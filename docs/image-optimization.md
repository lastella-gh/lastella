# Product image delivery

Product UI images use Vercel's native on-demand Image Optimization API (`/_vercel/image`). Admins upload a normal image once. Supabase stores only that original; Vercel resizes, converts to WebP, and caches display images as they are requested. No manual preprocessing, browser canvas encoding, duplicate Storage uploads, or additional package is required.

`ProductImage` supplies responsive width candidates and `sizes`, lazy loading, asynchronous decoding, and an original-image fallback if the optimizer fails. Thumbnail widths are 128/256, catalog widths 256/384/640/768, and detail widths 384/640/768/1024/1280. Widths are actual output widths; aspect ratio is preserved. Full-resolution originals remain available for explicit zoom. Canonical database/cart/order image URLs remain unchanged. Static local assets and private payment proofs bypass this helper.

`vercel.json` defines the allowed widths, quality 75, WebP output, 30-day minimum cache lifetime, and a restrictive HTTPS allowlist for the current project's public `product-images` bucket. `nitro.config.ts` includes the same configuration in `.vercel/output/config.json`; defining it only in framework source is not sufficient. If the Supabase project changes, update the remote allowlist too. Other buckets/hosts must not be accepted by the optimizer.

Vite automatically enables the helper when building on Vercel (`VERCEL=1`) or explicitly targeting it (`NITRO_PRESET=vercel`). Normal local development and Lovable/Cloudflare builds use original URLs, because they do not host Vercel's optimizer. For local UI verification of optimized URL selection, start with `NITRO_PRESET=vercel npm run dev`; the actual image service is available only on a Vercel deployment. No new deployment environment variables are required.

Admin new-order emails resolve optimized thumbnail URLs against `ORDER_EMAIL_SITE_URL` when set; this must point to the deployed Vercel site. Without a site URL they use the original public image. Email URLs must be absolute.

Original uploads use numeric `cacheControl: "31536000"`. Paths include UUIDs, so changing an image changes its URL and cache key. The previous migration's malformed `max-age=no-cache` headers on 35 objects were corrected with identical file bytes. Public GET responses should be used to validate Storage caching, since HEAD responses can differ.

Vercel optimization has plan usage limits and billing; this setup does not change the account plan or purchase services. The first uncached transformation fetches the original from Supabase; subsequent cache hits avoid refetching until the cached transformation expires. Different widths, cache locations, and revalidation can require additional original fetches. Migration/verification downloads also consumed one-time Supabase egress. Cached Supabase bandwidth still counts as egress.

After redeployment, verify a product image request returns `image/webp` from `/_vercel/image` with a successful HTTP status and cache headers. Local request-interception tests validate UI URL selection and fallback, but cannot validate Vercel's hosted transformation/cache service. The earlier 1370 pre-generated `_optimized/v1/` copies were removed after matching their recorded IDs, versions, and checksums. All 685 originals were retained and their IDs/checksums rechecked. Do not recreate those copies.
