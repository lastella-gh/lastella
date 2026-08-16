-- Application fields used by the storefront and admin catalog.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS colors TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS need_gift_box BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products
  ADD CONSTRAINT products_old_price_nonnegative CHECK (old_price IS NULL OR old_price >= 0),
  ADD CONSTRAINT products_rating_range CHECK (rating >= 0 AND rating <= 5),
  ADD CONSTRAINT products_reviews_nonnegative CHECK (reviews >= 0),
  ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0);
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_unit_price_nonnegative CHECK (unit_price >= 0);
ALTER TABLE public.orders
  ADD CONSTRAINT orders_amounts_nonnegative CHECK (subtotal >= 0 AND shipping >= 0 AND tax >= 0 AND total >= 0);
CREATE INDEX IF NOT EXISTS products_active_idx ON public.products (active);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items (product_id);
-- Replace the race-prone first-user bootstrap with a fixed development admin.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(COALESCE(NEW.email, '')) = 'lackhorse.ak@gmail.com'
      THEN 'admin'::public.app_role
      ELSE 'customer'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- Bootstrap the already-created development account.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'lackhorse.ak@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
-- Only the checkout function may create orders. It calculates all money values
-- from current product prices and inserts the order and items atomically.
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.create_checkout_order(
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
  p_items JSONB
) RETURNS TABLE (id UUID, order_number TEXT, subtotal NUMERIC, shipping NUMERIC, tax NUMERIC, total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(12,2);
  v_shipping NUMERIC(12,2);
  v_tax NUMERIC(12,2);
  v_total NUMERIC(12,2);
  v_item JSONB;
  v_product RECORD;
  v_quantity INTEGER;
  v_product_id UUID;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' OR p_full_name IS NULL OR trim(p_full_name) = ''
     OR p_address IS NULL OR trim(p_address) = '' OR p_city IS NULL OR trim(p_city) = '' THEN
    RAISE EXCEPTION 'Required checkout fields are missing' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty' USING ERRCODE = '22023';
  END IF;
  IF p_payment_method NOT IN ('cod', 'bank') THEN
    RAISE EXCEPTION 'Unsupported payment method' USING ERRCODE = '22023';
  END IF;

  v_subtotal := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (v_item->>'product_id')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid product or quantity' USING ERRCODE = '22023';
    END;
    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity' USING ERRCODE = '22023';
    END IF;

    SELECT id, name_en, image, price, stock, active INTO v_product
    FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND OR NOT v_product.active THEN
      RAISE EXCEPTION 'Product is unavailable' USING ERRCODE = 'P0001';
    END IF;
    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product' USING ERRCODE = 'P0001';
    END IF;
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  END LOOP;

  v_subtotal := round(v_subtotal, 2);
  v_shipping := CASE WHEN v_subtotal > 20 THEN 0 ELSE 2 END;
  v_tax := round(v_subtotal * 0.05, 2);
  v_total := v_subtotal + v_shipping + v_tax;

  INSERT INTO public.orders (
    user_id, email, full_name, phone, address, city, postal_code, country,
    subtotal, shipping, tax, total, payment_method, notes, need_gift_box
  ) VALUES (
    v_user_id, trim(p_email), trim(p_full_name), NULLIF(trim(p_phone), ''), trim(p_address),
    trim(p_city), NULLIF(trim(p_postal_code), ''), COALESCE(NULLIF(trim(p_country), ''), 'Oman'),
    v_subtotal, v_shipping, v_tax, v_total, p_payment_method, NULLIF(trim(p_notes), ''),
    COALESCE(p_need_gift_box, false)
  ) RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    SELECT id, name_en, image, price INTO v_product FROM public.products WHERE id = v_product_id;
    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, size, color)
    VALUES (
      v_order_id, v_product.id, v_product.name_en, v_product.image, v_product.price, v_quantity,
      NULLIF(v_item->>'size', ''), NULLIF(v_item->>'color', '')
    );
    UPDATE public.products SET stock = stock - v_quantity WHERE id = v_product_id;
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_order_number, v_subtotal, v_shipping, v_tax, v_total;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO anon, authenticated;
-- Product images: public reads, admin-only writes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
CREATE POLICY "Public product image read" ON storage.objects FOR SELECT
TO public USING (bucket_id = 'product-images');
CREATE POLICY "Admin product image insert" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admin product image update" ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'product-images' AND public.has_role((select auth.uid()), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admin product image delete" ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'product-images' AND public.has_role((select auth.uid()), 'admin'));
