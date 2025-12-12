# Ticket 009 — Streamline Shipping Form

**Goal:** Reduce friction in checkout shipping form by hiding optional phone and minimizing fields for US/CA addresses.

**Owner:** TBD | **Priority:** P2 | **Status:** TODO

## Why
- Less input = higher conversion, especially on mobile.

## Scope
- Hide phone by default; show only if non-US/CA country or user opts in.
- Keep address fields concise; consider autofill-friendly ordering.

## Deliverables
- Checkout form hides phone by default; reveals when needed.
- Field order optimized for autofill.

## Acceptance Criteria
- Phone is optional/hidden unless country is not US/CA.
- No validation blocks when phone is empty.

## Implementation Notes
- File: `frontend/src/pages/CheckoutPage.tsx`.
- Use country check to toggle phone field visibility.

## Risks / Mitigations
- Risk: Users need phone for delivery updates. Mitigate with a small “Add phone for delivery updates” toggle.

---
### Notes (completed)
- Phone field hidden by default for US/CA with an opt-in toggle; shown automatically for other countries with updated helper text (`frontend/src/pages/CheckoutPage.tsx`).
