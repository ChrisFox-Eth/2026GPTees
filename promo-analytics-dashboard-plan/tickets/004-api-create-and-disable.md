# Ticket 004 – Admin code creation and disable controls

**Goal:** Provide admin endpoints to create codes safely and disable them without deletes.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Why
- Admins need controlled creation with audit data and the ability to stop misuse quickly.

## Scope
- Rework/extend existing `POST /api/admin/promo-codes` to require admin guard, set `createdByUserId`, and optionally `disabled` flag default false.
- Add `PATCH /api/admin/promo-codes/:id/disable` to soft-disable a code (set `disabled=true`) and `PATCH /api/admin/promo-codes/:id/enable`.
- Validation: ensure type-specific fields are coherent; reject changes when usageLimit exceeded vs. lowering limit.
- Consider optional `note` or `campaign` metadata (text) if useful for analytics, stored on `PromoCode`.

## Deliverables
- Updated routes/controllers/services; schema updated for `disabled` (and `note`/`campaign` if added).
- Tests for creation, disable/enable, and type validation.

## Acceptance Criteria
- Only admins can create/disable/enable codes.
- Disabled codes are rejected by checkout validation endpoints.***

## Notes
- Admin create endpoint now gated by admin middleware and accepts optional `disabled`; added `disabled` flag to schema/migration.
- Added enable/disable PATCH endpoints and checkout/promo validation now reject disabled codes.***
