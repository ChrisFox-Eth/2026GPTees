# Ticket 008 – QA + observability for promo analytics

**Goal:** Add tests and monitoring to keep promo analytics accurate and detectable when drifting.

**Owner:** TBD | **Priority:** P2 | **Status:** IN_PROGRESS

## Why
- Aggregations and admin endpoints are fragile without coverage; need alerting for anomalies.

## Scope
- Automated tests: unit/integration for metrics queries, list/detail filters, enable/disable logic; seed fixtures for expected counts.
- Logging: structured logs on admin actions (create/disable) and metrics query errors.
- Optional: simple anomaly check (e.g., usage spike) with log/alert hook or dashboard panel.
- QA checklist for dashboard: permissions, filters, latency, data accuracy vs. DB queries.

## Deliverables
- Test cases added to backend; minimal smoke tests on frontend data fetching.
- Runbook/QA notes added to plan docs.

## Acceptance Criteria
- CI passes with new tests; critical paths covered.
- Admin actions and failures are logged; anomalies detectable via logs/metrics.***

## Notes
- API responses include errors; frontend surfaces load errors. Still need automated tests/logging/alerting; leaving IN_PROGRESS.***
