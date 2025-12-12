# Ticket 008 — Prettier Tailwind Class Sorting + Sweep

**Goal:** Add `prettier-plugin-tailwindcss` and run a one‑time formatting sweep to canonicalize class ordering across frontend.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Completion Log
- Installed `prettier-plugin-tailwindcss` as devDep
- Updated `.prettierrc.json` with plugin entry
- Ran one-time sweep: `npx prettier --write "src/**/*.{ts,tsx,css}" "index.html"`
- Type-check passes (`npm run type-check`)

## Why
- Consistent ordering makes class lists readable and reduces diff noise.
- Complements structured variants (ticket 007).

## Scope
- Add plugin to frontend devDeps.
- Configure Prettier to use it.
- Run formatting sweep over frontend TS/TSX/CSS.

## Implementation steps
1. Add dependency:
   - `prettier-plugin-tailwindcss`
2. Update `frontend/.prettierrc.json`:
   - Add plugin entry.
   - Keep existing formatting rules.
3. Confirm editor integration:
   - Ensure VSCode/IDE uses project Prettier.
4. Run one‑time sweep:
   - `npx prettier --write "frontend/src/**/*.{ts,tsx,css}" "frontend/index.html"`
5. Sanity check:
   - FE build and a quick visual smoke.

## Deliverables
- Tailwind class strings reordered consistently.
- Prettier on save keeps ordering stable.

## Acceptance criteria
- Large diff is reorder‑only; runtime styling unchanged.
- Future formatting reorders classes automatically.

## Risks / mitigations
- **Risk:** Conflicting duplicate classes in a single literal could change precedence semantics.  
  **Mitigation:** Before sweep, remove intentional duplicates; rely on variants/`cn()` for overrides.

