ALTER TABLE public.product_variants
  ADD COLUMN color_ar TEXT,
  ADD COLUMN size_ar TEXT;

UPDATE public.product_variants
SET color_ar = CASE lower(trim(color))
  WHEN 'black' THEN 'أسود'
  WHEN 'silver' THEN 'فضي'
  WHEN 'white' THEN 'أبيض'
  WHEN 'maroon' THEN 'عنابي'
  WHEN 'pink' THEN 'وردي'
  WHEN 'golden' THEN 'ذهبي'
  WHEN 'gold' THEN 'ذهبي'
  WHEN 'red' THEN 'أحمر'
  ELSE NULL
END
WHERE color IS NOT NULL AND color_ar IS NULL;

UPDATE public.product_variants
SET size_ar = CASE lower(trim(size))
  WHEN 'small' THEN 'صغير'
  WHEN 'large' THEN 'كبير'
  ELSE NULL
END
WHERE size IS NOT NULL AND size_ar IS NULL;
