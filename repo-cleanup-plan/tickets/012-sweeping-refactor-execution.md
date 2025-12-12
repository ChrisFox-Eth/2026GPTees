# Ticket 012 — Sweeping Refactor Execution Checklist

**Goal:** Coordinate the full sweeping cleanup/refactor across tickets 1–11 with a safe rollout order, verification steps, and rollback strategy.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Completion Log
All tickets (001-003, 005-011) completed. Ticket 004 deferred as planned.

**Verification results:**
- ✓ Frontend type-check passes
- ✓ Backend type-check passes
- ✓ Frontend build passes

**Definition of done checklist:**
- ✓ Social/media code removed (Tickets 002-003)
- ✓ Root clutter archived (Ticket 001)
- ✓ No inline TSX types; ESLint enforces (Tickets 005-006)
- ✓ UI primitives use variants + `cn()` (Ticket 007)
- ✓ Tailwind classes auto-sorted (Ticket 008)
- ✓ Only global CSS remains (Ticket 009)
- ✓ Components organized into `ui/` + features (Ticket 010)
- ✓ Backend placeholders removed (Ticket 011)
- ✓ All type-checks and build pass

## Why
- Multiple large diffs (types, styling, paths) need sequencing to avoid thrash.
- This ticket acts as the master playbook.

## Scope
- Define sprint order and “definition of done.”
- Track cross‑ticket dependencies.
- Provide a verification checklist after each phase.

## Proposed execution order
1. **Archive root artifacts** (Ticket 001)
2. **Remove social feature** (Ticket 002)
3. **Remove AI media services** (Ticket 003)
4. **Frontend types sweep** (Ticket 005)
5. **ESLint hard ban** (Ticket 006)
6. **Structured Tailwind variants** (Ticket 007)
7. **Prettier Tailwind sorting sweep** (Ticket 008)
8. **Global CSS cleanup** (Ticket 009)
9. **Component hierarchy reorg** (Ticket 010)
10. **Backend dead code + naming** (Ticket 011)
11. **Stabilization window**
12. **Shared types package (later)** (Ticket 004)

## Verification checklist (run after each phase)
- `npm run type-check`
- `npm run lint`
- `npm run build`
- Smoke:
  - Browse home/shop/cart/checkout/design/order detail.
  - Verify auth, Stripe checkout redirect, design generation, order status updates.

## Rollback strategy
- Each phase should be a separate PR/commit so it can be reverted independently.
- If a phase causes breakage:
  - revert the phase commit,
  - open a follow‑up ticket to handle edge cases.

## Definition of done
- Social/media code removed.
- Root clutter archived.
- No inline TSX types; ESLint enforces.
- UI primitives use variants + `cn()`.
- Tailwind classes auto‑sorted.
- Only global CSS remains.
- Components organized into `ui/` + features.
- Backend placeholders removed.
- All scripts/tests/builds pass.

## Risks / mitigations
- **Risk:** Large diffs cause merge friction.  
  **Mitigation:** do sequential PRs, keep each phase focused.
- **Risk:** Unintended UI regressions during styling sweep.  
  **Mitigation:** finish variants before sorting; visual smoke after each phase.

