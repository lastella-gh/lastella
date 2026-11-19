# Deploy Lastella to Hostinger

In hPanel, open **Websites → Create site → Web App** and select a temporary domain for the first deployment. Choose **Import your Git repository → Connect with GitHub** and select `lastella-gh/lastella`. Use `main` so Hostinger automatically deploys updates pushed to the same branch used by Lovable.

| Setting          | Value                      |
| ---------------- | -------------------------- |
| Framework preset | Nitro (backend)            |
| Node.js version  | 24.x                       |
| Git branch       | `main`                     |
| Root directory   | Repository root            |
| Package manager  | npm                        |
| Build command    | `npm run build:hostinger`  |
| Output directory | `.output`                  |
| Entry file       | `.output/server/index.mjs` |

If hPanel only offers `npm run build`, set `NITRO_PRESET=node-server` in the deployment environment. If it detects the project as Vite, select Nitro or use **Other** with the build and entry settings above. The equivalent local commands are `npm run build:hostinger` and `npm start`.

Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` to hPanel's environment variables before deploying. Use the values for `www.lastellajewellery.com`, including `SUPABASE_URL` if it is set. The Vercel demo URL currently points to the older Supabase project. Keep `SUPABASE_SECRET_KEY` server-only. Use the existing [order email variables](transactional-emails.md) if admin order emails are enabled, with `ORDER_EMAIL_SITE_URL` set to the canonical storefront origin. Leave local `.env` files out of the upload.

On Hostinger, product images load from their original Supabase Storage URLs. Vercel's responsive image optimizer is specific to Vercel deployments.

Verify the home page, catalog, product images, sign-in, and checkout on the temporary domain. Avoid submitting an order with production credentials during a preview smoke check unless a production test order is intended. Once verified, use **Connect domain** on the Node.js app. Save the current web DNS records for rollback, then use the records shown for the new Node.js app. Preserve existing mail records. Check HTTPS, apex and www behavior, and checkout on the live domain before retiring the Vercel deployment.

[Hostinger Web App setup](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) · [Connect a custom domain](https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/)
