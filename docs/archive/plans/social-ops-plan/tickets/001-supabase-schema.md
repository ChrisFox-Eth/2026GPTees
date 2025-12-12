# Ticket 001 — Supabase schema for Social Ops

**Goal:** Create Supabase tables as source-of-truth for /admin/social (dev-only UI), focused on FB/IG copy+CSV MVP.

## Why
- Persist social posts/templates/hashtag sets in Supabase (remote SoT) while UI/APIs stay dev-only.
- Avoid Prisma for this feature; use supabase-js.

## Scope
- Tables:
  - `social_posts`: id (uuid), title, caption, hashtags text[], cta, platforms text[] (fb/ig), asset_urls text[], status (draft/scheduled/posted/failed), scheduled_at timestamptz, posted_at timestamptz, template_key text, first_comment text, fb_type text, ig_type text, show_reel_on_feed bool, created_by text, created_at/updated_at default now().
  - `social_templates`: key text PK, title text, body text, default_hashtags text[], created_at/updated_at.
  - `hashtag_sets`: id uuid PK, name text, tags text[], created_at/updated_at.
- Indexes on status+scheduled_at, template_key, name.
- RLS: disabled for now (admin-only, service role). Document decision.

## Deliverables
- SQL migration (manual Supabase SQL or migration file) with create table + indexes.
- README note on env vars required (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

## Acceptance Criteria
- Tables exist in Supabase; insert/select works via service role.
- Platforms restricted to fb/ig at application layer (document expected values).
- Status enum handled as text with allowed values documented.

## Notes / Risks
- Keep timestamps in UTC.
- No Prisma models; do not touch existing Prisma schema.
- Future: add RLS + service role policies if we ever expose from edge functions.
