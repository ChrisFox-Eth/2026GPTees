/**
 * @module services/email
 * @description Resend email service for transactional emails
 * @since 2025-11-21
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
const SITE_NAME = '2026GPTees';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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

/**
 * Send order confirmation email
 * Triggered when payment is successful
 */
export async function sendOrderConfirmation(
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${SITE_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    <div class="content">
      <h2>Thank you, ${data.customerName}!</h2>
      <p>Your order has been confirmed and payment received. You're one step closer to getting your custom AI-designed t-shirt!</p>

      <div class="info-box">
        <strong>Order Number:</strong> ${data.orderNumber}<br>
        <strong>Total:</strong> $${data.orderTotal}<br>
        <strong>Items:</strong> ${data.itemCount}<br>
        <strong>Design Tier:</strong> ${data.tier}
      </div>

      <h3>What's Next?</h3>
      <ol>
        <li><strong>Generate Your Design:</strong> Use our AI to create your custom t-shirt design</li>
        <li><strong>Review & Approve:</strong> Once you're happy with the design, approve it</li>
        <li><strong>We Print & Ship:</strong> Your order will be printed and shipped to you</li>
      </ol>

      <div style="text-align: center;">
        <a href="${data.orderUrl}" class="button">Generate Design Now →</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions, feel free to reply to this email.</p>
    </div>
    <div class="footer">
      <p>${SITE_NAME} - AI-Powered Custom Apparel</p>
      <p><a href="${FRONTEND_URL}">Visit Our Store</a></p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmed - ${data.orderNumber}`,
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
 * Send design approved email
 * Triggered when user approves their design
 */
export async function sendDesignApproved(
  data: DesignApprovedData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Approved - ${SITE_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .design-preview { text-align: center; margin: 30px 0; }
    .design-preview img { max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #e5e7eb; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Design Approved!</h1>
    </div>
    <div class="content">
      <h2>Great choice, ${data.customerName}!</h2>
      <p>Your design has been approved and your order is being submitted for printing.</p>

      <div class="design-preview">
        <img src="${data.designImageUrl}" alt="Your Approved Design" />
      </div>

      <p><strong>Order Number:</strong> ${data.orderNumber}</p>

      <h3>What Happens Next?</h3>
      <ol>
        <li><strong>Order Submitted:</strong> Your order is being sent to our printing partner</li>
        <li><strong>Production:</strong> Your custom t-shirt will be printed (typically 2-5 business days)</li>
        <li><strong>Shipping:</strong> Once printed, your order will be shipped to you</li>
        <li><strong>Tracking:</strong> You'll receive a tracking number when your order ships</li>
      </ol>

      <div style="text-align: center;">
        <a href="${data.orderUrl}" class="button">View Order Details</a>
      </div>

      <p style="margin-top: 30px;">We'll send you another email when your order ships with tracking information.</p>
    </div>
    <div class="footer">
      <p>${SITE_NAME} - AI-Powered Custom Apparel</p>
      <p><a href="${FRONTEND_URL}">Visit Our Store</a></p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Design Approved - ${data.orderNumber}`,
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
 * Send order shipped email
 * Triggered when Printful ships the order
 */
export async function sendOrderShipped(
  data: OrderShippedData
): Promise<{ success: boolean; error?: string }> {
  try {
    const trackingInfo = data.trackingNumber
      ? `
      <div class="info-box">
        <strong>Tracking Number:</strong> ${data.trackingNumber}<br>
        ${
          data.trackingUrl
            ? `<a href="${data.trackingUrl}" class="button" style="margin-top: 10px;">Track Your Package →</a>`
            : ''
        }
      </div>
      `
      : '<p>Tracking information will be updated shortly.</p>';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped - ${SITE_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>
    <div class="content">
      <h2>Hi ${data.customerName}!</h2>
      <p>Great news! Your custom t-shirt order is on its way to you.</p>

      <p><strong>Order Number:</strong> ${data.orderNumber}</p>

      ${trackingInfo}

      <p>Your custom AI-designed t-shirt should arrive within 5-10 business days depending on your location.</p>

      <div style="text-align: center;">
        <a href="${data.orderUrl}" class="button">View Order Details</a>
      </div>

      <p style="margin-top: 30px;">If you have any questions about your shipment, please don't hesitate to reach out!</p>
    </div>
    <div class="footer">
      <p>${SITE_NAME} - AI-Powered Custom Apparel</p>
      <p><a href="${FRONTEND_URL}">Visit Our Store</a></p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Your Order Has Shipped - ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log(`✓ Order shipped email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending order shipped email:', error);
    return { success: false, error: error.message };
  }
}

export default resend;
