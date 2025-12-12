# Ticket 010 — Bundle Upsell Polish

**Goal:** Refine the bundle toggle messaging and ensure it’s reflected in cart/checkout summary to maximize AOV without confusion.

**Owner:** TBD | **Priority:** P2 | **Status:** TODO

## Why
- Clear savings display increases uptake; ensures transparency in totals.

## Scope
- Update bundle toggle copy in product modal to highlight “Buy 2, save 10% on tier.”
- Reflect bundle savings/quantity in cart and checkout summaries.

## Deliverables
- Product modal shows clear savings language.
- Cart/checkout summarize bundle (2 items, discounted tier) so totals are transparent.

## Acceptance Criteria
- Cart/checkout show adjusted quantity and tier price when bundle is enabled.
- Copy is concise; no confusion about totals.

## Implementation Notes
- Files: `frontend/src/components/ProductModal/ProductModal.tsx`, `frontend/src/pages/CartPage.tsx`, `frontend/src/pages/CheckoutPage.tsx`.
- Ensure cart math aligns with bundle discount; display savings line if helpful.

## Risks / Mitigations
- Risk: Users unsure about discount. Mitigate with explicit “10% applied to tier price” note.

---
### Notes (completed)
- Bundle toggle copy clarifies “Buy 2, save 10% on tier”; cart/checkout now show bundle status and savings when applied (`frontend/src/components/ProductModal/ProductModal.tsx`, `frontend/src/pages/CartPage.tsx`, `frontend/src/pages/CheckoutPage.tsx`).
