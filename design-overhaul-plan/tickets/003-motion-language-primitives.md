# Ticket 003 — Motion Language Primitives (Framer Motion)

**Goal:** Define and centralize the editorial motion system, then update existing motion components to use it.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Motion should feel like a fashion lookbook: subtle, confident, quiet.
- Central tokens prevent inconsistent animations.

## Scope
- Create motion tokens (durations, easing, distances).
- Update motion primitives (`MotionFadeIn`, `MotionStaggerList`, `MotionHoverCard`, etc.).
- Add calm route transitions.
- Respect reduced‑motion.

## Motion rules (locked)
- Easing: `cubicBezier(0.16, 1, 0.3, 1)`
- Micro duration: 0.12–0.18s
- Section reveal: 0.35–0.6s
- Route transition: 0.25–0.35s
- No spring bounce. No flashy effects.

## Implementation steps
1. **Token file**
   - Add `frontend/src/utils/motion.ts` (or `components/motion/motion.tokens.ts`) exporting:
     - easing
     - durations
     - base variants: fadeUp, fadeIn, staggerContainer, staggerItem, hoverLift, pressScale.
2. **Update primitives**
   - Refactor:
     - `frontend/src/components/motion/MotionFadeIn/*`
     - `MotionStaggerList/*`
     - `MotionHoverCard/*`
     - `MotionTogglePanel/*`
     - `MotionDraggableCard/*` (if still used)
   - Replace ad‑hoc transitions with shared tokens.
3. **Route transitions**
   - In `frontend/src/App.tsx`, wrap routes with a simple AnimatePresence + crossfade/soft slide using tokens.
4. **Reduced motion**
   - Use `useReducedMotion()` to disable transforms and shorten durations for users who prefer reduced motion.
5. **Doc**
   - Add “Motion” section to `frontend/TAILWIND_GUIDE.md` describing patterns and do‑nots.

## Deliverables
- Central motion token file.
- Motion primitives updated to consume it.
- Route transitions added.

## Acceptance criteria
- All animations feel consistent across surfaces.
- No bouncy spring effects remain.
- Reduced‑motion users get near‑static UI.

## Risks / mitigations
- **Risk:** Over‑animating harms the minimal vibe.  
  **Mitigation:** keep motion opt‑in per section; prefer fewer, larger reveals.

