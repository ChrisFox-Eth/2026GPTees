# GPTees Editorial Minimal / Studio Overhaul Plan

**Purpose:** Translate the locked brand direction into a cohesive site‑wide visual + copy overhaul.  
Direction: Apple News‑style **Editorial Minimal / Studio**, Palette **Warm Studio Neutrals + Cobalt**, Typography **modern/editorial** with **Instrument Serif** reserved for hero/large heads, Motion **calm + precise**, Mobile‑first priority.  
No “AI company” framing anywhere except legal pages.

Tickets live in `design-overhaul-plan/tickets/` and are ordered to build foundations first, then re‑skin surfaces, then sweep copy/emails/QA.

## Non‑negotiables
- Never surface “AI”, “AI‑powered”, “OpenAI”, “DALL‑E”, “model”, or similar outside `TermsPage`/`PrivacyPage`.
- Never use the word **“vibe”** in user‑visible copy.
- Do not market “free previews” or “unlimited redraws” as a perk. Exploration/drafts are framed as optional creative choice, not a quality fallback.
- Mobile layouts come first; desktop is an enhancement.
- Motion is subtle and editorial: no bouncy springs, no gimmicks.

## Ticket index (ordered)
1. `001-design-tokens-tailwind-theme.md` — Palette + spacing/radius/shadow tokens in Tailwind and CVA variants.
2. `002-typography-system.md` — Font loading + Tailwind typography scale (Inter / Space Grotesk / Instrument Serif).
3. `003-motion-language-primitives.md` — Motion tokens + update Motion components and route transitions.
4. `004-visual-assets-lookbook-plan.md` — Lifestyle/mockup/texture asset requirements and placement plan.
5. `005-homepage-editorial-redesign.md` — Home marketing surfaces re‑layout + motion + copy.
6. `006-shop-and-product-surfaces-redesign.md` — Shop grid + ProductCard/Modal redesign.
7. `007-studio-design-flow-redesign.md` — Quickstart + DesignPage studio experience polish.
8. `008-appwide-copy-sweep.md` — Remove banned terms and re‑tone copy everywhere.
9. `009-transactional-emails-overhaul.md` — Resend templates editorial refresh.
10. `010-mobile-qa-accessibility.md` — Mobile QA + reduced‑motion + contrast/a11y pass.

## Dependencies
- Assumes `repo-cleanup-plan` is complete through tickets 8–11 (Tailwind sorting, CSS policy, component hierarchy, backend dead‑code).  
If any are still pending, finish them first to avoid overlapping diffs.

