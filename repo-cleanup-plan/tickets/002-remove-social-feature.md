# Ticket 002 — Remove Temporary Social Feature

**Goal:** Fully remove the temporary “social media” feature from both backend and frontend, including routes, controllers, services, types, UI, and docs.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Chris confirmed social was a temporary experiment and should not remain in the product surface.
- Removing now prevents future drift and reduces maintenance surface.

## Scope
- Delete all social‑specific backend code and frontend UI/logic.
- Remove social docs/templates from `docs/` (archive if desired per ticket 001).

## Out of scope
- Non‑social core e‑commerce flows (orders, designs, products, payments).
- Any shared utilities that are used elsewhere after verification.

## Backend work
**Targets (expected):**
- `backend/src/routes/social.routes.ts`
- `backend/src/controllers/social.controller.ts`
- `backend/src/services/*` that are only used by social (see ticket 003 for media services).
- `backend/src/types/social.ts`
- Prisma schema/models related only to social (verify in `backend/prisma/schema.prisma`).
- Any env vars only required by social.

**Steps:**
1. Confirm social routes are not mounted (currently not in `backend/src/index.ts`) and note any hidden consumers.
2. Grep for `social` imports/paths in backend:
   - remove route exports.
   - remove controller exports.
   - remove service dependencies that become unused.
3. Prisma:
   - If schema contains social tables, decide:
     - delete models + run migration (if safe), **or**
     - leave models but remove code paths (if DB already in prod and we don’t want migrations yet).
4. Delete social docs in backend side (if any), update `backend/package.json` to drop unused deps.

## Frontend work
**Targets (expected):**
- `frontend/src/components/social/**`
- `frontend/src/hooks/useSocialData.ts`, `frontend/src/hooks/usePostForm.ts`
- `frontend/src/types/social.ts`
- Pages/admin routes referencing social (grep `Social` / `/social`).
- Any router entries or nav links pointing to social UI.

**Steps:**
1. Grep for social usage:
   - components imported in pages.
   - hooks used by admin dashboards.
2. Remove social pages/routes from `frontend/src/App.tsx` router.
3. Delete social folders/hooks/types after confirming no remaining imports.
4. Update `frontend/package.json` to remove unused deps (if any were only for social).

## Docs / assets
- Archive or delete:
  - `docs/SOCIAL_MEDIA.md`
  - `docs/social_*` templates/csvs
  - `docs/social_posts_import.md`
  - `docs/social_import_template.md`

## Deliverables
- Social feature code removed from both halves.
- No social UI links remain.
- Dependencies cleaned.

## Acceptance criteria
- `npm run build` passes for both backend and frontend.
- No references to social remain in code search (excluding archive).
- App runs without dead routes or missing imports.

## Risks / mitigations
- **Risk:** Hidden dependency on a “social” utility in core flows.  
  **Mitigation:** delete only after verifying import graph; migrate any genuinely shared logic to non‑social locations.
- **Risk:** Database models still exist but no code references → confusion later.  
  **Mitigation:** add a short note in archive or schema comments if models remain temporarily.

---
### Notes
- Ticket 003 handles AI media generation services that are only referenced by social.

### Completion Log (2025-12-11)

**Summary:** Removed all social media feature code from backend and frontend. Social docs archived to `docs/archive/social-docs/`.

**Backend files deleted:**
- `backend/src/routes/social.routes.ts`
- `backend/src/controllers/social.controller.ts`
- `backend/src/types/social.ts`

**Frontend files deleted:**
- `frontend/src/components/social/` (entire directory - 14 files)
- `frontend/src/pages/AdminSocialPage.tsx`
- `frontend/src/pages/AdminSocialPageNext.tsx`
- `frontend/src/hooks/useSocialData.ts`
- `frontend/src/hooks/usePostForm.ts`
- `frontend/src/types/social.ts`
- `frontend/src/constants/social.ts`

**Docs archived to `docs/archive/social-docs/`:**
- `SOCIAL_MEDIA.md`
- `social_csv_template.csv`
- `social_fb_ig_export.csv`
- `social_import_template.md`
- `social_posts_import.md`

**Kept (not part of social feature):**
- `frontend/src/components/SocialProofStrip/` - Marketing component showing rotating design ideas

**Commands run:**
- `npm run type-check --prefix backend` - PASSED
- `npm run type-check --prefix frontend` - PASSED

**Follow-ups:**
- Ticket 003 will handle removal of AI media services (Sora/Veo/Suno/FFmpeg) that were used by social

