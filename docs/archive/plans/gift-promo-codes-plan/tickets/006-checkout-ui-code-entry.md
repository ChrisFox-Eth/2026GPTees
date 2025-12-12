# Ticket 006 – Checkout UI for code entry/apply + free-order handling

**Goal:** Add code input/apply UX on checkout, display applied state, and handle $0 orders without Stripe redirect.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Why
- Users need to enter and see code effects before paying.
- Zero-total orders should bypass Stripe smoothly.

## Scope
- Checkout page: input + Apply/Remove; show success/error messages inline near order summary.
- Optional pre-validation call (`GET /api/promo/validate?code=...`) or rely on submit errors; reflect applied code in UI.
- Include `code` in checkout POST payload.
- Adjust client flow: if response has `orderId` but no `url`, navigate directly to success page (with orderId query) instead of throwing error.
- Show discounted totals in summary if possible (or at least applied badge).

## Deliverables
- Updated `CheckoutPage.tsx` with code field, state, and UX feedback.
- Logic to handle free-order branch and navigation.
- Optional helper to format applied discount in UI.

## Acceptance Criteria
- User can apply/remove a code; invalid codes show clear error without page reload.
- Successful apply persists through submit and payload.
- Free orders redirect to success without Stripe; paid orders still go to Stripe.
- Mobile/desktop layouts remain intact.***

## Audit Notes
- Checkout UI adds code input/apply/remove with `/api/promo/validate` call, error/success messaging, and sends `code` in POST payload; free-order responses route directly to `/checkout/success?order_id=...`.
- Totals displayed in summary are not recalculated client-side after apply (discount handled server-side).***
