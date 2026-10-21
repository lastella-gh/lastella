# Lastella transactional emails

Emails are sent server-side through Resend after checkout or an admin order change has committed. They use the saved `orders` and `order_items` snapshots, including product images, sizes/colors, quantities, unit and line prices, delivery address, and three-decimal OMR totals. The HTML uses email-compatible tables and inline styles; every email also includes plain text.

## Configuration

Set these in the deployment's server environment, and in the ignored `.env` for local previews:

| Variable               | Purpose                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY`       | Resend sending API key. Keep server-only.                                                                                      |
| `ORDER_EMAIL_FROM`     | Verified sender: `Lastella <info@lastellajewellery.com>`.                                                                      |
| `ORDER_ADMIN_EMAILS`   | Optional comma-separated recipients for new-order alerts.                                                                      |
| `ORDER_EMAIL_SITE_URL` | Public HTTPS storefront origin. Used for the hosted logo, checkout receipt links, and admin links. No trailing path is needed. |
| `ORDER_EMAIL_REPLY_TO` | Optional monitored support email for customer replies.                                                                         |

The configured storefront is currently `https://lastella-demo.vercel.app`. When the custom domain is live, change only `ORDER_EMAIL_SITE_URL` to `https://lastellajewellery.com` in `.env` and the deployment environment, then restart/redeploy so the server loads the new value. No code change is needed. Sender, reply-to, and admin inbox currently use `info@lastellajewellery.com`; these are also environment-configurable.

Verify the sender domain in Resend and configure its required DNS records before enabling delivery. Use the real deployed storefront URL. Do not prefix any of these variables with `VITE_`.

In production, without the API key or sender, email sending is disabled with a server log warning. Without the site URL, emails retain the text branding and order details, but omit the logo and storefront/receipt links. The order receipt token is used only in the customer's confirmation link; admin alerts link to the authenticated admin panel. Payment-proof images and private Storage links are never attached or included.

## Events

With `npm run dev` (`NODE_ENV=development`), every email is logged to the server console instead of being sent to Resend, even when an API key is configured. The preview includes the recipient, event, subject, and plain-text order details; API keys and private receipt links are omitted. No Resend key or sender is required for development previews. Production delivery keeps the configuration requirements above.

- Checkout: customer order receipt and a separate new-order alert to configured admins. The current proof-upload checkout says the bank transfer proof is under review; it does not claim that payment is verified.
- Payment review: customer payment verified or rejected email, including the rejection reason when applicable.
- Order status: customer emails for processing, shipped, delivered, and cancelled. Selecting the existing state does not send another email. Pending/awaiting-payment status edits do not send a separate update.

Email failure never turns a successful checkout or admin update into an error. Transient network failures, rate limits, and provider 5xx responses receive one bounded retry. The same request uses the same Resend idempotency key; provider deduplication lasts 24 hours. Status events use the committed update timestamp so a later transition back to the same status can send a fresh notification. Customer and admin delivery are independent.

This integration does not include a durable email outbox or delivery webhooks. Permanent failures are logged with order ID and event; delivery/bounce diagnostics are available in Resend. An application crash after committing an order can leave an email unsent. Use a durable outbox if guaranteed background retries are required. Do not replay old checkout requests as a general email resend tool.

## Verification

Before production enablement, inspect a rendered HTML preview at phone and desktop widths, including image-blocked/plain-text output. Exercise checkout, payment decisions, and order status changes against intercepted provider requests; verify recipient separation, stored totals/options, no email on failed mutations, retry idempotency, and that provider failures do not fail the completed order action.

A real inbox delivery check requires a verified sender and API key. Use an explicitly chosen test recipient rather than a customer's address.

Provider references: [sending email](https://resend.com/docs/api-reference/emails/send-email), [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys), [domain verification](https://resend.com/docs/dashboard/domains/introduction).
