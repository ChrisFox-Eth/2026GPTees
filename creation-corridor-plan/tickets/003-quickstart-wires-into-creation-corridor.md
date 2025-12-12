# Ticket 003 — Quickstart Starts the Creation Corridor (No Immediate Navigation)

**Goal:** Refactor the homepage Quickstart so that clicking **Create draft** starts the Creation Corridor flow (global state + overlay) instead of immediately navigating to `/auth` or `/design`.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Today Quickstart is both:
  - The prompt entry surface.
  - The full “flow controller” (creates preview order, starts generation, handles guest claim, navigates).
- The Creation Corridor needs Quickstart to become a *trigger/input surface*, while the corridor owns:
  - Orchestration (API calls + persistence)
  - Narrative staging and timing
  - Routing decisions

## Scope
- Keep the Quickstart UI (prompt input, Create draft button) as the entry point.
- On submit, call the corridor API (`startCorridor(...)`) and let the corridor drive:
  - preview order creation
  - generation kick-off
  - auth pause
  - post-auth resume/claim
  - final navigation to `/design?orderId=...`
- Remove or disable Quickstart’s existing “mini flow” UI blocks that compete with the corridor overlay:
  - `progressMessage` / “Studio preview” card
  - “Sign in to reveal your design preview” block
  - auto-navigation inside Quickstart

## Non-goals
- Do not change DesignPage behavior.
- Do not change backend APIs.
- Do not redesign the homepage layout.

## Breadcrumbs (current Quickstart truth)
- **Quickstart component**: `frontend/src/components/sections/Quickstart/Quickstart.tsx`
  - Guest create preview: `POST /api/orders/preview/guest`
  - Guest generate: `POST /api/designs/generate/guest`
  - Guest claim after sign-in: `POST /api/orders/preview/claim`
  - Signed-in create preview: `POST /api/orders/preview`
  - Signed-in generate: `POST /api/designs/generate`
  - Navigation today:
    - guest → `navigate('/auth?redirect=/')`
    - signed-in → `navigate('/design?orderId=...')`
- **Local storage keys used today**:
  - `gptees_preview_guest`
  - `gptees_quickstart_preview_cache`
  - `gptees_quickstart_prompt`

## Proposed approach

### 1) Introduce a corridor orchestration API
Add (or extend) the corridor hook from Ticket 001 to support a “Quickstart submission” payload:
- `startCorridorFromQuickstart({ prompt, productId, color, size, quantity }): Promise<void>`

Notes:
- The corridor should own the network calls so the flow is consistent across routes.
- The hook should also be responsible for updating `gptees_preview_guest` and/or the corridor persistence key.

### 2) Quickstart becomes a thin trigger
Update `Quickstart.tsx` so:
- It gathers the same inputs (prompt, selected color/size, product selection fallback).
- It calls `startCorridorFromQuickstart(...)`.
- It does **not** directly call `navigate(...)`.

UX notes:
- After submit, Quickstart can remain mounted under the overlay, but should not show its own loading UI.
- Consider disabling the prompt field and button while `corridor.active === true`.

### 3) Preserve real-data behavior (no mocks)
Quickstart currently uses:
- `apiGet('/api/products')` to load real products (with `FALLBACK_PRODUCT` only as a local fallback).

Corridor wiring must keep using:
- The selected real product ID.
- The same default size/color logic already in Quickstart.

### 4) Error handling contract
Define corridor-visible error behavior:
- If preview order creation fails:
  - corridor should transition to `phase='error'` and unlock UI (reset) OR show an in-overlay error message with a single “Try again” CTA.
- If guest generation fails pre-auth:
  - continue to auth pause anyway (best-effort) and allow regeneration post-claim (Ticket 004).

## Expected file changes
- **[edit]** `frontend/src/components/sections/Quickstart/Quickstart.tsx`
  - Replace `handleSubmit` orchestration with `useCreationCorridor().startCorridorFromQuickstart(...)`.
  - Remove immediate navigation and competing progress blocks.
- **[new]** `frontend/src/types/creation-corridor-input.ts` (submission payload type)
- **[edit/new]** `frontend/src/context/CreationCorridorContext.tsx` (add start method)

## Deliverables
- Quickstart starts the corridor.
- Corridor owns the rest of the flow.

## Acceptance criteria
- Guest user:
  - Clicking **Create draft** starts the corridor overlay.
  - The app does not navigate away until the corridor’s auth pause CTA is clicked.
- Signed-in user:
  - Clicking **Create draft** starts the corridor overlay.
  - No auth pause is shown; the corridor proceeds through stages and then navigates to `/design?orderId=...`.
- Quickstart does not call `navigate('/auth...')` or `navigate('/design...')` directly.

## Risks / mitigations
- **Risk:** Removing Quickstart’s existing local “pendingGuest” state breaks the resume behavior.
  - **Mitigation:** Guest persistence + claim must move to corridor (Ticket 004) before deleting Quickstart logic.
- **Risk:** Duplicate API calls (Quickstart and corridor both creating orders).
  - **Mitigation:** corridor is the sole orchestrator; Quickstart never calls preview endpoints directly after this ticket.
