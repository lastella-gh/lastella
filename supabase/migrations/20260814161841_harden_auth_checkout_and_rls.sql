-- Keep authorization helpers outside the exposed Data API schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(UUID, public.app_role) TO anon, authenticated;

-- Each user has one role. Bootstrap the existing development account once;
-- future signups are always customers regardless of their email address.
DELETE FROM public.user_roles customer_role
USING auth.users auth_user
WHERE customer_role.user_id = auth_user.id
  AND customer_role.role = 'customer'
  AND lower(auth_user.email) = 'lackhorse.ak@gmail.com';

INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE lower(email) = 'lackhorse.ak@gmail.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'lackhorse.ak@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_role_per_user_idx
ON public.user_roles (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Rebuild policies around the private role helper.
DROP POLICY IF EXISTS "Own profile read" ON public.profiles;
DROP POLICY IF EXISTS "Own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Own profile update" ON public.profiles;
CREATE POLICY "Own profile read" ON public.profiles
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id);
CREATE POLICY "Own profile update" ON public.profiles
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Own roles read" ON public.user_roles;
CREATE POLICY "Own roles read" ON public.user_roles
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public read active" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
CREATE POLICY "Public read active" ON public.products
FOR SELECT TO anon, authenticated
USING (active OR (SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin insert products" ON public.products
FOR INSERT TO authenticated
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin update products" ON public.products
FOR UPDATE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin delete products" ON public.products
FOR DELETE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')));

DROP POLICY IF EXISTS "Own orders read" ON public.orders;
DROP POLICY IF EXISTS "Anyone create order" ON public.orders;
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Own orders read" ON public.orders
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);
CREATE POLICY "Admin update orders" ON public.orders
FOR UPDATE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));

DROP POLICY IF EXISTS "Items read via order" ON public.order_items;
DROP POLICY IF EXISTS "Items insert" ON public.order_items;
CREATE POLICY "Items read via order" ON public.order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = (SELECT auth.uid())
        OR (SELECT private.has_role((SELECT auth.uid()), 'admin'))
      )
  )
);

REVOKE INSERT ON public.profiles FROM authenticated;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (status) ON public.orders TO authenticated;

-- Checkout is the sole public write path. It uses database prices and applies
-- all order, item, stock, and total changes in one transaction.
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
  v_user_id UUID := auth.uid();
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(12,2) := 0;
  v_shipping NUMERIC(12,2);
  v_tax NUMERIC(12,2);
  v_total NUMERIC(12,2);
  v_item JSONB;
  v_product public.products%ROWTYPE;
  v_quantity INTEGER;
  v_product_id UUID;
  v_size TEXT;
  v_color TEXT;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' OR position('@' IN p_email) <= 1
     OR length(p_email) > 320
     OR p_full_name IS NULL OR trim(p_full_name) = '' OR length(p_full_name) > 200
     OR p_address IS NULL OR trim(p_address) = '' OR length(p_address) > 500
     OR p_city IS NULL OR trim(p_city) = '' OR length(p_city) > 120 THEN
    RAISE EXCEPTION 'Required checkout fields are invalid' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Cart must contain between 1 and 50 items' USING ERRCODE = '22023';
  END IF;

  IF p_payment_method NOT IN ('cod', 'bank') THEN
    RAISE EXCEPTION 'Unsupported payment method' USING ERRCODE = '22023';
  END IF;

  -- Validate input types before aggregating duplicate product lines.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (v_item->>'product_id')::UUID;
      v_quantity := (v_item->>'quantity')::INTEGER;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Invalid product or quantity' USING ERRCODE = '22023';
    END;

    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid product or quantity' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Lock and validate cumulative quantities per product.
  FOR v_item IN
    SELECT jsonb_build_object(
      'product_id', parsed.product_id,
      'quantity', sum(parsed.quantity)
    )
    FROM (
      SELECT
        (value->>'product_id')::UUID AS product_id,
        (value->>'quantity')::INTEGER AS quantity
      FROM jsonb_array_elements(p_items)
    ) parsed
    GROUP BY parsed.product_id
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    SELECT * INTO v_product
    FROM public.products
    WHERE products.id = v_product_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_product.active THEN
      RAISE EXCEPTION 'Product is unavailable' USING ERRCODE = 'P0001';
    END IF;
    IF v_quantity > 100 OR v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name_en USING ERRCODE = 'P0001';
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
    v_user_id,
    lower(trim(p_email)),
    trim(p_full_name),
    NULLIF(trim(p_phone), ''),
    trim(p_address),
    trim(p_city),
    NULLIF(trim(p_postal_code), ''),
    COALESCE(NULLIF(trim(p_country), ''), 'Oman'),
    v_subtotal,
    v_shipping,
    v_tax,
    v_total,
    p_payment_method,
    NULLIF(trim(p_notes), ''),
    COALESCE(p_need_gift_box, false)
  )
  RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  -- Preserve variants while combining identical cart lines.
  FOR v_item IN
    SELECT jsonb_build_object(
      'product_id', parsed.product_id,
      'quantity', sum(parsed.quantity),
      'size', parsed.size,
      'color', parsed.color
    )
    FROM (
      SELECT
        (value->>'product_id')::UUID AS product_id,
        (value->>'quantity')::INTEGER AS quantity,
        NULLIF(trim(value->>'size'), '') AS size,
        NULLIF(trim(value->>'color'), '') AS color
      FROM jsonb_array_elements(p_items)
    ) parsed
    GROUP BY parsed.product_id, parsed.size, parsed.color
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
      RAISE EXCEPTION 'Invalid size for product %', v_product.name_en USING ERRCODE = '22023';
    END IF;
    IF cardinality(v_product.colors) > 0
       AND (v_color IS NULL OR NOT v_color = ANY(v_product.colors)) THEN
      RAISE EXCEPTION 'Invalid color for product %', v_product.name_en USING ERRCODE = '22023';
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
  SELECT v_order_id, v_order_number, v_subtotal, v_shipping, v_tax, v_total;
END;
$$;
REVOKE ALL ON FUNCTION public.create_checkout_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO anon, authenticated;

-- Public buckets serve object URLs without a SELECT policy. Only admins may
-- list or mutate product image objects through the Storage API.
DROP POLICY IF EXISTS "Public product image read" ON storage.objects;
DROP POLICY IF EXISTS "Admin product image read" ON storage.objects;
DROP POLICY IF EXISTS "Admin product image insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin product image update" ON storage.objects;
DROP POLICY IF EXISTS "Admin product image delete" ON storage.objects;
CREATE POLICY "Admin product image read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'product-images'
  AND (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);
CREATE POLICY "Admin product image insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);
CREATE POLICY "Admin product image update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (SELECT private.has_role((SELECT auth.uid()), 'admin'))
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);
CREATE POLICY "Admin product image delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);

DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);
