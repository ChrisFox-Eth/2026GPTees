# Ticket 005 – Checkout code validation and pricing adjustments (backend)

**Goal:** Apply gift/promo codes during checkout server-side: validate, adjust totals/line items, record on order, and handle $0 flows.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Prevent price tampering; enforce limits and cart eligibility before Stripe session creation.
- Support free-product redemptions and percent discounts in one path.

## Scope
- Accept optional `code` in `createCheckout` controller and pass to `createCheckoutSession`.
- In Stripe service:
  - Lookup `PromoCode` by code; reject if not found/exhausted.
  - FREE_PRODUCT: enforce single-item cart with matching tier; zero item price.
  - PERCENT_OFF: apply discount to items subtotal (or include shipping if chosen); adjust line item amounts accordingly.
  - Set `order.promoCodeId` on creation; order items reflect adjusted unitPrice.
  - Handle zero-total: skip Stripe session, mark order PAID, trigger emails/analytics, increment usage immediately.
- Update metadata if helpful (promoCodeId/code) on paid sessions.

## Deliverables
- Updated controller/service signatures and logic.
- Error messages surfaced to client for invalid/overused/mismatched codes.
- Branch for zero-total orders with direct success response.

## Acceptance Criteria
- Valid codes adjust totals correctly; invalid codes return 400 with message.
- Gift code redemption results in $0 item, shipping still charged (unless changed by business decision).
- Zero-total orders complete without Stripe and are marked PAID with emails sent.
- PromoCode usageCount increments on PAID (webhook or instant flow).***

## Audit Notes
- `createCheckoutSession` validates promo/gift codes, enforces single-item tier match for FREE_PRODUCT, applies percent discounts, sets `promoCodeId`, adjusts line items, and increments usageCount on paid/zero flows.
- Zero-total bypass path marks order PAID, creates free payment, sends confirmation + prompt guide, and returns `{url:'', orderId, freeOrder:true}`; shipping is still added, so bypass triggers only when total (items + shipping) is zero.***
