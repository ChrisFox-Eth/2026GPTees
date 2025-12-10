# Ticket 003 — CSV export (FB/IG Metricool subset)

**Goal:** Provide FB/IG-only Metricool-compatible CSV export and maintain a trimmed template file for reference.

## Why
- Enable easy bulk upload to Metricool/Buffer while focusing on Facebook and Instagram only.

## Scope
- Add `docs/social_csv_template_fb_ig.csv` (trimmed columns per subset).
- Backend: `/api/admin/social/export.csv` using filters; columns: Text, Date, Time, Draft, Facebook, Instagram, Picture Url 1..10, Alt text picture 1..10, Facebook Post Type, Facebook Title, Instagram Post Type, Instagram Show Reel On Feed, First Comment Text, Video Thumbnail Url, Video Cover Frame.
- Ensure timezone handling: dates/times derived from scheduled_at in UTC, allow override.
- Map internal status to Draft flag (draft => true; scheduled/posted => false).

## Deliverables
- Template CSV file in docs.
- Endpoint returning CSV with correct headers/order and escaping.
- Tests or manual checklist for a few sample rows.

## Acceptance Criteria
- Exported CSV uploads cleanly to Metricool for FB/IG.
- Only FB/IG columns present; all others omitted.
- Handles posts with 0–10 images and optional alt text.

## Notes / Risks
- Ensure commas/quotes escaped.
- Keep UTC; document expectation for scheduling tools.
