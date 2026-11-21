# Move public product media to Cloudflare R2

The product media cutover completed on 22 November 2026. All 739 original files (968,881,649 bytes) were verified in R2 and returned successfully over public HTTPS at `https://cdn.lastellajewellery.com`. Migration `20261121205932_migrate_verified_product_media_to_r2.sql` switched image references on 699 products and 89 historical order items. Other fields and gallery ordering were compared against the private pre-cutover backup. The earlier missing historical image retains its old URL. Two external order images and the homepage's ImageKit video/poster retain their existing providers.

Use `R2_PUBLIC_URL=https://cdn.lastellajewellery.com` and `VITE_R2_PRODUCT_UPLOADS=true` in the Hostinger deployment environment, alongside the server-only R2 bucket and credentials, to enable new admin uploads to the same bucket. These environment changes require a rebuild. The private cutover backup, verification results, and conditional rollback SQL are under `/home/ak/.local/share/lastella/migrations/r2-cdn-cutover-20261122/`.

Use a dedicated R2 bucket for the public Supabase `product-images` objects. R2 objects retain their existing keys and original bytes. Supabase continues to own the catalog, orders, settings, and media URL fields.

Create an R2 token with **Object Read & Write** for the product media bucket only. Set `R2_ENDPOINT` to the account-level S3 endpoint and `R2_BUCKET` to the bucket name. Store `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in the ignored local `.env` and in the Hostinger environment when configuring admin uploads. Use a Cloudflare R2 custom domain for `R2_PUBLIC_URL`. Cloudflare requires the custom domain's zone to be in the bucket's account. Its public `r2.dev` URL is rate limited and intended for development.

Run a read-only source inventory first:

```bash
node --env-file=.env scripts/migrate-product-images-to-r2.mjs
```

Pass `--copy --report /path/to/new/private/report-directory` to copy and verify each file's checksum, size, and content type. R2 validates the MD5 on upload. The script checks the stored ETag and downloads the object for SHA-256 comparison if the ETag differs. The copy preserves existing R2 files and reports conflicts. Optionally pass `--backup /path/to/storage-20261022` to read matching bytes from the previous private backup where the live object ID, ETag, update timestamp, and size match. If the live listing is unavailable, combine `--backup` with `--snapshot` to stage the old files in R2. A snapshot cannot generate cutover SQL.

Enable `VITE_R2_PRODUCT_UPLOADS=true` in Hostinger and rebuild once the public hostname and server credentials are ready. Verify an admin can upload a catalog image on a preview and the R2 URL loads. Product edits and deletes retain R2 objects so old orders and previously shared links can still use them. Failed saves can leave an unreferenced object to review later.

Run the copy again against the live inventory with the final production `R2_PUBLIC_URL` set to obtain `cutover.sql`. The script prepares SQL only once all R2 copies verify and public HTTPS samples return the matching bytes. Export the current catalog and order image references before applying. Review the SQL and apply it in one transaction to switch only the verified exact URLs in products, order items, and media settings. Keep Supabase originals available for existing links and for rollback. Verify catalog, product galleries, checkout, order history, and admin uploads after cutover.

[Cloudflare R2 S3 credentials](https://developers.cloudflare.com/r2/get-started/s3/) · [Cloudflare R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)

## Private payment proofs

Create a separate R2 bucket named `lastella-payment-proofs` with the public development URL and custom domains disabled. Use **Object Read & Write** credentials scoped to this bucket. If the product media token also has access to this bucket, the same key pair can be used for both. Set `R2_PAYMENT_BUCKET`, `R2_PAYMENT_ACCESS_KEY_ID`, and `R2_PAYMENT_SECRET_ACCESS_KEY` in the ignored local `.env`. The private bucket uses the same account-level `R2_ENDPOINT`. Keep its credentials server-only.

```bash
node --env-file=.env scripts/migrate-payment-proofs-to-r2.mjs
node --env-file=.env scripts/migrate-payment-proofs-to-r2.mjs --copy --confirm-private
```

Confirm the privacy settings in Cloudflare before running the copy. The script copies only receipts attached to orders, checks each file's checksum and content type, and verifies the S3 endpoint denies unsigned reads. It keeps the existing object keys and leaves both the original files and order rows available for rollback.

Configure the same private bucket and credentials in Hostinger. Rebuild and verify that an admin can open a historical receipt. Set the runtime variable `R2_PAYMENT_UPLOADS=true` to route new proof uploads through the Hostinger server. Verify a test proof upload and admin review, including checkout without a proof. New proof links expire after 60 seconds and the storage responses use `private, no-store`. To pause new R2 uploads, set `R2_PAYMENT_UPLOADS=false` and keep the private bucket credentials available for existing R2 orders. Keep proofs on the same origin during upload and leave the bucket's public access disabled.
