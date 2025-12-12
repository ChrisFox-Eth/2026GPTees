/**
 * @module services/email
 * @description Resend email service for transactional emails. Handles all customer email communications including order confirmations, design approvals, shipping notifications, abandoned cart recovery, and gift codes.
 * @since 2025-11-21
 */

import { Resend } from 'resend';
import { EMAIL_TEMPLATES, buildEmailHtml } from './email-templates.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

/**
 * @function getFromEmail
 * @description Retrieves the configured sender email address for transactional emails.
 *
 * @returns {string} Configured from email address
 *
 * @throws {Error} When RESEND_FROM_EMAIL is not configured
 */
function getFromEmail(): string {
  if (!FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }
  return FROM_EMAIL;
}

/**
 * Email template interfaces
 */
interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderTotal: string;
  tier: string;
  itemCount: number;
  orderUrl: string;
}

interface DesignApprovedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  designImageUrl: string;
  orderUrl: string;
}

interface OrderShippedData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  orderUrl: string;
}

interface AbandonedCheckoutData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  resumeUrl: string;
  createdAt: Date;
  shipping?: number;
  subtotal?: number;
}

interface PromptGuideData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderUrl: string;
}

interface GiftCodeEmailData {
  customerName?: string;
  customerEmail: string;
  code: string;
  tier: string;
  usageLimit?: number | null;
  redeemUrl: string;
}

/**
 * @function sendOrderConfirmation
 * @description Sends order confirmation email to customer after successful payment. Includes order details, next steps, and a link to begin design generation.
 *
 * @param {OrderConfirmationData} data - Order confirmation email data
 * @param {string} data.customerName - Customer's name for personalization
 * @param {string} data.customerEmail - Customer's email address
 * @param {string} data.orderNumber - Unique order number
 * @param {string} data.orderTotal - Total order amount (formatted)
 * @param {string} data.tier - Design tier purchased
 * @param {number} data.itemCount - Number of items in order
 * @param {string} data.orderUrl - URL to design generation page
 *
 * @returns {Promise<{success: boolean, error?: string}>} Result of email send operation
 *
 * @example
 * await sendOrderConfirmation({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   orderNumber: 'ORDER-123',
 *   orderTotal: '29.99',
 *   tier: 'LIMITLESS',
 *   itemCount: 1,
 *   orderUrl: 'https://example.com/design?orderId=123'
 * });
 *
 * @async
 */
export async function sendOrderConfirmation(
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES.orderConfirmed(data.orderNumber, data.orderUrl);
    const emailHtml = buildEmailHtml(template);

    await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: template.subject,
      html: emailHtml,
    });

    console.log(`✓ Order confirmation email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @function sendDesignApproved
 * @description Sends design approval confirmation email to customer. Includes a preview of the approved design and explains the fulfillment process timeline.
 *
 * @param {DesignApprovedData} data - Design approval email data
 * @param {string} data.customerName - Customer's name for personalization
 * @param {string} data.customerEmail - Customer's email address
 * @param {string} data.orderNumber - Unique order number
 * @param {string} data.designImageUrl - URL to approved design image
 * @param {string} data.orderUrl - URL to order details page
 *
 * @returns {Promise<{success: boolean, error?: string}>} Result of email send operation
 *
 * @example
 * await sendDesignApproved({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   orderNumber: 'ORDER-123',
 *   designImageUrl: 'https://storage.example.com/design.png',
 *   orderUrl: 'https://example.com/orders/123'
 * });
 *
 * @async
 */
export async function sendDesignApproved(
  data: DesignApprovedData
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES.designApproved(data.orderNumber);
    const emailHtml = buildEmailHtml(template);

    await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: template.subject,
      html: emailHtml,
    });

    console.log(`✓ Design approved email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending design approved email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @function sendOrderShipped
 * @description Sends shipping notification email to customer when order is shipped by Printful. Includes tracking information if available.
 *
 * @param {OrderShippedData} data - Shipping notification email data
 * @param {string} data.customerName - Customer's name for personalization
 * @param {string} data.customerEmail - Customer's email address
 * @param {string} data.orderNumber - Unique order number
 * @param {string} [data.trackingNumber] - Shipping tracking number (optional)
 * @param {string} [data.trackingUrl] - Tracking URL (optional)
 * @param {string} data.orderUrl - URL to order details page
 *
 * @returns {Promise<{success: boolean, error?: string}>} Result of email send operation
 *
 * @example
 * await sendOrderShipped({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   orderNumber: 'ORDER-123',
 *   trackingNumber: '1Z999AA10123456784',
 *   trackingUrl: 'https://tracking.carrier.com/123',
 *   orderUrl: 'https://example.com/orders/123'
 * });
 *
 * @async
 */
export async function sendOrderShipped(
  data: OrderShippedData
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES.orderShipped(data.orderNumber, data.trackingUrl);
    const emailHtml = buildEmailHtml(template);

    await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: template.subject,
      html: emailHtml,
    });

    console.log(`✓ Order shipped email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending order shipped email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @function sendAbandonedCheckoutReminder
 * @description Sends abandoned cart recovery email to customers who left checkout without completing payment. Encourages them to complete their order with a direct link to resume.
 *
 * @param {AbandonedCheckoutData} data - Abandoned checkout email data
 * @param {string} data.customerName - Customer's name for personalization
 * @param {string} data.customerEmail - Customer's email address
 * @param {string} data.orderNumber - Unique order number
 * @param {string} data.resumeUrl - URL to resume checkout
 * @param {Date} data.createdAt - When the order was created
 * @param {number} [data.shipping] - Shipping amount (optional)
 * @param {number} [data.subtotal] - Items subtotal (optional)
 *
 * @returns {Promise<{success: boolean, error?: string}>} Result of email send operation
 *
 * @example
 * await sendAbandonedCheckoutReminder({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   orderNumber: 'ORDER-123',
 *   resumeUrl: 'https://example.com/checkout?orderId=123',
 *   createdAt: new Date(),
 *   subtotal: 25.00,
 *   shipping: 4.99
 * });
 *
 * @async
 */
export async function sendAbandonedCheckoutReminder(
  data: AbandonedCheckoutData
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES.abandonedCheckout(data.resumeUrl);
    const emailHtml = buildEmailHtml(template);

    await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: template.subject,
      html: emailHtml,
    });

    console.log(`Order reminder email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending abandoned checkout email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @function sendPromptGuide
 * @description Sends AI prompt writing tips email to help customers create better designs. Includes best practices and guidance for generating high-quality t-shirt designs.
 *
 * @param {PromptGuideData} data - Prompt guide email data
 * @param {string} data.customerName - Customer's name for personalization
 * @param {string} data.customerEmail - Customer's email address
 * @param {string} data.orderNumber - Unique order number
 * @param {string} data.orderUrl - URL to design generation page
 *
 * @returns {Promise<{success: boolean, error?: string}>} Result of email send operation
 *
 * @example
 * await sendPromptGuide({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   orderNumber: 'ORDER-123',
 *   orderUrl: 'https://example.com/design?orderId=123'
 * });
 *
 * @async
 */
export async function sendPromptGuide(
  data: PromptGuideData
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES.studioTips(data.orderUrl);
    const emailHtml = buildEmailHtml(template);

    await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: template.subject,
      html: emailHtml,
    });

    console.log(`Prompt tips email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending prompt guide email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @function sendGiftCodeEmail
 * @description Sends gift code email to purchaser with redemption instructions. Includes the unique gift code and usage details.
 *
 * @param {GiftCodeEmailData} data - Gift code email data
 * @param {string} [data.customerName] - Customer's name for personalization (optional)
 * @param {string} data.customerEmail - Customer's email address
 * @param {string} data.code - Unique gift code
 * @param {string} data.tier - Product tier the code is valid for
 * @param {number | null} [data.usageLimit] - Maximum number of uses allowed (null for unlimited)
 * @param {string} data.redeemUrl - URL to redeem the gift code
 *
 * @returns {Promise<{success: boolean, error?: string}>} Result of email send operation
 *
 * @example
 * await sendGiftCodeEmail({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   code: 'GIFT123ABC',
 *   tier: 'LIMITLESS',
 *   usageLimit: 1,
 *   redeemUrl: 'https://example.com/shop'
 * });
 *
 * @async
 */
export async function sendGiftCodeEmail(
  data: GiftCodeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = EMAIL_TEMPLATES.giftCode(data.code, data.redeemUrl);
    const emailHtml = buildEmailHtml(template);

    await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: template.subject,
      html: emailHtml,
    });

    console.log(`�o" Gift code email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending gift code email:', error);
    return { success: false, error: error.message };
  }
}

export default resend;
