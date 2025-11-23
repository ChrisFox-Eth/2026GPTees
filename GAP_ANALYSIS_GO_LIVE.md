# GAP Analysis — Go-Live Readiness (2025-11-22)

Scope: Functional readiness vs. the original implementation plan (excluding automated testing/deployment). Focus is on what must be fixed in code/config to ship GPTees within 24 hours.

## Snapshot
- Backend: Core routes (auth/products/payments/designs/orders) and integrations (Clerk/Stripe/OpenAI/S3) are present. Printful + email exist but have correctness gaps.
- Frontend: Shop/cart/checkout/account/design pages exist with Clerk wrapping. UX has a few blockers that prevent smooth design approval/fulfillment.
- Database: Prisma schema + initial migration/seed exist; ensure they are applied to Supabase/Heroku.

## Critical Blockers (must fix to ship)
- Printful webhook payload is not parsed, so fulfillment status/tracking never updates and “order shipped” emails never fire. Route `/api/webhooks/printful` is mounted before `express.json`, and the route itself has no body parser (`backend/src/index.ts`, `backend/src/routes/webhook.routes.ts`). Add `express.json({ type: 'application/json' })` (or move this route after the global JSON parser) so `handlePrintfulWebhook` receives structured data.
- Stripe client uses an invalid API version (`apiVersion: '2025-11-17.clover'` in `backend/src/services/stripe.service.ts`), which will hard-fail checkout/webhooks. Pin to a real version (e.g., `2024-11-20`) and re-run a checkout + webhook round-trip.
- Design approval flow is stuck after generation unless the user refreshes. Backend returns a design with status `GENERATING` and updates to `COMPLETED` only after the async S3 upload; the frontend never polls or refetches (`frontend/src/pages/DesignPage.tsx`), so the Approve button never appears. Add a short poll/refetch loop after generation or wait for S3 completion before responding so users can approve immediately.
- Fulfillment controls from the plan are missing. Order API only lists/reads orders (`backend/src/controllers/order.controller.ts`); there’s no submit/confirm/tracking endpoint, and failures from `createPrintfulOrder` are swallowed. Add POST `/api/orders/:id/submit-fulfillment` + `/tracking` endpoints and persist Printful errors so users aren’t left in `DESIGN_APPROVED` limbo.

## High Priority Gaps (close in the same push if possible)
- Printful robustness: `PRINTFUL_STORE_ID` is unused and variant mapping is hard-coded for three products (`backend/src/services/printful.service.ts`). Either enforce only supported products or load/store the mapping in DB/config and include `store_id` in requests. Surface Printful failures to the order record (`fulfillmentStatus`, error message) for retry.
- Shipping/tax handling: Checkout collects an address but charges $0 shipping/tax (`stripe.service.ts` line items only). Printful submission hardcodes `shipping: '0.00'`. Decide on free shipping or add real shipping rates; otherwise margins and expectations will be wrong and Printful may reject incomplete addresses.
- Clerk auth hardening: `requireAuth` falls back to `CLERK_PUBLISHABLE_KEY` if the secret is missing and only checks issuer prefix (`backend/src/middleware/auth.middleware.ts`). Require `CLERK_SECRET_KEY` and add audience verification to avoid accepting malformed tokens.
- Email deliverability: `RESEND_FROM_EMAIL` defaults to `noreply@yourdomain.com` and errors are swallowed (`backend/src/services/email.service.ts`). Set a verified sender and log/store failures so order confirmation/design approved/shipped emails aren’t silently dropped.
- Tracking in UI: Frontend doesn’t display `trackingNumber`/`fulfillmentStatus` even if we store them (`frontend/src/pages/OrderDetailPage.tsx`, `AccountPage.tsx`). Add these fields so customers can self-serve tracking.
- UX polish/legibility: Multiple UI/email strings show mojibake placeholders (e.g., buttons in `Header.tsx`, `DesignPage.tsx`, and email templates). Replace with real text/icons to avoid shipping with broken copy.

## Operational Checks (do during fixes)
- Database: Ensure `prisma migrate deploy` and `prisma db seed` are run against Supabase/Heroku using the provided `DATABASE_URL`.
- Webhooks: Point Stripe to `/api/webhooks/stripe` (raw body), Clerk to `/api/webhooks/clerk`, and Printful to `/api/webhooks/printful` after the body-parser fix. Confirm secrets match env.
- Environment: Verify all provided keys are set on both backend (Heroku) and frontend (Vercel). Critical: `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `OPENAI_ORGANIZATION_ID`, `PRINTFUL_API_KEY`, `RESEND_API_KEY`, `AWS_*`, `S3_BUCKET_NAME`, `FRONTEND_URL`, `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`.
- Smoke tests to validate fixes: create checkout → pay (webhook updates to PAID) → generate design → approve → ensure Printful order created and webhook updates status/tracking → emails are received.
