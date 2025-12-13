# GPTees Execution Questionnaire (Fill-in + Repo-Based Draft)

Repo: `ChrisFox-Eth/2026GPTees`

## How to use this doc

- Edit the **Draft answer** fields into your **Final answer**.
- If a question has **Repo-based observation: Not found**, the repo did not contain an explicit answer.
- Keep the **Evidence** links so decisions stay auditable.

## Owner clarifications (2025-12-13)

- **Pricing/SKU**: One physical product price: **$54.99** (single primary SKU). Gift cards exist as a separate product/SKU.
- **Promotion**: Code `HAPPYHOLIDAYS` = **20% off** orders (time-limited).
- **Unlimited designs (positioning)**: Unlimited redesigns is intended as a differentiator/marketing lever; expectation is most users are happy within **~1–3 prompts**.
- **Safeguards (if needed later)**: downgrade model/settings after X attempts, caching/deduping, rate limits.

**Evidence (repo + config):**
- `frontend/src/utils/holidayPromo.ts` (code + percent)
- `backend/src/config/pricing.ts` (tier price default)
- `frontend/src/components/sections/PricingSection/PricingSection.tsx` (single-tier UI default)

## Quick repo snapshot (what exists today)

- **Preview-first flow** (design before payment): preview orders in `PENDING_PAYMENT` with guest claim support.
- **Design generation**: OpenAI DALL·E 3 image generation + OpenAI Moderation API; image is uploaded to Supabase Storage in the background.
- **Design limits**: enforced per order via `orders.designsGenerated` vs `orders.maxDesigns`.
- **Checkout + fulfillment**: Stripe checkout + Printful order submission; fulfillment is gated until payment.
- **Shipping**: flat rate by destination country.
- **Promo support**: promotion config exists for `HAPPYHOLIDAYS`.

Evidence:
- `docs/README_PREVIEW_FLOW.md`
- `docs/order-status-state-machine.generated.md`
- `backend/src/controllers/order.controller.ts`
- `backend/src/controllers/design.controller.ts`
- `backend/src/services/openai.service.ts`
- `backend/src/services/stripe.service.ts`
- `backend/src/services/printful.service.ts`
- `backend/src/config/shipping.ts`
- `docs/OPERATIONS_GUIDE.md`
- `frontend/src/utils/holidayPromo.ts`

---

## 1) Product Reality & Scope Control

**Translation goal:** Turn “we will build X, Y, Z” into “we will build this first, and delay everything else.”

### Q1.1 — What is the non-negotiable MVP for GPTees in the next 90 days?

**Repo-based observation (what exists today):**
- The repo already supports:
  - Preview order creation (including guest preview + claim)
  - AI design generation tied to an order
  - Stripe checkout for that order
  - Design approval gated behind payment
  - Printful submission after approval

**Draft answer (repo-based):**
- MVP appears to be a **single-product flow**:
  - Create a preview order (guest or authed)
  - Generate designs until user chooses one
  - Checkout and pay
  - Approve design after payment
  - Submit to Printful and track fulfillment

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `docs/README_PREVIEW_FLOW.md`
- `docs/OPERATIONS_GUIDE.md`
- `backend/src/controllers/order.controller.ts`
- `backend/src/controllers/design.controller.ts`
- `backend/src/services/stripe.service.ts`
- `backend/src/services/printful.service.ts`

### Q1.2 — What will not exist yet, even if it’s in the vision?

**Repo-based observation:**
- The repo does not contain any implemented “Vault / collectibles / Slabbies” mechanics.
- Static overlay previews and uploads are explicitly called out as backlog items.

**Draft answer (repo-based):**
- Likely not in v1 (based on repo + docs):
  - Vault/collectibles marketplace mechanics
  - Interactive placement editor
  - Upload-your-own artwork flow

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `docs/README_PREVIEW_FLOW.md` (Known Next Steps / Backlog)

### Q1.3 — Which features are explicitly postponed until after revenue proof?

**Repo-based observation:**
- Not explicitly stated in a single canonical “scope” document.
- The preview-flow doc does list next steps/backlog items.

**Draft answer (repo-based):**
- Explicitly postponed (called out as “next steps/backlog”):
  - Static overlay shirt previews per color
  - Interactive placement research
  - Uploads and associated moderation rules

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `docs/README_PREVIEW_FLOW.md`

### Q1.4 — What is the single user action that defines success in v1?

Options:
- Design created?
- Shirt purchased?
- Repeat purchase?

**Repo-based observation:**
- The product is architected end-to-end around a **paid order + fulfillment** lifecycle (Stripe + Printful gating).
- There are analytics events for both design generation and payment completion.

**Draft answer (repo-based, inferred):**
- Most defensible “success” signal in the current implementation is: **a paid order** (shirt purchased).

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `docs/order-status-state-machine.generated.md`
- `backend/src/services/stripe.service.ts`
- `backend/src/services/printful.service.ts`
- `docs/analytics-events.md`

---

## 2) AI Cost Control & Abuse Prevention

**Translation goal:** Replace “unlimited redraws” with “perceived abundance + actual limits.”

### Q2.1 — What does one average design session cost you today in AI usage?

**Repo-based observation:**
- Not tracked in code.
- The backend calls OpenAI image generation with:
  - model: `dall-e-3`
  - `n: 1`
  - `quality: 'standard'`
  - default size: `1024x1024`

**Draft answer (repo-based):**
- **Unknown (not in repo).** To answer, you’d need:
  - OpenAI billing export, or
  - add server-side logging of image generation calls + cost estimates.

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/services/openai.service.ts`

### Q2.2 — What is the hard cap on AI spend per user before checkout?

**Repo-based observation:**
- The only enforced cap visible is **designs per order** via `maxDesigns`.
- `maxDesigns` is configurable via database `settings` (operator-editable).
- There is no visible “per user lifetime” spend cap in code.

**Draft answer (repo-based):**
- Current cap mechanism = `orders.maxDesigns`.
- There is **no per-user hard cap**; a user (or guest) can create multiple preview orders.

**Owner note (clarified):**
- Unlimited is intentionally part of the offer; safeguards can be added later if needed.

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/controllers/design.controller.ts` (design limit check)
- `backend/prisma/schema.prisma` (`designsGenerated`, `maxDesigns`)
- `docs/OPERATIONS_GUIDE.md` (settings table keys)

### Q2.3 — Are redraws gated by time / soft limits / design credits?

**Repo-based observation:**
- Gating is by **count** only (`designsGenerated < maxDesigns`).
- No time-based gating and no “credits” system exists in the repo.

**Draft answer (repo-based):**
- Redraw gating is **count-based per order** only.

**Owner note (clarified):**
- “Unlimited” is the marketing promise; the practical implementation can remain “unlimited-feeling” while adding hidden guardrails.

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/controllers/design.controller.ts`

### Q2.4 — Intent signals (size/color selected, login, email capture)?

**Repo-based observation:**
- Preview orders require product variant selection (size/color) at creation.
- Guests can generate designs before login; login happens later via claim.
- No explicit “email capture before generation” exists; guest email is synthetic.

**Draft answer (repo-based):**
- Current intent signals available in the flow:
  - Variant selected (size/color) at preview creation
  - Login occurs later for guests (claim step)

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/controllers/order.controller.ts` (`/preview` and `/preview/guest`)
- `docs/README_PREVIEW_FLOW.md`

### Q2.5 — What happens if a user never buys and just farms images?

**Repo-based observation:**
- The flow allows design generation on `PENDING_PAYMENT` orders (preview) for both authed users and guests.
- There is no watermark/downscale.
- There is no rate limiter found in the repo.

**Draft answer (repo-based):**
- Today, a determined user can farm images by:
  - generating many designs on a single preview order if `maxDesigns` is high, and/or
  - creating multiple guest preview orders.

**Owner note (clarified):**
- Current strategy assumes most real shoppers converge in 1–3 prompts; if abuse shows up, add safeguards (model/quality downgrade after X, caching/deduping, rate limits).

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `docs/README_PREVIEW_FLOW.md` (explicit “No watermarking or downscaling (by design)”)
- `backend/src/policies/order-policy.ts` (generation allowed on `PENDING_PAYMENT`)
- `backend/src/controllers/design.controller.ts`

---

## 3) Unit Economics You Can Defend

**Translation goal:** Turn placeholder brackets into numbers you’re willing to swear under oath.

### Q3.1 — Current all-in COGS per shirt (Printful base cost, shipping, packaging/returns allowance)

**Repo-based observation:**
- The repo does not store or compute Printful base cost / COGS.
- Shipping *charged to customer* is implemented as flat rates.
- `products.basePrice` exists in DB but is not clearly used as a COGS field.

**Draft answer (repo-based):**
- **Unknown (not in repo).** The repo contains customer shipping charges, not your true COGS.

**Final answer (edit):**
- Printful base cost: [FILL IN]
- Shipping cost (your cost): [FILL IN]
- Packaging/returns allowance: [FILL IN]
- All-in COGS: [FILL IN]

**Evidence:**
- `backend/src/config/shipping.ts`
- `backend/prisma/schema.prisma` (Product.basePrice)

### Q3.2 — Realistic gross margin range today?

**Repo-based observation:**
- Not in repo.
- Pricing to customer appears to be driven by tier price + shipping.

**Draft answer (repo-based):**
- **Unknown (not in repo).** Needs a COGS model + actual Printful costs.

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/services/stripe.service.ts`

### Q3.3 — What price breaks or margin improvements are available at volume?

**Repo-based observation:**
- Not in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q3.4 — At what order volume does cash-flow timing become uncomfortable?

**Repo-based observation:**
- Not in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

---

## 4) Vault & Collectibles Mechanics (Slabbies)

**Translation goal:** Turn “Vault marketplace” from a concept into a ruleset.

### Q4.1 — What does “1/1 ownership” actually mean legally and practically?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q4.2 — Can original buyers opt out of secondary sales / earn credits or royalties?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q4.3 — Who sets secondary pricing: you, the system, or the original buyer?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q4.4 — What stops someone from buying a design just to flip it?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q4.5 — What happens if a design becomes problematic later?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

---

## 5) Vertical Strategy & Focus

**Translation goal:** Show disciplined experimentation, not creative sprawl.

### Q5.1 — Which vertical launches first, and why?

**Repo-based observation:**
- Not explicitly defined in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q5.2 — What metric proves a vertical is working (conversion lift / lower CAC / higher AOV)?

**Repo-based observation:**
- The repo includes an analytics event catalog, but it’s not tied to “verticals”.

**Draft answer (repo-based):**
- Instrumentation exists for key funnel actions (checkout start/success, design generation), but a “vertical success metric” is not defined.

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `docs/analytics-events.md`

### Q5.3 — What is the kill threshold for a vertical that underperforms?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q5.4 — How much custom UX does each vertical really need vs shared UI?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

---

## 6) IP, Moderation & Legal Safety

**Translation goal:** Demonstrate that you won’t accidentally become a cease-and-desist factory.

### Q6.1 — What prompt filtering exists today?

**Repo-based observation:**
- Raw prompts are checked with OpenAI’s Moderation API.
- If moderation fails (API error), the code allows the request.
- Prompt augmentation exists to reduce product mockups and (usually) block unintended text.

**Draft answer (repo-based):**
- Existing filtering:
  - OpenAI Moderation API on the raw user prompt
  - Prompt augmentation guardrails (print-ready, no mockups, usually no text)

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/services/openai.service.ts`
- `docs/PROMPTING_GUIDE.md`

### Q6.2 — What happens when a user tries real brands / real characters / real people who didn’t consent?

**Repo-based observation:**
- No explicit IP/trademark/celebrity filtering or blocklist was found.
- The OpenAI Moderation API may flag some content, but it is not purpose-built for trademark enforcement.

**Draft answer (repo-based):**
- **Not explicitly handled in code.** Behavior likely depends on OpenAI policy enforcement + moderation flags.

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/services/openai.service.ts`

### Q6.3 — Is there a manual review layer, and when does it trigger?

**Repo-based observation:**
- No manual review workflow found.

**Draft answer (repo-based):**
- **No manual review layer exists in the repo today.**

**Final answer (edit):**
- [FILL IN]

### Q6.4 — Who eats the cost of a canceled print?

**Repo-based observation:**
- Not defined in backend logic.
- There are refund-related DB models, but this questionnaire needs business policy.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/prisma/schema.prisma` (Payment/Refund models)

---

## 7) Go-To-Market Reality Check

**Translation goal:** Move from “we will do social” to “we will test this first.”

### Q7.1 — What is your actual early marketing wedge (one platform / one community)?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q7.2 — What content has already shown traction, even anecdotally?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q7.3 — How will you test CAC without lighting money on fire?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q7.4 — What does “organic” really mean in your model?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

---

## 8) Founder Bandwidth & Execution Risk

**Translation goal:** Prove the business isn’t a single point of human failure.

### Q8.1 — How many hours per week can each founder realistically commit?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q8.2 — What work is outsourced vs owned?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q8.3 — What breaks first if demand spikes?

**Repo-based observation:**
- Potential scaling bottlenecks inferred from architecture:
  - OpenAI image generation costs and rate limits
  - Printful API responsiveness
  - Webhook reliability (Stripe/Printful)

**Draft answer (repo-based, inferred):**
- Most likely to break first:
  - OpenAI rate limits / spend
  - Async jobs (image upload to Supabase) without a durable queue
  - Webhook backlog / missed webhook events

**Final answer (edit):**
- [FILL IN]

**Evidence:**
- `backend/src/services/openai.service.ts`
- `backend/src/controllers/design.controller.ts` (background upload)
- `docs/README_PREVIEW_FLOW.md` (webhook importance)

### Q8.4 — What happens if one founder is unavailable for 30 days?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

---

## 9) Funding Logic (This Matters More Than You Think)

**Translation goal:** Make the loan feel boring, safe, and necessary.

### Q9.1 — What milestone does this loan buy you (revenue / breakeven / proof of one vertical / runway length)?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q9.2 — What is the debt service coverage ratio at low sales?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

### Q9.3 — What gets cut first if revenue lags?

**Repo-based observation:**
- Not found in repo.

**Draft answer (repo-based):**
- **Unknown (not in repo).**

**Final answer (edit):**
- [FILL IN]

---

## How I’d use your answers (from the original prompt)

Once you answer these:

- I would rewrite sections 7–13 of the plan
- Replace vision language with execution language
- Tighten scope
- Reduce perceived risk without lying
- Make this feel like a controlled machine, not a creative explosion
