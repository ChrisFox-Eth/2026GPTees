# Gift & Promo Codes – How to use and test

## Quick facts
- Gift codes = free tee (Basic/Premium), shipping still paid at redemption.
- Promo codes = percent off items (shipping not discounted by default).
- One code per order; enforced server-side.
- Gift code purchase uses Stripe Checkout; redemption can be $0 (bypasses Stripe).

## URLs
- Buy a gift code: `/gift`
- Gift purchase success: `/gift/success`
- Redeem/apply codes: Checkout page has “Have a gift or promo code?” field.
- Orders show applied code on success + order detail pages.

## Env toggles
- Admin/dev endpoints gated by `ALLOW_ADMIN_SYNC=true` or `NODE_ENV=development`.
- core.autocrlf is `true` (Git will checkout CRLF on Windows).
- Ensure Stripe test keys + webhook secret, Clerk, Supabase, Resend are set in `.env`.

## Supabase SQL (run once in SQL Editor)
> If `pgcrypto` is not enabled, run: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
```sql
-- Enum
CREATE TYPE "PromoCodeType" AS ENUM ('FREE_PRODUCT', 'PERCENT_OFF');

-- Table
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "type" "PromoCodeType" NOT NULL,
    "productTier" "DesignTier",
    "percentOff" INTEGER,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");
ALTER TABLE "promo_codes"
  ADD CONSTRAINT "promo_codes_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Orders linkage
ALTER TABLE "orders" ADD COLUMN "promoCodeId" UUID;
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_promoCodeId_fkey"
  FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Sample codes for QA
- `TESTFREE_BASIC` → FREE_PRODUCT, `productTier=BASIC`, `usageLimit=1`
- `TESTFREE_PREMIUM` → FREE_PRODUCT, `productTier=PREMIUM`, `usageLimit=1`
- `SAVETEN` → PERCENT_OFF, `percentOff=10`, unlimited
- `SAVE25ONCE` → PERCENT_OFF, `percentOff=25`, `usageLimit=1`

Create via admin endpoint (requires admin flag):
```bash
curl -X POST https://<backend>/api/admin/promo-codes \
  -H "Authorization: Bearer <CLERK_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code":"TESTFREE_BASIC","type":"FREE_PRODUCT","productTier":"BASIC","usageLimit":1}'
```

## Flows
### Buy a gift code
1) Sign in, go to `/gift`.
2) Choose Classic (BASIC) or Limitless (PREMIUM); optional usage limit.
3) Click “Buy gift code” → redirects to Stripe Checkout (no shipping).
4) On payment, webhook creates deterministic code, emails buyer.

### Redeem a gift code
1) Add a single tee to cart matching the tier of the code.
2) At checkout, enter code and click Apply. UI confirms or shows error.
3) Submit checkout. If total > 0 → Stripe; if $0 → auto-marked PAID and sent to success.
4) Design flow continues as normal; order shows code in success/account/detail views.

### Use a promo code
1) Add items to cart; go to checkout.
2) Enter code, Apply. Valid percent code lowers item prices server-side; shipping unchanged.
3) Complete payment; order will carry promoCodeId; usageCount increments post-payment.

### Admin/dev tooling
- Create codes: `POST /api/admin/promo-codes` (auth + admin flag).
- Promo validation: `GET /api/promo/validate?code=XYZ` (auth) for UI apply feedback.
- Gift purchase: `POST /api/gift-codes/purchase` (auth) → returns Stripe URL.

## QA checklist (summary)
- Gift purchase (BASIC/PREMIUM) → code created once; email sent.
- Gift redemption → item $0, shipping charged, usageCount increments.
- Percent promos → discount applied; single-use codes rejected on second attempt.
- Invalid/mismatched → 400 with message.
- Zero-total → Stripe skipped, order PAID, emails sent.
- Webhook retry → no duplicate codes (deterministic code by session.id).
- Admin endpoint auth/duplicate handling.***
