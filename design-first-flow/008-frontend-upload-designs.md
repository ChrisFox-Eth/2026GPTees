# 008 — Frontend/Backend: User-uploaded design support
**Status:** Later/backlog (not in initial preview-before-purchase release)

## Objective
Let users upload their own image as a design option within the preview flow, stored and previewed like AI designs.

## Scope
- Frontend: add “Upload Image” path (tab/button) alongside AI prompt entry; show client-side thumbnail; validate type/size.
- Backend: new authenticated endpoint (e.g., `POST /api/designs/upload`) accepting multipart image + orderId + optional caption.
- Storage: save uploaded image (Supabase/S3), return public URL; create Design record linked to order with `aiModel='upload'`.
- Enforce tier limits same as AI generation (upload counts as a design).
- Integrate preview overlay (ticket 007) to show upload on shirt mock.

## Deliverables
- Frontend UI/logic to choose file, upload, show preview, and list among designs.
- Backend upload handler (Multer or equivalent) + storage service updates + design persistence.
- Validation: mime (png/jpg), size limit, optional min resolution warning.
- Tests for upload endpoint (auth, limits, invalid file).

## Acceptance Criteria
- Auth user can upload an image to an existing preview order; design appears in list/overlay.
- Upload obeys tier limits; blocked when limit reached.
- Stored image URL usable for sharing/printing; no approval/fulfillment until paid (per ticket 004).

## Open Questions
- Minimum resolution enforcement? Warn vs. reject?
- Prefer PNG only to encourage transparency or allow JPG?
- Any content moderation needed for uploads?
