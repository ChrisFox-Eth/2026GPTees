# Ticket 011 — Backend Dead Code Removal + Naming Cleanup

**Goal:** Remove unused backend placeholders and normalize naming/folder structure.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Completion Log
- Verified no imports reference candidate files
- Deleted `middlewares/` (was empty)
- Deleted `models/` folder (only contained `example.model.ts` - unused)
- Deleted `services/example.service.ts` (unused)
- Deleted `services/s3.service.ts` (unused)
- Backend now has single `middleware/` folder with real middleware files
- Backend type-check passes

## Why
- Backend contains empty/unused scaffolding (`middlewares/`, `example.*`, `s3.service.ts`).
- Cleaning now reduces confusion and future maintenance.

## Scope
- Delete unused files/dirs after verifying no imports:
  - `backend/src/middlewares/` (empty)
  - `backend/src/models/example.model.ts`
  - `backend/src/services/example.service.ts`
  - `backend/src/services/s3.service.ts` (verify unused)
- Standardize middleware naming to one folder: `backend/src/middleware/`.
- Ensure exports/imports align with `type: "module"` ESM paths.

## Out of scope
- Large backend architecture changes.
- Schema/DB migrations except those needed for social removal (ticket 002).

## Implementation steps
1. Grep for imports of the candidate files.
2. Delete confirmed‑unused items.
3. Normalize folders:
   - If any middleware lives in `middleware/`, ensure no stray duplicates elsewhere.
4. Run backend build/type‑check.
5. Update backend docs if they reference removed items.

## Deliverables
- Backend free of placeholder/dead files.
- Clear folder naming.

## Acceptance criteria
- No unused backend files remain under `src/`.
- Backend builds and starts normally.

## Risks / mitigations
- **Risk:** Hidden runtime usage via dynamic import.  
  **Mitigation:** verify via grep + quick runtime smoke.

