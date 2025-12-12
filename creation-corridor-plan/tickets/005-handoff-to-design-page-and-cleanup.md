# Ticket 005 — Corridor Completion → `/design` Handoff + Cleanup

**Goal:** Ensure the Creation Corridor ends cleanly by navigating to the Design Studio with a stable `orderId`, restoring normal site UI (Header/Footer), and clearing temporary corridor/guest state so future sessions don’t get “stuck”.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- The corridor is intentionally “locked down”; if we fail to reset state on completion, users can end up with:
  - Hidden navigation
  - Disabled scroll
  - Stale localStorage that re-triggers the corridor on future visits
- The DesignPage is the canonical place where the user continues iterating, choosing variants, and eventually checking out.

## Scope
- Define the corridor completion contract:
  - Always navigate to `/design?orderId=...`.
  - Always set corridor `active=false` before or during navigation.
- Clean up persistence keys:
  - `gptees_creation_corridor`
  - `gptees_preview_guest` (if used)
  - `gptees_quickstart_preview_cache` (if it would cause confusion)
- Verify DesignPage behavior when arriving from corridor:
  - Works with preview orders (`OrderStatus.PENDING_PAYMENT` / `DESIGN_PENDING`).
  - Handles “design image still swapping to Supabase URL” via existing polling.

## Non-goals
- Do not redesign DesignPage.
- Do not change order status semantics.

## Breadcrumbs (existing behavior)
- **DesignPage route**: `frontend/src/pages/DesignPage.tsx`
  - Reads `orderId` from query string.
  - Fetches:
    - `GET /api/orders/:id`
    - `GET /api/designs?orderId=...`
  - Polls every 5s when any design is still “generating/uploading” to swap to a durable Supabase URL.
- **Prompt carryover key**: `frontend/src/utils/quickstart.ts` (`QUICKSTART_PROMPT_KEY = 'gptees_quickstart_prompt'`)
  - DesignPage reads this key on load.

## Proposed approach

### 1) Single handoff function
Implement a corridor method:
- `completeAndGoToDesign({ orderId }): void`

Responsibilities:
- Transition to `phase='completing'`.
- Persist nothing further.
- Clear corridor storage and any guest preview storage.
- Set `active=false` (unlock UI).
- Navigate to `/design?orderId=${orderId}`.

### 2) Cleanup policy
Decide and document which keys are authoritative:
- **Must clear**
  - `gptees_creation_corridor`
  - any `guestToken` held for claim
- **Should clear**
  - `gptees_preview_guest` (current Quickstart key)
- **Conditional clear**
  - `gptees_quickstart_preview_cache`
    - If the corridor becomes the new flow owner, stale preview cache may point at an old order/design and confuse future starts.

Implementation note:
- Prefer a single helper in `creation-corridor-storage.ts` to clear all corridor-related keys.

### 3) Prompt carryover into DesignPage
On completion, ensure the DesignPage prompt field is prefilled.

Options:
- **Option A (reuse existing behavior):** Write `QUICKSTART_PROMPT_KEY` on corridor start or completion.
  - Keeps DesignPage behavior unchanged.
- **Option B (new corridor key):** store prompt in corridor state only.
  - Requires updating DesignPage to read the new key.

Recommendation:
- Start with **Option A** to minimize churn.

### 4) Visual continuity on first render
When the corridor navigates to `/design`, the user should not see a flash of locked UI state.

Ensure ordering:
- Set `active=false` before navigating.
- Or, if navigation is immediate, ensure `App.tsx` conditional Header/Footer respects the updated state on the next render.

### 5) Failure behavior
If navigation fails (unlikely) or orderId is missing:
- Corridor should transition to `phase='error'` and show a single recovery CTA:
  - “Return to start” (reset corridor)

## Expected file changes
- **[edit]** `frontend/src/context/CreationCorridorContext.tsx`
  - Add `completeAndGoToDesign`.
  - Add centralized cleanup helpers.
- **[optional/new]** `frontend/src/utils/creation-corridor-storage.ts`
  - `readCorridorState()`
  - `writeCorridorState()`
  - `clearCorridorState()`
  - `clearLegacyQuickstartKeysIfNeeded()`

## Deliverables
- Corridor completion reliably routes to DesignPage with `orderId`.
- Header/Footer and scroll behavior are restored.
- Local storage is not left in a state that re-triggers the corridor on the next visit.

## Acceptance criteria
- After corridor completion, user lands on `/design?orderId=...`.
- Header/Footer are visible on `/design`.
- Page scroll works normally on `/design`.
- Refreshing `/` after completing the corridor does **not** resume a corridor session.
- DesignPage loads the order/design successfully for both:
  - guest-claimed order
  - signed-in order

## Risks / mitigations
- **Risk:** Clearing `gptees_quickstart_preview_cache` removes a potentially helpful optimization.
  - **Mitigation:** only clear it when it points at a different orderId than the corridor order.
- **Risk:** OrderId is available but designs are not yet attached after claim.
  - **Mitigation:** ensure claim completes before completion; DesignPage already retries/polls designs.
