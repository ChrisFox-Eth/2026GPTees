# 010 — Decisions & open questions for preview-first flow

## Decisions needed
1) **Preview status naming**: Introduce `PREVIEW` or reuse `PENDING_PAYMENT` for pre-payment design orders? 
Answer: Reuse PENDING_PAYMENT
2) **Preview limits**: Basic = 1 preview; Premium = unlimited or capped (how many)? Homepage free preview cap?
Answer: See answer 3
3) **Upgrade path**: Allow tier change (Basic→Premium) mid-preview? If yes, how to adjust price/order before checkout?
Answer: Here is how I am thinking about questions 2 and 3 together:

User visits gptees.app homepage for the first time. They are not signed in.
User creates a prompt via QuickStart. QuickStart assumes it's a Premium.
We begin creating this as an 'order' immediately for this temporary user - we begin the image generation, it gets put into PENDING_PAYMENT status, etc. 
In order to see that prompt, user needs to be logged in.
If the user did already have an account, and they do just sign in to an existing account, we'll need to get that order into their account. If the user creates a brand new account, we associate this order (and their design) with it.
Now, that the user has their account, they can go to their Account page and see their design.
From their account page they can see the status of their orders and they should see the PENDING_PAYMENT status for their order, allowing them to review the design, or retry a new prompt, and continue until they approve it (and select size/color before checkout).

ALTERNATIVELY - if a user doesn't use QuickStart, and either uses the bottom footer or purchases via /shop, or otherwise goes with Classic instead of Limitless, we just need to make sure the user is then capped at 1 design as they currently are. We can let them see the design, have the option to check out, or try again (which instantly becomes a Limitless GPTee). And that's our upgrade path. Basically let's get the user hooked and happy with the design first, and use that as their means of creating an account/checking out and purchasing the shirt.

Ultimately, the user should be able to see their design, AND choose size and color at the time of checking out.
4) **Auto-approve on payment**: Should payment imply approval and trigger fulfillment automatically? If yes, which design is used (latest/selected)?
Answer: No.
5) **Watermark/resolution**: Apply watermark or lower-res for previews to deter misuse? If yes, when to strip before fulfillment?
Answer: Not necessary at the moment.
6) **Preview order lifecycle**: Limit one active preview per user? Expire/cleanup stale preview orders after X hours/days?
Answer: No.
7) **Multiple items**: Permit preview flow only for single-item orders, or support multi-item carts?
Answer: Prefer single-item preview orders to keep design-to-line-item mapping simple and Stripe/Printful reuse safe. If multi-item must be supported later, bind one design per line item and verify checkout reuse remains stable.
8) **Unauthenticated users**: Create preview order before login or require login first? How to preserve prompt/design on login redirect?
Answer: See above.
9)  **Color mock coverage**: Do we have per-color blank mock images? If not, can we accept a single neutral mock with a note?
Answer: No.
10) **Placement control roadmap**: Do we prioritize 2D drag placement now, or defer to later (3D/AR research outcome)?
Answer: Defer to later; ship static overlay first (ticket 007) and cover placement research in ticket 009.

## Clarifications requested (from recent plan)
- Should “Try again” on homepage automatically switch to Premium/Limitless pricing, or prompt before upgrade? (Prompt)
- Post-payment redirect: return to Design page, Order confirmation, or auto-approved “printing now” view? (Order confirmation)
- Content moderation for uploads: any requirements beyond file type/size? (None)
