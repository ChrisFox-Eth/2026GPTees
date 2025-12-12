# Ticket 002 — Creation Corridor Overlay (Narrative Stages + Motion)

**Goal:** Implement the full-screen Creation Corridor overlay that displays a sequence of narrative loading stages with calm Framer Motion transitions, including a dedicated “auth pause” prompt stage.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- The Creation Corridor experience depends on a *locked, full-screen* narrative sequence that feels continuous and premium.
- The overlay is the main “machine mode” UI: no navigation, no browsing, no competing calls-to-action.

## Scope
- A new overlay component rendered when corridor state is active.
- Timed stage progression with soft transitions.
- A dedicated auth pause UI (CTA to sign in).
- Reduced-motion support.

## Non-goals
- Do not implement API calls here (order create, generate, claim). Those are wired in Tickets 003–004.
- Do not redesign Quickstart layout; this overlay sits *on top*.

## Breadcrumbs (existing motion + patterns)
- **Motion tokens**: `frontend/src/utils/motion.ts`
- **Route crossfade**: `frontend/src/App.tsx` uses `AnimatePresence` + `routeTransition`.
- **Existing stage-like transitions**: `frontend/src/components/sections/Quickstart/Quickstart.tsx` prompt idea rotator uses `AnimatePresence mode="wait"`.
- **Design system motion guidance**: `design-overhaul-plan/tickets/003-motion-language-primitives.md`

## Proposed design

### 1) Stage definitions (typed, centralized)
Create a dedicated type file and constants file (no inline types):
- **[new]** `frontend/src/types/creation-corridor-stage.ts`
- **[new]** `frontend/src/constants/creation-corridor-stages.ts`

Suggested shape:
- `id` (stable string)
- `message` (user-visible)
- `durationMs` (how long to show before advancing)
- `requiresAuth` (boolean) or `kind: 'auto' | 'auth_pause'`

Copy constraints:
- Do not mention vendor/model/“AI” terms.
- Keep it calm and studio-like.

Suggested baseline stages (initial):
- Stage 0: “Interpreting your prompt…”
- Stage 1: “Exploring visual directions…”
- Stage 2: “Refining the draft…”
- Stage 3: “Finalizing your draft…”
- Auth pause stage: “Sign in to continue” + subcopy “We’re holding your draft while you sign in.”

### 2) Overlay component
Create a full-screen overlay that consumes corridor state:
- **[new]** `frontend/src/components/CreationCorridor/CreationCorridorOverlay.tsx`
- **[new]** `frontend/src/components/CreationCorridor/CreationCorridorOverlay.types.ts`

Rendering rules:
- Render only when `corridor.active === true`.
- The overlay should fully cover the viewport (`fixed` + `inset-0`) and sit above the Header (Header uses `z-50`).
- Use semantic Tailwind tokens (e.g. `bg-surface`, `text-ink`) instead of raw gray palette utilities.

### 3) Stage transitions (Framer Motion)
- Use `AnimatePresence` with `mode="wait"` to crossfade between stage messages.
- Use calm variants aligned to `utils/motion.ts` tokens.
- Ensure reduced-motion disables positional transforms and shortens durations.

Implementation notes:
- Each stage message should be keyed by stage `id` (not by index) to avoid transition glitches when reordering.
- Consider `aria-live="polite"` on the message container so screen readers get updates without being disruptive.

### 4) Timer progression
- Auto-advance through `kind: 'auto'` stages using `setTimeout`.
- Stop advancing when entering `kind: 'auth_pause'`.
- If corridor state changes due to auth completion/resume (Ticket 004), the overlay should immediately render the resumed stage.

### 5) Auth pause UI
- Render a focused panel with:
  - Headline
  - Subcopy
  - Single CTA button: “Sign in to continue”
- The CTA triggers:
  - corridor transition to `phase = 'auth_in_progress'`
  - navigation to `/auth?redirect=/`

## Expected file changes
- **[new]** `frontend/src/types/creation-corridor-stage.ts`
- **[new]** `frontend/src/constants/creation-corridor-stages.ts`
- **[new]** `frontend/src/components/CreationCorridor/CreationCorridorOverlay.tsx`
- **[new]** `frontend/src/components/CreationCorridor/CreationCorridorOverlay.types.ts`
- **[edit]** `frontend/src/App.tsx`
  - Render the overlay near the root so it can appear above any route when corridor is active.

## Deliverables
- Overlay appears full-screen when corridor is active.
- Narrative stage transitions with consistent motion.
- Auth pause stage with a single sign-in CTA.

## Acceptance criteria
- Starting the corridor shows Stage 0 full-screen within 100ms.
- Stages crossfade/soft-slide using motion tokens (no bouncy spring).
- When the auth pause stage is reached:
  - stage progression stops
  - a sign-in CTA is visible and is the only primary interaction
- Clicking the CTA navigates to `/auth?redirect=/` and keeps the UI locked down (Header/Footer hidden by Ticket 001).
- With reduced-motion enabled:
  - no noticeable y-translation/slide occurs
  - stage changes are simple opacity transitions (or instant)

## Risks / mitigations
- **Risk:** Overlay z-index conflicts with existing fixed header.
  - **Mitigation:** ensure overlay uses a z-index above `z-50`.
- **Risk:** Timer logic duplicates or double-advances on re-renders.
  - **Mitigation:** timers must be owned by a single effect with cleanup and depend only on stage/phase.
