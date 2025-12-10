# Ticket 006 — Asset picker (Supabase images + alt text)

**Goal:** Add asset selection UX that uses existing public Supabase design URLs; capture alt text per image for export.

## Why
- Reuse real assets (no mocks) and ensure accessibility/alt text is present for Metricool CSV export.

## Scope
- Backend: endpoint to list/filter assets by prefix/tags (if tags stored on post or future table). For MVP, accept pasted URLs and validate they match Supabase public pattern.
- Frontend: asset input allowing paste of up to 10 URLs; optional tags/labels; alt text fields per image; preview thumbnails (if CORS allows) or fallback to URL text.
- Validation: enforce max 10 assets; ensure URLs start with configured Supabase public base; collect alt text alongside.

## Deliverables
- API support (if needed) to fetch known assets or tags (may be simple pass-through/paste-only for MVP).
- UI module for selecting/pasting assets and entering alt text; wires to create/edit post form.

## Acceptance Criteria
- User can attach up to 10 Supabase image URLs to a post and provide alt text for each.
- Non-Supabase URLs rejected or warned (configurable base URL).
- Alt text stored with post and included in CSV export.

## Notes / Risks
- CORS: if preview fails, show URL fallback.
- Keep types in dedicated file; no inline types; property-level JSDoc on components.
