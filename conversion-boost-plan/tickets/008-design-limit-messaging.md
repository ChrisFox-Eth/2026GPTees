# Ticket 008 — Design Limit Messaging in Cart/Checkout

**Goal:** Make Basic (1) vs Premium (unlimited) design limits explicit in cart and checkout to set expectations and upsell Premium.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Clear limits reduce confusion and can nudge upgrades to Premium.

## Scope
- Add a short line in cart and checkout summarizing design limits for selected tier.
- Premium: “Unlimited retries until you approve.” Basic: “Includes 1 AI design.”

## Deliverables
- Cart page and checkout page show the limit note near totals or item/tier info.

## Acceptance Criteria
- Messaging appears for each cart item or as a summary line; adjusts per tier selected.
- Copy is concise; no layout breakage on mobile.

## Implementation Notes
- Files: `frontend/src/pages/CartPage.tsx`, `frontend/src/pages/CheckoutPage.tsx`.
- Use existing tier data from cart items; no hardcoded prices needed.

## Risks / Mitigations
- Risk: Redundant copy. Mitigate with one concise line per item/tier.

---
### Notes (completed)
- Cart and checkout now display tier limits per item (Basic = 1 design, Premium = unlimited) with concise copy, plus bundle note where applicable (`frontend/src/pages/CartPage.tsx`, `frontend/src/pages/CheckoutPage.tsx`).
