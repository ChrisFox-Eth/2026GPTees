## 2026GPTees – End-to-End Test (Low/No Cost)

Goal: validate the full user flow (landing → sign up → browse → customize → pay → generate → confirm) while avoiding real spend. Run in a test/staging environment with Stripe test keys and a tiny-priced tier.

### Prerequisites
- Backend/Frontend running against staging env vars.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set; bucket `designs` exists and is public.
- Clerk test users enabled (or dev instance).
- Stripe in **test mode** with publishable/secret keys configured in frontend/backend.
- Pricing: keep `TierType.TEST` at `0.01` (backend `pricing.ts`) to minimize any real charges if live keys are ever used by mistake.
- Tier pricing/max designs now come from Supabase `settings` table (keys: `basic_tier_price`, `premium_tier_price`, `test_tier_price`, `basic_tier_max_designs`, `premium_tier_max_designs`, `test_tier_max_designs`). Premium remains unlimited unless you override `premium_tier_max_designs`.
- Shipping is charged as flat-rate: US $5.95, CA $7.95, International $9.95. Totals in checkout should reflect items + shipping.

### Happy-Path Checklist
1) **Landing & Analytics**
   - Open `/` and ensure shop grid loads products; network call to `/api/products` returns active items.
   - Confirm “Starting at” shows the tier-inclusive price (no `$0.00`).
2) **Auth**
   - Sign up with a new Clerk test user (email magic link or password). Ensure session appears in Clerk dashboard.
3) **Browse & Select**
   - Open product modal; switch size/color/tier (Basic/Premium) and see price update.
4) **Cart**
   - Add to cart and open cart page; totals should equal `basePrice + tierPrice`.
5) **Checkout (Stripe Test)**
   - Proceed to checkout; verify order summary matches cart.
   - Use Stripe test card `4242 4242 4242 4242`, any future date, any CVC/ZIP.
   - Payment should succeed and redirect/confirm without hitting real funds.
6) **Order & Limits**
   - After payment, ensure order status is `PAID` and `maxDesigns` matches tier.
7) **Design Generation**
   - Enter a prompt and generate. Expect:
     - Design record created with temporary OpenAI URL then swapped to Supabase URL.
     - Image + thumbnail present in `designs` bucket (public URL).
8) **Design Retrieval**
   - Refresh order page; design should still display (verifies Supabase storage, not expiring OpenAI URL).
9) **Approval & Email**
   - Approve design; order status should move to `DESIGN_APPROVED`.
   - If emails are enabled, confirm the “design approved” email; otherwise verify the send call doesn’t throw.
10) **Printful Stub**
    - Ensure the background Printful submission path is invoked (or safely stubbed/disabled in staging) and does not block response.

### Negative/Edge Checks
- Try exceeding design limit for the tier; expect a friendly error.
- Load products when none are active; expect the empty state copy.
- Attempt design generation without payment or without auth; expect 401/400 with correct messaging.

### Data Verification (Supabase/DB)
- `orders` table: new order with `PAID` then `DESIGN_PENDING/APPROVED`.
- `designs` table: records with Supabase URLs (not temporary OpenAI links).
- `users` table: Clerk user synced.

### Cost-Control Tips
- Keep using Stripe **test mode**; never swap to live keys for this run.
- Use the `TEST` tier (0.01) if any live-mode sanity check is unavoidable.
- Clean up: delete test users/orders/designs and storage objects after the run.

### Quick Reset
- Clear cart/local storage, sign out of Clerk, and start with a fresh test user for each full pass.***
