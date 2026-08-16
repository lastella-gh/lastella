-- The original seed was labeled PKR while the storefront is an OMR store.
-- Normalize those records and replace source-only asset paths with public URLs.
UPDATE public.products AS product
SET
  price = seed.price,
  old_price = seed.old_price,
  image = seed.image,
  images = ARRAY[seed.image]
FROM (VALUES
  ('etoile-rose-necklace', 125.000::NUMERIC, 150.000::NUMERIC, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'),
  ('celestine-diamond-studs', 89.000::NUMERIC, 105.000::NUMERIC, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=85'),
  ('aurore-gemstone-bangle', 210.000::NUMERIC, NULL::NUMERIC, 'https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=1200&q=85'),
  ('solitaire-rose-ring', 180.000::NUMERIC, 210.000::NUMERIC, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85'),
  ('perle-blush-pendant', 52.000::NUMERIC, NULL::NUMERIC, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85'),
  ('swan-heart-necklace', 139.000::NUMERIC, 160.000::NUMERIC, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'),
  ('lumiere-diamond-watch', 340.000::NUMERIC, NULL::NUMERIC, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85'),
  ('amour-heart-pendant', 115.000::NUMERIC, 135.000::NUMERIC, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=85')
) AS seed(slug, price, old_price, image)
WHERE product.slug = seed.slug;
