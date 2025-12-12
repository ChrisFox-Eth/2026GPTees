# Ticket 002 — Social Proof Strip

**Goal:** Add a trust strip under hero/pricing with “Trusted by 1,200+ customers” and 3 rotating blurbs to increase credibility.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- First-time visitors need reassurance. Social proof boosts conversion, especially before the pricing/CTA.

## Scope
- Add a horizontal strip below hero (and/or pricing) with:
  - Headline: “Trusted by 1,200+ customers”
  - 3 short blurbs rotating/fading.
  - Optionally include tiny star rating icons.
- Track view and interaction events.

## Deliverables
- Component rendered on home page (and optionally pricing section).
- Animations for rotating blurbs (fade/slide).
- Analytics: `social_proof.view`, `social_proof.rotate`.

## Acceptance Criteria
- Visible on mobile/desktop without pushing main CTA below fold.
- Rotates through at least 3 blurbs automatically every few seconds.
- Accessible (no motion sickness: allow reduced motion respect).

## Implementation Notes
- Component location: `frontend/src/components/SocialProofStrip` and used in `Hero` or `PricingSection`.
- Data static for now; can be constants in component.
- Respect `prefers-reduced-motion`: disable animation if set.

## Risks / Mitigations
- Risk: Pushes main content down. Mitigate with compact height and inline positioning.

---
### Notes (completed)
- Added social proof strip component with rotating blurbs and “Trusted by 1,200+ customers” badge; respects reduced-motion (`frontend/src/components/SocialProofStrip/SocialProofStrip.tsx`).
- Integrated under hero on Home and Shop pages (`frontend/src/pages/HomePage.tsx`, `frontend/src/pages/ShopPage.tsx`).
