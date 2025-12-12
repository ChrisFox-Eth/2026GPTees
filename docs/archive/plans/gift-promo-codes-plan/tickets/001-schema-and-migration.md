# Ticket 001 – PromoCode schema and Order linkage

**Goal:** Introduce unified `PromoCode` model (gift + percent) and wire orders to track a single applied code.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Need durable source of truth for codes, limits, and linkage to orders.
- Enables validation and usage tracking before charging via Stripe.

## Scope
- Prisma: add `PromoCode` model with `code`, `type`, `productTier?`, `percentOff?`, `usageLimit?`, `usageCount`, `createdByUserId?`, timestamps; map to `promo_codes`.
- Enums: add `PromoCodeType` (`FREE_PRODUCT`, `PERCENT_OFF`) reusing `DesignTier` for tier.
- Order: add `promoCodeId` FK + relation to `PromoCode`; ensure one-code-per-order constraint.
- Migration: generate and apply.

## Deliverables
- Updated `backend/prisma/schema.prisma` with model, enum, relation.
- Migration SQL generated/applied; Prisma client regen.
- Notes on seed data strategy (optional initial codes).

## Acceptance Criteria
- `prisma migrate dev` succeeds locally; `prisma db push` parity noted if used.
- New table `promo_codes` and nullable `promoCodeId` column on `orders`.
- Type-safe client exposes `promoCode` relation on `Order`.

## Implementation Notes
- Follow existing mapping style (`@@map("promo_codes")`, singular model).
- Consider index on `code` (unique) for lookup speed.
- Keep optional `usageLimit` to represent unlimited (NULL).
- Add to seed file only if helpful for QA (e.g., TESTFREE, SAVE10).***

## Audit Notes
- Implemented in `backend/prisma/schema.prisma` with `PromoCode` model, `PromoCodeType` enum, and `promoCodeId` relation on `Order`; migration `backend/prisma/migrations/202512010000_add_promo_codes/migration.sql` creates table/index/FKs.
- No seed data included; sample codes listed in USER_GUIDE.md can be seeded via admin endpoint.***
