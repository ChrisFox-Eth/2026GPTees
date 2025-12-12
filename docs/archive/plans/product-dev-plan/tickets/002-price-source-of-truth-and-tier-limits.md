# Ticket 002 — Price Source-of-Truth & Tier Limits

**Goal:** Eliminate frontend hardcoded prices, ensure pricing comes from backend `TIERS`, and cap design counts to control OpenAI spend.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- FE hardcodes (`ProductModal`, `PricingSection`) can drift from backend `pricing.ts`.
- Unlimited `maxDesigns` (9999) risks API overage; needs realistic caps and add-on flow later.

## Scope
- FE reads tier pricing and descriptions only from API data.
- Backend tier config updated to profitable defaults (e.g., Basic $24.99 / 1 design; Premium $34.99 / 3 designs; TEST stays $0.01).
- Reduce `maxDesigns` to bounded values; keep Premium generous but finite (e.g., 10).
- Display updated limits in UI (modal, design page).

## Deliverables
- No hardcoded tier prices or descriptions in FE; rely on `product.tierPricing`.
- Updated `backend/src/config/pricing.ts` and `backend/prisma/seed.ts` (settings) with new prices/limits.
- FE surfaces `maxDesigns` in Design page helper text.

## Acceptance Criteria
- Changing a price in `pricing.ts` is reflected in FE without code edits.
- UI shows correct tier names, prices, descriptions from API.
- Design generation stops at new `maxDesigns` and shows a friendly upsell message.

## Implementation Notes
- FE: `frontend/src/components/ProductModal/ProductModal.tsx` remove `TIER_PRICES` fallback; trust `product.tierPricing`.
- FE: `frontend/src/components/PricingSection/PricingSection.tsx` fetch or accept injected pricing (fallback: prop) instead of literals; short-term allow prop with server-provided values.
- FE: `frontend/src/pages/DesignPage.tsx` use `order.maxDesigns` in copy and disable states.
- Backend: Update `TIERS` prices/maxDesigns; adjust seed settings to match.
- Copy: Update `docs/E2E_TESTING.md` to note current tier caps/prices.

## Risks / Mitigations
- Risk: FE route without pricing data. Mitigate with loading skeleton and guarded optional chaining; do not reintroduce literals.
- Risk: Users hit new cap unexpectedly. Mitigate with clear pre-purchase messaging on modal and pricing section.

---
### Notes (completed)
- Added DB-backed pricing service sourcing Supabase settings with fallback, keeping Premium unlimited by default (`backend/src/services/pricing.service.ts`).
- Product and Stripe flows now deliver tierPricing from DB (`backend/src/controllers/product.controller.ts`, `backend/src/services/stripe.service.ts`).
- Removed FE hardcoded prices; Product modal and Pricing section read API tierPricing, with runtime fetch and guarded defaults (`frontend/src/components/ProductModal/ProductModal.tsx`, `frontend/src/components/PricingSection/PricingSection.tsx`).
- Documented Supabase settings keys for pricing/max designs in `docs/E2E_TESTING.md`.
