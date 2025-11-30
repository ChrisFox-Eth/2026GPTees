# Ticket 001 – Admin authz and roles for analytics

**Goal:** Establish a consistent admin authorization layer for all analytics/code-management endpoints.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Existing admin tooling uses env flags; analytics endpoints need stricter gating to prevent data leakage or abuse.

## Scope
- Define admin guard middleware: requires auth + email allowlist (or future role claim).
- Apply guard to analytics routes namespace (e.g., `/api/admin/analytics/*` and promo code mgmt routes).
- Config: use `ADMIN_EMAIL_ALLOWLIST`; log denied attempts.

## Deliverables
- Middleware implemented and applied.
- Env docs updated to call out required allowlist variable.

## Acceptance Criteria
- Non-admins get 403 for analytics and code management endpoints.
- Admins on allowlist can access.

## Notes
- Implemented `requireAdmin` middleware using `ADMIN_EMAIL_ALLOWLIST` (with ALLOW_ADMIN_SYNC/dev fallback) and applied to all admin promo routes and sync endpoint.***
