# Ticket 007 – Order surfaces show applied codes

**Goal:** Expose applied promo/gift code info on success page, account orders list, and order detail views.

**Owner:** TBD | **Priority:** P2 | **Status:** IN_PROGRESS

## Why
- Transparency for customers; support inquiries about discounts or gifts.
- Aids support/debugging (code, discount type, amount).

## Scope
- API: include `promoCode` relation (code, type, percentOff, productTier) in order responses where appropriate.
- Success page: display applied code badge/line item (e.g., “Gift code applied: FREE PREMIUM TEE” or “Promo SAVE10: -10%”).
- Account/order detail pages: show code and discount effect in summary.
- Optional: show usage type (gift vs percent) and any remaining obligation (e.g., shipping paid).

## Deliverables
- API response adjustments (serializer layer or direct Prisma include).
- UI updates on success + account/order detail pages.

## Acceptance Criteria
- If an order used a code, UI shows it clearly; if not, no regression.
- Data includes enough to distinguish gift vs percent and display value/impact.
- No PII leaks; only code metadata relevant to user shown.***

## Audit Notes
- Backend order fetches include `promoCode` relation; success page and order detail page render applied code/type/percent/tier.
- Account orders list does not surface promo/gift code info, so customers cannot see applied code from history summary yet.***
