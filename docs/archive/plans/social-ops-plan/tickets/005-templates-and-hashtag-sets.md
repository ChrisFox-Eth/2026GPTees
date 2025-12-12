# Ticket 005 — Templates & hashtag sets

**Goal:** CRUD + import for social templates and hashtag sets, leveraging the existing SOCIAL_MEDIA.md content.

## Why
- Speed up creation by reusing strategy-based templates and reusable hashtag bundles.

## Scope
- Backend: CRUD endpoints for templates and hashtag sets (Supabase tables). Import endpoint to preload a curated set derived from `docs/SOCIAL_MEDIA.md` (no mock data; use real content).
- Frontend: UI pickers in create/edit drawer (template select → prefill body/hashtags; hashtag set select → append tags). Inline create/edit/delete.
- Validation: prevent duplicate keys/names; trim whitespace; enforce non-empty names.

## Deliverables
- APIs wired to Supabase tables with validation.
- UI controls wired to APIs; prefill behavior documented.
- Import script/endpoint that maps real strategy items into templates (key, title, body, default_hashtags).

## Acceptance Criteria
- Can create/update/delete templates and hashtag sets; changes persist in Supabase.
- Selecting a template prefills caption/body/hashtags; selecting a hashtag set appends tags.
- Import populates a starter set derived from SOCIAL_MEDIA.md (real data).

## Notes / Risks
- Keep template keys stable for references in posts.
- Avoid inline types; keep property-level JSDoc on components.
