# Ticket 008 — Backend Preview Contract Audit (Guest/Claim Hardening)

**Goal:** Audit and (if needed) harden the backend preview-order + guest claim contracts so the Creation Corridor can reliably create a guest preview, generate, claim, and proceed without brittle edge-case failures.

**Owner:** TBD | **Priority:** P2 | **Status:** TODO

## Why
- The Creation Corridor leans heavily on preview endpoints:
  - `POST /api/orders/preview/guest`
  - `POST /api/designs/generate/guest`
  - `POST /api/orders/preview/claim`
- The corridor adds persistence and resume behaviors that may retry calls after refresh; the backend should be robust to this.

## Scope
- Verify contract correctness (request/response shapes) and docs alignment.
- Validate idempotency expectations (especially for claim).
- Confirm allowed status gates and error messages are corridor-friendly.

## Non-goals
- Do not change database schema unless strictly necessary.
- Do not introduce new user-visible copy in the API layer beyond clearer error messages.

## Breadcrumbs (current truth)
- Routes:
  - `backend/src/routes/order.routes.ts`
  - `backend/src/routes/design.routes.ts`
- Controllers:
  - `backend/src/controllers/order.controller.ts`
  - `backend/src/controllers/design.controller.ts`

## Audit checklist

### 1) Route docs vs implementation
- **[claim param naming]** In `order.routes.ts`, the JSDoc mentions `claimToken`, but the controller expects `guestToken`.
  - Align route docs to the real contract to avoid drift.

### 2) Claim idempotency expectations
Current behavior:
- If an order has already been claimed (`previewGuestToken` is null), claim returns 404 (`Preview order not found or already claimed`).

Corridor implications:
- A resume flow might retry claim after a refresh.

Options:
- **Option A (frontend-only guard):** corridor guarantees claim is called once (store `hasClaimed`).
- **Option B (backend idempotency):** treat “already claimed by this user” as success.

Decide and implement one; document it.

### 3) Allowed status gates
Confirm the following remain true:
- Guest generation (`createDesignGuest`) allows:
  - `PENDING_PAYMENT`
  - `DESIGN_PENDING`
- Auth generation (`createDesign`) allows:
  - `PENDING_PAYMENT`
  - `DESIGN_PENDING`
  - `PAID`

This is important because corridor may:
- kick off guest generation pre-auth
- land in post-auth generation fallback

### 4) Error messaging + status codes
Ensure errors are consistent and corridor-friendly:
- Missing params → 400
- Invalid guest token → 403
- Order not found / already claimed → 404
- Disallowed status → 400

### 5) Guest user creation volume
`createGuestPreviewOrder` currently creates a guest `User` record for every guest preview.
- Confirm we are comfortable with this volume.
- Confirm cleanup behavior in claim endpoint is sufficient.

Optional hardening:
- Add a scheduled cleanup task (out of scope unless already planned).

## Expected file changes
- **[edit]** `backend/src/routes/order.routes.ts` (doc param name alignment)
- **[optional/edit]** `backend/src/controllers/order.controller.ts` (claim idempotency behavior if chosen)

## Deliverables
- Documented, stable contracts for preview guest + claim.
- Optional backend improvements that reduce corridor brittleness.

## Acceptance criteria
- Route docs match runtime behavior.
- Corridor resume can safely handle at least one retry scenario without unrecoverable failure (either frontend-guarded or backend-idempotent).
- Guest preview → guest generate → claim → `/design` works reliably under normal load.

## Risks / mitigations
- **Risk:** Making claim idempotent could mask real misuse.
  - **Mitigation:** only treat “already claimed” as success when `order.userId === req.user.id` and the order is still in preview-eligible statuses.
