# 2026GPTees Product Development Plan

**Purpose:** Execution-ready backlog to drive revenue quickly (shipping margin, catalog visibility, upsell, retention, analytics). Tickets live under `product-dev-plan/tickets/` and are ordered by impact/urgency. No code changes are implemented here—only scoped work items.

## How to use
- Start with lower ticket numbers (highest priority).
- Each ticket lists code touchpoints and acceptance criteria.
- Keep existing sandbox safety (Stripe test mode, TEST tier) when validating.

## Ticket index (ordered)
1. `001-shipping-pricing-parity.md` — add paid shipping + unified pricing
2. `002-price-source-of-truth-and-tier-limits.md` — remove FE hardcodes; cap design count
3. `003-product-catalog-unlock.md` — show all SKUs, real images, viable base prices
4. `004-printful-variant-mapping-safety.md` — stop fulfillment failures
5. `005-checkout-landing-ux-boost.md` — trust/CTA upgrades for conversion
6. `006-upsell-cross-sell.md` — modal defaults, bundles, success-page add-ons
7. `007-abandoned-checkout-and-drip.md` — recover PENDING_PAYMENT orders
8. `008-analytics-revenue-events.md` — tie events to revenue and funnel
9. `009-design-flow-optimization.md` — presets, polling, limits UX
