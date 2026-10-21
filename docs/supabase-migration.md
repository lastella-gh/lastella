# Supabase database migration — 22 October 2026

The database was copied from `rhnnhecshxnqybkujuyl` (`lastella`, AbdulKarim018's Org) to `wgkbudzediwknmbdxvgy` (`lastella-production`, lastella-gh's Org), in Mumbai (`ap-south-1`).

Destination dashboard: https://supabase.com/dashboard/project/wgkbudzediwknmbdxvgy

The local `.env`, Supabase CLI link, and project configuration use the destination. Deployment environment variables must also be changed before the deployed app uses the new database; no deployment is included in this database copy. Use the destination values from local `.env` for `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SECRET_KEY`, and optional `SUPABASE_URL`, then redeploy. Never put the secret key in a `VITE_` variable.

## Copied and verified

| Data                    |  Rows |
| ----------------------- | ----: |
| Brands                  |    15 |
| Products                |   633 |
| Variants                |   487 |
| Auth users / identities | 3 / 3 |
| Profiles / user roles   | 3 / 3 |
| Orders / items          | 2 / 4 |
| Store settings          |     1 |
| Payment upload intents  |     0 |
| Migration history       |    15 |

Verification compares complete application rows, Auth user IDs/password hashes, identities, migration history, RLS, signup trigger, and checkout RPC permissions. The destination's default grants were reconciled to the source's effective application-role permissions after restore. Checkout RPCs remain service-role-only. Email signup confirmation behavior matches the source; the Auth site URL is the current demo URL.

The performance advisor reported no issues at warning level. The security advisor reported one Auth configuration warning: leaked-password protection is disabled. No checkout RPC or table-RLS access regression remains after the permission comparison.

## Storage intentionally deferred

The user requested database-only migration; Storage files will be copied separately. Existing product and historical order image URLs still point to **the original project's public Storage**, so keep the original project active. Do not delete or pause it, or replace image URLs with the new hostname yet.

At inspection, source Storage had 679 files (951,200,763 bytes) in public `product-images`; private `payment-proofs` had no files. Bucket definitions and policies exist in the destination for future uploads, but old object metadata was excluded to avoid listing nonexistent destination files. No existing Storage files were migrated. A temporary upload/delete check may leave an empty test folder prefix.

When resuming, copy source files without overwriting conflicting new destination uploads, verify file counts/checksums and bucket privacy, then update only old-host URLs in `products.image`, `products.images`, `order_items.product_image`, and any applicable settings media URLs. Preserve any new destination data. Do not restore the old database snapshot again after the destination starts accepting writes.

Backups, source environment, destination credentials, verification results, and partial local Storage downloads are stored outside Git under `/home/ak/.local/share/lastella/migrations/20261022-030250/` with restricted permissions. Treat database dumps and credential files as private. The source project and its data were not deleted or modified by the copy.
