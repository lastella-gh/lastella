-- The removed categories have no existing products. Keep the enum values for
-- migration compatibility, but reject them for all catalog writes.
ALTER TABLE public.products
  ADD CONSTRAINT products_supported_category
  CHECK (category NOT IN ('watch', 'pendant'));
