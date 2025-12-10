# 006 — Frontend: Home Quickstart free preview funnel

## Objective
Make homepage Quickstart the primary entry: let users generate first design for free, show engaging loading, display result inline, and offer “Continue” (adds Classic $34.99 and checkout) or “Try again” (switch to Limitless).

## Scope
- Update home Quickstart UI/flow:
  - Initiate preview order creation on first generate; store `orderId`.
  - Trigger design generation immediately; show engaging loading state (e.g., staged messages/progress, skeleton mock).
  - Show resulting design on homepage (no redirect) with CTA: “Continue with this” (adds Classic tee to cart/uses existing preview order) and “Try again” (switches to Premium/Limitless and triggers another generate).
- Ensure size/color chosen at checkout step; preserve selected prompt/design.
- Auth handling: if not signed in, prompt login but preserve in-progress preview/orderId.
- Mobile-first layout with clear, minimal friction CTAs.

## Deliverables
- Home Quickstart enhancements to support inline preview display and CTA buttons.
- Logic to create/fetch preview orderId and reuse for design generation and checkout.
- Improved loading UX (messages, skeleton, maybe fun “AI is drawing” microcopy).
- Error handling and retry on generation failures.

## Acceptance Criteria
- From homepage, user can enter prompt, generate preview, see design without paying.
- “Continue with this” adds Classic tier and routes to checkout using same orderId.
- “Try again” triggers new generation (Premium) without losing order context.
- Size/color selection available before final checkout.
- Works on mobile; loading state avoids blank waits.

## Open Questions
- Should “Try again” automatically upgrade to Premium pricing or prompt before upgrade? Prompt before upgrade (avoid surprise pricing).
- If user is unauthenticated, do we defer order creation until after login or create then require login before showing design? Create immediately to preserve prompt/orderId, but require login to reveal design and re-associate to the user on auth.
- Should we cap free previews on homepage to 1 before forcing signup/checkout? Yes—cap at 1 free preview to deter abuse; prompt for signup/checkout after the first.
