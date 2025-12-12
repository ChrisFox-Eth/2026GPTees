# Ticket 006 — Shop + Product Surfaces Editorial Redesign

**Goal:** Update the Shop grid and product surfaces to match the new brand system and copy direction.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Scope
- `frontend/src/pages/ShopPage.tsx`
- `frontend/src/components/product/ProductCard/*`
- `frontend/src/components/product/ProductModal/*`
- Any related pricing/upsell microcopy.

## Implementation steps
1. **ShopPage grid**
   - Lookbook‑style cards: larger images, calmer borders, strong whitespace.
   - Mobile first: 1‑col with generous gutters; desktop 2–3 col.
2. **ProductCard**
   - Update typography and tokens.
   - Remove “unlimited redraws / free previews” marketing language.
   - Add subtle hover zoom + shadow lift.
3. **ProductModal**
   - Editorial layout: left image, right details, short bullet list.
   - Replace user‑visible “prompt/generate/redraw” terms.
4. **Tier language**
   - Keep tier name “Limitless” but describe as studio access and optional exploration, not a quality fallback.
5. **Asset alignment**
   - Use new mockups/lifestyle assets per ticket 004.

## Deliverables
- Shop and product UI visually aligned with brand kit.

## Acceptance criteria
- Shop feels like browsing a fashion catalog.
- Product surfaces use the new copy and tokens.
- No banned terms appear outside legal.

## Risks / mitigations
- **Risk:** Existing images don’t fit new ratios.  
  **Mitigation:** add aspect‑ratio wrappers and crop rules.

