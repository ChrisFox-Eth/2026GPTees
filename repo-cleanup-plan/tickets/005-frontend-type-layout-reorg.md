# Ticket 005 — Frontend Type Layout Reorg (No Inline TSX Types)

**Goal:** Remove inline `interface`/`type` declarations from `.tsx` files and enforce a consistent type layout:  
domain models in `frontend/src/types/`, component props/state in adjacent `<Component>.types.ts`.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Inline types are currently duplicated across pages (`OrderDetailPage`, `AccountPage`, `AdminPromoPage`, etc.).
- Centralizing types improves reuse and refactorability.

## Scope
- Sweep `frontend/src/**/*.tsx` for inline types.
- For each inline type:
  - If it represents a domain/API shape → move to `frontend/src/types/<domain>.ts`.
  - If it is component‑local props/state → move to adjacent `*.types.ts`.
- Update imports and ensure no circular dependencies.

## Out of scope
- Backend types (handled elsewhere).
- Shared package (ticket 004, later).

## Implementation steps
1. **Inventory**
   - Use grep to list inline types in `.tsx`:
     - `interface Foo {}` / `type Foo = ...`
   - Create a checklist of files and inline types.
2. **Classify types**
   - Domain types examples: `Order`, `OrderItem`, `ShippingAddress`, `Design`, `Product`, etc.
   - Component props examples: `QuickstartProps`, `PricingCardProps`, etc.
3. **Move domain types**
   - Add/extend files in `frontend/src/types/`:
     - Ensure naming matches backend DTOs.
     - Prefer exported types/interfaces.
   - Create/extend `frontend/src/types/index.ts` barrel for cleaner imports.
4. **Move component props**
   - For each component with inline props:
     - Create `<Component>.types.ts` adjacent.
     - Export props/interfaces there.
     - Update component imports.
5. **Deduplicate**
   - If multiple files define identical shapes, consolidate to one domain type.
6. **Refactor imports**
   - Update all `.tsx` to import from `src/types` or local `*.types.ts`.
   - Prefer type‑only imports: `import type { … } from …`.
7. **Sanity check**
   - Run FE type‑check and build.

## Deliverables
- All `.tsx` free of inline type/interface declarations.
- Domain types centralized.
- Component props co‑located.

## Acceptance criteria
- Grep for `interface`/`type` in `.tsx` returns none (except `as const` or allowed patterns per ticket 006).
- No duplicate domain types remain.
- FE builds without TS errors.

## Risks / mitigations
- **Risk:** Moving types breaks import paths in many files (big diff).  
  **Mitigation:** Do in batches by feature/page; keep barrel exports stable.
- **Risk:** Domain types become too broad.
  **Mitigation:** Separate API DTO vs UI view models if needed.

---

## Completion Log

**Completed:** 2025-12-11

### Summary
Removed all inline type declarations from .tsx files and centralized types according to the classification rules.

### Domain Types Enhanced/Created (in `frontend/src/types/`)
- **order.ts** - Enhanced with:
  - `OrderStatus`, `DesignTier` type aliases
  - `OrderItemProduct`, `OrderItem`, `ShippingAddress`, `AppliedPromoCode`, `DesignPreview`, `Order`
  - `OrderSummaryItem`, `OrderSummary`
- **promo.ts** - Enhanced with:
  - `PromoType`, `PromoTier` type aliases
  - `AppliedCodeInfo`, `PromoCode`, `PromoOrderSummary`, `PromoDetail`
  - `MetricsSeriesPoint`, `MetricsResponse`, `CreatePromoFormState`, `GiftTierOption`
- **admin.ts** - NEW file:
  - `SyncResultItem`, `SyncResult`, `VariantResult`

### Pages Updated (inline types removed)
- `AccountPage.tsx` - Uses `Order`, `DesignPreview` from `types/order`
- `OrderDetailPage.tsx` - Uses `Order`, `DesignPreview` from `types/order`
- `CheckoutSuccessPage.tsx` - Uses `OrderSummary` from `types/order`
- `AdminPromoPage.tsx` - Uses `PromoType`, `PromoTier`, `PromoCode`, `PromoDetail`, `MetricsResponse`, `CreatePromoFormState` from `types/promo`
- `AdminPage.tsx` - Uses `SyncResult`, `VariantResult` from `types/admin`
- `GiftPage.tsx` - Uses `GiftTierOption` from `types/promo`

### Component Props Files Created (adjacent `.types.ts`)
- `ErrorBoundary/ErrorBoundary.types.ts` - `ErrorBoundaryProps`, `ErrorBoundaryState`
- `ProtectedRoute.types.ts` - `ProtectedRouteProps`
- `PricingSection/PricingSection.types.ts` - `TierCard`
- `LoadingSpinner/LoadingSpinner.types.ts` - `LoadingSpinnerProps`
- `ProductCard/ProductCard.types.ts` - `ProductCardProps`
- `StickyCtaBar/StickyCtaBar.types.ts` - `StickyCtaBarProps`
- `ProductModal/ProductModal.types.ts` - `ProductModalProps`
- `Toast/Toast.types.ts` - `ToastProps`, `ToastAction`

### Components Updated (now import from adjacent .types.ts)
- `ErrorBoundary.tsx`
- `ProtectedRoute.tsx`
- `PricingSection.tsx`
- `LoadingSpinner.tsx`
- `ProductCard.tsx`
- `StickyCtaBar.tsx`
- `ProductModal.tsx`
- `Toast.tsx`

### Type Fixes Applied
- Fixed `Tier` → `PromoTier` reference in AdminPromoPage
- Fixed `Design` → `DesignPreview` reference in OrderDetailPage
- Fixed optional `designs` field to required array in Order interface
- Fixed `address2` null handling in CheckoutPage
- Fixed optional `item.product` access in OrderDetailPage

### Verification
- Frontend type-check passes: `npm run type-check` ✓
- Backend type-check passes: `npm run type-check` ✓

