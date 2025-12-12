# Ticket 007 — Scheduling, calendar view, bulk tools

**Goal:** Add scheduling UX (per-post scheduled_at/status), calendar view, duplicate, bulk export for FB/IG CSV.

## Why
- Operator can plan the “digital advent” queue, see what’s scheduled by day/week, and bulk export to Metricool.

## Scope
- Backend: endpoints already support scheduled_at/status; add bulk export with filters; ensure list endpoint filters by date/status/platform.
- Frontend: calendar view (week/month) showing scheduled posts; ability to reschedule via drag or picker (MVP: date/time picker); bulk select → export CSV; duplicate post with new date; status toggles (draft/scheduled/posted).
- Timezone: display in local time; store/send UTC. Clearly label.

## Deliverables
- UI calendar component (lightweight) consuming list API; list↔calendar toggle.
- Bulk actions bar (export selected, duplicate, set status).

## Acceptance Criteria
- Can schedule a post and see it on calendar; editing updates scheduled_at in Supabase.
- Bulk select → CSV export limited to FB/IG columns.
- Duplicate creates a new post with new scheduled time and same content/assets.

## Notes / Risks
- Drag/drop optional; if complex, use a date/time picker modal per event.
- Avoid inline types; use dedicated types file; JSDoc on props.
