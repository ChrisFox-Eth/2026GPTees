# Ticket 003 — Pricing Clarity & Risk Reducer

**Goal:** Make Basic vs Premium value obvious and reduce perceived risk with “Free edits until you approve” messaging.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Clear tier differentiation lifts AOV; risk reducers reduce hesitation to choose Premium.

## Scope
- Pricing section updates:
  - Labels: “Basic (1 AI design)” and “Premium (unlimited designs)”.
  - Badge on Premium: “Most choose this”.
  - Add a line: “Free edits until you approve.”
- Modal/cart mirrors the same copy.

## Deliverables
- Updated pricing cards (Home).
- Tier descriptions reflected in product modal/cart summary.
- Analytics event for Premium selection remains.

## Acceptance Criteria
- Pricing section shows Basic=1, Premium=unlimited, plus “Free edits until you approve.”
- Product modal tier cards match the same wording.
- No hardcoded prices; values still pulled from API tierPricing.

## Implementation Notes
- Files: `frontend/src/components/PricingSection/PricingSection.tsx`, `frontend/src/components/ProductModal/ProductModal.tsx`.
- Add a short subline under Premium CTA: “Unlimited retries until you approve.”

## Risks / Mitigations
- Risk: Copy clutter. Mitigate by keeping lines concise.

---
### Notes (completed)
- Pricing cards now show Basic (1 design) and Premium (unlimited) with “Most choose this” badge and “Free edits until you approve” in features (`frontend/src/components/PricingSection/PricingSection.tsx`).
- Product modal tier headings updated to “Basic (1 design)” and “Premium (unlimited)” (`frontend/src/components/ProductModal/ProductModal.tsx`).
