-- Checkout business rules now run in the TanStack server function. PostgreSQL
-- retains only the row locks and atomic order/item/stock commit.
REVOKE ALL ON FUNCTION public.create_checkout_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB)
FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.create_checkout_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB);

CREATE FUNCTION public.commit_checkout_order(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_country TEXT,
  p_payment_method TEXT,
  p_notes TEXT,
  p_need_gift_box BOOLEAN,
  p_subtotal NUMERIC,
  p_shipping NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_items JSONB
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
  v_product_id UUID;
  v_quantity INTEGER;
  v_size TEXT;
  v_color TEXT;
  v_expected_price NUMERIC(12,3);
BEGIN
  IF jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Invalid checkout items' USING ERRCODE = '22023';
  END IF;
  IF p_subtotal < 0 OR p_shipping < 0 OR p_tax < 0 OR p_total < 0
     OR p_total <> p_subtotal + p_shipping + p_tax THEN
    RAISE EXCEPTION 'Invalid checkout totals' USING ERRCODE = '22023';
  END IF;

  -- Lock each product once and reject stale catalog data before writing.
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

    IF NOT FOUND OR NOT v_product.active THEN
      RAISE EXCEPTION 'Product is unavailable' USING ERRCODE = 'P0001';
    END IF;
    IF v_quantity <= 0 OR v_quantity > 100 OR v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name_en USING ERRCODE = 'P0001';
    END IF;
    IF v_expected_price <> (v_item->>'max_price')::NUMERIC(12,3)
       OR v_product.price <> v_expected_price THEN
      RAISE EXCEPTION 'Product price changed; refresh the cart' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    user_id, email, full_name, phone, address, city, postal_code, country,
    subtotal, shipping, tax, total, payment_method, notes, need_gift_box
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    NULLIF(p_phone, ''),
    p_address,
    p_city,
    NULLIF(p_postal_code, ''),
    p_country,
    p_subtotal,
    p_shipping,
    p_tax,
    p_total,
    p_payment_method,
    NULLIF(p_notes, ''),
    p_need_gift_box
  )
  RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_size := NULLIF(v_item->>'size', '');
    v_color := NULLIF(v_item->>'color', '');

    SELECT * INTO v_product
    FROM public.products
    WHERE products.id = v_product_id;

    IF cardinality(v_product.sizes) > 0
       AND (v_size IS NULL OR NOT v_size = ANY(v_product.sizes)) THEN
      RAISE EXCEPTION 'Product options changed; refresh the cart' USING ERRCODE = 'P0001';
    END IF;
    IF cardinality(v_product.colors) > 0
       AND (v_color IS NULL OR NOT v_color = ANY(v_product.colors)) THEN
      RAISE EXCEPTION 'Product options changed; refresh the cart' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image, unit_price,
      quantity, size, color
    ) VALUES (
      v_order_id, v_product.id, v_product.name_en, v_product.image,
      v_product.price, v_quantity, v_size, v_color
    );
  END LOOP;

  UPDATE public.products
  SET stock = products.stock - requested.quantity
  FROM (
    SELECT
      (value->>'product_id')::UUID AS product_id,
      sum((value->>'quantity')::INTEGER)::INTEGER AS quantity
    FROM jsonb_array_elements(p_items)
    GROUP BY (value->>'product_id')::UUID
  ) requested
  WHERE products.id = requested.product_id;

  RETURN QUERY
  SELECT v_order_id, v_order_number, p_subtotal, p_shipping, p_tax, p_total;
END;
$$;

REVOKE ALL ON FUNCTION public.commit_checkout_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN,
  NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_checkout_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN,
  NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
) TO service_role;
