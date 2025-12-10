# Admin Social Ops — How to Use (Last Updated: 2025-12-07)

This is the dev-only social ops hub (frontend `/admin/social`, backend `/api/admin/social/*`). It writes to Supabase tables (`social_posts`, `social_templates`, `hashtag_sets`, `prompt_bank`) and storage bucket `designs`.

## Required env (backend/.env)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DESIGNS_BUCKET` (public read, allow image/* audio/* video/*).
- `SOCIAL_SORA_ENABLED=true|false`, `OPENAI_API_KEY` (+ `OPENAI_ORGANIZATION_ID` if needed).
- `SOCIAL_VEO_ENABLED=true|false`, `KIE_VEO_API_KEY`, `KIE_VEO_CALLBACK_URL=https://<public>/api/webhooks/veo`, optional `KIE_VEO_API_URL`.
- `SOCIAL_SUNO_ENABLED=true|false`, `SUNO_API_KEY`, `SUNO_CALLBACK_URL=https://<public>/api/webhooks/suno`, optional `SUNO_API_URL`.
- `VITE_API_URL`, `VITE_SKIP_AUTH` (frontend).
- Sora/Suno/Veo require public callback URLs if you use their webhooks.
- ffmpeg must be on PATH (for GIF/MP4 stitching fallback).

## Core flows
- List/filter/sort posts. Table shows FB/IG type, status, scheduled, assets/prompts badges.
- Generate posts:
  - Buttons: Generate next 7 days; Generate 1 Post/Story/Reel.
  - Optional “context” input: every generated title/caption/CTA must include it; titles diversified.
- Detail drawer:
  - Media links: Sora video, Veo video, Suno audio (when present), assets preview.
  - AI assistant: suggest prompts, generate & attach; bulk generate images.
  - Publish pack: caption + CTA + hashtags + first comment copy; single-row CSV download.
- Asset library: attach existing Supabase assets (designs bucket).
- Bulk actions: status update, delete, apply prompt bank (when populated).
- Export: full CSV or “Export selected” (first asset + video URL if present).

## Import/export
- Import from Markdown → Supabase via `npm run import:social -- --input docs/social_posts_import.md --csv docs/social_fb_ig_export.csv` (backend). Populate templates/hashtag sets from docs first.
- Export all or selected → CSV matches `docs/social_csv_template_fb_ig.csv` (trimmed FB/IG Metricool).

## Media generation logic (REEL/STORY vs POST)
- POST: prompt generation → 1 image cover.
- REEL/STORY:
  1) Try Sora (if enabled) → meta.video_url set on success.
  2) Try Veo (if enabled) → meta.veo_task_id; callback uploads video, sets meta.veo_video_url.
  3) If no video queued: generate 3–4 DALL·E frames → stitch GIF + MP4 via ffmpeg; if Suno audio exists, mux into MP4; meta.video_url/meta.gif_url updated; first frame kept as cover.
  4) Suno audio runs only if no video task was queued; callback sets meta.suno_* and mirrors audio to Supabase.

## Webhooks (public)
- `/api/webhooks/suno`: attaches audio URLs (mirrored + source) to meta for matching `meta->>suno_task_id`.
- `/api/webhooks/veo`: attaches mirrored video URL + source URLs to meta for matching `meta->>veo_task_id`.

## Prompts/templates
- Context is enforced in every generated title/caption/CTA.
- Prompt bank reusable; can save current prompts and reapply to posts.
- Evergreen themes baked into planner; context overrides drive the set.

## Quick steps (one-off)
1) Ensure envs + ffmpeg + ngrok (if using webhooks). Restart backend.
2) Open `/admin/social`, enter optional context, click “Generate 1 Reel” (or Post/Story).
3) Refresh to see assets; for REEL/STORY expect video (Sora/Veo) or stitched GIF/MP4; audio if Suno ran.
4) Export selected or copy packs from drawer.
