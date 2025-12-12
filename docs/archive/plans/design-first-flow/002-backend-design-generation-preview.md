# 002 — Backend: Design generation in preview mode

## Objective
Allow POST /api/designs/generate to work for preview orders (pre-payment), while enforcing tier limits and protections.

## Scope
- Relax status guard: permit generation when order.status is PREVIEW/PENDING_PAYMENT (not just PAID/DESIGN_PENDING).
- Enforce tier limits in preview: Basic = 1 design; Premium = unlimited (per current decision).
- If using new status PREVIEW, set order.status → DESIGN_PENDING after generation.
- Persist designs against preview orders so the exact image is stored (no regeneration needed later).
- Add rate-limit/logging hooks for preview generations (monitor abuse).

## Deliverables
- Controller logic updated with preview-allowed statuses and tier-limit handling.
- Tests covering: unpaid order generation success, limit exceeded error, unauthorized order.
- Telemetry/logging for preview generations (event name, userId, orderId).

## Acceptance Criteria
- Auth user with preview order can generate a design without payment; response returns stored design URL.
- Basic tier blocks after first preview; Premium supports unlimited previews.
- Status transitions remain consistent (e.g., PREVIEW → DESIGN_PENDING).

## Notes
- No watermarking or downscaling planned for previews.
