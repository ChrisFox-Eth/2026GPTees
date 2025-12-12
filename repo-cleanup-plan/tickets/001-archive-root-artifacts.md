# Ticket 001 — Archive Root Artifacts

**Goal:** Reduce root‑level noise by archiving planning/ticket/temp artifacts into a structured `docs/archive/` area while preserving history.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- Root currently mixes runtime code with historical planning and debug artifacts, making navigation and onboarding harder.
- Archiving keeps history accessible without cluttering the code surface.

## Scope
- Inventory all non‑runtime artifacts at repo root and in root‑level plan/ticket folders.
- Create an archive structure under `docs/archive/`.
- Move agreed items into archive, update any links that should remain valid.

## In scope artifacts (initial candidates)
- Root directories matching patterns: `*-plan/`, `*-tickets/`, `feedback-tickets/`, `launch-ready-tickets/`, etc.
- Root files that are historical/diagnostic rather than “living” docs:  
  `AUDIT.md`, `CART_DEBUG.md`, `CLERK_TURNSTILE_FIX.md`, `DEPLOY_FIX.md`, `FINAL_FIXES.md`,  
  `FIXES_APPLIED.md`, `GAP_ANALYSIS_GO_LIVE.md`, `IMMEDIATE_ACTIONS.md`, `IMPLEMENTATION_*.md`,  
  `manual-user-sync.sql`, `temp.txt`, `temp_patch.py`, `USER_SYNC_FIX.md`, `WEBHOOK_*.md`, etc.

## Out of scope
- Living docs that should stay at root for discoverability: `README.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`, `.env.example`, root `package.json`.
- Any file referenced by CI or runtime paths unless verified safe to move.

## Deliverables
- `docs/archive/README.md` describing archive intent and structure.
- Archive subfolders (proposed):
  - `docs/archive/plans/` — old plan directories with their ticket subfolders intact.
  - `docs/archive/tickets/` — one‑off ticket collections.
  - `docs/archive/diagnostics/` — debug reports, fix logs, SQL patches.
  - `docs/archive/temp/` — temporary scripts/notes.
- Root cleaned so only runtime + living docs remain.

## Implementation steps
1. **Inventory**
   - List root items and classify as:
     - Runtime / living docs → keep at root.
     - Historical planning → archive/plans.
     - Diagnostics/fix notes → archive/diagnostics.
     - Temporary scratch → archive/temp (or delete if agreed).
2. **Confirm mapping with Chris**
   - Post a short mapping table in this ticket for sign‑off before moving.
3. **Create archive structure**
   - Add `docs/archive/README.md` + folders above.
4. **Move items**
   - Preserve internal folder structures (e.g., keep `tickets/` subdirs).
   - For moved root `.md` files, keep original filenames.
5. **Update references**
   - Search for links to moved files and update if they should remain valid.
   - If a link is purely historical, leave as is and rely on archive README.
6. **Sanity check**
   - Ensure no runtime imports reference moved files.
   - Run `npm run type-check` and quick `npm run dev` smoke if needed.

## Acceptance criteria
- Root listing is primarily runtime code + a small set of living docs.
- All archived content is still accessible under `docs/archive/` with a clear index.
- No build/runtime paths break due to moves.

## Risks / mitigations
- **Risk:** Moving something referenced by a script/CI.  
  **Mitigation:** grep for filename references before moving; keep stubs or update scripts.
- **Risk:** Losing context by over‑archiving.  
  **Mitigation:** keep a short root‑level `docs/archive/README.md` index.

---
### Notes
- This ticket should land before other sweeps to avoid churn in moved files.

### Completion Log (2025-12-11)

**Summary:** Successfully archived all historical planning, diagnostic, and temporary files from the repository root into a structured `docs/archive/` directory.

**Files/directories moved:**

*To `docs/archive/plans/`:*
- `conversion-boost-plan/`
- `design-first-flow/`
- `gift-promo-codes-plan/`
- `launch-ready-tickets/`
- `product-dev-plan/`
- `product-roadmap/`
- `promo-analytics-dashboard-plan/`
- `social-ops-plan/`

*To `docs/archive/tickets/`:*
- `feedback-tickets/`

*To `docs/archive/diagnostics/`:*
- `AUDIT.md`, `CART_DEBUG.md`, `CLERK_TURNSTILE_FIX.md`, `DEPLOY_FIX.md`
- `FINAL_FIXES.md`, `FIXES_APPLIED.md`, `GAP_ANALYSIS_GO_LIVE.md`
- `IMMEDIATE_ACTIONS.md`, `IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_SUMMARY.md`
- `PRODUCT_OWNER_README.md`, `PROGRESS_SUMMARY.md`, `TROUBLESHOOTING_AUTH.md`
- `USER_SYNC_FIX.md`, `WEBHOOK_DIAGNOSIS.md`, `WEBHOOK_FAILURE_DEBUG.md`
- `manual-user-sync.sql`

*To `docs/archive/temp/`:*
- `temp.txt`
- `temp_patch.py`

**Created:**
- `docs/archive/README.md` - Index explaining archive structure

**Commands run:**
- `npm run type-check --prefix backend` - PASSED
- `npm run type-check --prefix frontend` - PASSED

**Follow-ups:**
- `repo-cleanup-plan/` kept at root until cleanup is complete, then should be archived

