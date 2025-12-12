# Ticket 006 – Codes table and filters (frontend)

**Goal:** Surface promo/gift codes in a filterable/paginated table with detail view.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Why
- Admins need to search codes, inspect limits/usage, and drill into recent redemptions.

## Scope
- Table columns: code, type, tier, percentOff, usageCount/usageLimit, disabled state, createdAt, createdBy.
- Filters: search by code (contains), type, tier, disabled/active, date range; pagination controls.
- Actions per row: view details (drawer/modal), disable/enable (calls API).
- Detail drawer: full metadata + recent orders list (from detail endpoint).

## Deliverables
- Frontend components wired to list/detail APIs; optimistic UI for enable/disable.
- Empty/error/loading states; mobile-friendly layout (stacked rows).

## Acceptance Criteria
- Filters and pagination work; detail view shows recent orders for that code.
- Enable/disable updates reflect immediately in UI and API.

## Notes
- Codes table with search/type/tier/state filters, pagination controls, detail view, and enable/disable actions implemented on `/admin/promo`.***
