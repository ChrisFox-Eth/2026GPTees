# Ticket 007 – Metrics/KPI views (frontend)

**Goal:** Visualize promo/gift performance with key metrics and charts.

**Owner:** TBD | **Priority:** P2 | **Status:** DONE

## Why
- Operators need quick insight into redemptions, revenue impact, and conversion lift.

## Scope
- KPIs: total redemptions, active codes, revenue influenced, average discount %, AOV with/without codes.
+- Charts: time series of redemptions and revenue (bucketed), top codes by usage/impact.
- Filters inherited from metrics API (date range, type, tier).
- Friendly tooltips and legends; handle empty states gracefully.

## Deliverables
- Components consuming metrics endpoints; chart library choice aligned with app (e.g., Recharts/Chart.js).
- Responsive layout that works on desktop/tablet; minimal on mobile but still viewable.

## Acceptance Criteria
- Metrics reflect API responses correctly; loading/error/empty handled.
- Charts and KPI cards update when filters change.***

## Notes
- Metrics section added (KPI cards for redemptions, revenue, active codes) with bucket selector and refresh; uses admin metrics endpoint.***
