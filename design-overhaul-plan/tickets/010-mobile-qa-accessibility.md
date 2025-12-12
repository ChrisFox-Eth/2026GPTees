# Ticket 010 — Mobile QA + Accessibility Pass

**Goal:** Validate the overhaul for mobile delight and accessibility, including reduced‑motion support.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Scope
- Manual QA across key flows on mobile sizes:
  - Home → Quickstart → DesignPage → Checkout → Success
  - Shop → ProductModal → Cart → Checkout
  - Account → Order detail → Share
  - Gift flow
- A11y and motion checks.

## Implementation steps
1. **Device matrix**
   - iPhone SE/13/15 Pro Max widths, common Android widths.
2. **Layout**
   - Ensure generous spacing, no cramped stacks, consistent section rhythm.
3. **Touch targets**
   - 44px minimum interactive targets.
4. **Typography**
   - Heads not wrapping awkwardly; body readable without zoom.
5. **Contrast**
   - Verify ink/muted/accent meet WCAG AA on paper and dark surfaces.
6. **Reduced motion**
   - Toggle reduced‑motion and confirm transforms are minimized.
7. **Perf smoke**
   - Check that motion/imagery doesn’t tank scroll performance.

## Deliverables
- QA notes and fixes.

## Acceptance criteria
- Mobile experience feels premium and editorial.
- No accessibility regressions.

