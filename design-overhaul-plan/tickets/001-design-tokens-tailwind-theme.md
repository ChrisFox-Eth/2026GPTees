# Ticket 001 — Design Tokens + Tailwind Theme (Warm Neutrals + Cobalt)

**Goal:** Encode the new editorial palette and core UI tokens into Tailwind + CVA variants so the entire app can be re‑skinned consistently.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- A fashion‑brand feel starts with a coherent system: neutrals, ink, surfaces, and a single accent.
- Tokenizing early prevents piecemeal styling later.

## Scope
- Update Tailwind theme to the locked palette and semantic neutrals.
- Define a minimal spacing/radius/shadow scale that supports editorial layouts.
- Update CVA variant bases (Buttons, Cards, Inputs, etc.) to use tokens.

## Palette (locked)
- Paper / warm off‑white: `#F7F5F2`
- Ink / near black: `#0E0F12`
- Muted gray: `#8C8F96`
- Surface white: `#FFFFFF`
- Surface gray: `#F0F1F3`
- Accent cobalt: `#2F6BFF`
- Accent soft: `#E6EDFF`

## Implementation steps
1. **Tailwind colors**
   - In `frontend/tailwind.config.js`, add semantic groups:
     - `paper`, `ink`, `muted`, `surface`, `surface-2`, `accent`, `accent-soft`
   - Keep existing `primary/secondary/success/warning/danger` if still used, but remap `primary` to cobalt family for backward compatibility.
2. **Dark mode neutrals**
   - Define dark equivalents (warm darks, not pure black), e.g.:
     - `paper-dark`, `surface-dark`, `ink-dark`, `muted-dark`, `accent-dark`
   - Update base layer in `frontend/src/index.css` to use these tokens instead of raw `white/gray`.
3. **Token scale**
   - Define consistent:
     - Radii: `sm/ md/ lg/ xl` tuned for editorial cards.
     - Shadows: `soft/ medium/ lifted` (subtle).
     - Spacing rhythm: ensure section padding aligns (e.g., 16/24/32/48/64).
4. **CVA variant updates**
   - Update base classes in primitives under `frontend/src/components/ui/**`:
     - Buttons: ink text on paper, cobalt primary, soft hover states.
     - Cards/Modals: paper/surface backgrounds, gentle borders, soft shadow.
     - Inputs: minimal borders, strong focus ring in accent.
5. **Replace hardcoded colors**
   - Sweep for `bg-white`, `text-gray-*`, `bg-primary-*` in primitives and key sections to prefer semantic tokens.
6. **Documentation**
   - Add a “Design Tokens” section to `frontend/TAILWIND_GUIDE.md`.

## Deliverables
- Updated Tailwind config with semantic colors and scales.
- Updated UI primitive variants using tokens.
- Base `index.css` uses paper/ink tokens.

## Acceptance criteria
- Marketing + commerce surfaces render with warm neutrals and cobalt accents without manual per‑component tweaks.
- No new custom CSS introduced outside `index.css`.
- Visual regression is controlled (colors shift as intended, layout stable).

## Risks / mitigations
- **Risk:** Existing `primary-*` usage conflicts with new semantics.  
  **Mitigation:** remap `primary` to cobalt and migrate to semantic tokens gradually.

