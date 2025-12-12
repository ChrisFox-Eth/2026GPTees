# 001 - Backend: Order status + preview order creation

## Objective
Reuse the existing `PENDING_PAYMENT` status to support design preview before payment, and expose/confirm an endpoint to create preview orders (without Stripe checkout) that can be used for design generation.

## Scope
- Reuse PENDING_PAYMENT status for orders created before checkout.
- Allow order creation without Stripe session via a dedicated endpoint (e.g., `POST /api/orders/preview`). NOTE: This may already exist; orders are being created pre-checkout today—confirm and reuse instead of adding a new one if unnecessary.
- Ensure order items capture product, color, size, tier, and quantity for preview use.
- Update status transition rules to include preview -> paid -> design approval.

## Deliverables
- Order status addition/mapping (Prisma schema + enum usage) supporting preview orders.
- New controller/service method to create preview orders for authenticated users.
- Validation: only one active preview order per user (optional but recommended) to limit clutter.
- Basic rate/logging: record preview order creation events for monitoring abuse.

## Key Tasks
- Update Prisma schema and enums for new status (or document reuse of PENDING_PAYMENT) and run migration.
- Add controller route + validation (auth required) to create preview order without payment.
- Ensure default `designsGenerated = 0`, `maxDesigns` derived from tier config, and items persisted.
- Update any status guards or middleware that assume only paid orders exist.
- Add telemetry/logging for preview order creation.

## Dependencies
- Tier pricing map for maxDesigns.
- Auth (Clerk) context already used in controllers.
- Coordination with ticket 002 for design generation to respect preview status.

## Acceptance Criteria
- Authenticated user can create a preview order via API without initiating Stripe; response returns orderId.
- Order persisted with correct item attributes and preview-friendly status.
- No regression to existing paid order creation flow.

## Open Questions
- Do we enforce a single active preview order per user? If yes, should we reuse an existing one instead of creating multiples? No, until we feel we need to.
- Should preview orders expire/cleanup after X hours? No; in fact, this might make for a good 'abandoned cart' style email or something.
- Should we cap quantity to 1 for preview orders (one tee at a time)? (no)
