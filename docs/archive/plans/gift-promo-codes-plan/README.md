# Gift & Promo Codes Plan

**Purpose:** Deliver a unified gift code and promo code system (free tees + % discounts) across backend, checkout, and fulfillment. Tickets live in `gift-promo-codes-plan/tickets/` and are ordered for execution.

## Ticket index (ordered)
1. `001-schema-and-migration.md` – add PromoCode model + Order linkage
2. `002-stripe-webhook-branching.md` – split gift vs order flows in Stripe webhook
3. `003-gift-code-purchase-backend.md` – Stripe session + handler to sell gift codes
4. `004-gift-code-email-template.md` – email delivery for purchased codes
5. `005-checkout-code-validation-pricing.md` – server-side apply/price adjust logic
6. `006-checkout-ui-code-entry.md` – checkout UX for apply/remove + free-order handling
7. `007-order-surfaces-for-codes.md` – show applied code on success/account/order detail
8. `008-gift-code-purchase-ui.md` – frontend flow to buy gift codes + success page
9. `009-admin-code-creation-endpoint.md` – dev/admin endpoint to seed/manage codes
10. `010-qa-test-plan.md` – end-to-end test matrix (Stripe, limits, edge cases)

## QA sample codes (plan)
- `TESTFREE_BASIC` → FREE_PRODUCT, `productTier=BASIC`, `usageLimit=1`
- `TESTFREE_PREMIUM` → FREE_PRODUCT, `productTier=PREMIUM`, `usageLimit=1`
- `SAVETEN` → PERCENT_OFF, `percentOff=10`, `usageLimit=null` (unlimited)
- `SAVE25ONCE` → PERCENT_OFF, `percentOff=25`, `usageLimit=1`

These can be seeded via the admin/dev endpoint (Ticket 009) or direct Prisma seed for QA.

## Suggested env toggles
- Ensure `ALLOW_ADMIN_SYNC=true` (or equivalent admin flag) is set when using admin/dev endpoints in non-prod.
- Stripe: use test keys + webhook signing secret for local QA; disable production webhooks when testing locally.
- FRONTEND_URL/PORT should match the app hosting so success/cancel URLs resolve during Stripe flows.
