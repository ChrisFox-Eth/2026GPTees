# Ticket 002 — Order/Design State Machine (Single Source of Truth)

**Goal:** Centralize GPTees order + design status semantics into a single, testable “policy/state machine” module and use it everywhere we gate user actions (generate, approve, checkout, fulfill, claim guest previews).

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Status semantics are currently enforced in multiple places with slightly different rules:
  - Backend controllers/services (authoritative) each have their own `allowedStatuses` arrays.
  - Frontend pages/components duplicate gating logic (`DesignPage`, `Quickstart`) for UX.
  - Docs are easy to drift (example: `CLAUDE.md` still describes a pay-first-only flow).
- A dedicated policy module gives us:
  - One place to change rules.
  - A place to generate diagrams/docs from code.
  - Fewer “edge case” bugs when adding new states.

## Scope
- Backend-first: implement authoritative state/policy in the API.
- Replace scattered status checks with calls to the policy module.
- (Optional follow-up) expose “capabilities” in API responses so the frontend does not need to re-encode status logic.

## Definitions (canonical)
### Order statuses (Prisma `OrderStatus`)
- `PENDING_PAYMENT`: Preview order exists, unpaid.
- `DESIGN_PENDING`: At least one design generated for the order (still unpaid or paid depending on flow).
- `PAID`: Stripe has confirmed payment.
- `DESIGN_APPROVED`: One design is selected for printing (may be auto-approved after payment).
- `SUBMITTED`: Printful order has been created/confirmed.
- `SHIPPED`, `DELIVERED`: Fulfillment progress.
- `CANCELLED`, `REFUNDED`: terminal business states.

### Design statuses (Prisma `DesignStatus`)
- `GENERATING`, `COMPLETED`, `FAILED` represent generation lifecycle.
- **Note:** Approval is currently tracked via `Design.approvalStatus` boolean (not `Design.status`). The enum includes `APPROVED`, but it is not consistently used today.

## Non-goals (for this ticket)
- Do not change DB schema.
- Do not rename existing statuses.
- Do not change guest-preview semantics (token claim) beyond refactoring gates.

## Breadcrumbs (current gating logic)
- **Generate design (auth)**: `backend/src/controllers/design.controller.ts` (`createDesign`)
- **Generate design (guest)**: `backend/src/controllers/design.controller.ts` (`createDesignGuest`)
- **Approve design**: `backend/src/controllers/design.controller.ts` (`approveDesign`)
- **Preview order create/reuse**: `backend/src/controllers/order.controller.ts` (`createPreviewOrder`)
- **Update preview variant (size/color)**: `backend/src/controllers/order.controller.ts` (`updatePreviewItemVariant`)
- **Claim guest preview**: `backend/src/controllers/order.controller.ts` (`claimPreviewOrder`)
- **Stripe webhook paid transition + auto-approve**: `backend/src/services/stripe.service.ts` (`handleSuccessfulPayment`, `autoApproveLatestDesign`)
- **Printful submit gate**: `backend/src/services/printful.service.ts` (`createPrintfulOrder`)
- **Frontend UX gates** (not authoritative, but user-visible):
  - `frontend/src/pages/DesignPage.tsx`
  - `frontend/src/components/sections/Quickstart/Quickstart.tsx`

## Proposed design
### 1) Policy module (backend)
Create a backend module that answers questions like:
- `canGenerateDesign(orderStatus)`
- `canChangeVariant(orderStatus)`
- `canApproveDesign(orderStatus)`
- `canSubmitFulfillment(orderStatus)`
- `canClaimGuestPreview(orderStatus, hasGuestToken)`

**Expected file changes**
- **[new]** `backend/src/domain/order-policy.ts` (or `backend/src/services/order-policy.service.ts`)
- **[new]** `backend/src/domain/order-state.ts` (transition table + helpers)
- **[new]** `backend/scripts/generate-order-state-diagram.ts`
- **[edit]** `backend/src/controllers/design.controller.ts`
- **[edit]** `backend/src/controllers/order.controller.ts`
- **[edit]** `backend/src/services/stripe.service.ts`
- **[edit]** `backend/src/services/printful.service.ts`

Suggested location (pick one and keep it consistent):
- `backend/src/domain/order-policy.ts`
- or `backend/src/services/order-policy.service.ts`

### 2) Normalize action gating
Replace controller-level arrays with calls to the policy module.

Example intent (pseudo):
```ts
// createDesign
if (!canGenerateDesign(order.status)) {
  throw new AppError('Order must be active or pending payment before generating designs', 400);
}
```

### 3) State transitions table (explicit)
Define allowed transitions in one place. Example:
- `PENDING_PAYMENT` -> `PAID`
- `PENDING_PAYMENT` -> `DESIGN_PENDING` (on first generation)
- `DESIGN_PENDING` -> `DESIGN_APPROVED` (only after payment)
- `DESIGN_APPROVED` -> `SUBMITTED` (Printful)
- `SUBMITTED` -> `SHIPPED` -> `DELIVERED`

Also include “terminal” transitions (e.g., refunds/cancellations) if currently used.

This enables:
- Stronger guardrails when new statuses are introduced.
- A generated diagram (below).

### 4) Generated diagram / doc artifact
Add a generator script that outputs a Mermaid state diagram from the same transition table.
- Script: `backend/scripts/generate-order-state-diagram.ts`
- Output: `docs/order-state.generated.md` (or `.mmd`)

The output should be treated as generated (not edited by hand).

### 5) (Optional) API capabilities for frontend
Instead of the frontend duplicating logic, backend order endpoints can include:
- `capabilities: { canGenerateDesign, canCheckout, canApproveDesign, canChangeVariant, ... }`

Then the frontend uses `capabilities.*` for UI gating.

## Deliverables
- New backend policy/state module.
- Controllers/services updated to use it.
- Generator script producing a state diagram artifact.

## Starter snippet (policy module sketch)
```ts
// backend/src/domain/order-policy.ts (sketch)
import { OrderStatus } from '@prisma/client';

export type OrderCapability = {
  canGenerateDesign: boolean;
  canChangeVariant: boolean;
  canCheckout: boolean;
  canApproveDesign: boolean;
  canSubmitFulfillment: boolean;
};

export function getOrderCapabilities(status: OrderStatus): OrderCapability {
  return {
    canGenerateDesign: status === 'PENDING_PAYMENT' || status === 'DESIGN_PENDING' || status === 'PAID',
    canChangeVariant: status === 'PENDING_PAYMENT' || status === 'DESIGN_PENDING',
    canCheckout: status === 'PENDING_PAYMENT' || status === 'DESIGN_PENDING',
    canApproveDesign: status === 'PAID' || status === 'DESIGN_APPROVED',
    canSubmitFulfillment: status === 'PAID' || status === 'DESIGN_APPROVED',
  };
}
```

## Starter snippet (transition table sketch)
```ts
// backend/src/domain/order-state.ts (sketch)
import { OrderStatus } from '@prisma/client';

export const ORDER_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  PENDING_PAYMENT: ['PAID', 'DESIGN_PENDING', 'CANCELLED'],
  DESIGN_PENDING: ['PAID', 'DESIGN_APPROVED', 'CANCELLED'],
  PAID: ['DESIGN_APPROVED', 'REFUNDED'],
  DESIGN_APPROVED: ['SUBMITTED', 'REFUNDED'],
  SUBMITTED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};
```

## Testing checklist
- **Unit tests** (backend)
  - Each status has expected capabilities.
  - Each “gate” currently in controllers is preserved.
- **Regression flows**
  - Guest preview: create → generate → claim.
  - Signed-in preview: create/reuse → generate.
  - Checkout reuse with `orderId`.
  - Paid transition via webhook.
  - Printful submit sets `SUBMITTED`.

## Acceptance criteria
- There is exactly **one** backend source of truth for:
  - “Is this action allowed for this order status?”
  - “What status transitions are valid?”
- All existing flows still work:
  - Guest quickstart + claim
  - Preview order reuse
  - Generate on preview orders
  - Checkout reuse
  - Approve only after payment
  - Printful submission gating
- The generated state diagram matches runtime behavior.

## Risks / mitigations
- **Risk:** The frontend currently depends on local gating logic for UX messaging.
  - **Mitigation:** Add backend “capabilities” progressively; keep frontend gates but align messaging.
- **Risk:** Docs drift continues.
  - **Mitigation:** After this lands, update `CLAUDE.md` + `docs/README_PREVIEW_FLOW.md` to reference the generated state diagram instead of re-stating the rules.
