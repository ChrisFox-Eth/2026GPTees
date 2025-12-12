# Ticket 002 – Promo/gift code list + detail API

**Goal:** Provide admin endpoints to list promo/gift codes with filters and fetch a single code with usage stats.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Operators need visibility into issued codes, usage, and limits to respond to support/marketing.

## Scope
- Endpoint: `GET /api/admin/promo-codes` with pagination, filters (code contains, type, tier, active/disabled, creator, createdAt range).
- Endpoint: `GET /api/admin/promo-codes/:id` returning code metadata, usageCount, usageLimit, createdBy, createdAt/updatedAt, and recent orders that used it (paginated).
- Add `disabled` boolean to `PromoCode` (nullable default false) if not present; include in responses.
- Index on `code` for search (exists) and optionally `createdAt` for range queries.

## Deliverables
- Routes/controllers/services for list/detail.
- DTO/validation for query params; consistent JSON shape (`data`, `meta`).

## Acceptance Criteria
- List returns paginated results with applied filters.
- Detail returns code info + recent linked orders without performance regressions.

## Notes
- Added list/detail admin endpoints with filters/pagination and recent orders, guarded by admin middleware.***
