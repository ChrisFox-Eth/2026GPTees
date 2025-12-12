# Ticket 006 — Upsell & Cross-Sell

**Goal:** Lift AOV by steering users to Premium, bundles, and post-purchase add-ons without hurting conversion.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Modal defaults to Basic; no incentives to add more items.
- Success page doesn’t offer add-ons or referrals.

## Scope
- Default modal tier to Premium; highlight savings/value.
- Add “Buy 2, save 10%” toggle in modal that adjusts cart line item price.
- Success page: offer add-on (hoodie with same design) and referral/copy-link CTA.
- Optional: show “Best Value” badge on Premium card.

## Deliverables
- Product modal with Premium preselected and bundle toggle.
- Success page upsell buttons: “Add a Hoodie” (preload cart) and “Share & get 10% off” (copy/share link).
- Analytics events for upsell clicks and conversions.

## Acceptance Criteria
- Modal loads with Premium selected; price updates correctly across size/color changes.
- Bundle toggle changes cart line item total (and surfaces in checkout summary).
- Success page links navigate correctly and preserve order/design context.
- Events emitted: `shop.upsell.bundle_toggle`, `checkout.success.add_on_click`, `checkout.success.referral_share`.

## Implementation Notes
- Files: `frontend/src/components/ProductModal/ProductModal.tsx`, `frontend/src/pages/CheckoutSuccessPage.tsx`, `frontend/src/pages/CheckoutPage.tsx` (summary reflects bundle discount).
- Cart math: store `discount` or adjusted `tierPrice`; avoid silent math drift.
- Referral: reuse existing share logic; add discount code placeholder for future automation.

## Risks / Mitigations
- Risk: Discount erodes margin. Mitigate with guardrails (min subtotal) and only on second item.
- Risk: Confusing totals. Mitigate with clear line items and checkout summary parity.

---
### Notes (completed)
- Premium is preselected; added bundle toggle (buy 2, save 10%) with analytics event `shop.upsell.bundle_toggle` and pricing adjustments in modal totals (`frontend/src/components/ProductModal/ProductModal.tsx`).
- Checkout success page adds an add-on CTA back to shop and enhanced share text/code (`frontend/src/pages/CheckoutSuccessPage.tsx`).
