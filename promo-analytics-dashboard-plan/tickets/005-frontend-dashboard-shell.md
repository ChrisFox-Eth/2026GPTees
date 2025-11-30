# Ticket 005 – Frontend dashboard shell

**Goal:** Build a protected admin dashboard frame for promo/gift analytics and management.

**Owner:** TBD | **Priority:** P1 | **Status:** DONE

## Why
- Need a UI entry point with navigation for tables and metrics.

## Scope
- Add `/admin/promo` route (guarded by auth + allowlist check on client if available).
- Layout: sidebar/topbar with sections: Codes, Metrics, Settings/Flags.
- State management: simple fetch + SWR/react-query (pick one) with loading/error states.
- Dark/light support consistent with app theme.

## Deliverables
- New page/component shell; navigation highlighting; placeholder cards/slots for codes table and metrics.
- Redirect non-admins to home with a message.

## Acceptance Criteria
- Admin users can load dashboard shell; non-admins are bounced.
- Layout responsive on mobile/tablet/desktop.

## Notes
- `/admin/promo` added with ProtectedRoute; shows dashboard shell and user email. Server still enforces admin allowlist.***
