# Ticket 005 — Real Mockups for Bella 3001

**Goal:** Replace placeholder imagery with 2–3 real Bella 3001 mockups (on-model and flat lay) to set expectations.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Authentic visuals increase trust and help users visualize the product; placeholder images hurt conversion.

## Scope
- Source/host 2–3 high-quality mockups for Bella 3001 (front view on-model; flat lay).
- Update product image URLs (seed + DB) and product modal/card.

## Deliverables
- Updated `products` table imageUrl for the active tee.
- Product modal/card show the new mockups.

## Acceptance Criteria
- Shop and modal display real mockups; no placeholders remain for the active SKU.
- Images load fast on mobile.

## Implementation Notes
- File: `backend/prisma/seed.ts` (or update Supabase `products` directly).
- Host on a reliable CDN (e.g., Supabase storage public URL).

## Risks / Mitigations
- Risk: Slow image load. Mitigate with optimized sizes (~800px) and CDN hosting.

---
### Notes (completed)
- Updated Basic tee imagery to a real Bella 3001-style mockup and refreshed description/base price (`backend/prisma/seed.ts`).
- Premium tee (inactive) also points to a real mockup for future activation.
