# Ticket 006 — Analytics Instrumentation (Creation Corridor Funnel)

**Goal:** Instrument the Creation Corridor funnel with consistent analytics events so we can measure drop-off by stage, auth impact, and downstream conversion to DesignPage/Checkout without logging sensitive prompt content.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- The corridor is a conversion-critical change; we need confidence it improves:
  - prompt → draft start rate
  - auth completion rate (guest → signed in)
  - time-to-first-design
  - downstream checkout starts
- Today, analytics is a mix of:
  - Frontend `trackEvent(...)` calls
  - Backend `sendAnalyticsEvent(...)` calls
  - A (planned) typed event catalog (`dev-experience-plan/tickets/003-analytics-event-catalog.md`)

## Scope
- Define a minimal event set for the corridor.
- Add `trackEvent(...)` calls at key corridor transitions.
- Ensure payloads follow current conventions:
  - flat primitives only
  - snake_case keys
  - never send full prompt text

## Non-goals
- Do not rename existing event strings unless explicitly planned.
- Do not implement a full event catalog in this ticket (that is tracked elsewhere).

## Breadcrumbs (current truth)
- **Frontend analytics helper**: `frontend/src/utils/analytics.ts`
  - Sanitizes payload values to primitives and truncates long strings.
- **Existing funnel hotspots**:
  - `frontend/src/components/sections/Quickstart/Quickstart.tsx` (quickstart events)
  - `frontend/src/pages/DesignPage.tsx` (design events)
- **Backend analytics dispatcher**: `backend/src/services/analytics.service.ts`
  - Used in preview/create/claim and design generation.

## Proposed event set (frontend)

### Event naming convention
Use dot notation consistent with existing events:
- Prefix: `creation_corridor.*`

### Required events
1. `creation_corridor.start`
   - Fired when the user submits the prompt and the corridor session is created (before any navigation).
   - Payload:
     - `source` (e.g. `quickstart_home`)
     - `prompt_length`
     - `is_signed_in` (boolean)
     - `product_id`
     - `color`
     - `size`
     - `tier`

2. `creation_corridor.stage.view`
   - Fired when a stage becomes visible.
   - Payload:
     - `stage_id`
     - `stage_index`
     - `elapsed_ms`
     - `order_id` (nullable until created)

3. `creation_corridor.auth.pause_shown`
   - Fired when the auth pause UI is shown.
   - Payload:
     - `elapsed_ms`
     - `order_id`

4. `creation_corridor.auth.cta_click`
   - Fired when user clicks “Sign in to continue”.
   - Payload:
     - `elapsed_ms`
     - `order_id`

5. `creation_corridor.resume`
   - Fired when the corridor resumes post-auth on `/`.
   - Payload:
     - `elapsed_ms`
     - `order_id`

6. `creation_corridor.claim.success` / `creation_corridor.claim.error`
   - Fired after attempting `POST /api/orders/preview/claim`.
   - Payload:
     - `elapsed_ms`
     - `order_id`
     - `message` (on error; keep it short)

7. `creation_corridor.complete`
   - Fired immediately before navigating to `/design?orderId=...`.
   - Payload:
     - `elapsed_ms`
     - `order_id`
     - `design_count` (if known)

8. `creation_corridor.reset`
   - Fired when the corridor is abandoned/reset by user action or TTL cleanup.
   - Payload:
     - `reason` (e.g. `user_cancel`, `ttl_expired`, `error`)
     - `elapsed_ms`
     - `order_id` (nullable)

### Notes on prompt data
- Do **not** send the prompt string.
- Only send:
  - `prompt_length`
  - (optional) `prompt_has_text` boolean

## Preserving existing events
The corridor will likely replace portions of Quickstart orchestration.
- Preserve existing Quickstart events where possible to avoid breaking dashboards:
  - `quickstart.preview_guest_created`
  - `quickstart.preview_order_created`
  - `quickstart.preview.generated`
- Corridor events should be additive (not a rename).

## Implementation guidance
- Fire events from the corridor provider/overlay so they are not duplicated across components.
- Use guards to prevent duplicates:
  - `hasTrackedStart`
  - `lastTrackedStageId`
- For timing, store `startedAtMs` in corridor state and compute `elapsed_ms = Date.now() - startedAtMs`.

## Expected file changes
- **[edit]** `frontend/src/context/CreationCorridorContext.tsx` (or corridor hook)
  - Add event calls for start/resume/claim/complete/reset.
- **[edit]** `frontend/src/components/CreationCorridor/CreationCorridorOverlay.tsx`
  - Add stage view events on visibility.
- **[optional/edit]** `docs/analytics-events.md`
  - Add a short note linking corridor events (until Ticket 003 generates a canonical catalog).

## Deliverables
- Corridor emits a consistent event stream covering the major funnel steps.
- Payloads follow current sanitization and privacy constraints.

## Acceptance criteria
- Starting the corridor always fires `creation_corridor.start` exactly once.
- Each stage fires `creation_corridor.stage.view` at most once per stage instance.
- Guest flow:
  - auth pause shows + CTA click events fire
  - claim success/error fires
- Completion fires `creation_corridor.complete` with `order_id`.
- No event payload includes prompt text or non-primitive values.

## Risks / mitigations
- **Risk:** Double events due to re-mounting on route transitions.
  - **Mitigation:** track in corridor state and only fire when entering a new state.
- **Risk:** Sensitive content leaks in error messages.
  - **Mitigation:** truncate/sanitize error `message` and avoid including request bodies.
