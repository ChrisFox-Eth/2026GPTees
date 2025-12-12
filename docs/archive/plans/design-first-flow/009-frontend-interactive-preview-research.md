# 009 — Research: Interactive preview (drag/3D/AR)
**Status:** Later/backlog (post-MVP research)

## Objective
Evaluate options for interactive design preview (drag-to-position, potential 3D model/AR) to inform roadmap after static overlay.

## Scope
- Survey approaches:
  - Lightweight: 2D drag/scale overlay on shirt mock; capture offsets for possible print alignment.
  - Heavier: React Three Fiber/Three.js 3D model with design texture; assess mobile perf/cost.
  - Printful mockup generator multi-angle images as quasi-3D fallback.
- Prototype feasibility/timebox notes; identify required assets (3D model, UV map).
- Assess fulfillment implications: how to translate user positioning into Printful printfile coordinates.

## Deliverables
- Short findings doc with pros/cons, effort estimate, and recommended next step (e.g., start with 2D drag, defer 3D).
- If possible, tiny prototype notes/code pointers for 2D drag placement.

## Acceptance Criteria
- Clear recommendation on whether to pursue 2D drag now vs. defer full 3D/AR.
- Identified libraries and risks (performance, bundle size, mobile).

## Open Questions
- Do we need user-controlled placement at all, or is standard center placement sufficient?
- If 3D is desired, can we source a suitable shirt GLTF with correct UVs?
- How to persist placement offsets into Printful order creation?
