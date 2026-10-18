-- These jewelry products were accidentally entered as ring boxes.
UPDATE public.products
SET kind = 'jewelry', category = 'ring'
WHERE kind = 'ring_box'
  AND id IN (
    'e8b9024d-4285-4b57-bea5-fb2fb9ea67b7',
    '91329e8e-39c1-47c4-82d2-7ea5cb34bbf3',
    'b60b91e4-d99e-4311-82c6-28c2822e4fb4',
    'a2b6d93f-f4a0-4426-84f8-f2bf864ffae9',
    '6f32bede-700b-4a87-8891-bb9bf8f5e6a1'
  );

-- Keep product IDs, slugs, images, prices and historical order snapshots intact.
UPDATE public.products
SET kind = 'general_box'
WHERE kind = 'ring_box';

UPDATE public.products AS product
SET name_en = regexp_replace(
      product.name_en,
      '(Ring Box|General( Gift)? Box)$',
      'Jewelery Box',
      'i'
    ),
    name_ar = CASE
      WHEN nullif(btrim(product.name_ar), '') IS NULL
        THEN brand.name || ' - صندوق مجوهرات'
      ELSE product.name_ar
    END,
    description_en = regexp_replace(
      product.description_en,
      'branded (ring|general jewelry) packaging set[.]',
      'branded jewelry packaging set.',
      'i'
    )
FROM public.brands AS brand
WHERE product.kind = 'general_box'
  AND product.brand_id = brand.id;

-- Retain the enum value for order history, but stop creating separate ring boxes.
ALTER TABLE public.products
  ADD CONSTRAINT products_supported_kind CHECK (kind <> 'ring_box');
