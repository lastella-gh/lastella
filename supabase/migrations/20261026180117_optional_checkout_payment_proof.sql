-- Keep the v4 phone-only entry point and existing atomic product/variant checks.
-- A supplied proof still requires its valid, locked upload intent.
CREATE OR REPLACE FUNCTION public.commit_checkout_order_v3(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_country TEXT,
  p_delivery_type public.delivery_type,
  p_notes TEXT,
  p_subtotal NUMERIC,
  p_shipping NUMERIC,
  p_total NUMERIC,
  p_items JSONB,
  p_payment_intent_id UUID,
  p_payment_claim_hash TEXT,
  p_success_token_hash TEXT
) RETURNS TABLE (
  id UUID,
  order_number TEXT,
  subtotal NUMERIC,
  shipping NUMERIC,
  tax NUMERIC,
  total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_intent public.payment_upload_intents%ROWTYPE;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_expected_price NUMERIC(12,3);
BEGIN
  IF p_success_token_hash IS NULL
     OR p_success_token_hash !~ '^[0-9a-fA-F]{64}$'
     OR (p_payment_intent_id IS NULL) <> (p_payment_claim_hash IS NULL)
     OR (p_payment_claim_hash IS NOT NULL AND p_payment_claim_hash !~ '^[0-9a-fA-F]{64}$') THEN
    RAISE EXCEPTION 'Invalid payment checkout credentials' USING ERRCODE = '22023';
  END IF;

  IF p_payment_intent_id IS NULL THEN
    -- Serialize retries without requiring an upload intent or storing a placeholder proof.
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_success_token_hash, 0));
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.success_token_hash = p_success_token_hash
        AND orders.payment_intent_id IS NULL
    ) THEN
      RETURN QUERY
      SELECT orders.id, orders.order_number, orders.subtotal, orders.shipping,
        orders.tax, orders.total
      FROM public.orders
      WHERE orders.success_token_hash = p_success_token_hash
        AND orders.payment_intent_id IS NULL;
      RETURN;
    END IF;
  ELSE
    SELECT * INTO v_intent
    FROM public.payment_upload_intents
    WHERE payment_upload_intents.id = p_payment_intent_id
      AND payment_upload_intents.claim_token_hash = p_payment_claim_hash
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment upload intent is invalid or expired' USING ERRCODE = 'P0001';
    END IF;
    IF v_intent.consumed_at IS NOT NULL THEN
      IF v_intent.consumed_order_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = v_intent.consumed_order_id
          AND orders.success_token_hash = p_success_token_hash
      ) THEN
        RAISE EXCEPTION 'Payment upload intent has already been used' USING ERRCODE = 'P0001';
      END IF;

      RETURN QUERY
      SELECT orders.id, orders.order_number, orders.subtotal, orders.shipping,
        orders.tax, orders.total
      FROM public.orders
      WHERE orders.id = v_intent.consumed_order_id;
      RETURN;
    END IF;
    IF v_intent.expires_at <= pg_catalog.now() THEN
      RAISE EXCEPTION 'Payment upload intent is invalid or expired' USING ERRCODE = 'P0001';
    END IF;
    IF v_intent.declared_mime NOT IN ('image/jpeg', 'image/png', 'image/webp')
       OR v_intent.expected_size <= 0 OR v_intent.expected_size > 5242880 THEN
      RAISE EXCEPTION 'Payment proof metadata is invalid' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Invalid checkout items' USING ERRCODE = '22023';
  END IF;
  IF p_delivery_type IS NULL
     OR p_subtotal < 0
     OR p_shipping < 0
     OR p_total <> p_subtotal + p_shipping THEN
    RAISE EXCEPTION 'Invalid checkout totals' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN
    SELECT jsonb_build_object(
      'product_id', parsed.product_id,
      'quantity', sum(parsed.quantity),
      'min_price', min(parsed.unit_price),
      'max_price', max(parsed.unit_price)
    )
    FROM (
      SELECT
        (value->>'product_id')::UUID AS product_id,
        (value->>'quantity')::INTEGER AS quantity,
        (value->>'unit_price')::NUMERIC(12,3) AS unit_price
      FROM jsonb_array_elements(p_items)
    ) parsed
    GROUP BY parsed.product_id
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_expected_price := (v_item->>'min_price')::NUMERIC(12,3);

    SELECT * INTO v_product
    FROM public.products
    WHERE products.id = v_product_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_product.visible OR NOT v_product.available THEN
      RAISE EXCEPTION 'Product is unavailable' USING ERRCODE = 'P0001';
    END IF;
    IF v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid product quantity' USING ERRCODE = '22023';
    END IF;
    IF v_expected_price <> (v_item->>'max_price')::NUMERIC(12,3)
       OR v_product.price <> v_expected_price THEN
      RAISE EXCEPTION 'Product price changed; refresh the cart' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    user_id, email, full_name, phone, address, city, postal_code, country,
    subtotal, shipping, tax, total, status, payment_status, payment_method,
    delivery_type, notes, need_gift_box, payment_intent_id,
    payment_proof_path, payment_proof_name, payment_proof_content_type,
    payment_proof_size, success_token_hash
  ) VALUES (
    p_user_id, lower(trim(p_email)), trim(p_full_name), NULLIF(trim(p_phone), ''),
    trim(p_address), trim(p_city), NULLIF(trim(p_postal_code), ''), p_country,
    p_subtotal, p_shipping, 0, p_total, 'awaiting_payment',
    CASE WHEN p_payment_intent_id IS NULL THEN 'awaiting_payment'::public.payment_status
      ELSE 'proof_submitted'::public.payment_status END, 'bank',
    p_delivery_type, NULLIF(trim(p_notes), ''), false, p_payment_intent_id,
    v_intent.object_path, v_intent.original_filename, v_intent.declared_mime,
    v_intent.expected_size, p_success_token_hash
  )
  RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;

    SELECT * INTO v_product FROM public.products WHERE products.id = v_product_id;

    IF EXISTS (
      SELECT 1 FROM public.product_variants
      WHERE product_variants.product_id = v_product_id
    ) THEN
      IF v_variant_id IS NULL THEN
        RAISE EXCEPTION 'A product option is required' USING ERRCODE = '22023';
      END IF;

      SELECT * INTO v_variant
      FROM public.product_variants
      WHERE product_variants.id = v_variant_id
        AND product_variants.product_id = v_product_id
      FOR SHARE;

      IF NOT FOUND OR NOT v_variant.available THEN
        RAISE EXCEPTION 'Product option is unavailable' USING ERRCODE = 'P0001';
      END IF;
    ELSIF v_variant_id IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid product option' USING ERRCODE = '22023';
    ELSE
      v_variant.size := NULL;
      v_variant.color := NULL;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_name, product_image, product_kind,
      unit_price, quantity, size, color
    ) VALUES (
      v_order_id, v_product.id, v_variant_id, v_product.name_en, v_product.image,
      v_product.kind, v_product.price, v_quantity, v_variant.size, v_variant.color
    );
  END LOOP;

  UPDATE public.payment_upload_intents
  SET consumed_at = pg_catalog.now(), consumed_order_id = v_order_id
  WHERE payment_upload_intents.id = v_intent.id
    AND payment_upload_intents.consumed_at IS NULL;

  RETURN QUERY
  SELECT v_order_id, v_order_number, p_subtotal, p_shipping, 0::NUMERIC, p_total;
END;
$$;

REVOKE ALL ON FUNCTION public.commit_checkout_order_v3(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.delivery_type,
  TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB, UUID, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_checkout_order_v3(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.delivery_type,
  TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB, UUID, TEXT, TEXT
) TO service_role;
