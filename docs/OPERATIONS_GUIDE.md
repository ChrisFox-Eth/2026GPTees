# How to Manage and Operate GPTees (For Humans)

Plain-English playbook to run GPTees without deep code knowledge.

## What the system does (in 30 seconds)
- Customers buy a **Basic** (1 design) or **Premium** (unlimited) design for one product: the **Bella+Canvas 3001 tee** (Printful ID 71) with a few colors/sizes.
- They pay first (Stripe), then generate/approve an AI design (OpenAI), and we auto-send to Printful for printing/shipping.
- Emails go out via Resend; analytics via Vercel Analytics; auth via Clerk.

## Where to change prices and limits
- Go to **Supabase** → `settings` table. Edit these keys:
  - `basic_tier_price`, `premium_tier_price`, `test_tier_price`
  - `basic_tier_max_designs`, `premium_tier_max_designs`, `test_tier_max_designs`
- Premium is unlimited unless you set `premium_tier_max_designs` to a number.
- No code change needed; frontend reads from API automatically.

## Shipping (flat rates)
- Hard-coded flat rates: US $5.95, CA $7.95, Intl $9.95.
- Shown at checkout and charged via Stripe; passed to Printful. To change, edit `backend/src/config/shipping.ts` and redeploy.

## Products (keep it simple)
- Only **Printful product 71 (Bella 3001)** is active. Colors limited to mapped basics.
- To add/deactivate products:
  - Update `products` table in Supabase (or rerun `backend prisma/seed.ts`).
  - Ensure Printful variant mapping exists before activating new SKUs, or orders will be blocked.

## Keys and environment (must-haves)
- **Backend (.env / Heroku):** `DATABASE_URL`, `CLERK_*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `PRINTFUL_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL`.
- **Frontend (Vercel):** `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
- AWS/S3 keys are **not used** (storage is Supabase).

## Webhooks to keep in sync
- **Stripe** → `POST /api/webhooks/stripe` (checkout.session.completed).
- **Printful** → `POST /api/webhooks/printful` (order status updates).
- **Clerk** → `POST /api/webhooks/clerk` (user sync).
Make sure each dashboard points to your backend URL.

## Running the abandoned-checkout reminders (optional)
- Env flag: `ENABLE_ABANDONED_REMINDERS=true`.
- Command: `npm run remind:abandoned` in `backend/` (use a scheduler/cron in production). Sends a reminder for `PENDING_PAYMENT` orders older than 1 hour.

## Daily/weekly checks (no code)
- Stripe dashboard: failed webhooks? (replay if needed).
- Printful dashboard: errored orders? (fix variant mapping if you add SKUs).
- Supabase `settings` table: pricing/limits correct?
- Resend dashboard: email bounces/errors?
- Vercel Analytics: track funnel events (order.paid emitted client-side on success).

## Support steps (common issues)
- Customer can’t generate designs: ensure order status is `PAID` and designs_generated < max_designs (check `orders` table).
- Variant not available: confirms you’re only selling product 71; new SKUs need mappings.
- Payment stuck: retry Stripe webhook or use “Confirm Payment” button on the success page (hits `/api/payments/confirm-session`).
- Tracking missing: once `trackingNumber` is stored on the order, users see a clickable tracking link in Account and Order Detail pages.

## Deploy/verify checklist
- Set env vars in Heroku (backend) and Vercel (frontend).
- Rerun `npm run build` in backend to regenerate Prisma client, then deploy.
- After deploy: run a test checkout (Stripe test card 4242...) and generate/approve a design; confirm emails and Printful submission.

## Who owns what (mental map)
- **Auth**: Clerk
- **Payments**: Stripe (webhook required)
- **AI**: OpenAI (DALL-E)
- **Database/Storage**: Supabase (Postgres + Storage)
- **Fulfillment**: Printful (webhook recommended)
- **Email**: Resend
- **Analytics**: Vercel Analytics (client events)

## Branding, copy, and UI tweaks (non-technical checklist)
- **Site colors/typography/layout**: `frontend/src` components. Global styles: `frontend/src/index.css`, `App.css`. Hero/pricing copy: `frontend/src/components/Hero/Hero.tsx`, `frontend/src/components/PricingSection/PricingSection.tsx`. Buttons/text: `frontend/src/components/Button`, `Header`, `Footer`.
- **Product images/descriptions**: `backend/prisma/seed.ts` (and `products` table in Supabase). Swap image URLs to your branded mockups; update descriptions there.
- **Legal pages copy**: `frontend/src/pages/PrivacyPage.tsx`, `TermsPage.tsx`, `RefundsPage.tsx`. Edit text directly.
- **Emails (Resend)**: HTML templates live in `backend/src/services/email.service.ts`:
  - `sendOrderConfirmation`
  - `sendDesignApproved`
  - `sendOrderShipped`
  - `sendAbandonedCheckoutReminder` (optional)
  - `sendPromptGuide`
  Each template is inline HTML. Edit copy/branding/colors here. Sender is `RESEND_FROM_EMAIL` (set in backend env).
- **Clerk UI (sign-in/up modal)**: Managed via Clerk Dashboard (branding, logo, color) and on-app routing:
  - Dashboard: https://dashboard.clerk.com → Appearance → set brand colors/logo; Authentication → sign-in methods.
  - Frontend entry: `frontend/src/main.tsx` wraps the app with `ClerkProvider`; routes `/auth`, `/sign-in/*`, `/sign-up/*` handled in `frontend/src/pages/AuthPage.tsx`. Update headings/copy in `AuthPage.tsx` if desired.
- **Emails from Printful vs. Resend**: Printful can send its own notifications; we also send from Resend. For a single brand voice, consider disabling Printful’s customer emails in Printful dashboard and rely on our Resend templates. If you keep Printful emails on, set your logo/brand in Printful dashboard → Settings → Packing Slips/Branding, and use the same “from” name as Resend for consistency.

## How to update Resend email templates/content (step-by-step)
1) Open `backend/src/services/email.service.ts`.
2) Find the function for the email you want (e.g., `sendOrderConfirmation`).
3) Edit the HTML string: change colors (inline styles), copy, CTAs, and logo URL if desired.
4) Deploy backend; trigger the flow (e.g., place a test order) to verify. Resend dashboard shows logs/bounces.
5) Sender identity: set `RESEND_FROM_EMAIL` in backend env; use a verified domain in Resend for deliverability.

## How to adjust Clerk login/signup experience
1) Clerk Dashboard → Appearance: set brand color, logo, button styles.
2) Clerk Dashboard → Authentication: choose methods (email, OAuth), enable/disable requirements.
3) App-level copy/layout: `frontend/src/pages/AuthPage.tsx` (wrapper) and routing in `App.tsx` (`/auth`, `/sign-in/*`, `/sign-up/*`). Adjust headings/subtext there if needed.
4) Test locally with `npm run dev --prefix frontend`; sign-in modal will reflect dashboard branding.

## Email ownership and branding
- **Resend (ours)**: Order confirmation, design approved, order shipped, prompt tips, abandoned reminder. “From” address is `RESEND_FROM_EMAIL`; set your display name in that address (e.g., `GPTees <hello@yourdomain.com>`). All copy/HTML is fully controllable in `email.service.ts`.
- **Printful**: Can be disabled or customized in Printful dashboard. If enabled, set your logo/brand in Printful → Settings → Branding/Packaging. To avoid mixed voice, prefer keeping customer-facing emails on Resend only.
- **Consistency tips**: Use the same logo URL, brand color, and CTA language across Resend templates, site hero, and checkout.

## Where to change site copy fast
- Hero headline/subtext/CTA: `frontend/src/components/Hero/Hero.tsx`
- Pricing blurb and feature bullets: `frontend/src/components/PricingSection/PricingSection.tsx`
- Checkout helper copy: `frontend/src/pages/CheckoutPage.tsx`
- Success page CTAs/share text: `frontend/src/pages/CheckoutSuccessPage.tsx`
- Design page helper text/prompts: `frontend/src/pages/DesignPage.tsx`
- Legal pages: `frontend/src/pages/PrivacyPage.tsx`, `TermsPage.tsx`, `RefundsPage.tsx`
