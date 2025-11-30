# Ticket 004 – Gift code email template and dispatch

**Goal:** Email purchased gift codes to buyer with redemption instructions using Resend.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Why
- Buyer needs immediate access to the code; email is the reliable channel.
- Keeps parity with existing transactional email patterns.

## Scope
- Add `sendGiftCodeEmail` (or similar) to `email.service.ts`.
- Template: code string, tier, usage limit, how to redeem, support contact, CTA to shop.
- Trigger from `handleGiftCodePurchase` (Ticket 002/003) after PromoCode creation; best-effort, non-blocking.
- Ensure uses `RESEND_FROM_EMAIL` and logs failures without breaking flow.

## Deliverables
- New email function with HTML template consistent with brand styling.
- Hook in gift code creation path to send to purchaser email (lookup via user).

## Acceptance Criteria
- Gift purchase sends email with correct code details.
- Email send failures are logged but do not fail webhook.
- Template renders on mobile/desktop, uses inline CSS like other templates.***

## Audit Notes
- `sendGiftCodeEmail` added in `backend/src/services/email.service.ts` with inline HTML template; uses RESEND_FROM_EMAIL and non-blocking send.
- Triggered from `handleGiftCodePurchase` after PromoCode creation; failures logged but do not block webhook.***
