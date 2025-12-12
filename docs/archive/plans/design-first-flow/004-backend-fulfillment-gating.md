# 004 — Backend: Fulfillment & approval gating for previews

## Objective
Ensure Printful submission only happens after payment; adjust approval flow for preview orders (no auto-approval on payment).

## Scope
- Add guard in approve/fulfillment paths: reject or defer when order.status is not PAID.
- Do not auto-approve on payment; require explicit approval after payment or an explicit post-payment user action.
- Ensure design approval notifications/emails are suppressed until payment.
- Keep createPrintfulOrder calls isolated to paid orders.

## Deliverables
- Updated approveDesign / submitFulfillment logic with payment check.
- Optional: service method to auto-approve most recent design on payment (configurable).
- Tests for: attempt approve unpaid → blocked; paid order → proceeds; webhook-driven approve (if chosen).

## Acceptance Criteria
- No Printful submission or approval for unpaid/preview orders.
- Paid orders continue to approve and submit successfully.
- Emails/notifications align with paid-only approval.

## Notes
- Auto-approval on payment is out of scope; keep explicit approval after payment.
- No watermarking/downscaling required for previews.***
