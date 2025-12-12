/**
 * @module services/email-templates
 * @description Centralized email template system for GPTees transactional emails.
 * Provides a base template and specific email builders with editorial styling.
 * @since 2025-12-11
 */

/** Email template configuration */
export interface EmailTemplateConfig {
  subject: string;
  preheader?: string;
  heading: string;
  body: string[];
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

/** Brand colors for email templates */
const BRAND = {
  paper: '#F7F5F2',
  ink: '#0E0F12',
  muted: '#8C8F96',
  accent: '#2F6BFF',
  surface: '#FFFFFF',
  /** Logo hosted on Supabase Storage for email clients */
  logoUrl: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/assets/gptees-logo.png',
} as const;

/** Social media links for email footer */
const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/gptees.app' },
  { name: 'Facebook', href: 'https://facebook.com/gpteesapp' },
  { name: 'TikTok', href: 'https://tiktok.com/@gptees.app' },
] as const;

/**
 * Base HTML email template with editorial styling
 *
 * @param {EmailTemplateConfig} config - Email template configuration
 * @returns {string} Complete HTML email string
 *
 * @example
 * const html = buildEmailHtml({
 *   heading: 'Order Confirmed',
 *   body: ['Thanks for your order!'],
 *   ctaText: 'View Order',
 *   ctaUrl: 'https://example.com/order/123'
 * });
 */
export function buildEmailHtml(config: EmailTemplateConfig): string {
  const { heading, body, ctaText, ctaUrl, footerNote } = config;

  const bodyHtml = body.map(p => `<p style="margin: 0 0 16px; line-height: 1.6;">${p}</p>`).join('');

  const ctaHtml = ctaText && ctaUrl ? `
    <div style="margin: 32px 0; text-align: center;">
      <a href="${ctaUrl}" style="
        display: inline-block;
        background-color: ${BRAND.accent};
        color: #FFFFFF;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 8px;
        min-width: 200px;
      ">${ctaText}</a>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: ${BRAND.paper};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: ${BRAND.ink};
  line-height: 1.5;
">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <img
        src="${BRAND.logoUrl}"
        alt="GPTees"
        width="120"
        height="auto"
        style="display: block; margin: 0 auto;"
      />
    </div>

    <!-- Main Content -->
    <div style="
      background-color: ${BRAND.surface};
      border-radius: 12px;
      padding: 40px 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    ">
      <h2 style="
        margin: 0 0 24px;
        font-size: 28px;
        font-weight: 700;
        color: ${BRAND.ink};
        text-align: center;
      ">${heading}</h2>

      <div style="font-size: 16px; color: ${BRAND.ink};">
        ${bodyHtml}
      </div>

      ${ctaHtml}

      ${footerNote ? `<p style="margin: 24px 0 0; font-size: 14px; color: ${BRAND.muted}; text-align: center;">${footerNote}</p>` : ''}
    </div>

    <!-- Footer -->
    <div style="
      margin-top: 40px;
      text-align: center;
      font-size: 14px;
      color: ${BRAND.muted};
    ">
      <!-- Social Links -->
      <div style="margin-bottom: 16px;">
        ${SOCIAL_LINKS.map(s => `<a href="${s.href}" style="display: inline-block; margin: 0 8px; color: ${BRAND.muted}; text-decoration: none;" target="_blank">${s.name}</a>`).join('<span style="color: ${BRAND.muted};">·</span>')}
      </div>
      <p style="margin: 0 0 8px;">GPTees - Custom apparel from your imagination</p>
      <p style="margin: 0;">
        <a href="https://gptees.app" style="color: ${BRAND.muted};">gptees.app</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Pre-built email templates

/**
 * All available email template configurations
 */
export const EMAIL_TEMPLATES = {
  /**
   * Order confirmation email sent after successful payment
   *
   * @param {string} orderNumber - Order number to display
   * @param {string} designPageUrl - URL to design generation page
   * @returns {EmailTemplateConfig} Email template configuration
   */
  orderConfirmed: (orderNumber: string, designPageUrl: string): EmailTemplateConfig => ({
    subject: 'Order confirmed — your preview is ready',
    heading: 'Order Confirmed',
    body: [
      `Thanks for your order! Your preview is ready.`,
      `Order #${orderNumber}`,
      `Head to your design studio to review and approve your design.`,
    ],
    ctaText: 'View Your Design',
    ctaUrl: designPageUrl,
    footerNote: 'We will begin printing once you approve your design.',
  }),

  /**
   * Design approval confirmation email
   *
   * @param {string} orderNumber - Order number to display
   * @returns {EmailTemplateConfig} Email template configuration
   */
  designApproved: (orderNumber: string): EmailTemplateConfig => ({
    subject: 'Approved — we\'re printing your tee',
    heading: 'Design Approved',
    body: [
      `Great choice! Your design has been approved and sent to print.`,
      `Order #${orderNumber}`,
      `You'll receive tracking information once your tee ships.`,
    ],
    footerNote: 'Estimated delivery: 5-8 business days after shipping.',
  }),

  /**
   * Shipping notification email
   *
   * @param {string} orderNumber - Order number to display
   * @param {string} [trackingUrl] - Optional tracking URL
   * @returns {EmailTemplateConfig} Email template configuration
   */
  orderShipped: (orderNumber: string, trackingUrl?: string): EmailTemplateConfig => ({
    subject: 'On the way — your tee has shipped',
    heading: 'Your Tee Has Shipped',
    body: [
      `Your custom tee is on its way!`,
      `Order #${orderNumber}`,
      trackingUrl ? `Track your package to see delivery updates.` : `You'll receive updates as your package moves.`,
    ],
    ctaText: trackingUrl ? 'Track Package' : undefined,
    ctaUrl: trackingUrl,
  }),

  /**
   * Abandoned checkout reminder email
   *
   * @param {string} resumeUrl - URL to resume checkout
   * @returns {EmailTemplateConfig} Email template configuration
   */
  abandonedCheckout: (resumeUrl: string): EmailTemplateConfig => ({
    subject: 'Your tee is waiting',
    heading: 'Still Thinking?',
    body: [
      `You left something in your cart.`,
      `Your design idea is saved and ready whenever you are.`,
    ],
    ctaText: 'Complete Your Order',
    ctaUrl: resumeUrl,
  }),

  /**
   * Design studio tips email
   *
   * @param {string} designPageUrl - URL to design generation page
   * @returns {EmailTemplateConfig} Email template configuration
   */
  studioTips: (designPageUrl: string): EmailTemplateConfig => ({
    subject: 'Studio tips for a print-ready design',
    heading: 'Studio Tips',
    body: [
      `Here are some tips to get the best results:`,
      `<strong>Be specific:</strong> Describe colors, style, and mood clearly.`,
      `<strong>Keep it simple:</strong> One main subject works best for apparel.`,
      `<strong>Think contrast:</strong> Bold designs stand out on fabric.`,
    ],
    ctaText: 'Start Designing',
    ctaUrl: designPageUrl,
  }),

  /**
   * Gift code email
   *
   * @param {string} code - Gift code to display
   * @param {string} redeemUrl - URL to redeem the gift code
   * @returns {EmailTemplateConfig} Email template configuration
   */
  giftCode: (code: string, redeemUrl: string): EmailTemplateConfig => ({
    subject: 'Your GPTees gift code',
    heading: 'You\'ve Got a Gift!',
    body: [
      `Someone special sent you a custom tee experience.`,
      `<div style="background: #F0F1F3; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin: 16px 0;">${code}</div>`,
      `Use this code at checkout to create your own unique design.`,
    ],
    ctaText: 'Redeem Your Gift',
    ctaUrl: redeemUrl,
  }),
};
