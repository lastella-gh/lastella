CREATE TYPE public.product_category AS ENUM (
  'necklace', 'bracelet', 'ring', 'earrings', 'pendant', 'watch'
);
CREATE TYPE public.product_kind AS ENUM ('jewelry', 'ring_box', 'general_box');
CREATE TYPE public.delivery_type AS ENUM ('home', 'office');

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) BETWEEN 1 AND 120),
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
CREATE POLICY "Public read visible brands" ON public.brands
FOR SELECT TO anon, authenticated
USING (visible OR (SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin insert brands" ON public.brands
FOR INSERT TO authenticated
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin update brands" ON public.brands
FOR UPDATE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin delete brands" ON public.brands
FOR DELETE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE TRIGGER brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.brands (slug, name) VALUES
  ('lastella', 'Lastella'),
  ('cartier', 'Cartier'),
  ('dior', 'Dior'),
  ('hermes', 'Hermes'),
  ('chanel', 'Chanel'),
  ('van-cleef-and-arpels', 'Van Cleef & Arpels'),
  ('louis-vuitton', 'Louis Vuitton'),
  ('bvlgari', 'Bvlgari'),
  ('apm-monaco', 'APM Monaco'),
  ('messika', 'Messika'),
  ('swarovski', 'Swarovski'),
  ('aigner', 'Aigner'),
  ('valentino', 'Valentino');

ALTER TABLE public.products ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.products
  ALTER COLUMN category TYPE public.product_category
  USING category::public.product_category;
ALTER TABLE public.products ALTER COLUMN price SET DEFAULT 1.100;
ALTER TABLE public.products
  ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE RESTRICT,
  ADD COLUMN kind public.product_kind NOT NULL DEFAULT 'jewelry',
  ADD COLUMN visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN display_color TEXT;

UPDATE public.products
SET
  brand_id = (SELECT id FROM public.brands WHERE slug = 'lastella'),
  visible = active,
  available = active AND stock > 0;

ALTER TABLE public.products ALTER COLUMN brand_id SET NOT NULL;
ALTER TABLE public.products ADD CONSTRAINT products_category_matches_kind CHECK (
  (kind = 'jewelry' AND category IS NOT NULL)
  OR (kind IN ('ring_box', 'general_box') AND category IS NULL)
);
CREATE INDEX products_brand_id_idx ON public.products (brand_id);
CREATE INDEX products_kind_visible_idx ON public.products (kind, visible);
CREATE INDEX products_category_visible_idx ON public.products (category, visible);

DROP POLICY IF EXISTS "Public read active" ON public.products;
CREATE POLICY "Public read visible" ON public.products
FOR SELECT TO anon, authenticated
USING (visible OR (SELECT private.has_role((SELECT auth.uid()), 'admin')));

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_has_option CHECK (size IS NOT NULL OR color IS NOT NULL)
);
CREATE UNIQUE INDEX product_variants_unique_options_idx
ON public.product_variants (product_id, COALESCE(size, ''), COALESCE(color, ''));
CREATE INDEX product_variants_product_id_idx ON public.product_variants (product_id);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
CREATE POLICY "Public read variants for visible products" ON public.product_variants
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_variants.product_id
      AND (
        products.visible
        OR (SELECT private.has_role((SELECT auth.uid()), 'admin'))
      )
  )
);
CREATE POLICY "Admin insert variants" ON public.product_variants
FOR INSERT TO authenticated
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin update variants" ON public.product_variants
FOR UPDATE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admin delete variants" ON public.product_variants
FOR DELETE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE TRIGGER product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.product_variants (product_id, size, color, available)
SELECT
  products.id,
  sizes.size,
  colors.color,
  products.available
FROM public.products
CROSS JOIN LATERAL unnest(
  CASE WHEN cardinality(products.sizes) > 0 THEN products.sizes ELSE ARRAY[NULL::TEXT] END
) AS sizes(size)
CROSS JOIN LATERAL unnest(
  CASE WHEN cardinality(products.colors) > 0 THEN products.colors ELSE ARRAY[NULL::TEXT] END
) AS colors(color)
WHERE cardinality(products.sizes) > 0 OR cardinality(products.colors) > 0;

CREATE TABLE public.store_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  video_url TEXT,
  video_poster_url TEXT,
  video_enabled BOOLEAN NOT NULL DEFAULT false,
  bank_name TEXT NOT NULL DEFAULT 'Bank name to be confirmed',
  bank_account_name TEXT NOT NULL DEFAULT 'Account holder to be confirmed',
  bank_account_number TEXT NOT NULL DEFAULT 'Account number / IBAN to be confirmed',
  bank_instructions TEXT NOT NULL DEFAULT 'Transfer instructions will be provided after confirmation.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.store_settings (id) VALUES (1);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
CREATE POLICY "Public read store settings" ON public.store_settings
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin update store settings" ON public.store_settings
FOR UPDATE TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'admin')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'admin')));
CREATE TRIGGER store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders
  ADD COLUMN delivery_type public.delivery_type,
  ALTER COLUMN status SET DEFAULT 'awaiting_payment',
  ALTER COLUMN payment_method SET DEFAULT 'bank';
ALTER TABLE public.order_items
  ADD COLUMN variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN product_kind public.product_kind;

CREATE FUNCTION public.commit_checkout_order_v2(
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
  v_variant public.product_variants%ROWTYPE;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_expected_price NUMERIC(12,3);
BEGIN
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
    subtotal, shipping, tax, total, status, payment_method, delivery_type, notes,
    need_gift_box
  ) VALUES (
    p_user_id,
    lower(trim(p_email)),
    trim(p_full_name),
    NULLIF(trim(p_phone), ''),
    trim(p_address),
    trim(p_city),
    NULLIF(trim(p_postal_code), ''),
    p_country,
    p_subtotal,
    p_shipping,
    0,
    p_total,
    'awaiting_payment',
    'bank',
    p_delivery_type,
    NULLIF(trim(p_notes), ''),
    false
  )
  RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;

    SELECT * INTO v_product
    FROM public.products
    WHERE products.id = v_product_id;

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

  RETURN QUERY
  SELECT v_order_id, v_order_number, p_subtotal, p_shipping, 0::NUMERIC, p_total;
END;
$$;

REVOKE ALL ON FUNCTION public.commit_checkout_order_v2(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.delivery_type,
  TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_checkout_order_v2(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.delivery_type,
  TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB
) TO service_role;
