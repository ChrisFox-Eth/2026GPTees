# Ticket 009 – Admin/dev code creation endpoint

**Goal:** Provide a protected endpoint to create promo/gift codes without direct DB writes; useful for marketing and QA until an admin UI exists.

**Owner:** TBD | **Priority:** P2 | **Status:** IN_PROGRESS

## Why
- Fast path to issue codes (campaigns, support make-goods, QA).
- Avoid manual DB edits; keep audit trail via createdBy.

## Scope
- Endpoint (e.g., `POST /api/admin/promo-codes`) guarded by admin flag/env/email allowlist.
- Payload: `code`, `type`, `productTier?`, `percentOff?`, `usageLimit?`, `createdByUserId?`.
- Validation: unique code, compatible fields per type.
- Response: created promo code data.
- Logging for audit; optionally reuse code generation helper if `code` omitted.

## Deliverables
- Route/controller/service implementing create with auth guard.
- Optional helper to generate random code when not provided.

## Acceptance Criteria
- Non-admin calls are rejected (403).
- Admin can create both FREE_PRODUCT and PERCENT_OFF codes with limits.
- Duplicate codes rejected gracefully.***

## Audit Notes
- `POST /api/admin/promo-codes` creates codes with validation and optional generated code; guarded only by `ALLOW_ADMIN_SYNC` flag or NODE_ENV=development and **not** by authentication/allowlist, so currently callable without proving admin status.
- Handler does not source `createdByUserId` from the authenticated user (no auth middleware applied). Needs auth gate to meet acceptance.***
