# Ticket 008 — Optional Meta Graph posting (flagged)

**Goal:** (Later) Enable direct posting to Facebook/Instagram via Meta Graph API, behind feature flag `SOCIAL_POSTING_ENABLED`.

## Why
- Optional step to avoid manual/CSV for some posts; must remain gated and server-side.

## Scope
- Backend: endpoints `/posts/:id/publish-now` and webhook handler (status callbacks) using Meta Graph; requires PAGE access token + IG business id. Feature flag off by default.
- Env: META_APP_ID, META_APP_SECRET, META_PAGE_ID, META_IG_BUSINESS_ID, META_PAGE_ACCESS_TOKEN, META_WEBHOOK_VERIFY_TOKEN, SOCIAL_POSTING_ENABLED.
- Store publish attempt logs/errors on the post record (meta column) to keep DB as SoT.
- DO NOT expose tokens to frontend.

## Deliverables
- Server-side Meta Graph client wrapper; uses service secrets from env.
- Guarded endpoints; return clear errors if flag/env missing.
- Documentation for required permissions (`pages_manage_posts`, `instagram_content_publish`, etc.).

## Acceptance Criteria
- With flag on and creds present, can publish a post with media to FB/IG from server; status updates stored.
- With flag off or missing env, endpoints return 403/disabled without side effects.

## Notes / Risks
- Media upload steps differ for image vs reel; handle image first (MVP).
- Rate limits and token expiry—log errors, no retries for MVP.
- Keep everything dev-only until explicitly enabled.
