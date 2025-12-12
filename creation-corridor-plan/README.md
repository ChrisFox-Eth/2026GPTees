# GPTees Creation Corridor Plan

**Purpose:** Implement the new full-screen “Creation Corridor” conversion funnel that starts at the homepage prompt (“Create draft”), optionally pauses for authentication, and lands the user in the Design Studio with their draft attached.

Tickets live in `creation-corridor-plan/tickets/` and are ordered to build foundations first (state + UI lock), then user-visible UX (overlay + motion), then wiring (Quickstart/auth/design handoff), then instrumentation + QA.

## AI Dev Team Prompt (copy/paste)
```md
You are implementing the GPTees “Creation Corridor” conversion funnel in the repo `2026GPTees` C:\Users\chris\Hunnys-Development\2026GPTees\creation-corridor-plan.

### Backstory / intent
Right now GPTees behaves like a normal website: the user clicks “Create draft” and immediately bounces between surfaces (home → auth → design). We want the opposite: the moment the user clicks **Create draft**, the app becomes a dedicated full-screen creation machine.

The user should experience a calm, continuous narrative with soft transitions (e.g. “Interpreting your prompt…”, “Exploring visual directions…”) and then land in the Design Studio (`/design?orderId=...`) with their draft attached.

### Core requirements (non-negotiable)
- Full-screen corridor overlay with **sequential narrative stages**.
- **Mid-flow auth continuation** for guests:
  - Pause in-flow with a sign-in CTA.
  - Navigate to `/auth?redirect=/`.
  - After auth, resume exactly where the user left off.
- **Locked-down UI** while corridor is active:
  - Hide Header and Footer.
  - Prevent background scrolling.
  - No extra links/clickable distractions (except the auth CTA during the pause stage).
- **State persistence** across route changes and possible refresh during auth:
  - Prompt, orderId, guestToken, stage index.
- **End-to-end integration**:
  - Corridor ends by navigating to `/design?orderId=...`.

### Constraints / style guardrails
- Do not introduce mock data. Use the existing backend preview endpoints.
- Prefer reusing existing behavior and contracts:
  - Guest preview create: `POST /api/orders/preview/guest`
  - Guest generate: `POST /api/designs/generate/guest`
  - Claim after auth: `POST /api/orders/preview/claim` (expects `{ orderId, guestToken }`)
  - Signed-in preview create: `POST /api/orders/preview`
  - Signed-in generate: `POST /api/designs/generate`
  - DesignPage fetch: `GET /api/orders/:id`, `GET /api/designs?orderId=...`
- Use Framer Motion and **existing motion tokens** in `frontend/src/utils/motion.ts`.
- Respect reduced motion (`useReducedMotion()`): stage transitions should become opacity-only or near-static.
- Use **semantic Tailwind tokens** (e.g. `bg-surface`, `text-ink`) and keep copy aligned with `design-overhaul-plan` non-negotiables:
  - Don’t frame anything as “AI”.
  - Keep tone calm/studio-like.

### Implementation direction (what to build)
Build this as a global, app-level flow controller (not buried inside Quickstart):

1) **Global corridor state + UI lock**
   - Add a provider/hook (e.g. `CreationCorridorContext`) that stores:
     - `active`, `phase`, `stageIndex`, `prompt`, `orderId`, `guestToken`, `startedAtMs`.
   - Persist minimal corridor state to localStorage (new key like `gptees_creation_corridor`) with a TTL.
   - When `active=true`:
     - Hide `<Header />` and `<Footer />` in `frontend/src/App.tsx`.
     - Lock body scroll (restore on exit).

2) **Creation corridor overlay UI**
   - Render a full-screen overlay above all routes when `active=true`.
   - Implement timed stage progression with calm crossfades (AnimatePresence `mode="wait"`).
   - Include a dedicated “auth pause” stage with a single CTA: “Sign in to continue”.
   - Stage copy should be short and non-technical.

3) **Quickstart becomes a trigger**
   - Update `frontend/src/components/sections/Quickstart/Quickstart.tsx` so “Create draft” calls the corridor start function.
   - Quickstart should no longer directly navigate to `/auth` or `/design`.

4) **Guest auth resume + claim**
   - For unauth users:
     - Create guest preview order (store `orderId + guestToken` in corridor state + localStorage).
     - Best-effort kick off guest generation before auth pause.
     - Pause the corridor for auth and navigate to `/auth?redirect=/`.
   - On return to `/` after auth:
     - Claim the preview order.
     - Ensure at least one design exists (fallback: call signed-in generate if guest generation didn’t happen).
     - Continue remaining stages and then complete.
   - Update `frontend/src/pages/AuthPage.tsx` to show a small continuity note when corridor is active (e.g. “We’re holding your draft while you sign in.”).

5) **Completion + cleanup**
   - When the final stage finishes:
     - Set corridor `active=false`.
     - Clear corridor storage (and clear `gptees_preview_guest` if used).
     - Navigate to `/design?orderId=...`.

6) **Analytics + QA**
   - Add new additive events (don’t break existing ones), e.g. `creation_corridor.start`, `creation_corridor.stage.view`, `creation_corridor.complete`.
   - Never send prompt text; only `prompt_length`.
   - QA the full guest and signed-in happy paths plus refresh/back/reduced-motion/mobile scroll lock.

### Where to look (breadcrumbs)
- Layout: `frontend/src/App.tsx` (Header/Footer always rendered today)
- Quickstart: `frontend/src/components/sections/Quickstart/Quickstart.tsx`
- Auth page: `frontend/src/pages/AuthPage.tsx`
- Design landing: `frontend/src/pages/DesignPage.tsx`
- Motion tokens: `frontend/src/utils/motion.ts`
- Preview endpoints:
  - `backend/src/routes/order.routes.ts`, `backend/src/controllers/order.controller.ts`
  - `backend/src/routes/design.routes.ts`, `backend/src/controllers/design.controller.ts`

### Definition of done
- Guest user flow:
  - Click “Create draft” → corridor starts full-screen (Header/Footer hidden; no scroll).
  - Corridor reaches auth pause → CTA navigates to `/auth?redirect=/`.
  - AuthPage shows continuity copy.
  - After auth → corridor resumes automatically and completes → navigates to `/design?orderId=...`.
- Signed-in flow:
  - Click “Create draft” → corridor runs without auth pause and lands on `/design?orderId=...`.
- No scenario leaves the site “stuck” with scroll locked or nav hidden.
- Reduced-motion users get near-static transitions.
```

## Ticket index (ordered)
1. `001-creation-corridor-flow-state-and-ui-lock.md` — Global corridor state, persistence, and layout lock (Header/Footer + scroll).
2. `002-creation-corridor-overlay-motion-stages.md` — Full-screen overlay with narrative stages + Framer Motion transitions.
3. `003-quickstart-wires-into-creation-corridor.md` — Update Quickstart to start the corridor instead of immediate navigation.
4. `004-auth-continuation-and-resume-claim.md` — Mid-flow auth continuity + post-auth resume + claim guest preview.
5. `005-handoff-to-design-page-and-cleanup.md` — Corridor completion → `/design?orderId=...` + cleanup + “draft ready” UX checks.
6. `006-analytics-instrumentation-creation-corridor.md` — Funnel analytics events and payload conventions.
7. `007-creation-corridor-qa-regression.md` — QA checklist + edge cases (refresh/back/reduced motion/mobile).
8. `008-backend-preview-contract-audit.md` — (Optional) Backend contract hardening for preview guest/claim.

## Notes
- Keep user-visible copy aligned with `design-overhaul-plan` non-negotiables (no “AI” framing; calm studio tone).
- Prefer reusing existing preview-order + guest-claim endpoints and localStorage keys rather than inventing new server state.
