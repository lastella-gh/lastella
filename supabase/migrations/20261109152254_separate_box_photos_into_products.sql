-- Split the imported galleries into one box product per original image.
-- Existing IDs, slugs, prices and availability stay on each gallery's first image.
DO $$
DECLARE
  source_slugs text[] := ARRAY[
    'apm-monaco-general-box',
    'cartier-general-box',
    'dior-general-box',
    'hermes-general-box',
    'louis-vuitton-general-box',
    'messika-general-box',
    'swarovski-general-box',
    'van-cleef-and-arpels-general-box'
  ];
  source_count integer;
  extra_image_count integer;
  inserted_count integer;
BEGIN
  PERFORM id FROM public.products WHERE slug = ANY(source_slugs) FOR UPDATE;

  SELECT count(*), sum(cardinality(images) - 1)
  INTO source_count, extra_image_count
  FROM public.products
  WHERE slug = ANY(source_slugs);

  IF source_count <> 8 OR extra_image_count <> 14 THEN
    RAISE EXCEPTION 'Expected 8 imported box galleries with 14 additional images; found % and %',
      source_count, extra_image_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.products AS product
    WHERE product.slug = ANY(source_slugs)
      AND (
        product.kind <> 'general_box'
        OR product.category IS NOT NULL
        OR product.image IS DISTINCT FROM product.images[1]
        OR EXISTS (
          SELECT 1 FROM public.product_variants AS variant WHERE variant.product_id = product.id
        )
      )
  ) THEN
    RAISE EXCEPTION 'Imported box galleries changed unexpectedly; review before splitting';
  END IF;

  INSERT INTO public.products (
    slug, name_en, name_ar, description_en, description_ar, kind, category, brand_id,
    price, old_price, image, images, badge, available, visible, active, stock, sizes,
    colors, display_color, is_best_seller, is_new_arrival
  )
  SELECT
    product.slug || '-' || lpad(photo.number::text, 2, '0'),
    product.name_en || ' ' || lpad(photo.number::text, 2, '0'),
    CASE WHEN product.name_ar IS NOT NULL
      THEN product.name_ar || ' ' || lpad(photo.number::text, 2, '0')
      ELSE NULL
    END,
    product.description_en, product.description_ar, 'general_box', NULL, product.brand_id,
    product.price, product.old_price, photo.url, ARRAY[photo.url], product.badge,
    product.available, product.visible, product.active, product.stock, product.sizes,
    product.colors, product.display_color, product.is_best_seller, product.is_new_arrival
  FROM public.products AS product
  CROSS JOIN LATERAL unnest(product.images) WITH ORDINALITY AS photo(url, number)
  WHERE product.slug = ANY(source_slugs) AND photo.number > 1;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count <> 14 THEN
    RAISE EXCEPTION 'Expected 14 new box products, inserted %', inserted_count;
  END IF;

  UPDATE public.products
  SET images = ARRAY[image]
  WHERE slug = ANY(source_slugs);
END;
$$;
