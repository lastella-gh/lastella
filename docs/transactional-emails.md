# Lastella admin order notifications

Checkout collects a contact number, name, and delivery address. It does not collect or infer a customer email, including for signed-in customers. New orders store `NULL` in the optional historical `orders.email` column. Existing order emails are retained for historical admin records. Account sign-in still uses Supabase Auth email/password.

Only admins receive a branded email when a new order is committed. Customers receive no order, payment-review, shipping, delivery, or cancellation emails. Admin payment/status changes send no emails. The notification includes saved product names/images, sizes/colors, quantities, three-decimal OMR totals, customer contact number, delivery address, and notes. HTML and plain-text versions are provided.

## Store setting

In **Admin → Store Settings → Order Notifications**, use **Email admins when a new order is received**, then save. The persisted `store_settings.admin_order_emails_enabled` switch defaults to enabled and is read server-side on every checkout. Turning it off suppresses both sending and development previews for subsequent orders. A missing/unreadable setting fails closed; notification failures do not fail checkout.

Only admins can update Store Settings through existing RLS policies. Recipient addresses and provider credentials stay in server environment variables.

## Environment

| Variable               | Purpose                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`       | Server-only Resend API key.                                                                                     |
| `ORDER_EMAIL_FROM`     | Verified sender, e.g. `Lastella <info@lastellajewellery.com>`.                                                  |
| `ORDER_ADMIN_EMAILS`   | Comma-separated admin recipients. Without recipients, no notification is sent.                                  |
| `ORDER_EMAIL_SITE_URL` | Storefront origin for the hosted logo and authenticated admin-order link, e.g. `https://lastellajewellery.com`. |
| `ORDER_EMAIL_REPLY_TO` | Optional monitored reply-to address.                                                                            |

Do not use `VITE_` prefixes for email credentials. Production requires a verified Resend domain, API key, and sender. Environment changes require a restart/redeploy. Without a site URL, the email uses text branding and omits the admin link. No private checkout receipt token, payment proof, or signed Storage URL is included.

## Development and failures

With `npm run dev` (`NODE_ENV=development`), enabled admin notifications are logged to the server console instead of sent, even if an API key is present. No API key or sender is required for these previews. The log contains the admin recipients, subject, and plain-text order details.

Production requests have a five-second timeout and one bounded retry for network failures, rate limits, or provider 5xx responses. The stable new-order idempotency key is retained across checkout retries; provider deduplication lasts 24 hours. Failures are logged without provider response bodies or private receipt/payment credentials. Checkout remains successful if notification delivery fails.

There is no durable email outbox or delivery webhook integration. A process crash after order commit can leave a notification unsent; provider delivery diagnostics remain in Resend. Do not replay old checkout requests as a general resend tool.

## Verification

Check phone-only guest and signed-in checkout, required contact-number validation, and the persisted setting. Intercept provider requests to verify admin-only recipients, saved order totals/options, switch-off suppression, retry idempotency, and no sends from development or order status/payment changes. Use only a deliberately chosen test inbox for real delivery tests.

Provider references: [sending email](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
