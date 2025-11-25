/**
 * @module services/analytics
 * @description Lightweight analytics dispatcher for server-side events.
 */

interface AnalyticsPayload {
  event: string;
  properties: Record<string, any>;
}

const ANALYTICS_WEBHOOK_URL = process.env.ANALYTICS_WEBHOOK_URL;

/**
 * Send an analytics event to a configurable webhook.
 * @param {AnalyticsPayload} payload - Event name and properties.
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
