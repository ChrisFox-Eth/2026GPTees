# Ticket 008 — App‑Wide Copy Sweep (No AI, No “Vibe”, No “Free/Unlimited” Flaunting)

**Goal:** Ensure every user‑visible string aligns with the new brand voice and constraints.

**Owner:** TBD | **Priority:** P0 | **Status:** TODO

## Why
- Residual copy can undo the brand shift even if visuals change.

## Scope
- Sweep all frontend `.tsx` and backend email templates for banned terms and tone mismatches.
- Leave factual AI references only in `TermsPage` and `PrivacyPage`.

## Banned / replace list
- **Ban outright:** “vibe”.
- **Remove outside legal:** “AI”, “AI‑powered”, “OpenAI”, “DALL‑E”, “model”, “generator”.
- **Reframe:** “free preview”, “unlimited redraws”, “we redraw until you love it”.

## Preferred vocabulary
- “studio”, “draft”, “option”, “direction”, “design”, “artwork”, “preview”, “approve”.
- “Describe your idea” instead of “prompt”.
- “Create draft” instead of “generate”.

## Implementation steps
1. Grep for banned terms and create a hit list.
2. Update marketing surfaces first (Home, Shop, Gift).
3. Update studio/commerce microcopy (Quickstart, DesignPage, Cart, Checkout, Account, OrderDetail).
4. Review legal pages:
   - keep AI wording but tighten to neutral/factual if desired.
5. Final grep to confirm no banned terms remain outside legal.

## Deliverables
- Copy updated everywhere to match voice.

## Acceptance criteria
- Zero banned terms outside `TermsPage`/`PrivacyPage`.
- Copy reads as contemporary fashion brand, not tech product.

## Risks / mitigations
- **Risk:** Over‑editing breaks meaning in edge cases.  
  **Mitigation:** verify flows after edits; keep labels precise.

