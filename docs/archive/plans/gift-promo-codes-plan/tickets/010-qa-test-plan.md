# Ticket 010 – QA test plan for gift/promo codes

**Goal:** Define end-to-end test matrix for gift and promo codes across backend, Stripe, and frontend flows.

**Owner:** TBD | **Priority:** P2 | **Status:** READY

## Why
- Prevent regressions in payments and discounts; validate edge cases and limits.

## Scope (test matrix)
- Gift purchase (BASIC + PREMIUM): Stripe Checkout completes; webhook creates single code (idempotent on retry); gift email sent.
- Gift redemption: one BASIC cart item + gift code → item $0, shipping charged; order promoCodeId set; usageCount increments.
- Percent promo: SAVETEN (10% unlimited) applies to items; SAVE25ONCE (25% single-use) rejects on second use with clear 400.
- Invalid/mismatched: wrong-tier gift code with multi-item cart → 400; nonexistent code → 400; exhausted code → 400.
- Zero-total flow: FREE_PRODUCT + $0 shipping scenario → Stripe skipped, order marked PAID, confirmation + prompt-guide emails sent.
- Webhook retry: re-deliver checkout.session.completed for a gift purchase → no duplicate promo_codes row (idempotent).
- Admin endpoint: non-admin 403; admin creates codes; duplicate code rejected.

## Env/fixtures
- Stripe test mode keys + webhook signing secret configured locally.
- Sample codes (seed/admin): TESTFREE_BASIC (BASIC, usageLimit=1), TESTFREE_PREMIUM (PREMIUM, usageLimit=1), SAVETEN (10% unlimited), SAVE25ONCE (25% single-use).
- Supabase DB migrated with promo schema.

## Steps (high level)
- Run migrations against test DB.
- For each scenario, record: request payload, expected response, Stripe UI total, DB assertions (`orders.promoCodeId`, `promo_codes.usageCount`), email receipt if applicable.
- Use Stripe test cards (4242...) and webhook CLI/Stripe dashboard to replay events for idempotency checks.
- Reset state between runs: adjust `promo_codes.usageCount` or re-seed codes; delete test orders as needed.

## Acceptance Criteria
- QA can execute all cases with the above fixtures.
- Expected vs actual captured; any blocker logged before release.

## Audit Notes
- Plan aligns with implemented flows (gift purchase path, checkout code validation, zero-total bypass). Update admin endpoint scenarios once auth gating is added.***
