# Ticket 005 — Checkout & Landing UX Boost

**Goal:** Increase conversion with trust signals, delivery clarity, and stronger CTAs on landing/pricing and checkout screens.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Landing/pricing lacks credibility cues (Printful, Stripe, delivery ETA).
- Users don’t see why to act now; no risk-reduction copy or social proof.

## Scope
- Add trust badges and “Printed & shipped by Printful” + “Payments secured by Stripe/Clerk” to hero/pricing.
- Add delivery ETA block (“Ships in 2–4 business days”) and quality highlights.
- Improve CTA copy (“Start your design in 60s”) and secondary CTA (“See examples”).

## Deliverables
- Updated hero (`Hero.tsx`) and pricing section (`PricingSection.tsx`) with badges, delivery note, and refined CTAs.
- Mini “What you get” list on checkout side panel summarizing quality + support.
- Mobile-first layout verified.

## Acceptance Criteria
- Above-the-fold shows at least 2 trust anchors and an ETA.
- CTAs mention speed/value; secondary CTA links to shop or gallery.
- Checkout summary has a short trust block; no layout regressions on mobile.

## Implementation Notes
- Files: `frontend/src/components/Hero/Hero.tsx`, `frontend/src/components/PricingSection/PricingSection.tsx`, `frontend/src/pages/CheckoutPage.tsx`.
- Add a small testimonial or rating stub (static) to hero/pricing.
- Keep copy configurable via constants in component files for quick iteration.

## Risks / Mitigations
- Risk: Visual clutter. Mitigate with concise badges and a single-line ETA.

---
### Notes (completed)
- Hero now includes Printful/Stripe trust badges and delivery ETA, with stronger CTA copy (`frontend/src/components/Hero/Hero.tsx`).
- Pricing cards show shipping ETA and secure checkout note (`frontend/src/components/PricingSection/PricingSection.tsx`).
- Checkout page adds a concise trust strip for shipping, fulfillment, and payments (`frontend/src/pages/CheckoutPage.tsx`).
