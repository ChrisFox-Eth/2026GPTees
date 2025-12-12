# Ticket 004 — /admin/social UI shell

**Goal:** Build dev-only /admin/social page consuming new Supabase-backed APIs for FB/IG copy/CSV MVP.

## Why
- Provide operators a fast way to list/filter/create/edit social posts and copy publish packs.

## Scope
- Route: add `/admin/social` (dev-only guard). Add card in Admin hub pointing to it.
- Views: list with filters (platform, status, date range, template), pagination; detail drawer; create/edit drawer.
- Actions: duplicate post; copy publish pack (caption, hashtags, CTA, assets); set status; set scheduled time; delete.
- UX: reuse Button + table styling from promo dashboard; respect semantic Tailwind classes; property-level JSDoc on components.
- Types: define in dedicated types file (no inline types). Props documented.

## Deliverables
- New page component + supporting components/hooks calling `/api/admin/social` endpoints.
- Dev-only visibility (`import.meta.env.DEV` + ProtectedRoute/requireAdmin).

## Acceptance Criteria
- Can view, filter, paginate social posts from Supabase data.
- Can create/edit posts with validation for platforms (fb/ig) and required fields.
- Copy buttons work (publish pack modal or inline).

## Notes / Risks
- Ensure no service role keys leak to frontend; all data via admin API.
- Keep loading/error states consistent with existing admin pages.
