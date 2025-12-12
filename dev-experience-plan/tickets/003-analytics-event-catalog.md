# Ticket 003 — Analytics Event Catalog (Typed + Generated)

**Goal:** Make analytics events discoverable, consistent, and hard to drift by introducing a typed event catalog and a generator that produces a canonical markdown reference from code.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Events are currently defined ad-hoc as string literals across the repo.
- There is an existing human-maintained catalog (`docs/analytics-events.md`), but it can drift unless we add enforcement.
- For conversion work, we need high confidence that:
  - Event names are stable
  - Payload keys are consistent
  - We can audit all events used in the funnel quickly

## Current state (truth sources)
- **Frontend tracking helper**: `frontend/src/utils/analytics.ts`
  - `trackEvent(eventName: string, payload?: Record<string, unknown>)`
  - Sanitizes payload to primitives + truncates strings to 255 chars.
- **Backend dispatcher**: `backend/src/services/analytics.service.ts`
  - `sendAnalyticsEvent({ event: string, properties: Record<string, any> })`
- **Manual catalog doc**: `docs/analytics-events.md`
- **Usage hotspots** (not exhaustive):
  - Frontend: `rg "trackEvent\('" frontend/src`
  - Backend: `rg "sendAnalyticsEvent\(" backend/src`

## Scope
- Define a single event registry that:
  - Enumerates event names
  - Describes required/optional payload keys (flat primitives only)
  - Can generate markdown docs
  - Can be imported to provide type safety (at least in the frontend first)

## Expected file changes
- **[new]** `frontend/src/types/analytics-event-catalog.ts` (event registry + exported TS types)
- **[new]** `frontend/scripts/generate-analytics-events-doc.ts` (writes `docs/analytics-events.generated.md`)
- **[new]** `frontend/scripts/check-analytics-events.ts` (CI check: unknown events)
- **[edit]** `frontend/src/utils/analytics.ts` (type `trackEvent` name to known events; keep payload sanitization)
- **[optional/edit]** `docs/analytics-events.md` (either slim it down to “intro + link to generated catalog”, or keep it as curated narrative)

## Proposed approach
### 1) Create an event registry module (code, not docs)
Pick one source of truth format:
- **Option A (preferred):** A TypeScript `as const` registry (easy to type + generate docs from)
- **Option B:** A JSON registry + generated TS types (more language-agnostic, slightly more tooling)

Suggested initial location:
- `frontend/src/types/analytics-event-catalog.ts` (frontend-first rollout)

Registry shape concept (example):
- event name
- description
- payload keys with a minimal schema (`type` + `required`)

### 2) Type-safe `trackEvent`
Update `trackEvent` to accept only known events (and optionally enforce payload shapes):
- `trackEvent(name, payload)` where `name` is a union of known strings.
- Phase 1 can validate only the **event name**.
- Phase 2 can validate payload keys/types (still primitives only).

**Pragmatic note:** there is already a broad set of events in `docs/analytics-events.md`. Start by importing those into the registry so we don’t create churn.

### 3) Generator script (truthful docs)
Add a script that outputs a generated markdown table from the registry:
- Script: `frontend/scripts/generate-analytics-events-doc.ts` (or root `scripts/`)
- Output: `docs/analytics-events.generated.md`

Then decide doc policy:
- Keep `docs/analytics-events.md` as curated narrative.
- Or replace it with a generated file and keep a short intro doc that links to the generated catalog.

### 4) Backend alignment (phase 2)
Back-end events should reference the same catalog eventually.
Options:
- Create a small shared folder at repo root (e.g. `shared/analytics/`) and update both tsconfigs to include it.
- Or keep a mirrored backend registry and generate docs from both (less ideal).

### 5) Enforcement (CI)
Add a check that fails CI if:
- A new `trackEvent('some.new.event'...)` appears that is not in the catalog.

This can be done by:
- ESLint custom rule (heavy)
- A lightweight script that scans for `trackEvent('...')` string literals and diffs against the registry (pragmatic)

Suggested enforcement strategy:
- **Phase 1 (non-blocking):** generate a report of “unknown events” and print warnings.
- **Phase 2 (blocking):** fail if unknown events exist.
- **Phase 3 (stricter):** fail only for events introduced in the PR diff (optional).

## Breadcrumbs / migration targets
- `frontend/src/pages/DesignPage.tsx` (many events)
- `frontend/src/components/sections/Quickstart/Quickstart.tsx`
- `frontend/src/pages/CheckoutPage.tsx`
- `backend/src/controllers/order.controller.ts`
- `backend/src/controllers/design.controller.ts`
- `backend/src/services/stripe.service.ts`

## Deliverables
- Event registry in code (typed).
- Generated markdown catalog under `docs/`.
- (Optional but recommended) CI check that prevents unknown events.

## Starter snippet (catalog + type export)
```ts
// frontend/src/types/analytics-event-catalog.ts (sketch)
export const ANALYTICS_EVENT_CATALOG = {
  'site.page_view': {
    description: 'Route change in SPA router',
    source: 'frontend',
    payload: {
      path: { type: 'string', required: true },
      search: { type: 'string', required: false },
      title_length: { type: 'number', required: false },
      referrer: { type: 'string', required: false },
    },
  },
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENT_CATALOG;
```

## Starter snippet (typed `trackEvent`)
```ts
// frontend/src/utils/analytics.ts (sketch)
import type { AnalyticsEventName } from '@types/analytics-event-catalog';

export function trackEvent(eventName: AnalyticsEventName, payload?: Record<string, unknown>): void {
  // existing sanitize + dispatch logic
}
```

## Suggested npm scripts
- `frontend/package.json`
  - `"analytics:doc": "tsx scripts/generate-analytics-events-doc.ts"`
  - `"analytics:check": "tsx scripts/check-analytics-events.ts"`

## Acceptance criteria
- There is a single canonical list of analytics event names.
- Adding a new frontend event is a 2-step process:
  - Add it to the catalog
  - Use `trackEvent(...)`
  - If someone forgets, CI fails.
- Generated docs list at least:
  - event name
  - description
  - payload keys (required vs optional)

## Risks / mitigations
- **Risk:** Existing events are numerous; migration could be noisy.
  - **Mitigation:** Phase rollout: enforce only on new events first (CI checks only new diffs or runs in warn mode initially).
- **Risk:** Backend and frontend events may intentionally differ.
  - **Mitigation:** Catalog can support a `source: 'frontend'|'backend'|'both'` field.
