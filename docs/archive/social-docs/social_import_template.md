# Social post import template (parsed by `backend/scripts/import-social-from-md.ts`)

Recommended format: add one or more fenced `social-post` JSON blocks to a markdown file (default: `docs/social_posts_import.md`). The script parses these blocks, upserts Supabase rows, and can emit a Metricool-ready CSV (FB/IG-only).

## Example block
```social-post
{
  "title": "Cyber Monday Flash Sale",
  "date": "2025-12-01",
  "time": "14:00:00", // local time; script converts to UTC
  "caption": "Cyber Monday is here! 10% off today only. Create your AI tee now.",
  "cta": "Design yours now at GPTees.app and use code CYBER at checkout!",
  "hashtags": ["CyberMonday","HolidayDeals","GPTees","CustomTShirt","OneOfOne","HolidayGifts","Sale"],
  "platforms": ["facebook","instagram"],
  "fb_type": "POST",
  "ig_type": "POST",
  "show_reel_on_feed": false,
  "first_comment": "",
  "assets": [
    { "url": "https://your-supabase-bucket/designs/abc/image.png", "alt": "Festive promo tee" }
  ],
  "status": "draft",
  "scheduled_at": "", // optional ISO; if present, overrides date+time
  "template_key": "" // optional; defaults to slugified title
}
```

Notes:
- `hashtags` should be an array of bare tags (no `#` needed).
- `platforms` defaults to `["facebook","instagram"]` if omitted.
- `fb_type` / `ig_type` allowed: `POST`, `REEL`, `STORY`. If omitted, defaults to `POST`.
- `assets` supports up to 10 entries; alt text is required per asset (empty string allowed).
- `scheduled_at` (ISO) wins; otherwise the script combines `date` + `time` (local) into UTC.

## Running the import
From `backend/`:
```
npm run import:social -- --input ../docs/social_posts_import.md --csv ../docs/social_fb_ig_export.csv
```
Flags:
- `--input <path>`: markdown file to parse (defaults to `../docs/social_posts_import.md` if present, otherwise `../docs/SOCIAL_MEDIA.md` legacy parser).
- `--csv <path>`: optional CSV output path (FB/IG Metricool subset).
- `--dry-run`: parse and build CSV only, no Supabase writes.
- `--legacy`: force legacy parser for the original `SOCIAL_MEDIA.md` layout.

Env required (backend): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
