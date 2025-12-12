# 006 - Checkout fast lane (mobile-first)
- File: `frontend/src/pages/CheckoutPage.tsx`.
- Move purchase CTA above the fold for mobile: insert a compact summary card right under the header with total + pay CTA:
  ```tsx
  <div className="md:hidden mb-4 bg-white dark:bg-gray-800 border ... rounded-lg p-3 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500">Ships in 5-8 business days</p>
      <p className="text-base font-semibold text-gray-900 dark:text-white">Pay ${totalWithShipping.toFixed(2)}</p>
    </div>
    <Button size="sm" onClick={handleCheckout}>Checkout</Button>
  </div>
  ```
- Form layout: change grid gaps to `gap-3` and input padding to `px-3 py-2.5`; set `inputMode="numeric"` on zip and `autoCapitalize="words"` on name fields for better mobile keyboards.
- Progress indicator: add a 3-step bar above the form (Cart → Shipping → Pay) with current step highlighted using Tailwind classes; keep it text-only for simplicity.
- Payment request prep: add a placeholder button under the main CTA `Button` with text “Pay faster with Apple/Google Pay” (secondary style) and track via `trackEvent('checkout.payment_request.click', {...})`.
- Error handling: ensure `setError` renders above the form and is dismissed when typing—add `onChange` hook to clear errors (`setError(null)`) when any input updates.
- Sticky bottom bar: reduce padding to `py-3` and change label to `className="text-sm"` so it covers less viewport on mobile.
