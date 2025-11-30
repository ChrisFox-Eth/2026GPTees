# Ticket 003 – Gift code purchase backend (Stripe session + handler)

**Goal:** Allow authenticated users to buy gift codes (free Basic/Premium tee) via dedicated Stripe Checkout session; generate PromoCode on payment.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Enable revenue-generating gift purchases without shipping.
- Cleanly separate from physical order checkout logic.

## Scope
- New route/controller (e.g., `POST /api/gift-codes/purchase`) requiring auth.
- Request: tier (`BASIC`/`PREMIUM`), optional `usageLimit` (default 1).
- Service: `createGiftCodeSession` that prices gift code using tier pricing + representative base price; no shipping collection.
- Stripe session metadata: `giftCodeType`, `giftCodeUses`, `userId`.
- Success/cancel URLs (likely `/gift/success` and landing fallback).
- Handler (invoked via webhook from Ticket 002) to generate unique code, insert `PromoCode`, and return success.

## Deliverables
- Controller/service code to create Stripe gift sessions.
- Unique code generation util (collision-safe); stored with `usageLimit` and `productTier`.
- Response returns `session.url` for redirect.

## Acceptance Criteria
- Authenticated call returns a valid Stripe Checkout URL.
- Gift session charges correct tier price; collects no shipping.
- Payment completion creates `PromoCode` row with correct metadata.***

## Audit Notes
- Endpoint `POST /api/gift-codes/purchase` (router guarded by `requireAuth`) creates sessions via `createGiftCodeSession`, pricing from tier map + product base price, no shipping.
- Gift metadata (`giftCodeType`, `giftCodeUses`, `userId`) set; webhook handler creates deterministic FREE_PRODUCT promo code with usage limit and createdByUserId.***
