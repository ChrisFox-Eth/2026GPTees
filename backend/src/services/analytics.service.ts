/**
 * @module services/analytics
 * @description Lightweight analytics dispatcher for server-side events. Sends events to a configurable webhook endpoint for tracking user actions, business metrics, and system events.
 * @since 2025-11-21
 */

/**
 * Analytics payload interface
 * @interface AnalyticsPayload
 * @property {string} event - Event name identifier
 * @property {Record<string, any>} properties - Event properties and metadata
 */
interface AnalyticsPayload {
  event: string;
  properties: Record<string, any>;
}

const ANALYTICS_WEBHOOK_URL = process.env.ANALYTICS_WEBHOOK_URL;

/**
 * @function sendAnalyticsEvent
 * @description Sends an analytics event to a configurable webhook endpoint. Silently fails if webhook URL is not configured or if the request fails, preventing analytics errors from impacting application functionality.
 *
 * @param {AnalyticsPayload} payload - Event data containing event name and properties
 * @param {string} payload.event - Name of the event being tracked (e.g., 'order.paid', 'design.generated')
 * @param {Record<string, any>} payload.properties - Event metadata and properties
 *
 * @returns {Promise<void>} Resolves when the event is sent or silently fails
 *
 * @example
 * await sendAnalyticsEvent({
 *   event: 'order.paid',
 *   properties: {
 *     order_id: '123',
 *     amount: 29.99,
 *     tier: 'LIMITLESS'
 *   }
 * });
 *
 * @async
 */
export async function sendAnalyticsEvent(payload: AnalyticsPayload): Promise<void> {
  if (!ANALYTICS_WEBHOOK_URL) {
    return;
  }

  try {
    await fetch(ANALYTICS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Analytics dispatch failed', error);
  }
}
