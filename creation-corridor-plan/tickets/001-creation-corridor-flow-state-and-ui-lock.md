# Ticket 001 — Creation Corridor Flow State + UI Lock (Global)

**Goal:** Add a global “Creation Corridor” flow state (React context + persistence) that can lock down the UI (hide Header/Footer, prevent scroll) across route changes (`/` → `/auth` → `/`) while preserving the user’s prompt/draft identifiers.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- The current homepage Quickstart flow is a *component-local* experience; it navigates away quickly (guest → `/auth?redirect=/`, signed-in → `/design?orderId=...`).
- The Creation Corridor requires an *app-wide* state that:
  - Survives route changes.
  - Can hide global navigation surfaces.
  - Can resume after auth without losing prompt/order context.

## Scope
- **Global state**
  - Introduce a single authoritative “corridor session” state that is readable by:
    - App layout (Header/Footer visibility)
    - Corridor overlay
    - Quickstart (start trigger)
    - AuthPage (continuation copy)
- **UI lock**
  - Hide Header/Footer when the corridor is active.
  - Disable background scroll while active.
- **Persistence**
  - Persist enough state to localStorage so an auth redirect / hard refresh doesn’t lose the session.

## Non-goals
- Do not change backend schema.
- Do not introduce new backend endpoints if existing preview endpoints are sufficient.
- Do not implement the overlay UI in this ticket (that’s Ticket 002).

## Breadcrumbs (where the truth lives today)
- **Layout always-on**: `frontend/src/App.tsx`
  - Always renders `<Header />` and `<Footer />` today.
- **Quickstart guest persistence keys**: `frontend/src/components/sections/Quickstart/Quickstart.tsx`
  - `gptees_preview_guest`
  - `gptees_quickstart_preview_cache`
  - `gptees_quickstart_prompt` (from `frontend/src/utils/quickstart.ts`)
- **Guest preview type**: `frontend/src/types/preview.ts` (`PendingGuestPreview`)

## Proposed design

### 1) Corridor state model (typed)
Create a dedicated type file (no inline types):
- **[new]** `frontend/src/types/creation-corridor.ts`

Suggested fields (exact naming TBD):
- `active: boolean`
- `phase: 'idle' | 'running' | 'auth_pause' | 'auth_in_progress' | 'resuming' | 'completing' | 'error'`
- `stageIndex: number`
- `prompt: string`
- `orderId: string | null`
- `guestToken: string | null`
- `startedAtMs: number` (for analytics + TTL)
- `source: 'quickstart_home' | 'other'` (optional)

Invariants:
- If `active === true`, `prompt` must be non-empty.
- If `phase` is any of `auth_pause | auth_in_progress | resuming`, `orderId` and `guestToken` should be set for guest flows.

### 2) Public API (hook)
Expose a stable API via a hook:
- `startCorridor({ prompt, productId, color, size, tier }): void`
- `setDraftIdentifiers({ orderId, guestToken? }): void`
- `setStageIndex(next: number): void`
- `pauseForAuth(): void`
- `markAuthInProgress(): void`
- `resumeAfterAuth(): void`
- `completeAndReset(): void`
- `reset(reason?: string): void`

Implementation note:
- Keep the corridor API “business-level” (start/pause/resume/complete) and avoid exposing raw `setState` everywhere.

### 3) Persistence strategy (localStorage)
Add a single dedicated key for corridor state (recommended):
- `gptees_creation_corridor`

Persist **only** what is needed to resume:
- `phase`
- `stageIndex`
- `prompt`
- `orderId`
- `guestToken`
- `startedAtMs`

TTL/cleanup:
- If `Date.now() - startedAtMs` exceeds a reasonable TTL (e.g. 60 minutes), auto-clear the corridor state.
- Always clear the key on successful completion.

### 4) App-level UI lock (Header/Footer + scroll)
- In `frontend/src/App.tsx`, conditionally render:
  - `active ? null : <Header ... />`
  - `active ? null : <Footer />`
- Apply body scroll lock while active:
  - `document.body.style.overflow = 'hidden'` on activate
  - restore previous value on deactivate/unmount

## Expected file changes
- **[new]** `frontend/src/types/creation-corridor.ts`
- **[new]** `frontend/src/context/CreationCorridorContext.tsx` (provider + reducer/state)
- **[new]** `frontend/src/hooks/useCreationCorridor.ts` (exported hook wrapper)
- **[edit]** `frontend/src/App.tsx` (wrap app with provider; hide Header/Footer when active)
- **[optional/new]** `frontend/src/utils/creation-corridor-storage.ts` (localStorage helpers + TTL)
- **[optional/new]** `frontend/src/hooks/useBodyScrollLock.ts` (if we want a reusable abstraction)

## Deliverables
- A provider + hook that can be consumed from any route.
- Header/Footer visibility tied to corridor `active`.
- Background scroll disabled while corridor `active`.
- LocalStorage persistence + TTL.

## Acceptance criteria
- Starting the corridor sets `active=true` and immediately:
  - hides Header + Footer
  - prevents scroll
- Navigating to `/auth` keeps Header + Footer hidden and scroll disabled.
- Refreshing on `/auth` or `/` restores corridor state from localStorage (within TTL).
- Resetting/completing the corridor restores Header + Footer and re-enables scroll.

## Risks / mitigations
- **Risk:** Scroll remains locked after exit.
  - **Mitigation:** body lock effect must always restore previous overflow value in cleanup.
- **Risk:** Stale corridor state causes the site to appear “stuck”.
  - **Mitigation:** TTL + explicit reset path.
- **Risk:** Two competing sources of truth (Quickstart state vs corridor state).
  - **Mitigation:** corridor becomes the sole authority for “active flow”; Quickstart becomes a trigger + input surface only (see Ticket 003).
