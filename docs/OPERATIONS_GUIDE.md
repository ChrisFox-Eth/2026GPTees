# How to Manage and Operate GPTees (For Humans)

Plain-English playbook to run GPTees without deep code knowledge.

## What the system does (in 30 seconds)
- Customers buy a tee plus design in one of two tiers: **Classic (Basic/BASIC)** = one-shot; **Limitless (Premium/PREMIUM)** = unlimited redraws with new prompts until approval.
- Core product today: **Printful Bella+Canvas 3001 tee** (Printful ID 71) with mapped colors/sizes.
- Flow: Pay first (Stripe) → generate/approve AI art (OpenAI) → auto-send to Printful → emails via Resend; auth via Clerk; analytics via Vercel Analytics.

## Tier naming vs. backend keys
- UI wording is Classic/Limitless. Backend and DB keys remain **BASIC** and **PREMIUM**—do not rename enums or DB values.
- QuickStart on the home page defaults to Limitless (Premium).

## Where to change prices and limits
- Supabase `settings` table (no code change needed):
  - `basic_tier_price`, `premium_tier_price`, `test_tier_price`
  - `basic_tier_max_designs` (set to 1 for Classic), `premium_tier_max_designs` (set high for Limitless), `test_tier_max_designs`
- Frontend and checkout read pricing from the API automatically.

## Shipping (flat rates)
- Flat rates: US $5.95, CA $7.95, Intl $9.95.
- Shown at checkout and passed to Stripe/Printful.
- To change: edit `backend/src/config/shipping.ts` and redeploy backend.

## Products (keep it simple)
- Active: Printful product 71 (Bella 3001). Other seeded items stay inactive until you map variants.
- To add or deactivate:
  - Update Supabase `products` table (or rerun `backend/prisma/seed.ts`).
  - Ensure Printful variant mapping exists before setting `isActive=true`; otherwise orders will fail.

## Keys and environment (must-haves)
- **Backend (.env / hosting):** `DATABASE_URL`, `CLERK_*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `PRINTFUL_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL`.
- **Frontend (Vercel):** `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
- Storage is Supabase; no AWS/S3 keys needed.

## Webhooks to keep in sync
- **Stripe:** `POST /api/webhooks/stripe` (checkout.session.completed).
- **Printful:** `POST /api/webhooks/printful` (order status updates).
- **Clerk:** `POST /api/webhooks/clerk` (user sync).
Point each provider’s dashboard to your backend URL; replay failed events when needed.

## Running abandoned-checkout reminders (optional)
- Set `ENABLE_ABANDONED_REMINDERS=true`.
- Run `npm run remind:abandoned` in `backend/` (schedule/cron in production). Sends reminders for `PENDING_PAYMENT` orders older than 1 hour.

## Daily/weekly checks
- Stripe: failed webhooks or payments? replay if needed.
- Printful: errored orders? fix variant mappings before requeueing.
- Supabase `settings`: prices/limits correct?
- Resend: bounces/errors?
- Vercel Analytics: funnels firing (order.paid emitted client-side on success).

## Support steps (common issues)
- Can’t generate designs: ensure order status `PAID` and `designs_generated < max_designs` (check `orders` table). Classic max should be 1; Limitless high.
- Variant missing: confirm product 71 only, or add mappings for new SKUs.
- Payment stuck: replay Stripe webhook or hit `/api/payments/confirm-session` (Confirm Payment button on success page).
- Tracking missing: once `trackingNumber` is stored, customers see links in Account and Order Detail pages.
- Manual order sync (Printful → DB): POST to `/api/admin/sync-fulfillment` to pull latest Printful statuses. Only works in `NODE_ENV=development` or when `ALLOW_ADMIN_SYNC=true` is set on the backend host. Use with an authenticated tool like curl/Postman. Example:
  ```
  curl -X POST https://<your-backend>/api/admin/sync-fulfillment
  ```
  Response includes how many orders were updated.

## Deploy/verify checklist
- Set env vars in backend host and Vercel.
- Backend: `npm run build` to regenerate Prisma client, then deploy.
- Post-deploy smoke test: run a Stripe test checkout (4242...), generate/approve art (Classic and Limitless), confirm emails, and Printful submission.

## Who owns what (mental map)
- **Auth:** Clerk
- **Payments:** Stripe (webhook required)
- **AI:** OpenAI (DALL-E)
- **Database/Storage:** Supabase (Postgres + Storage)
- **Fulfillment:** Printful (webhook recommended)
- **Email:** Resend
- **Analytics:** Vercel Analytics (client events)

## Branding, copy, and UI tweaks
- **Site UI/copy:** `frontend/src` components. Key spots: `Hero.tsx`, `PricingSection.tsx`, `Quickstart.tsx`, `Header`, `Footer`, `CheckoutPage.tsx`, `DesignPage.tsx`.
- **Global styles:** `frontend/src/index.css`, `App.css`.
- **Product images/descriptions:** `backend/prisma/seed.ts` and Supabase `products` table. Swap image URLs and descriptions there.
- **Legal pages:** `frontend/src/pages/PrivacyPage.tsx`, `TermsPage.tsx`, `RefundsPage.tsx`.
- **Emails (Resend) templates:** `backend/src/services/email.service.ts`
  - `sendOrderConfirmation`
  - `sendDesignApproved`
  - `sendOrderShipped`
  - `sendAbandonedCheckoutReminder` (optional)
  - `sendPromptGuide`
  Edit inline HTML and colors here. Sender = `RESEND_FROM_EMAIL`.
- **Clerk UI:** Configure branding in Clerk dashboard (Appearance). App wraps with `ClerkProvider` in `frontend/src/main.tsx`; routes handled in `AuthPage.tsx` and `App.tsx`.
- **Printful emails vs. Resend:** You can disable Printful’s customer emails in their dashboard to keep voice consistent with Resend. If you keep them, set logo/brand in Printful Settings → Branding/Packing Slips and match the “from” name with Resend.

## How to update Resend templates (quick)
1) Open `backend/src/services/email.service.ts`.
2) Edit the target function’s HTML (copy/colors/CTA/logo URL).
3) Deploy backend; place a test order to verify. Check Resend logs for bounces/errors.
4) Ensure `RESEND_FROM_EMAIL` is set and domain is verified in Resend.

## How to adjust Clerk login/signup experience
1) Clerk Dashboard → Appearance: set brand color/logo/buttons.
2) Clerk Dashboard → Authentication: choose sign-in methods and rules.
3) App copy/layout: `frontend/src/pages/AuthPage.tsx` and routing in `App.tsx`.
4) Test locally: `npm run dev --prefix frontend`.

## Email ownership and branding tips
- **Resend (ours):** order confirmation, design approved, shipped, prompt tips, abandoned reminder. Set display name (e.g., `GPTees <hello@yourdomain.com>`).
- **Printful:** optional; align branding if enabled. Prefer Resend-only for consistent voice.
- Keep logo/brand color/CTA language consistent across Resend templates, site hero, and checkout.

## Where to change site copy fast
- Hero headline/subtext/CTA: `frontend/src/components/Hero/Hero.tsx`
- Pricing blurb/features: `frontend/src/components/PricingSection/PricingSection.tsx`
- QuickStart copy (Limitless vs Classic note): `frontend/src/components/Quickstart/Quickstart.tsx`
- Checkout helper copy: `frontend/src/pages/CheckoutPage.tsx`
- Success page CTAs/share text: `frontend/src/pages/CheckoutSuccessPage.tsx`
- Design page helper text/prompts: `frontend/src/pages/DesignPage.tsx`
- Legal pages: `frontend/src/pages/PrivacyPage.tsx`, `TermsPage.tsx`, `RefundsPage.tsx`
