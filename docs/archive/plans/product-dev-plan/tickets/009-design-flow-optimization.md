# Ticket 009 — Design Flow Optimization

**Goal:** Reduce drop-off after payment by making design creation faster, clearer, and more reliable.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Users may stall on prompt writing; polling for storage swap is present but not surfaced as status.
- Unlimited designs create cost risk; limits need better UX/upsell messaging.

## Scope
- Add preset prompts/styles and “best-selling combo” button to Design page.
- Improve generation status copy; keep polling but show progress/“uploading” states.
- Show remaining designs prominently with upsell CTA when near/at limit.

## Deliverables
- Preset prompt chips (6) and “Use best-selling style” CTA.
- Status banners for generating/uploading; disable regenerate until previous completes.
- Upsell copy when remaining <= 1; link to upgrade path (placeholder) or support CTA.

## Acceptance Criteria
- User can generate with one click using a preset; style selection updates accordingly.
- While generating, UI shows status and prevents double-submit; once stored, image flips to permanent URL without refresh.
- Remaining count matches backend limit; when exhausted, button disabled with helpful message.

## Implementation Notes
- Files: `frontend/src/pages/DesignPage.tsx`.
- Use existing `generateRandomPrompt` endpoint or define a local preset array.
- Leverage existing polling flag (`hasGeneratingDesign`) but add UI banners/spinners.
- Copy should reflect new `maxDesigns` from Ticket 002.

## Risks / Mitigations
- Risk: Users perceive limit as paywall. Mitigate with upfront messaging on modal/pricing (Ticket 002/006).

---
### Notes (completed)
- Added preset prompt chips and a “best-selling combo” quick action to jumpstart generation (`frontend/src/pages/DesignPage.tsx`).
- Improved status messaging for generating/uploading designs and highlighted low remaining counts with an upsell hint.
