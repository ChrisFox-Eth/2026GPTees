# Social Ops Plan (/admin/social)

Purpose: Track dev-only Social Ops work (copy/CSV-first) while storing SoT in Supabase. Tickets live in `social-ops-plan/tickets/` and are ordered logically, not yet executed.

## Ticket index
1. `001-supabase-schema.md` — define Supabase tables for social posts/templates/hashtag sets
2. `002-admin-api-supabase.md` — dev-only admin endpoints using supabase-js (no Prisma) + guards
3. `003-csv-export-template.md` — FB/IG-only Metricool-compatible CSV template + export endpoint
4. `004-admin-ui-shell.md` — /admin/social UI shell (list, filters, create/edit) consuming new APIs
5. `005-templates-and-hashtag-sets.md` — template + hashtag-set CRUD and import from SOCIAL_MEDIA.md
6. `006-asset-picker-supabase.md` — asset picker using public Supabase URLs + alt text capture
7. `007-scheduling-and-bulk.md` — scheduling, calendar view, duplicate/bulk/export flows
8. `008-meta-graph-optional.md` — optional direct posting via Meta Graph behind feature flag

## Notes
- Supabase schema SQL lives at social-ops-plan/sql/001-social-ops-schema.sql (service-role only). Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
- Social import script: use docs/social_posts_import.md with `social-post` JSON fences and run `npm run import:social -- --input ../docs/social_posts_import.md --csv ../docs/social_fb_ig_export.csv` from backend/. Legacy parser can ingest docs/SOCIAL_MEDIA.md with `--legacy`.
