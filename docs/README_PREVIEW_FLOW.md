# GPTees Preview-First Flow — Read Me for Humans

This doc is the fast lane to understand, run, and ship the preview-first flow (design-before-payment) across local and prod. It covers the why, the how, and the exact commands to use. Treat it as the “you just joined the team” briefing.

---

## The Pitch (what we’re selling)
- Let shoppers create a tee design **before paying**. We anchor them with a preview order in `PENDING_PAYMENT`.
- Limits: **Basic = 1 preview**, **Premium = unlimited** (backend enforced, UI enforced).
- Guest users can start a preview, then sign in and reclaim it—keeping the prompt, design, and orderId.
- Checkout **reuses** the preview orderId (no duplicate orders). Webhooks update the same order.
- Fulfillment/approval is blocked until payment. No watermarking or downscaling (by design).
- Static overlay mocks per color (ticket 007) are next; placement control deferred.

---

## High-Level Architecture
- **Frontend**: React + TS + Tailwind + framer-motion; Clerk for auth; Stripe Checkout; Supabase storage for images.
  - Key pages/components: `DesignPage` (preview banner, generate on `PENDING_PAYMENT`), `Quickstart` (home inline preview, guest → claim flow), `CheckoutPage` (accepts `?orderId=` to reuse preview).
- **Backend**: Express + Prisma (Postgres); Stripe for payments; Printful for fulfillment; Supabase storage; Clerk auth middleware.
  - Services: `stripe.service.ts`, `printful.service.ts`, `pricing.service.ts`, `analytics.service.ts`.
  - Controllers: `order.controller.ts`, `design.controller.ts`, `payment.controller.ts`.
  - Routes: `/api/orders/preview`, `/api/orders/preview/guest`, `/api/orders/preview/claim`, `/api/designs/generate`, `/api/payments/create-checkout-session`.
  - Statuses reused: `PENDING_PAYMENT` for previews; fulfillment gates check `PAID`+.

---

## Data & Status Semantics
- **Order statuses**: `PENDING_PAYMENT` (preview + unpaid), `PAID`, `DESIGN_PENDING`, `DESIGN_APPROVED`, `SUBMITTED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`.
- **Preview identity**:
  - Guest orders carry `previewGuestToken` (new column) and a temporary guest user.
  - After login, `/api/orders/preview/claim` reassigns the order to the real user and deletes the guest user if unused.
- **Design limits**: `maxDesigns` from pricing map (Basic=1, Premium=9999). Enforced in backend and UI.
- **Checkout reuse**: `createCheckoutSession` accepts `orderId`; recalculates totals from stored items; keeps metadata consistent so Stripe webhook updates the same order.
- **Fulfillment gate**: Approval/Printful blocked unless `status` is `PAID` (or later). Approve endpoint rejects unpaid.

---

## Local Setup (step-by-step)
1) **Install deps**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2) **Env files**
   - Copy `.env.example` to `.env` in both backend and frontend; fill:
     - Clerk: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
     - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_API_VERSION`, `STRIPE_WEBHOOK_SECRET`
     - Supabase: storage keys/URLs
     - Printful: `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID` (optional)
     - DB: `DATABASE_URL`
     - Frontend base: `FRONTEND_URL`
   - For local auth bypass: `SKIP_AUTH=true` (backend) with `SKIP_AUTH_EMAIL` if needed.
3) **Database**
   - Ensure Postgres running and `DATABASE_URL` points to it.
   - The Supabase prod DB already has `previewGuestToken` (added via SQL). To keep local Prisma in sync:
     - If you just want local types/models: `cd backend && npx prisma db pull && npx prisma generate`.
     - If you need a local migration file (for version control), use a local DB and `npx prisma migrate dev --create-only --name add-preview-guest-token` (don’t point this at prod).
4) **Start backend**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on `http://localhost:5000` by default.
5) **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on Vite dev server (usually `http://localhost:5173`).
6) **Stripe webhook (local)**
   - Use Stripe CLI:
     ```bash
     stripe listen --forward-to localhost:5000/api/webhooks/stripe
     ```
   - Ensure `STRIPE_WEBHOOK_SECRET` matches the CLI output.
7) **Printful webhook (optional local)**
   - Expose tunnel (ngrok) and set `PRINTFUL_WEBHOOK_SECRET` if using signature checks.

---

## Key Commands & Scripts
Backend (from `backend/`):
- `npm run dev` — start API in dev.
- `npm run build && npm run start` — prod build/start.
- `npx prisma migrate dev --name <name>` — create/apply migrations locally.
- `npx prisma migrate deploy` — apply migrations in prod.
- `npx prisma studio` — inspect DB.

Frontend (from `frontend/`):
- `npm run dev` — start Vite dev server.
- `npm run build` — production bundle.
- `npm run preview` — preview production build.

Stripe CLI:
- `stripe listen --forward-to localhost:5000/api/webhooks/stripe`

---

## Flow Walkthroughs (happy paths)
1) **Homepage Quickstart (unauth)**
   - User enters prompt → `POST /api/orders/preview/guest` creates preview + guest token (PENDING_PAYMENT).
   - Prompt/token stored locally; user is prompted to sign in.
   - After login → `/api/orders/preview/claim` reassigns order → immediate `/api/designs/generate` → inline design shown with CTA:
     - “Continue with this” → `/checkout?orderId=...` (reuses preview order)
     - “Try again (Premium)” → regenerate (tier already Premium by default).
2) **Design Page (auth)**
   - Accepts `?orderId=`. Shows preview banner if `PENDING_PAYMENT`.
   - Allows generate when `PENDING_PAYMENT`/`DESIGN_PENDING`/`PAID`.
   - Approve button becomes “Checkout to print” until paid.
3) **Checkout Reuse**
   - `POST /api/payments/create-checkout-session` accepts `orderId`; recalculates totals from DB items/tier; no new order created.
   - Success webhook marks the same order `PAID`.
4) **Fulfillment**
   - Approval endpoint blocks unpaid; Printful service rejects unpaid orders. Webhooks update status to SHIPPED/DELIVERED.

---

## Operational Checks (what to watch)
- **Migrations**: Prod already has `previewGuestToken` via manual SQL. Don’t run `migrate dev` against prod; use `migrate deploy` only after reviewing any new migration files.
- **Webhook health**: Stripe webhook must run for payment capture; fallback endpoint exists (`/api/payments/confirm-session`) but should be rare.
- **Status transitions**: Preview orders stay `PENDING_PAYMENT` until Stripe marks them paid; design generation sets `DESIGN_PENDING`; approval sets `DESIGN_APPROVED`; Printful moves to `SUBMITTED`/`SHIPPED`.
- **Identity attach**: Guest orders must be claimed via `/api/orders/preview/claim`—verify login flows in QA.
- **Design limits**: Basic capped at 1; ensure UI disables generate when limit hit; backend returns 400.
- **Checkout reuse**: Passing `orderId` must not create duplicates; totals must match Stripe metadata (watch for variant mapping errors).
- **Fulfillment gating**: Approve endpoint and Printful submission must enforce payment.

---

## Prod Deployment Pointers
- **Backend**
  - Apply migrations: `npx prisma migrate deploy`.
  - Set env for Stripe, Clerk, Supabase, Printful, DATABASE_URL, FRONTEND_URL.
  - Ensure webhook endpoints are reachable externally; configure Stripe webhook secret accordingly.
- **Frontend**
  - Set `VITE_API_URL` to backend API URL; `VITE_CLERK_PUBLISHABLE_KEY` to live key.
  - Build: `npm run build`; host static assets (Vercel/Netlify/etc.).
- **Printful**
  - Production API key and store ID; set webhook target to `/api/webhooks/printful`.
- **Analytics**
  - `ANALYTICS_WEBHOOK_URL` optional; if unset, events are no-ops.

---

## Testing Matrix (preview-first)
| Area | Scenario | Expected |
| --- | --- | --- |
| Preview creation | Auth user `POST /api/orders/preview` | 201, order in `PENDING_PAYMENT`, items persisted, maxDesigns set |
| Preview creation | Guest `POST /api/orders/preview/guest` | 201, guest order + `previewGuestToken` returned |
| Guest claim | Auth user `POST /api/orders/preview/claim` | Order reassigned to user, guest token cleared |
| Design generation | `PENDING_PAYMENT` order | 200, design stored, status -> `DESIGN_PENDING`, counter incremented |
| Design limits | Basic with 1 existing design | 400 limit error, analytics event sent |
| Checkout reuse | `create-checkout-session` with `orderId` | No new order, totals from DB, stripeCheckoutId set |
| Checkout amounts | Stripe webhook vs DB total | Amounts match within 1 cent; status -> `PAID` |
| Fulfillment gate | Approve unpaid order | 400 error |
| Fulfillment pass | Approve paid order | Status -> `DESIGN_APPROVED`; Printful submission attempts |
| Guest flow UI | Unauth Quickstart | Preview created, prompt saved, sign-in prompt shown |
| Claim UI | After login with pending guest | Order claimed, design auto-generated inline |
| DesignPage UI | `PENDING_PAYMENT` order | Banner shows, generate enabled, approve replaced with “Checkout to print” |
| Checkout UI | `/checkout?orderId=` | Banner shows reuse, session creation works, redirects to Stripe |
| Regeneration UI | Quickstart “Try again” | Generates new design on same orderId (Premium) |

---

## Quick Reference (endpoints)
- `POST /api/orders/preview` — Auth; create/reuse preview order.
- `POST /api/orders/preview/guest` — No auth; guest preview + token.
- `POST /api/orders/preview/claim` — Auth; claim guest order.
- `POST /api/designs/generate` — Auth; allowed for `PENDING_PAYMENT`/`DESIGN_PENDING`/`PAID`.
- `POST /api/payments/create-checkout-session` — Auth; accepts `orderId` to reuse.
- `POST /api/designs/:id/approve` — Auth; requires paid.
- `POST /api/orders/:id/submit-fulfillment` — Auth; requires paid + approved design.

---

## Known Next Steps / Backlog
- Static overlay shirt previews per color with modal (ticket 007).
- Interactive placement research (ticket 009).
- Uploads (ticket 008) and associated moderation rules.
- Upgrade prompt before Premium on “Try again” already noted; verify copy once UI is finalized.

---

## If Something Breaks
- Check env variables first (Clerk/Stripe/Supabase).
- Verify migrations are applied.
- Stripe amounts mismatching → ensure variant mapping and tier pricing are correct; check `getPrintfulVariantId` and pricing map.
- Guest claim issues → confirm `previewGuestToken` present and not already cleared; check auth headers.
- Printful errors → inspect `fulfillment_events` table and server logs; ensure variant IDs exist for color/size.

You’re good to go. Reach for this doc whenever you need the mental model, the commands, or the test cases.***
