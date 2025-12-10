# Ticket 002 — Admin API (supabase-js, dev-only)

**Goal:** Expose /api/admin/social endpoints that read/write Supabase social tables (no Prisma), gated by requireAdmin + NODE_ENV=development.

## Why
- Enable /admin/social UI to CRUD social data in Supabase (SoT) while keeping admin endpoints dev-only.

## Scope
- Supabase client helper (service role) for social tables.
- Routes under `/api/admin/social`: list/filter, create, update, delete, schedule (set scheduled_at/status), publish-pack (returns structured payload and CSV row), export CSV (FB/IG subset), templates CRUD, hashtag sets CRUD.
- Validation for allowed platforms (facebook, instagram) and statuses (draft/scheduled/posted/failed).
- Reuse error handling patterns; return JSON shapes compatible with frontend table + detail drawer.

## Deliverables
- Express routes + controllers using supabase-js queries (no Prisma changes).
- Input validation + error responses consistent with existing admin patterns.
- Dev-only guard (`requireAdmin` and NODE_ENV check) to block in prod.

## Acceptance Criteria
- CRUD endpoints operate against Supabase tables created in Ticket 001.
- CSV export endpoint returns Metricool-compatible columns (FB/IG subset) for filtered rows.
- Non-dev env returns 403/disabled message for these routes.

## Notes / Risks
- Ensure service role key not exposed to frontend.
- Keep time handling UTC; scheduled_at optional; posted_at set when status=posted.
