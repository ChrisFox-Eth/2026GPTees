# Ticket 009 — Transactional Email Overhaul (Resend)

**Goal:** Re‑tone and re‑template all transactional emails to match the new editorial brand and remove AI/GPT phrasing.

**Owner:** TBD | **Priority:** P1 | **Status:** TODO

## Scope
- `backend/src/services/email.service.ts` templates:
  - Order confirmation
  - Design approved
  - Order shipped
  - Abandoned checkout reminder
  - Studio tips email (prompt guide)
  - Gift code email

## Implementation steps
1. **Template base**
   - Create a single clean editorial HTML frame:
     - paper background, ink text, cobalt CTA.
     - consistent header/footer.
2. **Subjects (locked)**
   - Order confirmed: “Order confirmed — your preview is ready”
   - Design approved: “Approved — we’re printing your tee”
   - Shipped: “On the way — your tee has shipped”
   - Abandoned checkout: “Your tee is waiting”
   - Studio tips: “Studio tips for a print‑ready design”
   - Gift code: “Your GPTees gift code”
3. **Body language**
   - Remove: “AI‑powered”, “AI tee”, “GPTee” overuse, “redraw until you love it”.
   - Frame drafts as optional exploration, not a quality fallback.
4. **Mobile readability**
   - Large type, short paragraphs, 44px+ CTA buttons.
5. **Final sweep**
   - Grep email file for banned terms.

## Deliverables
- Updated email templates and subjects.

## Acceptance criteria
- Emails read like a fashion brand studio note.
- No banned terms appear (except legal footers if required).

## Risks / mitigations
- **Risk:** Inline HTML duplication becomes messy.  
  **Mitigation:** factor shared template function in the service if needed.

