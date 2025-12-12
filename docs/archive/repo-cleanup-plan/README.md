# 2026GPTees Repo Cleanup / Refactor Plan

**Purpose:** A sweeping consolidation/refactor to reduce bloat, enforce type/style standards, and reorganize the frontend/backend for long‑term maintainability.  
Tickets live in `repo-cleanup-plan/tickets/` and are ordered to minimize risk and maximize early wins.  
No code is implemented here—each ticket is a scoped work item with acceptance criteria and rollout notes.

## High‑level goals
- **Reduce cognitive load:** Remove dead/temporary features and archive non‑code artifacts.
- **Single sources of truth:** Centralize domain types; component props live adjacent in `*.types.ts`.
- **Styling consistency:** Structured Tailwind variants for UI primitives + automatic class sorting.
- **Cleaner architecture:** Clear UI layer hierarchy and predictable folder layout.
- **Guardrails:** ESLint + Prettier rules to prevent regression.

## Ticket index (ordered)
1. **[DONE]** `001-archive-root-artifacts.md` — Move plans/tickets/temp docs into `docs/archive/`.
2. **[DONE]** `002-remove-social-feature.md` — Remove the temporary social feature end‑to‑end.
3. **[DONE]** `003-remove-ai-media-services.md` — Delete Sora/Veo/Suno/FFmpeg media services tied to social.
4. **[DEFERRED]** `004-shared-types-package-phase2.md` — Phase‑2 shared types package (option B, later).
5. **[DONE]** `005-frontend-type-layout-reorg.md` — Migrate inline TSX types into `*.types.ts` / `src/types`.
6. **[DONE]** `006-eslint-ban-inline-types.md` — Hard‑ban inline types in `.tsx`.
7. **[DONE]** `007-tailwind-structured-variants.md` — Adopt CVA/tailwind‑variants patterns for UI.
8. **[DONE]** `008-prettier-tailwind-sorting-sweep.md` — Add Tailwind class sorting + one‑time sweep.
9. **[DONE]** `009-css-global-only-policy.md` — Enforce "global CSS only" and tidy `index.css`.
10. **[DONE]** `010-component-hierarchy-ui-layer.md` — Reorganize components into `ui/` + feature buckets.
11. **[DONE]** `011-backend-dead-code-and-naming.md` — Remove placeholders, unify middleware naming.
12. **[DONE]** `012-sweeping-refactor-execution.md` — Coordinated rollout checklist across all tickets.

## Dependencies / sequencing
- Tickets **2–3** should land before any large frontend refactors to avoid wasted work.
- Tickets **5–6** precede structured Tailwind work so lint doesn’t fight refactors.
- Tickets **7–9** are tightly coupled and should be tackled as a mini‑sprint.
- Ticket **10** should happen after primitives adopt variants (ticket 7).
- Ticket **4** is explicitly deferred until the repo is stable post‑sweep.

