# Ticket 001 — Runtime Route Manifest (Truthful API Map)

**Goal:** Add a single command that outputs a runtime-derived manifest of every Express API route (method + full path + auth requirement + handler names) so onboarding and AI-assisted navigation are fast and accurate.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- The authoritative list of API endpoints currently lives across:
  - `backend/src/index.ts` (mount points)
  - `backend/src/routes/*.routes.ts` (route definitions)
  - docs that can drift over time (`CLAUDE.md`, `docs/README_PREVIEW_FLOW.md`)
- A runtime manifest is harder to lie about: it reflects what the server actually mounts.

## Scope
- Create a runtime manifest generator script that:
  - Traverses the Express router stack.
  - Produces a stable list of:
    - `method`
    - `path` (including mount prefixes)
    - `requiresAuth` (best-effort, based on middleware stack containing `requireAuth`)
    - `handlers` (function names)
  - Can print to stdout and optionally write a markdown/JSON artifact.

## Breadcrumbs (where the truth lives today)
- **Server entry / route mounts**: `backend/src/index.ts`
- **Route definitions**:
  - `backend/src/routes/design.routes.ts`
  - `backend/src/routes/order.routes.ts`
  - `backend/src/routes/payment.routes.ts`
  - `backend/src/routes/webhook.routes.ts`
- **Auth middleware name**: `backend/src/middleware/auth.middleware.ts` exports `requireAuth`

## Implementation steps
1. **Refactor app creation so scripts can import the configured app without starting the server**
   - Today, importing `backend/src/index.ts` will call `startServer()`.
   - Create a new module, e.g. `backend/src/app.ts`, that exports a `createApp()` (or `buildApp()`) function.
   - `backend/src/index.ts` becomes a thin wrapper:
     - `await connectDatabase()`
     - `app.listen(...)`
   - Keep mounting order identical (notably: `/api/webhooks` before JSON body parsing).

   **Expected file changes**
   - **[new]** `backend/src/app.ts` (exports `createApp()` and mounts middleware/routes)
   - **[edit]** `backend/src/index.ts` (imports `createApp()`, connects DB, starts listening)

2. **Add route manifest generator script**
   - New script: `backend/scripts/route-manifest.ts`
   - Run with `tsx` (repo already uses this pattern):
     - `npx tsx scripts/route-manifest.ts`

   **Expected file changes**
   - **[new]** `backend/scripts/route-manifest.ts`
   - **[edit]** `backend/package.json` add `api:routes` script
   - **[optional/generated]** `docs/api-routes.generated.md`

3. **Traverse the Express router stack (runtime derived)**
   - Walk `app._router.stack` recursively.
   - For each `layer.route`, collect:
     - `layer.route.path`
     - `Object.keys(layer.route.methods)`
     - `layer.route.stack` handlers
   - For each nested router (`layer.name === 'router'`), accumulate its mount path prefix.

4. **Compute `requiresAuth`**
   - Mark `requiresAuth = true` if any route handler in the route stack has:
     - `fn.name === 'requireAuth'`
   - Include a note in the output when `requiresAuth` cannot be confidently determined.

5. **Output formats**
   - Default: print a table to stdout.
   - Optional flags:
     - `--format json|md|table`
     - `--out <path>`
   - Suggested generated docs:
     - `docs/api-routes.generated.md`

6. **Add npm scripts**
   - `backend/package.json`:
     - `"api:routes": "tsx scripts/route-manifest.ts --format md --out ../docs/api-routes.generated.md"`

## Starter snippet (app refactor sketch)
```ts
// backend/src/app.ts (sketch)
import express from 'express';

export function createApp() {
  const app = express();
  // mount middleware + routes exactly as in current index.ts
  return app;
}
```

## Starter snippet (route stack traversal sketch)
```ts
// scripts/route-manifest.ts (sketch)
// - Import the configured app from backend/src/app.ts
// - Walk app._router.stack
// - Emit [{ method, path, requiresAuth, handlers }]
```

## Output (suggested)
Prefer stable, greppable output for humans and LLMs:
- `docs/api-routes.generated.md` (markdown table)
- `docs/api-routes.generated.json` (machine readable)

Suggested markdown columns:
- `method`
- `path`
- `auth`
- `handlers`

## Deliverables
- A runnable command that prints the API route manifest.
- Optional generated doc artifact under `docs/`.

## Acceptance criteria
- Running the command lists all current routes, including nested prefixes (e.g. `/api/orders/preview/guest`).
- Output includes whether a route is protected by `requireAuth` (best-effort) and includes handler names.
- The manifest generator does **not** start the server or require a DB connection to succeed.

## Risks / mitigations
- **Risk:** Express internals (`_router.stack`) are not a public API.
  - **Mitigation:** Keep traversal logic small and covered by a basic smoke test; pin Express major version.
- **Risk:** Path extraction for mounted routers can be finicky.
  - **Mitigation:** Prefer a well-known helper lib if traversal gets brittle (e.g., `express-list-endpoints`) and treat that output as the source of truth.
