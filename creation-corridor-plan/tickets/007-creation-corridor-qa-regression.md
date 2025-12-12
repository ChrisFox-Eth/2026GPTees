# Ticket 007 — Creation Corridor QA + Regression Checklist

**Goal:** Define and execute a QA/regression checklist for the Creation Corridor across guest/signed-in flows, auth redirects, persistence edge cases, reduced-motion, and mobile scroll-lock behavior.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- The corridor introduces a global “locked UI” mode; bugs here can make the site feel broken (hidden nav, no scroll).
- It spans multiple routes (`/`, `/auth`, `/design`) and depends on state persistence.

## Scope
- Manual QA checklist with clear expected behavior.
- Edge case coverage for:
  - refresh during corridor
  - back button
  - multi-tab
  - TTL expiry
  - reduced-motion
  - mobile scroll lock
- Minimal dev diagnostics to speed debugging (console logs gated to DEV if needed).

## Breadcrumbs
- Existing end-to-end guidance: `docs/E2E_TESTING.md`
- Quickstart guest persistence keys:
  - `gptees_preview_guest`
  - `gptees_quickstart_preview_cache`
  - `gptees_quickstart_prompt`
- DesignPage polling behavior: `frontend/src/pages/DesignPage.tsx` (polls every 5s while designs are still swapping to Supabase URLs)

## QA checklist

### Corridor start (unauthenticated)
- **[start overlay]** Enter a prompt on `/` and click **Create draft**.
  - Expect overlay appears full-screen immediately.
  - Expect Header/Footer hidden.
  - Expect scroll disabled.
- **[stage progression]** Confirm stage messages transition smoothly (no jitter).
- **[auth pause]** Confirm an auth pause prompt appears at the configured point.
  - Only one primary CTA is offered (“Sign in to continue”).

### Auth route continuity
- **[locked UI on /auth]** Click the auth CTA.
  - Expect navigation to `/auth?redirect=/`.
  - Expect Header/Footer still hidden.
  - Expect AuthPage shows continuity copy.
- **[sign in]** Complete sign-in.
  - Expect redirect back to `/`.

### Post-auth resume
- **[resume overlay]** On return to `/`, overlay should immediately reappear.
- **[claim]** Order claim should succeed and not loop.
- **[continue stages]** Remaining stages should continue.
- **[handoff]** Corridor should navigate to `/design?orderId=...`.

### Signed-in start (no auth pause)
- **[skip auth]** With an existing session, click **Create draft**.
  - Expect no auth pause stage.
  - Expect direct completion to `/design?orderId=...`.

### DesignPage landing
- **[order loads]** DesignPage should load order + designs.
- **[preview states]** Confirm it works when order is `PENDING_PAYMENT` or `DESIGN_PENDING`.
- **[image swapping]** If design is still swapping to a durable Supabase URL, confirm polling updates the image without a manual refresh.

## Persistence + edge cases
- **[refresh on /]** Refresh the page during corridor stages.
  - Expect corridor restores state (within TTL) and remains locked.
- **[refresh on /auth]** Refresh while on `/auth` with an active corridor.
  - Expect corridor state remains and continuity copy still appears.
- **[back button]** While corridor active, press browser back.
  - Define expected behavior (pick one):
    - corridor resets cleanly
    - or corridor remains active and prevents escape
  - Ensure no “half-locked” state.
- **[TTL expiry]** Simulate an expired corridor session (edit `startedAtMs` or wait TTL).
  - Expect corridor resets automatically and UI unlocks.
- **[multi-tab]** Start corridor in one tab, open `/` in a second tab.
  - Expected: second tab either restores corridor (if key exists) or stays normal (define policy). No infinite loops.

## Accessibility + motion
- **[reduced motion]** Enable OS/browser reduced-motion.
  - Expect stage transitions reduce to opacity-only or near-static.
  - Expect no large transforms.
- **[focus]** Verify the auth CTA is keyboard reachable and has visible focus styles.

## Mobile
- **[iOS scroll lock]** On mobile Safari, ensure background does not scroll when overlay is active.
- **[viewport]** Rotate device; overlay remains centered and full-screen.

## Analytics verification
- **[events fire]** Verify key events fire once:
  - `creation_corridor.start`
  - `creation_corridor.stage.view`
  - `creation_corridor.auth.pause_shown`
  - `creation_corridor.complete`

## Deliverables
- A completed QA checklist with pass/fail notes.
- A short list of any bugs found + follow-up tickets.

## Acceptance criteria
- No scenario leaves the app in a permanently locked state after completion/reset.
- Guest and signed-in happy paths consistently end at `/design?orderId=...`.
- Reduced-motion users do not see transform-heavy animations.
- Mobile scroll lock works reliably.
