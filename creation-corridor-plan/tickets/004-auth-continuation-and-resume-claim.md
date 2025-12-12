# Ticket 004 — Auth Continuation + Resume (Claim Guest Preview)

**Goal:** Make authentication feel like a mid-flow step (not a detour) by:
- Showing continuity copy on `AuthPage` when a corridor session is active.
- Resuming the Creation Corridor after auth.
- Claiming the guest preview order (`/api/orders/preview/claim`) and continuing to `/design`.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- The Creation Corridor explicitly requires **mid-flow auth continuation**: the user should return to exactly where they left off.
- Today, guest Quickstart flow does guest preview creation + best-effort guest generation and then navigates to `/auth?redirect=/`.
- We need to move that behavior to the corridor and make it reliable across:
  - SPA route changes
  - OAuth redirects / hard refresh

## Scope
- Add continuity copy to `AuthPage` when a corridor session is active.
- Implement corridor “pause for auth” → navigate to `/auth?redirect=/`.
- Implement corridor “resume after auth”:
  - Detect signed-in user.
  - Claim guest preview order.
  - Ensure a design exists (generate if needed).
  - Resume narrative stages and proceed.

## Non-goals
- Do not replace Clerk UI.
- Do not introduce a new “auth callback” route; use existing `redirect` query param.

## Breadcrumbs (existing behavior)
- **Auth route**: `frontend/src/pages/AuthPage.tsx`
  - Reads `redirect` query param.
  - Uses `<SignIn />` / `<SignUp />`.
- **Guest preview order creation**:
  - Frontend (today): `Quickstart.tsx` calls `POST /api/orders/preview/guest`.
  - Backend: `backend/src/controllers/order.controller.ts` `createGuestPreviewOrder`.
- **Guest order claim**:
  - Frontend (today): `Quickstart.tsx` calls `POST /api/orders/preview/claim`.
  - Backend: `backend/src/controllers/order.controller.ts` `claimPreviewOrder`.
  - Contract today expects `{ orderId, guestToken }`.
- **Guest generation**:
  - Frontend (today): `Quickstart.tsx` calls `POST /api/designs/generate/guest`.
  - Backend: `backend/src/controllers/design.controller.ts` `createDesignGuest`.

## Proposed approach

### 1) AuthPage continuity copy
Update `AuthPage` so when a corridor session is active it shows a small continuity note.

Detection options (prefer robust):
- **Primary:** corridor context `active === true`.
- **Fallback:** localStorage contains `gptees_creation_corridor` within TTL.

Placement:
- Above the Clerk card inside the existing layout.

Copy guidelines:
- Keep it short and calm.
- Do not mention “AI”.

Example intent:
- Headline: “Your draft is in progress”
- Subcopy: “Sign in to continue. We’re holding your draft while you do.”

Styling guidance:
- Prefer semantic Tailwind tokens (avoid adding more raw palette utilities).

### 2) Pause → navigation contract
When the corridor reaches its auth pause stage (Ticket 002):
- On CTA click:
  - Persist corridor state (Ticket 001)
  - Transition corridor phase to `auth_in_progress`
  - Navigate to `/auth?redirect=/`

### 3) Resume after auth (claim + continue)
On app start / route mount, the corridor provider should:
- Detect `isSignedIn === true` and a persisted corridor session in `phase === 'auth_in_progress' | 'auth_pause'`.
- Transition to `phase = 'resuming'`.
- Claim preview order:
  - `POST /api/orders/preview/claim` with `{ orderId, guestToken }` using Clerk token.
- After claim:
  - Clear `gptees_preview_guest` (if used) and clear guestToken from corridor state.
  - Ensure there is at least one design for the order:
    - Try `GET /api/designs?orderId=...`.
    - If empty (guest generation failed pre-auth), call `POST /api/designs/generate` with `{ orderId, prompt, style }`.

Important: claim must be attempted **once** per session (avoid loops). Suggested guard:
- Store `hasClaimed: boolean` in corridor state.

### 4) Resume stage index
After successful claim (and generation kick-off if needed):
- Continue corridor narrative at the post-auth stage index (e.g. stage 2).
- Proceed through remaining stages and then hand off to `/design` (Ticket 005).

### 5) Signed-in users (skip auth pause)
If the user is signed in at corridor start:
- Never show auth pause stage.
- No claim behavior.

## Expected file changes
- **[edit]** `frontend/src/pages/AuthPage.tsx`
  - Add continuity note when corridor is active.
- **[edit]** `frontend/src/context/CreationCorridorContext.tsx`
  - Add `resumeAfterAuth()` effect:
    - reads localStorage fallback
    - claims guest order
    - ensures design exists
- **[edit]** `frontend/src/utils/api.ts` (only if needed to support corridor orchestration patterns)

## Deliverables
- AuthPage shows continuity note during corridor auth.
- Corridor reliably resumes after auth.
- Guest preview order is claimed and usable from `/design`.

## Acceptance criteria
- Guest flow:
  - Corridor pauses for auth and navigates to `/auth?redirect=/`.
  - Header/Footer remain hidden on `/auth`.
  - AuthPage shows continuity note.
  - After sign-in, user returns to `/` and immediately sees the corridor resume stage.
  - Corridor claims the guest preview order successfully.
  - Corridor continues and later navigates to `/design?orderId=...`.
- Guest generation failure pre-auth:
  - After claim, corridor generates a design as an authenticated user (fallback) and still proceeds.
- No infinite loops:
  - Claim is not retried endlessly on failure.
  - A failure transitions to a corridor error state with a clear reset/try-again path.

## Risks / mitigations
- **Risk:** Corridor state is lost during auth if the app reloads.
  - **Mitigation:** localStorage persistence with TTL (Ticket 001) and fallback detection in provider.
- **Risk:** Claim fails if token is missing or expired.
  - **Mitigation:** show a single retry action and/or reset corridor with a helpful error.
- **Risk:** AuthPage styling conflicts with semantic class policy.
  - **Mitigation:** if editing layout wrappers, prefer semantic tokens and keep changes minimal.
