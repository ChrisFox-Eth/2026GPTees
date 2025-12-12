# Ticket 007 — Studio / Design Flow Redesign

**Goal:** Turn the creation flow into a calm, premium “studio” experience with editorial UI, clear hierarchy, and trust‑building copy.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Scope
- `frontend/src/components/sections/Quickstart/*`
- `frontend/src/pages/DesignPage.tsx`
- `frontend/src/pages/OrderDetailPage.tsx` share/preview surfaces
- Any in‑flow banners/empty states tied to preview‑first.

## Implementation steps
1. **Quickstart studio tone**
   - Field label: “Describe your idea”.
   - Primary action: “Create draft”.
   - Secondary action for alternates: “Try another direction” / “Make another draft”.
   - Avoid implying the first draft might be wrong; alternates are for exploration.
2. **DesignPage**
   - Re‑layout for editorial calm: large preview, quiet controls, minimal chrome.
   - Replace visible “prompt/generate/redraw” labels.
   - Make status messaging confident (e.g., “Draft ready” not “Generating AI…”).
3. **Preview/approval**
   - Emphasize approval before print as quality control.
4. **Share surfaces**
   - Share text should be brand‑appropriate; no AI mention.
5. **Motion**
   - Use shared motion variants for draft reveal and card transitions.

## Deliverables
- Studio flow visually + verbally aligned with fashion‑brand identity.

## Acceptance criteria
- A new user feels confident their idea will translate well on the first draft.
- Optional exploration is framed as creative choice.
- No banned terms appear.

## Risks / mitigations
- **Risk:** Complex flow becomes too minimal and confusing.  
  **Mitigation:** keep hierarchy clear, add small helper text where needed.

