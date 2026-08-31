ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'bangle';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'anklet';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT false;

UPDATE public.products
SET
  is_new_arrival = lower(trim(COALESCE(badge, ''))) = 'new',
  is_best_seller = lower(trim(COALESCE(badge, ''))) = 'bestseller';

CREATE INDEX IF NOT EXISTS products_visible_new_arrivals_idx
  ON public.products (created_at DESC, id)
  WHERE visible AND is_new_arrival;
CREATE INDEX IF NOT EXISTS products_visible_best_sellers_idx
  ON public.products (created_at DESC, id)
  WHERE visible AND is_best_seller;

CREATE TYPE public.payment_status AS ENUM (
  'awaiting_payment', 'proof_submitted', 'payment_verified', 'payment_rejected'
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs', 'payment-proofs', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE public.payment_upload_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_token_hash TEXT NOT NULL UNIQUE
    CHECK (claim_token_hash ~ '^[0-9a-fA-F]{64}$'),
  object_path TEXT NOT NULL UNIQUE DEFAULT ('proofs/' || gen_random_uuid()::TEXT)
    CHECK (length(trim(object_path)) BETWEEN 1 AND 500),
  original_filename TEXT NOT NULL
    CHECK (length(trim(original_filename)) BETWEEN 1 AND 255),
  declared_mime TEXT NOT NULL
    CHECK (declared_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  expected_size BIGINT NOT NULL CHECK (expected_size > 0 AND expected_size <= 5242880),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ,
  consumed_order_id UUID,
  CONSTRAINT payment_upload_intents_expiry_check
    CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '24 hours'),
  CONSTRAINT payment_upload_intents_consumed_check
    CHECK ((consumed_at IS NULL AND consumed_order_id IS NULL)
      OR (consumed_at IS NOT NULL AND consumed_order_id IS NOT NULL))
);
ALTER TABLE public.payment_upload_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_upload_intents FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.payment_upload_intents TO service_role;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'awaiting_payment',
  ADD COLUMN IF NOT EXISTS payment_proof_path TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_name TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_content_type TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_size BIGINT,
  ADD COLUMN IF NOT EXISTS payment_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS success_token_hash TEXT;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_success_token_hash_unique UNIQUE (success_token_hash),
  ADD CONSTRAINT orders_success_token_hash_check
    CHECK (success_token_hash IS NULL OR success_token_hash ~ '^[0-9a-fA-F]{64}$'),
  ADD CONSTRAINT orders_payment_proof_size_check
    CHECK (payment_proof_size IS NULL OR payment_proof_size > 0 AND payment_proof_size <= 5242880),
  ADD CONSTRAINT orders_payment_proof_mime_check
    CHECK (payment_proof_content_type IS NULL
      OR payment_proof_content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  ADD CONSTRAINT orders_payment_proof_fields_check
    CHECK ((payment_proof_path IS NULL AND payment_proof_name IS NULL
      AND payment_proof_content_type IS NULL AND payment_proof_size IS NULL)
      OR (payment_proof_path IS NOT NULL AND payment_proof_name IS NOT NULL
      AND payment_proof_content_type IS NOT NULL AND payment_proof_size IS NOT NULL)),
  ADD CONSTRAINT orders_proof_processing_requires_verification
    CHECK (payment_proof_path IS NULL
      OR status <> 'processing'
      OR payment_status = 'payment_verified');

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_intent_id UUID
    REFERENCES public.payment_upload_intents(id) ON DELETE SET NULL;

ALTER TABLE public.payment_upload_intents
  ADD CONSTRAINT payment_upload_intents_consumed_order_fk
    FOREIGN KEY (consumed_order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS payment_upload_intents_active_idx
  ON public.payment_upload_intents (expires_at)
  WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_payment_status_idx
  ON public.orders (payment_status, created_at DESC);

GRANT UPDATE (payment_status, payment_reviewed_at, payment_reviewed_by, payment_rejection_reason)
  ON public.orders TO authenticated;

CREATE FUNCTION public.commit_checkout_order_v3(
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
  IF p_payment_intent_id IS NULL
     OR p_payment_claim_hash IS NULL
     OR p_payment_claim_hash !~ '^[0-9a-fA-F]{64}$'
     OR p_success_token_hash IS NULL
     OR p_success_token_hash !~ '^[0-9a-fA-F]{64}$' THEN
    RAISE EXCEPTION 'Invalid payment checkout credentials' USING ERRCODE = '22023';
  END IF;

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
    p_subtotal, p_shipping, 0, p_total, 'awaiting_payment', 'proof_submitted', 'bank',
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
