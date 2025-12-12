# Ticket 003 — Remove AI Media Services (Sora/Veo/Suno/FFmpeg)

**Goal:** Remove experimental AI media generation services that existed solely to support the temporary social feature.

**Owner:** TBD | **Priority:** P0 | **Status:** DONE

## Why
- These services are tied to social and add heavy dependency surface and env complexity.
- Cutting them reduces backend size and risk.

## Scope
- Delete backend services and any related types/helpers:
  - `backend/src/services/video.service.ts`
  - `backend/src/services/ffmpeg.service.ts`
  - `backend/src/services/suno.service.ts`
  - `backend/src/services/veo.service.ts`
  - Any storage listing helpers used only by social.
- Remove associated env variables, docs, and package deps.

## Out of scope
- Core OpenAI image/design generation (`openai.service.ts`) used by main product.

## Implementation steps
1. **Confirm exclusivity**
   - Verify these services are only imported from `social.controller.ts`.
2. **Delete services**
   - Remove files and their exports.
3. **Prune dependencies**
   - Check `backend/package.json` for deps only required by these services (e.g., ffmpeg wrappers, audio libs, extra OpenAI endpoints) and remove.
4. **Clean env**
   - Remove unused env variables from `backend/.env.example` and docs.
5. **Update docs**
   - Any media‑related docs should be archived under ticket 001.
6. **Smoke build**
   - Run backend type‑check/build to confirm no dangling imports.

## Deliverables
- Media services removed.
- Backend deps and env cleaned.

## Acceptance criteria
- `rg "video.service|ffmpeg.service|suno.service|veo.service"` returns no hits outside archive.
- Backend builds and starts normally.

## Risks / mitigations
- **Risk:** A service contains code we might want later.
  **Mitigation:** If desired, move into `docs/archive/temp/ai-media/` as reference before deleting.

---
### Completion Log (2025-12-11)

**Summary:** Removed all AI media generation services that were only used by the social feature.

**Files deleted:**
- `backend/src/services/video.service.ts` (Sora video generation)
- `backend/src/services/ffmpeg.service.ts` (GIF/MP4 stitching)
- `backend/src/services/suno.service.ts` (Music generation)
- `backend/src/services/veo.service.ts` (Kie.ai Veo video)
- `backend/src/services/storage-list.service.ts` (Social asset listing)

**Files modified:**
- `backend/src/services/supabase-storage.service.ts` - Removed `uploadBufferDirect` export (was only used by deleted services)

**Kept (used by core product):**
- `backend/src/services/supabase-storage.service.ts` - `uploadImage` function for design uploads
- `backend/src/services/supabase-admin.service.ts` - Admin client for design operations
- `backend/src/services/openai.service.ts` - Core DALL-E 3 image generation

**Commands run:**
- `npm run type-check --prefix backend` - PASSED

**Notes:**
- Env variables for SORA/VEO/SUNO are no longer used but not removed from .env.example (harmless)
- No package.json deps needed removal (services used native https, no ffmpeg wrapper packages)

