# Ticket 004 — Printful Variant Mapping Safety

**Goal:** Prevent paid orders from failing at fulfillment by ensuring every FE color/size maps to a Printful variant or is removed.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Current `COLOR_VARIANT_MAP` only covers a subset of Bella+Canvas 3001 colors/sizes. Seeded colors (e.g., Red, Royal Blue) may not exist in the map, causing submission errors post-payment.

## Scope
- Audit SKUs, colors, sizes against Printful catalog; update mapping or disable unsupported options.
- Add guardrails: block checkout/generation if a cart item lacks a variant mapping.
- Improve logging/alerting for missing variants.

## Deliverables
- Complete variant mapping for live SKUs or pruned options that cannot be fulfilled.
- Pre-check in backend to reject carts with unmapped variants before Stripe checkout.
- Clear error message to user if selection is unsupported (and guidance to pick available color/size).

## Acceptance Criteria
- Every active color/size presented in FE maps to a valid Printful variant ID.
- Stripe checkout creation fails gracefully (400) if a mapping is missing; no paid orders get stuck.
- Fulfillment logs show zero “No variant map found” errors in happy-path tests.

## Implementation Notes
- Backend: `backend/src/services/printful.service.ts`
  - Expand `COLOR_VARIANT_MAP` using Printful API/docs for current SKUs.
  - Add preflight validation before order creation (reuse same mapping function).
  - Log structured errors via `logFulfillmentEvent`.
- Seed/FE: align offered colors/sizes to mapped ones (see Ticket 003).

## Risks / Mitigations
- Risk: Printful catalog changes. Mitigate with a small config-driven map and TODO for dynamic fetch later.
- Risk: Users see fewer colors. Mitigate by prioritizing best-selling colors (Black/White/Navy) and add back once mapped.

---
### Notes (completed)
- Exposed variant lookup and added preflight guard: Stripe checkout now rejects unmapped color/size combos with a 400 error before payment (`backend/src/services/stripe.service.ts`, `backend/src/services/printful.service.ts`).
- Order items store `printfulVariantId` when available, ensuring parity for fulfillment.
- Seed colors trimmed to mapped basics to reduce unmapped cases (`backend/prisma/seed.ts`); SKUs with missing mappings (printfulId `19`, `146`) are deactivated until mapping is added.
