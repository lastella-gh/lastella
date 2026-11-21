-- The migration script inserts verified URL pairs before this SQL can be applied.
BEGIN;
SET LOCAL standard_conforming_strings = on;

CREATE TEMP TABLE media_url_map (old_url text PRIMARY KEY, new_url text NOT NULL) ON COMMIT DROP;
INSERT INTO media_url_map (old_url, new_url) VALUES
/* VERIFIED_URL_PAIRS */;

WITH rewritten AS (
  SELECT p.id, COALESCE(main.new_url, p.image) AS image,
    ARRAY(
      SELECT COALESCE(gallery.new_url, item.url)
      FROM unnest(p.images) WITH ORDINALITY AS item(url, position)
      LEFT JOIN media_url_map gallery ON gallery.old_url = item.url
      ORDER BY item.position
    ) AS images
  FROM public.products p
  LEFT JOIN media_url_map main ON main.old_url = p.image
)
UPDATE public.products p SET image = r.image, images = r.images
FROM rewritten r
WHERE p.id = r.id AND (p.image, p.images) IS DISTINCT FROM (r.image, r.images);

UPDATE public.order_items item SET product_image = m.new_url
FROM media_url_map m WHERE item.product_image = m.old_url;

WITH rewritten AS (
  SELECT s.id, COALESCE(video.new_url, s.video_url) AS video_url,
    COALESCE(poster.new_url, s.video_poster_url) AS video_poster_url
  FROM public.store_settings s
  LEFT JOIN media_url_map video ON video.old_url = s.video_url
  LEFT JOIN media_url_map poster ON poster.old_url = s.video_poster_url
)
UPDATE public.store_settings s
SET video_url = r.video_url, video_poster_url = r.video_poster_url
FROM rewritten r
WHERE s.id = r.id
  AND (s.video_url, s.video_poster_url) IS DISTINCT FROM (r.video_url, r.video_poster_url);

COMMIT;
