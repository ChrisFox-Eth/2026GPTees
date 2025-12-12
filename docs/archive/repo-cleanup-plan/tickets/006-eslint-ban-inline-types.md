# Ticket 006 — ESLint Hard Ban on Inline Types in `.tsx`

**Goal:** Add an ESLint rule that forbids declaring `interface` or `type` inside `.tsx` files (hard ban), enforcing ticket 005 permanently.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Prevents regression after the sweeping move of ticket 005.
- Makes type organization predictable for all contributors.

## Scope
- Update `frontend/.eslintrc.json` (and root scripts if needed) to:
  - Disallow `TSInterfaceDeclaration` and `TSTypeAliasDeclaration` in `.tsx`.
  - Allow them in:
    - `*.types.ts`
    - `frontend/src/types/**/*.ts`
    - `vite-env.d.ts` and other ambient `.d.ts`

## Implementation options
1. **`no-restricted-syntax` (recommended)**
   - Add AST selectors for TS declarations.
   - Use ESLint overrides by file glob to exempt allowed locations.
2. **Custom local rule**
   - If selectors are too blunt, add a small local plugin under `frontend/eslint-rules/`.

## Implementation steps
1. Add override for `.tsx`:
   - `files: ["src/**/*.tsx"]`
   - `rules: { "no-restricted-syntax": [ "error", { selector: "TSInterfaceDeclaration", message: "..."} , { selector: "TSTypeAliasDeclaration", message: "..."} ] }`
2. Add exemptions:
   - Overrides for `src/types/**/*.ts`, `**/*.types.ts`, `**/*.d.ts` with rule disabled.
3. Run `npm run lint` in frontend; fix any remaining offenders (should be none after ticket 005).
4. Document rule in a short section in `frontend/CONTRIBUTING.md` or `repo-cleanup-plan/README.md`.

## Deliverables
- ESLint blocks new inline type declarations in `.tsx`.

## Acceptance criteria
- Introducing an inline type in any `.tsx` fails `npm run lint`.
- `.types.ts` and `src/types/*` remain unaffected.

## Risks / mitigations
- **Risk:** False positives for legitimate TS syntax (rare).
  **Mitigation:** adjust selectors or add narrow allowlist comments if truly needed.

---

## Completion Log

**Completed:** 2025-12-11

### Summary
Added ESLint rule that forbids inline `interface` and `type` declarations in `.tsx` files, enforcing the type organization from ticket 005.

### Configuration Changes
Updated `frontend/.eslintrc.json` with:
- Override for `src/**/*.tsx` files that errors on `TSInterfaceDeclaration` and `TSTypeAliasDeclaration`
- Exemption overrides for `src/types/**/*.ts`, `**/*.types.ts`, and `**/*.d.ts`

### Violations Found and Fixed
- `Gallery.tsx` line 31: `type TeamMemberRow` moved to `Gallery.types.ts`
- Added index signature to `TeamMemberRow` to satisfy `TableRow` constraint

### ESLint Rule Details
```json
"no-restricted-syntax": [
  "error",
  {
    "selector": "TSInterfaceDeclaration",
    "message": "Inline interface declarations are not allowed in .tsx files..."
  },
  {
    "selector": "TSTypeAliasDeclaration",
    "message": "Inline type declarations are not allowed in .tsx files..."
  }
]
```

### Verification
- `npm run lint` passes with 0 errors ✓
- `npm run type-check` passes ✓
- New inline types in `.tsx` will fail lint ✓

