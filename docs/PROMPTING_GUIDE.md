<!--
Simple internal guide for prompt behavior and tuning.
Keep this doc product-agnostic: we generate print-ready graphics, not product mockups.
-->

# Prompting Guide (Image Generation)

This app generates **print-ready artwork** via OpenAI image generation. The most important behavior is: we take a user’s prompt, add style + guardrails on the backend, then send the final prompt to DALL·E 3.

If you want to reduce “shirt mockups”, backgrounds, unwanted text, etc., you almost always want to change the backend prompt augmentation (not the frontend).

## End-to-end Flow

1. **Frontend collects prompt + style**
   - Quickstart (Creation Corridor) uses `style: 'trendy'` by default.
   - Design workspace uses a `selectedStyle` state.
2. **Frontend calls API**
   - Auth: `POST /api/designs/generate` (requires auth)
   - Guest: `POST /api/designs/generate/guest`
3. **Backend moderates the raw prompt**
   - Uses OpenAI Moderation API on the **raw** user prompt.
4. **Backend augments the prompt**
   - Normalizes some product-trigger words.
   - Adds a style suffix (if provided).
   - Adds print-ready guardrails (centered, high contrast, plain background, avoid mockups).
   - Optionally blocks text unless the prompt appears to explicitly request text.
5. **Backend calls OpenAI image generation**
   - Model: `dall-e-3`
   - Saves both the user prompt and the model’s `revised_prompt` for later inspection.

## Where Prompt Augmentation Happens

All prompt shaping is in:

- `backend/src/services/openai.service.ts`

Key pieces:

### 1) Base prompt normalization

`normalizeBasePrompt()` is a light-touch sanitizer that currently replaces common “t‑shirt” variants with `graphic` to reduce accidental product-mockup generations.

If you add more products (hoodies, mugs, mousepads), consider expanding this carefully (see “Common problems” below).

### 2) Style presets

`STYLE_PROMPTS` maps UI style values to a suffix appended to the prompt.

To tune styles:
- Adjust wording inside `STYLE_PROMPTS`.
- Keep them short and visual (“clean vector”, “bold outlines”, “muted retro palette”, etc.).

### 3) Print-ready guardrails (most important)

`enhancePrompt()` appends an instruction block that biases toward:
- Standalone graphic illustration (not product photography/mockups)
- Centered composition
- High contrast / clean edges
- Plain/transparent/solid background (no scene)

This is the primary fix for: shirts/hangers/mannequins, room scenes, posters-on-walls, etc.

### 4) Text allowance heuristic

By default we append “No text/letters/numbers…” to reduce gibberish typography and watermarks.

If the prompt looks like it explicitly wants typography (quotes, “text”, “slogan”, “monogram”, etc.), we **do not** append the “No text…” rule.

This means:
- Non-typography prompts get cleaner art.
- Typography prompts still work without building a dedicated text feature.

## Files You’ll Usually Edit

Backend prompt logic:
- `backend/src/services/openai.service.ts` (normalization, styles, guardrails, text rules)

Where prompt/style is received and saved:
- `backend/src/controllers/design.controller.ts` (stores `prompt` + `revisedPrompt`)

Frontend prompt sources (idea lists / default style):
- `frontend/src/components/sections/Quickstart/Quickstart.tsx` (rotating idea prompts; default `trendy`)
- `frontend/src/components/sections/SocialProofStrip/SocialProofStrip.tsx` (short rotating blurbs)
- `frontend/src/pages/DesignPage.tsx` (prompt input + `selectedStyle`)

## Common Problems & How To Correct Them

### Problem: The output includes a shirt, hanger, mannequin, or product mockup

Actions:
- Strengthen the guardrails line in `enhancePrompt()`:
  - Add explicit negatives: “no apparel, no hangers, no mannequin, no flat-lay, no product photography, no mockup template”.
- Expand normalization to catch product framing phrases:
  - Example patterns: “design for a hoodie”, “printed on a mug”, “on a mousepad”.
  - Prefer replacing/stripping the **product framing** (“for a hoodie”) rather than the product word everywhere (so “a wizard holding a mug” still works).

### Problem: Background scenes keep showing up

Actions:
- Make the “no background scene” line more explicit:
  - “No scenery/environment. No room/interior/exterior. Isolated subject only.”
- Add “single subject with margin/padding” to reduce edge-to-edge scenes.

### Problem: Text appears when it shouldn’t (or gibberish text shows up)

Actions:
- Keep the default “No text…” rule in place.
- If you want to be stricter, remove the typography detection and always add “No text…”.
- If you want better typography results without new UI, instruct users (or presets) to include the exact phrase in quotes (our heuristic already treats quotes as text intent).

### Problem: Too photographic / not graphic enough

Actions:
- Add to the guardrails: “vector illustration”, “screenprint-friendly”, “flat colors”, “bold outline”.
- Or tune style presets to bias toward illustration rather than photorealism.

## Quick QA Prompts (Old system was likely worse)

These used to often generate product mockups because they included “t‑shirt” framing. With the new normalization + anti-mockup guardrails, they should more consistently produce standalone art:

1. `t-shirt design: astronaut standing on the moon, black and white, high contrast`
2. `tee shirt graphic: cute snowman and dog, winter theme, bright colors`
3. `tshirt print: vintage surf wave badge, halftone shading, bold outline`
4. `t-shirt artwork: neon dragon emblem, crisp vector edges`
5. `a t-shirt idea: crystal heart cracked open with tiny lightning inside`

Tip: After generation, compare `prompt` vs `revisedPrompt` in the saved design record to see how the model interpreted the request.

