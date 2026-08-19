DROP FUNCTION public.commit_checkout_order(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN,
  NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
);

UPDATE public.brands SET name = 'Hermès' WHERE slug = 'hermes';
UPDATE public.products
SET name_en = replace(name_en, 'Hermes', 'Hermès')
WHERE brand_id = (SELECT id FROM public.brands WHERE slug = 'hermes');
