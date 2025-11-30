# Ticket 008 – Gift code purchase UI

**Goal:** Frontend flow to let users buy gift codes (Basic/Premium) and see purchase confirmation.

**Owner:** TBD | **Priority:** P2 | **Status:** DONE

## Why
- Make gift purchases discoverable and self-serve.
- Provides entry point to backend gift purchase endpoint (Ticket 003).

## Scope
- New page/section (e.g., `/gift` or account tab) with selector for tier (Classic/Limitless) and Buy button.
- On submit: call `/api/gift-codes/purchase`, redirect to returned Stripe URL.
- Success page `/gift/success`: thank-you copy and instruction to check email for code (no code in URL).
- Link entry point from header/account or CTA on marketing surfaces.

## Deliverables
- UI component/page, routing wired.
- Loading/error states; guards for auth (redirect to sign-in then back).
- Copy explaining what the gift includes (tee tier, shipping not included unless policy changes).

## Acceptance Criteria
- Authenticated user can initiate purchase and reach Stripe checkout.
- Post-payment redirect lands on success page with correct messaging.
- Works on mobile/desktop; follows design system.***

## Audit Notes
- `/gift` page present with tier selector, usage limit input, auth redirect, and POST to `/api/gift-codes/purchase`; redirects to Stripe URL on success.
- `/gift/success` page thanks buyer and links back to gift/shop; no code shown (as intended). Entry point wired in `App.tsx`.***
