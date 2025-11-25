# Ticket 007 — Abandoned Checkout & Drip

**Goal:** Recover revenue from PENDING_PAYMENT orders with reminders and prompt guidance post-payment.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Orders created pre-payment can stall if Stripe webhook fails or user drops.
- Post-payment, users may not finish design generation without guidance.

## Scope
- Detect PENDING_PAYMENT orders older than 1 hour; send reminder email with return-to-checkout link.
- Add Day 0/Day 1 prompt-coaching emails after payment to drive design completion.
- Admin toggle to disable reminders in staging.

## Deliverables
- Cron/worker or scheduled job to query stale PENDING_PAYMENT orders and send reminder via Resend template.
- Email templates: “Complete your purchase” (reminder) and “How to write a winning prompt” (post-payment drip).
- Config flag/env for enabling reminders.

## Acceptance Criteria
- Stale orders receive a reminder with a working return link (includes order/session info).
- Paid orders trigger Day 0 and Day 1 emails; errors don’t block the main flow.
- No reminders sent in staging when flag is off.

## Implementation Notes
- Backend: add script or endpoint to run on a schedule; reuse prisma to find stale orders.
- Email: extend `backend/src/services/email.service.ts` with new templates; link to `/checkout` (for pending) and `/design?orderId=...` (for paid).
- Stripe fallback: point reminder CTA to manual confirm flow on `/checkout/success`.
- Config: add env `ENABLE_ABANDONED_CHECKOUT_EMAILS` or similar.

## Risks / Mitigations
- Risk: Spamming legitimate users. Mitigate with one reminder and opt-out toggle in config.
- Risk: Invalid session link. Mitigate by regenerating a fresh checkout session if needed.

---
### Notes (completed)
- Added abandoned checkout reminder email template and runnable script (`backend/scripts/send-abandoned-reminders.ts`) to email PENDING_PAYMENT orders older than 1h using `sendAbandonedCheckoutReminder`.
- Added prompt-coaching email (`sendPromptGuide`) triggered post-payment to drive design completion (`backend/src/services/email.service.ts`, invoked in `backend/src/services/stripe.service.ts`).
- Reminders can be run via `npm run remind:abandoned` with `ENABLE_ABANDONED_REMINDERS` toggle; configure external cron/runner to automate (staging can disable via env).
