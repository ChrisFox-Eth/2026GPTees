/**
 * @module types/preview
 * @description Preview flow related types for guest/unauth flows.
 */

export interface PendingGuestPreview {
  orderId: string;
  guestToken: string;
  prompt: string;
  style: string;
}
