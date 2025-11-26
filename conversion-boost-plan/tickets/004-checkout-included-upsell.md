# Ticket 004 — Checkout “What’s Included” + Why Premium

**Goal:** Clarify value at checkout with a concise “What’s included” block and a “Why Premium?” upsell note.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Reinforces what customers are buying and nudges toward Premium at the decision point.

## Scope
- Add “What’s included” box in checkout summary: tee + AI design + fulfillment + shipping ETA.
- Add “Why Premium?” note with benefits (unlimited retries, best design guarantee).
- Ensure totals remain unchanged; purely informational.

## Deliverables
- Checkout page shows the new block(s) on both desktop summary and mobile.
- Copy mirrors tier messaging (Basic=1, Premium=unlimited).

## Acceptance Criteria
- Visible on checkout page without pushing CTA below fold on mobile.
- Premium benefits called out; Basic noted as 1 design.
- Shipping ETA shown alongside included items.

## Implementation Notes
- File: `frontend/src/pages/CheckoutPage.tsx`.
- Keep styling compact (small card/bullet list).

## Risks / Mitigations
- Risk: Overcrowding mobile. Mitigate with collapsible section on mobile.

---
### Notes (completed)
- Added “What’s included” block and “Why Premium?” note plus shipping ETA to desktop summary; added mobile note above pay CTA (`frontend/src/pages/CheckoutPage.tsx`).
