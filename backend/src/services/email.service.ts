/**
 * @module services/email
 * @description Resend email service for transactional emails
 * @since 2025-11-21
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const SITE_NAME = '2026GPTees';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
      <p>Your order has been confirmed and payment received. You're one step closer to getting your custom GPTee with premium quality printing!</p>

      <div class="info-box">
        <strong>Order Number:</strong> ${data.orderNumber}<br>
        <strong>Total:</strong> $${data.orderTotal}<br>
        <strong>Items:</strong> ${data.itemCount}<br>
        <strong>Design Tier:</strong> ${data.tier}
      </div>

      <h3>What's Next?</h3>
      <ol>
        <li><strong>Generate Your Design:</strong> Use GPTees to create your custom t-shirt design</li>
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
      from: getFromEmail(),
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
      from: getFromEmail(),
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

      <p>Your custom GPTee should arrive within 5-10 business days depending on your location.</p>

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
      from: getFromEmail(),
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

/**
 * Send reminder for pending payment orders.
 * Useful for abandoned checkout recovery.
 */
export async function sendAbandonedCheckoutReminder(
  data: AbandonedCheckoutData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Order - ${SITE_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 26px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 26px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Finish your order</h1>
    </div>
    <div class="content">
      <p>Hi ${data.customerName || 'there'},</p>
      <p>You left your custom AI tee in checkout. Pick up where you left off and we’ll hold your cart for the next few hours.</p>

      <p><strong>Order:</strong> ${data.orderNumber}</p>
      <p><strong>Started:</strong> ${data.createdAt.toLocaleString()}</p>
      ${
        data.subtotal !== undefined
          ? `<p><strong>Items:</strong> $${data.subtotal.toFixed(2)}</p>`
          : ''
      }
      ${
        data.shipping !== undefined
          ? `<p><strong>Shipping:</strong> $${data.shipping.toFixed(2)}</p>`
          : ''
      }

      <div style="text-align: center;">
        <a href="${data.resumeUrl}" class="button">Return to checkout</a>
      </div>

      <p style="margin-top: 20px;">Need help? Reply to this email and we’ll get you sorted.</p>
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
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `Finish your order - ${data.orderNumber}`,
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
 * Send prompt-writing guide to encourage design completion.
 */
export async function sendPromptGuide(
  data: PromptGuideData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pro Tips for Your Design - ${SITE_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 26px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 26px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .tip { background: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Write a winning prompt</h1>
    </div>
    <div class="content">
      <p>Hey ${data.customerName || 'there'},</p>
      <p>Here are quick tips to get a print-ready design:</p>
      <div class="tip">🎯 Add subject + style: "vintage surf wave, minimal line art"</div>
      <div class="tip">🎨 Keep it print-friendly: "no background, high contrast, centered design"</div>
      <div class="tip">🧢 Call out apparel: "designed for a t-shirt, vector-style, screen-print friendly"</div>
      <div class="tip">⚡️ Try 2–3 variations, then approve your favorite</div>

      <div style="text-align: center;">
        <a href="${data.orderUrl}" class="button">Generate your design</a>
      </div>
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
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `Pro tips for your design - ${data.orderNumber}`,
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
 * Send gift code email to purchaser.
 */
export async function sendGiftCodeEmail(
  data: GiftCodeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const usageText =
      data.usageLimit && data.usageLimit > 0
        ? `${data.usageLimit} ${data.usageLimit === 1 ? 'use' : 'uses'}`
        : 'unlimited uses';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${SITE_NAME} Gift Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 28px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #fff; padding: 28px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; }
    .code-box { font-size: 24px; letter-spacing: 2px; font-weight: 700; background: #0ea5e9; color: white; padding: 14px 18px; text-align: center; border-radius: 10px; margin: 20px 0; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 18px 0; }
    .footer { text-align: center; margin-top: 24px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're gifting a GPTee!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.customerName || 'there'},</p>
      <p>Thanks for purchasing a gift code. Share it with a friend (or keep it for yourself) to redeem a Limitless tee.</p>

      <div class="code-box" aria-label="Gift code">${data.code}</div>
      <p style="text-align:center; margin-top:-10px;">${usageText} · Tier: ${data.tier}</p>

      <ol style="padding-left:18px; color:#334155;">
        <li>Go to <a href="${data.redeemUrl}">${data.redeemUrl}</a></li>
        <li>Add a Limitless tee to cart</li>
        <li>Enter the code at checkout to apply it</li>
      </ol>

      <div style="text-align:center;">
        <a href="${data.redeemUrl}" class="button">Start shopping</a>
      </div>

      <p style="margin-top: 18px;">If you need help, just reply to this email and we'll jump in.</p>
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
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `Your ${SITE_NAME} gift code`,
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
