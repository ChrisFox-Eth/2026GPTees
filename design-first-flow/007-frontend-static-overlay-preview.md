# 007 — Frontend: Static shirt overlay preview

## Objective
Show generated (or uploaded) designs composited on a t-shirt mockup to improve confidence before purchase.

## Scope
- Build a `<ShirtPreview>` component to layer design image over a base tee mock (per color).
- Source/confirm base mock images per color (from product data/Supabase). Fallback: neutral color with note.
- Use CSS positioning/sizing to place design in chest area; responsive scaling for mobile.
- Integrate overlay into DesignPage (and optionally Order confirmation/history) replacing raw image display.
- Handle loading/empty/error states gracefully.

## Deliverables
- Shirt overlay component with Tailwind positioning and responsive sizing.
- Integration into design gallery cards (and any single-view detail) to show composited preview.
- Documentation of placement sizing so it roughly matches Printful print area.

## Acceptance Criteria
- Each design preview renders on a shirt mockup; scales on mobile/desktop without layout issues.
- Uses product color when available; falls back gracefully if missing.
- No regression to design list functionality (share, approve/checkout buttons still work).

## Open Questions
- If design has white background, do we accept it on colored tees or need background removal later? Accept it on colored tees.
- If only one mock color exists, do we show a note when user selected a different color? No, we only offer 4 colors, we should be able to show a preview of all four.
- Should click open a modal for larger view? Yes.
