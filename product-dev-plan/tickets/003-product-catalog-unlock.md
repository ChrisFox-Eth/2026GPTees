# Ticket 003 — Product Catalog Unlock

**Goal:** Surface all active products with real imagery and profitable base prices; remove artificial filtering that hides SKUs.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- `ShopPage` filters to only “basic” SKUs, hiding higher AOV products (hoodies, premium tees).
- Seed data uses placeholder images and $0 base price for Basic tee, hurting trust and margin.

## Scope
- Remove client-side filter and add simple category/tier filter UI.
- Update seed data with real Printful images and viable base prices (reflecting garment + print cost).
- Ensure modal options (colors/sizes) match what Printful can fulfill (ties to Ticket 004).

## Deliverables
- FE shows all `isActive` products; user can filter by category/tier.
- Seed products have real `imageUrl`, accurate `basePrice`, and consistent colors/sizes.
- Empty/low-inventory states handled gracefully.

## Acceptance Criteria
- `ShopPage` renders all active products without hardcoded slug filters.
- Product modal loads with real images, valid sizes/colors; no 404 images.
- Base prices + tier prices align to intended margin (documented in ticket notes).

## Implementation Notes
- FE: `frontend/src/pages/ShopPage.tsx` remove slug/name filter; add optional category/tier filters.
- FE: Add lightweight badge for “New”/“Best Value” to steer to higher AOV SKUs.
- Seed: `backend/prisma/seed.ts` set realistic `basePrice` (e.g., Basic tee >= garment + print + buffer), replace placeholder URLs with Printful-hosted mockups or CDN assets.
- Docs: Note SKU list and URLs in `docs/E2E_TESTING.md` for QA.

## Risks / Mitigations
- Risk: Showing SKUs with missing variant mapping. Mitigate by aligning with Ticket 004 before activation or temporarily disabling SKUs lacking mappings.

---
### Notes (completed)
- Removed shop slug filter; added simple category filter controls so all active products render (`frontend/src/pages/ShopPage.tsx`).
- Seed data now uses real images, non-zero base prices, and trimmed colors to mapped basics (`backend/prisma/seed.ts`).
- Catalog still respects Printful mapping guard (see Ticket 004) to prevent unfulfillable selections.
