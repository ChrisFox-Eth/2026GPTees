# Ticket 004 — Visual Assets + Lookbook Plan

**Goal:** Define the imagery and asset needs for an editorial fashion‑brand presentation and where they live in the app.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Why
- Minimal layouts rely on strong imagery; without it the site reads like a tool.
- Visual assets are the fastest way to gain “brand character.”

## Scope
- Identify required asset types and target placement.
- Define style guidance for photos/mockups.
- Create a repo structure for assets and placeholders.

## Asset types needed
1. **Hero lifestyle** (mobile‑first crops)
   - 1–2 full‑bleed images, warm light, neutral wardrobe, focus on tees.
2. **Lookbook / Examples**
   - 6–12 grid images or mockups showing real designs on body.
3. **Fabric/print detail**
   - Close‑ups of texture/print quality (2–3).
4. **Product neutral mockups**
   - Clean front/back mockups in core colors aligned with palette.
5. **Subtle texture overlays**
   - Light grain/paper texture (2–4% opacity) for backgrounds.

## Style guardrails
- Contemporary, not techy. No futuristic/robot/AI motifs.
- Warm neutrals, natural lighting, soft shadows.
- Avoid stock‑photo “startup energy.”
- Consistent aspect ratios for grids.

## Implementation steps
1. **Placement mapping**
   - Home:
     - Hero (full‑bleed)
     - ExamplesGallery (lookbook grid)
     - Pricing/CTA (light texture background)
   - Shop:
     - ProductCard/Modal mockups
   - Design studio:
     - Subtle texture, not busy.
2. **Repo structure**
   - Add `frontend/src/assets/overhaul/` (or similar) with subfolders:
     - `hero/`, `lookbook/`, `mockups/`, `textures/`
3. **Placeholders**
   - Until final photos are ready, add neutral placeholders with correct aspect ratios.
4. **Checklist for final delivery**
   - Provide a simple spec: sizes, ratios, file formats, naming.

## Deliverables
- Asset requirements doc inside this ticket.
- New assets folder with placeholders.

## Acceptance criteria
- Every marketing section has a clear visual anchor.
- Assets feel like a fashion brand, not a tech product.

## Risks / mitigations
- **Risk:** No real photography available yet.  
  **Mitigation:** use clean mockups temporarily but keep layout ready for lifestyle swaps.

