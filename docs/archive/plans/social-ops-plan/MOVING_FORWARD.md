# Moving Forward (Social Ops) — Last Updated: 2025-12-07

### Clarity & UX
- Define per-type requirements: POST (cover image + caption/CTA/hashtags), REEL (vertical video + optional cover; captions optional), STORY (vertical video/GIF; captions generally unused; avoid text for Metricool). Surface these rules in the UI (tooltips/labels) and enforce validations before export.
- Add status badges for media sources: Sora, Veo, Stitched (frames), Suno. Show “video pending” vs “audio pending” vs “complete”.
- Show final “publish pack” preview per platform (IG/FB) so it’s obvious what will be copied/exported.

### Asset library
- Add pagination + search + sort; raise limit beyond 50. Filter by type (image/gif/video). Fix displayed URLs for videos to the actual file (e.g., …/veo-*/asset-*.mp4).
- Support multi-select attach and better tagging (e.g., cover, variant, frame).

### Media generation
- Sora: now verified—extend polling + add one retry (done) and surface when still pending; optionally add a manual “poll status” button.
- Veo: keep behind flag; add credit check and “skip Veo if quota low” guard; surface fallback message in UI.
- Stitched frames: improve prompt structure (Frame 1..4, same subject/style) and allow choosing frame count (3–6). Add “Generate frames only” button to avoid accidental runs.
- Suno: show when audio is muxed vs just stored; allow “attach audio” to existing video.

### Planner & content variety
- Allow selectable templates/themes (gift cards, community, BTS, prompt challenge, seasonal). Context already enforced; add a “theme picker” plus weights.
- Add per-day schedule offsets (e.g., time windows) to reduce randomness-only times.
- Store the generation context used in meta and display it.

### Export/Import
- Export selected: currently only first asset + video URL. Add options: “include all assets”, “include gif/mp4 if present”, “strip captions for Story”.
- Import: add validation and dry-run output; show how many posts/templates/hashtags were ingested.

### Reliability & Ops
- Add a “refresh post meta” button to re-fetch publish-pack/meta after webhooks.
- Add simple audit logs for generation events (Sora/Suno/Veo/Frames). It is imperative to have this and be able to trace every AI creation back to the prompt that initiated it. And let's store that in Supabase, of course.
- Add toast/error display for webhook failures (e.g., credit errors from Veo/Suno).

### Nice-to-have
- Per-post checklist (assets ready, prompts saved, audio present, caption length OK).
- Quick-copy for platform-specific packs (IG caption/hashtags + optional first comment; FB caption/hashtags).
- Optional “download bundle” (cover, video/gif, audio, caption.txt, hashtags.txt) for manual schedulers/Canva.
- Content remixer (e.g., mix 2 IG reels into a new IG reel).
