# Ticket 001 — Shipping & Pricing Parity

**Goal:** Stop margin leak by charging shipping, surfacing it in UI, and ensuring Stripe/DB totals match what users see.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Stripe line items omit shipping; Printful payload sets `retail_costs.shipping = '0.00'`, so we eat COGS.
- Users see “shipping calculated at checkout” but are never charged, shrinking contribution margin.

## Scope
- Backend: add shipping options + totals to Stripe session and DB order; pass through to Printful.
- Frontend: display shipping estimate/line item in checkout summary and success page.
- Config: simple flat rates (e.g., $5.95 US, $9.95 international) with room to tweak later.

## Deliverables
- Shipping config module (flat rates by country) used in Stripe session creation.
- Order total includes shipping; payment record reflects it.
- Checkout UI shows shipping line item; success page echoes total with shipping.
- Printful submission includes shipping in `retail_costs`.

## Acceptance Criteria
- Stripe Checkout displays shipping line item (or shipping options) and charges it.
- Orders in DB store `totalAmount` = items + shipping; payment rows match.
- Printful order payload includes non-zero shipping where applicable.
- Frontend: `CheckoutPage` and `CheckoutSuccessPage` show the same totals users pay.

## Implementation Notes
- Backend: update `backend/src/services/stripe.service.ts`
  - Introduce `calculateShipping(shippingAddress)` (flat rate by country).
  - Add `shipping_options` to `stripe.checkout.sessions.create`.
  - Include shipping cents in `totalAmount` and line items; persist on order.
- Frontend: `frontend/src/pages/CheckoutPage.tsx`
  - Show shipping estimate before redirect; update sticky footer button label to include shipping note.
- Frontend: `frontend/src/pages/CheckoutSuccessPage.tsx`
  - Display paid total and shipping line.
- Printful: `backend/src/services/printful.service.ts`
  - Set `retail_costs.shipping` to charged value.
- Seed/config: document defaults in `docs/E2E_TESTING.md` and `.env.example` if new env vars added.

## Risks / Mitigations
- Risk: Stripe + Printful totals drift. Mitigate by deriving from one shipping calculator.
- Risk: International addresses not covered. Mitigate with sane default rate + TODO for later tiered zoning.

---
### Notes (completed)
- Added flat-rate calculator (US $5.95, CA $7.95, Intl $9.95) in `backend/src/config/shipping.ts` and mirrored FE helper in `frontend/src/utils/shipping.ts`.
- Stripe checkout now includes shipping line item and stores `shippingAmount` metadata; order totals include shipping. See `backend/src/services/stripe.service.ts`.
- Printful retail costs now include the charged shipping portion (`backend/src/services/printful.service.ts`).
- Checkout UI shows shipping dollars and total with shipping (`frontend/src/pages/CheckoutPage.tsx`).
- Success page now shows items, shipping, and total paid by fetching order details with auth (`frontend/src/pages/CheckoutSuccessPage.tsx`).
