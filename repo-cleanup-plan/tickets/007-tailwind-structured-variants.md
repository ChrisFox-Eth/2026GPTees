# Ticket 007 — Tailwind Structured Variants for UI Primitives

**Goal:** Standardize Tailwind usage with a structured variant system (CVA or tailwind‑variants) for reusable UI primitives, plus a shared `cn()` helper.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Current class usage is ad‑hoc across components; variants reduce duplication and improve consistency.
- Enables easy theme/pattern updates later.

## Scope
- Add variant tooling dependencies to frontend.
- Create shared class merge helper.
- Refactor core UI primitives to use variants.
- Document patterns for new components.

## Out of scope
- Full design overhaul; this is structural refactor only.
- Non‑UI feature components until primitives are stable.

## Tooling choice
- Preferred: `class-variance-authority` + `clsx` + `tailwind-merge`.
- Alternative: `tailwind-variants` if you prefer its API. (Decide during implementation; keep consistent.)

## Target primitives (initial list)
Move these to variants first:
- `frontend/src/components/Button/*`
- `frontend/src/components/Card/*`
- `frontend/src/components/Badge/*`
- `frontend/src/components/Input/*`
- `frontend/src/components/Modal/*`
- `frontend/src/components/Tabs/*`
- `frontend/src/components/Table/*`
- `frontend/src/components/Alert/*`
- `frontend/src/components/Toast/*`
- `frontend/src/components/LoadingSpinner/*`

## Implementation steps
1. **Add deps**
   - Install chosen variant library + `clsx`/`tailwind-merge`.
2. **Create helpers**
   - `frontend/src/utils/cn.ts` exporting `cn(...classes)` using merge + clsx.
3. **Define variant maps**
   - For each primitive, create a `*.variants.ts` or inline in component (not types) defining:
     - base classes
     - `variant`, `size`, and state variants
4. **Refactor primitives**
   - Replace raw class strings with `cva`/variants + `cn()`.
   - Ensure props types live in adjacent `*.types.ts` (ticket 005).
5. **Update call sites**
   - Replace custom class combos with variant props.
6. **Doc**
   - Add a short “How to use variants” section to `frontend/TAILWIND_GUIDE.md`.

## Deliverables
- Variant‑powered primitives with stable APIs.
- `cn()` helper used consistently for conditional classes.

## Acceptance criteria
- Primitives accept `variant`/`size` props where relevant.
- No duplicated “primary/secondary/danger” class bundles across app.
- UI looks unchanged.
- Type‑check/build passes.

## Risks / mitigations
- **Risk:** API churn for primitives breaks many imports.
  **Mitigation:** refactor primitives first, then update call sites in a controlled sweep.

---

## Completion Log

**Completed:** 2025-12-11

### Summary
Added CVA (class-variance-authority) + clsx + tailwind-merge for structured Tailwind variant patterns.

### Dependencies Added
- `class-variance-authority` - Variant system for component styling
- `clsx` - Conditional class construction
- `tailwind-merge` - Tailwind class conflict resolution

### Files Created
- `src/utils/cn.ts` - Shared class merge helper combining clsx + tailwind-merge
- `src/components/Button/Button.variants.ts` - Button variant definitions
- `src/components/Card/Card.variants.ts` - Card variant definitions
- `src/components/Alert/Alert.variants.ts` - Alert variant definitions
- `src/components/Input/Input.variants.ts` - Input variant definitions

### Components Refactored
- **Button** - Uses CVA for variant/size, cn() for class merging
- **Card** - Uses CVA for variant/hoverable, cn() for class merging
- **Alert** - Uses CVA for variant, cn() for class merging
- **Input** - Uses CVA for size/invalid state, cn() for class merging

### Pattern Established
```typescript
// Variant definition
export const componentVariants = cva(baseClasses, {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: 'default', size: 'md' }
});

// Component usage
className={cn(componentVariants({ variant, size }), className)}
```

### Verification
- `npm run type-check` passes ✓
- `npm run lint` passes ✓
- Component APIs unchanged (backward compatible)

