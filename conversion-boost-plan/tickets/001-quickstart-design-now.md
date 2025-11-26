# Ticket 001 — Quickstart “Design Now” CTA

**Goal:** Remove first-visit friction by offering a one-click “Design Now” path that preselects the Bella 3001 tee (popular color/size) with a single prompt field and a “Generate preview” CTA that leads into checkout with the cart prefilled.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- New visitors bounce when forced to browse/select before seeing value. A direct CTA improves engagement and reduces drop-off.

## Scope
- Add a “Design Now” panel on home and shop pages with:
  - Prefilled product: Bella 3001 (Printful 71), default color (e.g., Black) and size (M).
  - Single prompt input + optional style dropdown.
  - CTA “Generate preview” that adds the item to cart and routes to checkout (or design page post-payment).
- Track engagement (`quickstart.start`, `quickstart.submit`).

## Deliverables
- UI component visible on home and shop pages.
- Prefill cart with default SKU/color/size/tier (Premium preselected or configurable).
- Routing: if signed in → checkout; if not → auth then back to checkout.
- Analytics events for start/submit.

## Acceptance Criteria
- Clicking “Generate preview” adds the default tee with selected tier/color/size/prompt to cart and navigates to checkout/auth as appropriate.
- Works on mobile/desktop; CTA above the fold on home.
- Analytics events fire with product_id, color, size, tier.

## Implementation Notes
- Component placement: `frontend/src/pages/HomePage.tsx` and `frontend/src/pages/ShopPage.tsx` (shared component).
- Cart add: reuse `useCart.addToCart` with prompt stored in local state or query param for design page.
- Default SKU: product slug `basic-tee` (Printful 71); color “Black”; size “M”; tier Premium preselected.
- Navigation: if not signed in, redirect to auth then back to checkout.
- Copy: “Design a tee in 60s — pick a style, enter one prompt, we handle the rest.”

## Risks / Mitigations
- Risk: Hardcoded SKU mismatch if product not loaded. Mitigate by fetching products first and fallback to existing slug.
- Risk: Confusing flow after auth. Mitigate by preserving redirect to `/checkout`.

---
### Notes (completed)
- Added quickstart component that preselects Bella 3001 (Black, size M) with Premium and prompt input; submit adds to cart and routes to checkout/auth (`frontend/src/components/Quickstart/Quickstart.tsx`, `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/ShopPage.tsx`).
- Prompt is stored locally for later use; analytics fires `quickstart.submit` with product/color/size/tier.
- Handles load/error states when fetching products.
