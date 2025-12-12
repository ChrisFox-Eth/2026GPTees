# Ticket 006 — “See Examples” Gallery

**Goal:** Add a small gallery (6–8 sample designs) near the product modal/hero/checkout to reduce uncertainty.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Showing examples helps visitors believe the output quality; reduces hesitation before purchase.

## Scope
- Add a compact gallery component with sample images.
- Place near product modal trigger and/or checkout hero.
- Track interactions.

## Deliverables
- Gallery component rendered on shop/home and optionally checkout.
- Analytics: `examples.view`, `examples.click`.

## Acceptance Criteria
- Displays 6–8 example thumbnails; opens larger on click or just shows inline.
- Does not push primary CTAs below fold on mobile.

## Implementation Notes
- Component: `frontend/src/components/ExamplesGallery` (static data for now).
- Images: use curated sample designs; host on Supabase storage/CDN.

## Risks / Mitigations
- Risk: Visual clutter. Mitigate with small thumbnails and optional modal/lightbox.

---
### Notes (completed)
- Added examples gallery component with 6 sample thumbnails to build confidence (`frontend/src/components/ExamplesGallery/ExamplesGallery.tsx`).
- Integrated on Home page and Checkout page to keep examples visible pre-purchase (`frontend/src/pages/HomePage.tsx`, `frontend/src/pages/CheckoutPage.tsx`).
