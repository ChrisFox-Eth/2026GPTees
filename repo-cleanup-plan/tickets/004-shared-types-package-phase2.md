# Ticket 004 — Shared Types Package (Phase 2, Option B)

**Goal:** After the main sweep stabilizes, introduce a lightweight `packages/shared/` TypeScript package for FE/BE‑shared domain + API contract types.

**Owner:** TBD | **Priority:** P2 | **Status:** DEFERRED

## Why
- Prevent FE/BE drift on core domain types (Order, Product, Design, enums).
- Improve refactor safety and autocomplete.

## Scope (phase 2)
- Add a minimal shared workspace package exporting:
  - Enums and narrow unions (e.g., `OrderStatus`, `DesignTier`, `DesignStatus`).
  - Core DTO shapes that are genuinely shared.
- Update FE and BE to import from shared where overlap is clear.

## Out of scope for initial shared package
- Runtime code (no services/helpers in shared).
- Generated OpenAPI/zod‑based contracts (possible phase 3).
- Social/media types (feature removed).

## Proposed approach
1. **Monorepo wiring**
   - Enable npm workspaces in root `package.json`.
   - Add TS project references or path aliases so FE/BE can consume shared without fragile relative imports.
2. **Create package**
   - `packages/shared/package.json`
   - `packages/shared/src/index.ts` exporting types.
   - `packages/shared/tsconfig.json` (emit types only).
3. **Seed with small overlap**
   - Move or copy safe shared types from:
     - `frontend/src/types/*`
     - `backend/src/types/*`
   - Prefer “API DTO” versions over Prisma model types.
4. **Adopt gradually**
   - Replace imports in FE/BE one domain at a time.
5. **Guardrails**
   - Document in `packages/shared/README.md`.
   - Add lint rule to discourage re‑defining shared enums locally.

## Acceptance criteria
- FE/BE can import shared types via package name (no relative cross‑imports).
- Only truly shared types live there; package remains small.
- CI/build still works locally and in deploy environments.

## Dependencies
- Must follow tickets 2–3 (social removal) and 5–6 (type consolidation) so shared surface is clean.

## Risks / mitigations
- **Risk:** Over‑coupling FE and BE too early.  
  **Mitigation:** Keep shared minimal; avoid runtime logic.
- **Risk:** Build tooling friction.  
  **Mitigation:** Use type‑only package with no runtime emit initially.

