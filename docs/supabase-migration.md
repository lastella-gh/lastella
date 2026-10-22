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

## Storage copied and verified — 22 October 2026

All 679 source files (951,200,763 bytes) from public `product-images` were copied to the destination using the Storage API, keeping object paths, content types, and cache settings. Each destination file was downloaded again and its SHA-256 checksum matched the source. No source file changed or disappeared during the copy. Private `payment-proofs` had no source files.

The destination already contained one new file (199,048 bytes); it was backed up and its checksum remained unchanged. The final inventory contains 680 files. Existing destination uploads were not overwritten, and the old database snapshot was not restored.

Migration `20261022062929_migrate_verified_storage_urls.sql` switches exact old public Storage URLs only where a corresponding destination object exists. It updated all 633 products and four historical order items. Product image array order, prices, order details, and other application fields were verified unchanged, apart from normal update timestamps. No settings media URL needed changing. All 669 distinct referenced destination image URLs passed public HTTP checks.

One historical order item references a file that was **already missing from the source** before this copy (`NoSuchKey`). That original URL remains unchanged; no replacement image was invented. The private verification report records the affected order item and object path. This is the only remaining source Storage reference in the checked product, order-item, and settings media fields.

Storage access checks passed for anonymous users, customers, and an admin: product images are publicly readable, listing and mutation require an admin, and payment proofs remain private with server-issued signed URL access. Temporary verification users and files were removed. Local browser checks at 390px and 1440px passed for the catalog and product page: visible images loaded from the destination, no old Storage requests occurred, and there were no page errors or horizontal overflow. Lint, typecheck, and the Vercel build passed; regenerated public types were unchanged. Migration history is in sync. The security advisor still reports only the previously documented leaked-password-protection warning; the performance advisor reports no warnings.

Keep the source project active for rollback and previously shared image links. Do not pause or delete it without a separate retirement decision. Browser cart snapshots and emails sent before cutover can still contain old URLs.

Backups, credentials, and verification files stay outside Git:

- Database copy: `/home/ak/.local/share/lastella/migrations/20261022-030250/`.
- Full Storage backup, source/destination inventories, per-file checksums, access checks, pre-cutover rows, and rollback SQL: `/home/ak/.local/share/lastella/migrations/storage-20261022/`.

The private `rollback-urls.sql` restores only migrated fields whose current values still match the cutover result, preserving later edits. Review it before use; any rollback after new writes needs care. The source project and its data were not modified or deleted.

## Additional customer account copied — 22 October 2026

A later source/destination comparison found one confirmed customer account that was absent from the destination. A fresh private backup and email/phone/provider-identity conflict check preceded the copy. One transaction inserted the original Auth user ID, preserved password hash and email identity, and restored its profile and customer role. The normal signup trigger remained enabled; only its newly generated profile/role rows for this inserted user were replaced with the source records. Sessions and pending authentication flows were not migrated, and no email was sent.

Verification confirmed four users, identities, profiles, and role records in the destination. All three pre-existing destination accounts and the order associations were unchanged. The account is visible through the destination Auth Admin API, and the password hash matches the source. A password login was not attempted because the customer's plaintext password is unknown. At the final check, no source-only Auth user, profile, or order remained.

Private backups, the one-user restore SQL, and verification results are under `/home/ak/.local/share/lastella/migrations/auth-delta-20261022/`, outside Git. This was a data-only operation; application code, database schema, and permissions were not changed.

Per the user's instruction, the demo deployment was not updated or redirected. It still uses the source project and can create additional source-only data if used again. The source project has not been deleted.

## Local cleanup

Task-owned dev/test processes were stopped and generated build outputs, temporary browser-test output, and Vite caches were removed. The 186 partial image downloads were removed only after both copies matched the SHA-256 checksums in the full 679-file backup. No unique backup file was deleted. Reusable task scripts were consolidated into `migration-tools.tar.gz` inside the Storage and additional-user backup directories; rollback SQL, credentials, inventories, and verification reports remain private outside Git. Project dependencies and lockfiles were not changed by this cleanup.
