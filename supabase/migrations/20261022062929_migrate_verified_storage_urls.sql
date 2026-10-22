-- Apply only after the source files have been copied and checksum-verified.
-- Map existing destination objects; missing historical images keep their original URL.
-- This changes image references only and preserves files uploaded to the new project.
BEGIN;

CREATE TEMPORARY TABLE lastella_storage_url_map ON COMMIT DROP AS
SELECT
  'https://rhnnhecshxnqybkujuyl.supabase.co/storage/v1/object/public/product-images/' || name AS old_url,
  'https://wgkbudzediwknmbdxvgy.supabase.co/storage/v1/object/public/product-images/' || name AS new_url
FROM storage.objects
WHERE bucket_id = 'product-images';

CREATE UNIQUE INDEX ON lastella_storage_url_map (old_url);

WITH rewritten AS (
  SELECT
    p.id,
    COALESCE(m.new_url, p.image) AS image,
    ARRAY(
      SELECT COALESCE(im.new_url, entry.url)
      FROM unnest(p.images) WITH ORDINALITY AS entry(url, position)
      LEFT JOIN lastella_storage_url_map im ON im.old_url = entry.url
      ORDER BY entry.position
    ) AS images
  FROM public.products p
  LEFT JOIN lastella_storage_url_map m ON m.old_url = p.image
)
UPDATE public.products p
SET image = r.image, images = r.images
FROM rewritten r
WHERE p.id = r.id
  AND (p.image IS DISTINCT FROM r.image OR p.images IS DISTINCT FROM r.images);

UPDATE public.order_items oi
SET product_image = m.new_url
FROM lastella_storage_url_map m
WHERE oi.product_image = m.old_url;

WITH rewritten AS (
  SELECT
    s.id,
    COALESCE(video.new_url, s.video_url) AS video_url,
    COALESCE(poster.new_url, s.video_poster_url) AS video_poster_url
  FROM public.store_settings s
  LEFT JOIN lastella_storage_url_map video ON video.old_url = s.video_url
  LEFT JOIN lastella_storage_url_map poster ON poster.old_url = s.video_poster_url
)
UPDATE public.store_settings s
SET video_url = r.video_url, video_poster_url = r.video_poster_url
FROM rewritten r
WHERE s.id = r.id
  AND (s.video_url IS DISTINCT FROM r.video_url OR s.video_poster_url IS DISTINCT FROM r.video_poster_url);

COMMIT;
