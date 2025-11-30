# Ticket 002 – Stripe webhook branching for gift vs order

**Goal:** Extend Stripe webhook handling to route gift code sessions separately from order checkouts, preventing missing-order errors and creating codes post-payment.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Current webhook assumes an order-backed session; gift code sessions would fail.
- Need to create PromoCode records and skip order fulfillment path for gift purchases.

## Scope
- In Stripe webhook controller, detect `checkout.session.completed` with `metadata.giftCodeType` (or similar) and branch.
- Implement `handleGiftCodePurchase(session)` in Stripe service (or controller) to create code + email trigger (Ticket 004).
- Ensure existing `handleSuccessfulPayment` remains unchanged for order sessions.
- Return 200 for gift flows to avoid retries.

## Deliverables
- Updated webhook switch with branching logic.
- New handler invoked for gift sessions; no order lookups performed in that path.
- Logging that distinguishes gift vs order webhooks.

## Acceptance Criteria
- Gift checkout session completes without `Order ID not found` errors.
- Code created exactly once per paid gift session; webhook idempotent on retries.
- Order sessions still call `handleSuccessfulPayment` unchanged.***

## Audit Notes
- `handleStripeWebhook` branches on `metadata.giftCodeType`; gift path calls `handleGiftCodePurchase`, otherwise `handleSuccessfulPayment` for orders.
- Gift handler enforces paid status, uses deterministic code from session id, and is idempotent on duplicate events.***
