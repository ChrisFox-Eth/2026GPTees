# Ticket 005 — Homepage Editorial Redesign (Mobile‑First)

**Goal:** Re‑layout HomePage marketing surfaces to match the Apple News‑style editorial minimal direction, with new copy and motion.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Home is the brand front door; it must read as a fashion studio, not an AI tool.

## Scope
- Update layout, type, spacing, imagery, and copy for:
  - `Hero`
  - `Quickstart`
  - `HowItWorks`
  - `ExamplesGallery`
  - `PricingSection`
  - `CallToAction`
  - `StickyCtaBar`
  - `Footer` / `Header`
- Integrate motion primitives from ticket 003.
- Apply new tokens/type from tickets 001–002.

## Copy constraints (locked)
- Hero headline: **“Design a tee that doesn’t exist yet.”**
- No “vibe”.
- No marketing “free preview / unlimited redraws.” Exploration is optional.
- No “AI” language outside legal pages.

## Implementation steps
1. **Hero**
   - Full‑bleed (or near full‑bleed) lifestyle image, warm paper background.
   - Large serif head, minimal subcopy, one primary CTA.
   - Remove any techy trust badges; keep only fashion/quality trust.
2. **Quickstart**
   - Present as “Studio preview” block with calm UI.
   - Field label: “Describe your idea” (not “prompt”).
   - Button label: “Create draft”.
3. **HowItWorks**
   - Convert to vertical, editorial step flow on mobile; grid enhancement on desktop.
   - Update step titles/descriptions per new copy direction.
4. **ExamplesGallery**
   - Lookbook grid with strong imagery, gentle hover zoom, staggered reveal.
5. **Pricing**
   - Minimal card, big price, short bullets, no “unlimited” boasting.
6. **CTA band**
   - Keep it quiet and confident; cobalt CTA.
7. **Sticky CTA**
   - Update label/subcopy to new language.
8. **Motion**
   - Add scroll‑reveal stagger to sections, soft hover lifts to cards.

## Deliverables
- HomePage and all listed sections restyled and re‑copied.
- Mobile layout polished.

## Acceptance criteria
- Home reads as an editorial fashion brand on first glance.
- No banned terms appear.
- Mobile experience feels premium and spacious, not cramped.

## Risks / mitigations
- **Risk:** Minimal layout feels empty without assets.  
  **Mitigation:** ticket 004 provides placeholders and ratios.

