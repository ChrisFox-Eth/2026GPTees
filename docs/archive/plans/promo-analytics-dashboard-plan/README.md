# Promo & Gift Codes Analytics Dashboard Plan

**Purpose:** Ship an admin-only dashboard to create, view, and analyze promo/gift codes and their usage/conversion. Tickets live in `promo-analytics-dashboard-plan/tickets/` and are ordered for execution.

## Ticket index (ordered)
1. `001-api-authz-and-roles.md` — enforce admin allowlist/roles for analytics surface
2. `002-api-list-and-detail.md` — list codes, filters, pagination, single-code detail
3. `003-api-metrics-and-aggregates.md` — usage counts, revenue impact, conversion slices
4. `004-api-create-and-disable.md` — admin code creation, toggles, and soft-disable
5. `005-frontend-dashboard-shell.md` — protected admin UI frame + routing
6. `006-frontend-code-table-and-filters.md` — table with filters, paging, detail drawer
7. `007-frontend-metrics-views.md` — charts/KPIs for usage, revenue, conversion
8. `008-qa-and-observability.md` — tests, logging, alerts for anomalies

## Notes
- Reuse existing `ADMIN_EMAIL_ALLOWLIST` / `ALLOW_ADMIN_SYNC` patterns where possible, but prefer a dedicated admin guard.
- Metrics source: orders table + promo_codes usage_count; ensure queries are indexed for code and date.
- Keep all new admin routes behind auth + allowlist; no public exposure.
