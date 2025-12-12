# 003 — Backend: Checkout reuse for preview orders

## Objective
Reuse existing unpaid preview orders when creating Stripe checkout sessions, avoiding duplicate orders and preserving generated designs.

## Scope
- Extend `POST /api/payments/create-checkout-session` to accept an `orderId` of an existing unpaid/preview order.
- Validate ownership, unpaid status, and recalc totals from stored items (no client tampering).
- Skip creating a new order when `orderId` is provided; attach Stripe metadata to existing order.
- Ensure webhook success updates the same order to PAID.

## Deliverables
- Controller/service updates to load existing order when `orderId` is passed.
- Validation: reject if order is already PAID/REFUNDED/CANCELLED or belongs to another user.
- Tests for: new order path (unchanged), reuse existing preview order, bad orderId, wrong user.
- Docs for frontend on how to invoke checkout with existing orderId.

## Acceptance Criteria
- Passing `orderId` of an unpaid/preview order returns a Stripe session tied to that order; webhook marks it PAID.
- No duplicate orders created when reusing orderId.
- Totals derived from DB items/tier pricing, not client payload.

## Open Questions
- Should we allow updating order items/tier before checkout reuse (e.g., upgrade Basic→Premium)? If yes, add endpoint to mutate order before session creation.
- Should cancel_url/success_url include orderId for redirect convenience?
