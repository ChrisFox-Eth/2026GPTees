/**
 * @module types/domEvents
 * @description DOM event payload types used across the frontend.
 * @since 2025-12-12
 */

/**
 * @interface QuickstartPrefillEventDetail
 * @description Payload detail for the `gptees.quickstart.prefill` DOM event.
 */
export interface QuickstartPrefillEventDetail {
  /** Optional prompt to prefill into the Quickstart prompt field. */
  prompt?: string;
}
