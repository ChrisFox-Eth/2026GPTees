# 005 — Frontend: Design preview workflow (pre-payment)

## Objective
Move design generation earlier in the funnel with a preview flow tied to a preview orderId; prevent approval/fulfillment actions before payment.

## Scope
- Add “Design Now / Preview” entry points (product card/modal/cart) that create or fetch a preview orderId then navigate to design page with `?orderId=...`.
- Update DesignPage to handle preview status: show preview banner, allow generation when order.status is PENDING_PAYMENT, hide/repurpose Approve button to “Checkout to print”.
- Disable fulfillment-triggering actions until paid; route checkout button to use existing orderId (see backend 003).
- Handle Basic vs Premium preview limits in UI (disable generate when limit hit; CTA to checkout/upgrade per tier rules).
- Defer size/color selection to checkout step, preserving the chosen design.

## Deliverables
- UI entrypoint changes plus navigation carrying orderId.
- DesignPage state handling for preview orders (status checks, banners, disabled approval, CTA to checkout).
- Checkout action that calls backend with existing orderId and redirects to Stripe.
- Error/empty/loading states updated for preview path.

## Acceptance Criteria
- From product/cart, user can jump into design preview; design generation works before payment.
- DesignPage clearly indicates preview mode and routes to checkout instead of approval when unpaid.
- Basic tier: generating after limit shows upgrade/checkout CTA; Premium supports multiple (per backend caps).
- Size/color captured at checkout; selected design persists.
- Mobile layout verified.

## Open Questions
- Should we block preview if cart has multiple items or force single-item flow? No blocking.
- Upgrade path: allow changing tier before checkout or require new preview order? (Currently: Basic capped at 1; “try again” becomes Premium.)
- Post-payment redirect: stay on design page or go to confirmation? (Current answer: Order confirmation.)
