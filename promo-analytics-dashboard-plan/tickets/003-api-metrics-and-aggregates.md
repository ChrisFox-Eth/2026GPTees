# Ticket 003 – Metrics and aggregates API

**Goal:** Expose admin metrics endpoints for promo/gift code performance.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Why
- Marketing/support needs visibility into revenue impact and redemption behavior.

## Scope
- Endpoint: `GET /api/admin/promo-codes/metrics` with time-bucketed aggregates (daily/weekly) for: redemptions count, unique users, gross revenue with code, discount value, AOV with/without codes.
- Endpoint: `GET /api/admin/promo-codes/:id/metrics` for a specific code (usage over time, remaining uses, associated revenue/discount).
- Consider query params: `from`, `to`, `bucket=day|week`, `type`, `tier`.
- Ensure SQL uses existing `orders.promoCodeId` + `promo_codes.usageCount`; avoid full scans.

## Deliverables
- Metrics service functions with optimized queries (Prisma + raw SQL where needed).
- Tests for aggregation correctness on sample fixtures.

## Acceptance Criteria
- Metrics endpoints return within acceptable latency (<500ms on test dataset).
- Aggregates match expected values on seeded data.

## Notes
- Implemented aggregate endpoints for overall metrics and per-code metrics (redemptions + revenue series) with bucket/day-week and date filters; guarded by admin middleware.***
