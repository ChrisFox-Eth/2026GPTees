/**
 * @module types/preview
 * @description Preview flow related types for guest/unauth flows.
 * @since 2025-11-21
 */

/**
 * @interface PendingGuestPreview
 * @description Stores design preview information for unauthenticated guest users during the checkout flow
 *
 * @property {string} orderId - Unique identifier of the pending order associated with this preview
 * @property {string} guestToken - Authentication token for guest session validation
 * @property {string} prompt - User-provided text prompt describing the desired t-shirt design
 * @property {string} style - Selected art style/theme for the design generation
 */
export interface PendingGuestPreview {
  orderId: string;
  guestToken: string;
  prompt: string;
  style: string;
}
