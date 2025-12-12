# Ticket 009 — Global‑Only CSS Policy + `index.css` Cleanup

**Goal:** Enforce “CSS only in `src/index.css` for global utilities/tokens” and eliminate stray custom CSS.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Completion Log
- Audited CSS files: `index.css` contains all needed utilities, `App.css` was empty
- Deleted `App.css` (was only comments, no actual styles)
- Removed `App.css` import from `App.tsx`
- Added "CSS Policy (Global Only)" section to `TAILWIND_GUIDE.md`
- Type-check passes

## Why
- Keeps styling predictable and centralized.
- Tailwind + variants should handle nearly all styling needs.

## Scope
- Audit existing CSS files:
  - `frontend/src/index.css`
  - `frontend/src/App.css`
- Move any component‑level CSS into Tailwind/variants.
- Ensure `index.css` only contains:
  - Tailwind imports/config
  - base layer resets
  - small global utilities (e.g., `container-max`, `sr-only`, transitions)

## Out of scope
- Introducing a design‑token system beyond Tailwind theme (future work).

## Implementation steps
1. Review CSS usage:
   - Find where `App.css` classes are referenced.
2. Migrate styles:
   - Replace any custom classes with Tailwind or CVA variants.
3. Trim CSS:
   - Remove unused rules in `App.css` or delete file if empty.
   - Consolidate duplicate utilities into `index.css`.
4. Document policy:
   - Add a short “CSS policy” section to `frontend/TAILWIND_GUIDE.md`.

## Deliverables
- Minimal global CSS surface.

## Acceptance criteria
- No component imports a local CSS file.
- `App.css` contains only truly global leftover styles or is removed.
- UI unchanged.

## Risks / mitigations
- **Risk:** Some complex animation/styles are hard in Tailwind.  
  **Mitigation:** If truly needed, keep as a named global utility in `index.css` with justification.

