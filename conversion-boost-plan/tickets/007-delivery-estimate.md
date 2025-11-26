# Ticket 007 — Delivery Estimate Near Pay CTA

**Goal:** Show a clear delivery estimate (“Ships in 2–4 business days”) near the checkout pay CTA.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Delivery clarity reduces drop-off and boosts trust; keeps expectations aligned.

## Scope
- Add a short delivery ETA line near the primary pay button (desktop + mobile).
- Reiterate in summary if space permits.

## Deliverables
- ETA visible on checkout page alongside total/pay CTA.

## Acceptance Criteria
- ETA text appears next to or just above the pay button on desktop and mobile.
- Styling is subtle; does not push CTA off-screen on mobile.

## Implementation Notes
- File: `frontend/src/pages/CheckoutPage.tsx`.
- Keep copy concise: “Ships in 2–4 business days.”

## Risks / Mitigations
- Risk: Layout shift on mobile. Mitigate with short single-line copy.

---
### Notes (completed)
- Delivery ETA “Ships in 2–4 business days” now appears near the pay CTA on mobile and alongside the desktop pay button (`frontend/src/pages/CheckoutPage.tsx`).
