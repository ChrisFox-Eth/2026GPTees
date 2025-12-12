# Ticket 002 — Typography System (Inter / Space Grotesk / Instrument Serif)

**Goal:** Implement the editorial typography stack and hierarchy, with serif reserved for hero/large heads.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Type is the loudest “brand signal” on a minimal site.
- Apple News feel relies on confident heads + quiet body text.

## Scope
- Load fonts and wire Tailwind font families.
- Define heading/body scale and weights.
- Apply across marketing and core UI.

## Fonts (locked)
- Body/UI: **Inter** (400/500/600)
- Section heads: **Space Grotesk** (600/700/800)
- Hero/large editorial heads only: **Instrument Serif** (600/700)

## Implementation steps
1. **Font loading**
   - Add font imports in `frontend/src/index.css` (Google Fonts or local files).
   - Prefer `display=swap` and subset weights.
2. **Tailwind font families**
   - In `frontend/tailwind.config.js`, set:
     - `fontFamily.sans` → Inter stack
     - `fontFamily.display` → Space Grotesk stack
     - `fontFamily.serifDisplay` → Instrument Serif stack
3. **Type scale**
   - Establish a consistent scale (mobile first):
     - Hero H1: serifDisplay, ~`text-4xl` mobile → `text-6xl` desktop.
     - Section H2: display, ~`text-3xl` mobile → `text-5xl` desktop.
     - Body: sans, `text-base` mobile → `text-lg` desktop.
   - Define line‑height standards (`leading-tight` for heads, `leading-relaxed` for body).
4. **Apply in primitives**
   - Buttons/Inputs/Tabs use sans; section heads use display by default.
5. **Apply in marketing sections**
   - Update `Hero`, `HowItWorks`, `PricingSection`, `CallToAction`, `Footer`, etc to use new families/scale.
6. **Document usage**
   - Add “Typography” section in `frontend/TAILWIND_GUIDE.md` with examples and when serif is allowed.

## Deliverables
- Fonts loaded with no FOIT issues.
- Tailwind families + scale defined.
- Key surfaces updated to new hierarchy.

## Acceptance criteria
- Site reads as modern editorial on mobile and desktop.
- Serif appears only in hero/large heads, nowhere else.
- Lighthouse/web‑vitals font loading remains healthy.

## Risks / mitigations
- **Risk:** Overuse of serif dilutes minimal feel.  
  **Mitigation:** lint by convention + keep serif usage to one component family (`Hero`).

