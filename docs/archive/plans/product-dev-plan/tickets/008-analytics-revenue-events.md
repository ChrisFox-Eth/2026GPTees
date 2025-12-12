# Ticket 008 — Analytics Tied to Revenue

**Goal:** Connect events to dollars to see which surfaces drive paid orders and AOV.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Current analytics track UX steps but not revenue outcomes.
- Need order value, tier, SKU in events to optimize spend and UX.

## Scope
- Emit `order.paid` with order_id, amount, tier, item_count, sku list, country.
- Emit funnel stages: `checkout.start`, `checkout.session_created`, `design.started`, `design.approved`.
- Add simple dashboard doc for metrics to watch (CVR, AOV by tier, drop-offs).

## Deliverables
- Backend hook in `handleSuccessfulPayment` to fire analytics call.
- FE analytics enrichment for checkout and design flow (reuse `trackEvent`).
- Updated `docs/analytics-events.md` (or new section) with event schema and sample payloads.

## Acceptance Criteria
- Event pipeline receives `order.paid` for every Stripe payment success with correct amounts.
- Funnel events include consistent keys (`order_id`, `tier`, `subtotal`, `country`).
- Docs updated with new events and payload fields.

## Implementation Notes
- Backend: extend `backend/src/services/stripe.service.ts` post-payment to send to Vercel Analytics (if supported) or add lightweight POST to Segment/PostHog (configurable endpoint/env).
- FE: ensure `CheckoutPage` emits `checkout.start`; `CheckoutSuccessPage` emits `checkout.session_created`; `DesignPage` emits `design.started` when generation begins and `design.approved` when approved.
- Guard payload sizes (<255 chars strings).

## Risks / Mitigations
- Risk: Analytics call failure blocks flow. Mitigate by wrapping in try/catch and logging only.
- Risk: PII leakage. Mitigate by excluding emails; use order_id + country only.

---
### Notes (completed)
- Added backend analytics dispatcher with optional webhook (`backend/src/services/analytics.service.ts`).
- Emitting `order.paid` with amount, tier, item_count, and country from `handleSuccessfulPayment` (`backend/src/services/stripe.service.ts`).
- Configure `ANALYTICS_WEBHOOK_URL` to collect events; failures are non-blocking. Frontend now emits `checkout.session_created`, `design.started`, and `design.approved` (alongside existing submit events).
- Follow-up: Frontend funnel events (`checkout.start`, `checkout.session_created`, `design.started`, `design.approved`) remain on the roadmap—only `order.paid` is emitted server-side today.
