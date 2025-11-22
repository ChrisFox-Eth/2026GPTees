/**
 * @module services/printful
 * @description Printful API service for order fulfillment
 * @since 2025-11-21
 */

import axios, { AxiosInstance } from 'axios';
import prisma from '../config/database.js';
import { sendOrderShipped } from './email.service.js';

/**
 * Printful API client configuration
 */
const printfulApi: AxiosInstance = axios.create({
  baseURL: 'https://api.printful.com',
  headers: {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Interfaces
 */
interface PrintfulRecipient {
  name: string;
  address1: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
}

interface PrintfulFile {
  url: string;
  type?: 'default' | 'back' | 'label_outside' | 'label_inside';
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

interface PrintfulOrderItem {
  variant_id?: number;
  external_variant_id?: string;
  quantity: number;
  retail_price?: string;
  name?: string;
  files?: PrintfulFile[];
}

interface PrintfulOrderRequest {
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  retail_costs?: {
    currency: string;
    subtotal: string;
    discount?: string;
    shipping?: string;
    tax?: string;
    total: string;
  };
  external_id?: string;
}

interface PrintfulOrderResponse {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  recipient: PrintfulRecipient;
  items: any[];
  costs: any;
  retail_costs: any;
  shipments: any[];
}

/**
 * Map product color names to Printful variant IDs
 * This is a simplified mapping - in production, you'd query Printful's variant API
 * or maintain a complete mapping table in your database
 */
const COLOR_VARIANT_MAP: Record<string, Record<string, Record<string, number>>> = {
  '71': {
    // Basic Tee (Bella+Canvas 3001)
    Black: {
      S: 4011,
      M: 4012,
      L: 4013,
      XL: 4014,
      '2XL': 4015,
    },
    White: {
      S: 4016,
      M: 4017,
      L: 4018,
      XL: 4019,
      '2XL': 4020,
    },
    Navy: {
      S: 4021,
      M: 4022,
      L: 4023,
      XL: 4024,
      '2XL': 4025,
    },
    Gray: {
      S: 4026,
      M: 4027,
      L: 4028,
      XL: 4029,
      '2XL': 4030,
    },
  },
  '19': {
    // Premium Tee (Gildan 5000)
    Black: {
      S: 1359,
      M: 1360,
      L: 1361,
      XL: 1362,
      '2XL': 1363,
      '3XL': 1364,
    },
    White: {
      S: 1365,
      M: 1366,
      L: 1367,
      XL: 1368,
      '2XL': 1369,
      '3XL': 1370,
    },
    Navy: {
      S: 1371,
      M: 1372,
      L: 1373,
      XL: 1374,
      '2XL': 1375,
      '3XL': 1376,
    },
    Red: {
      S: 1377,
      M: 1378,
      L: 1379,
      XL: 1380,
      '2XL': 1381,
      '3XL': 1382,
    },
    'Royal Blue': {
      S: 1383,
      M: 1384,
      L: 1385,
      XL: 1386,
      '2XL': 1387,
      '3XL': 1388,
    },
  },
  '146': {
    // Hoodie (Gildan 18500)
    Black: {
      S: 4376,
      M: 4377,
      L: 4378,
      XL: 4379,
      '2XL': 4380,
    },
    Gray: {
      S: 4381,
      M: 4382,
      L: 4383,
      XL: 4384,
      '2XL': 4385,
    },
    Navy: {
      S: 4386,
      M: 4387,
      L: 4388,
      XL: 4389,
      '2XL': 4390,
    },
  },
};

/**
 * Get Printful variant ID from product, color, and size
 */
function getPrintfulVariantId(
  printfulId: string,
  color: string,
  size: string
): number | null {
  const productMap = COLOR_VARIANT_MAP[printfulId];
  if (!productMap) {
    console.error(`No variant map found for product ${printfulId}`);
    return null;
  }

  const colorMap = productMap[color];
  if (!colorMap) {
    console.error(`No color map found for ${color} in product ${printfulId}`);
    return null;
  }

  const variantId = colorMap[size];
  if (!variantId) {
    console.error(`No variant ID found for size ${size} in ${color} for product ${printfulId}`);
    return null;
  }

  return variantId;
}

/**
 * Create a Printful order from an approved design
 * @param orderId - Database order ID
 * @param designId - Approved design ID
 * @returns Printful order response
 */
export async function createPrintfulOrder(
  orderId: string,
  designId: string
): Promise<{ success: boolean; printfulOrderId?: number; error?: string }> {
  try {
    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        designs: {
          where: { id: designId },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.address) {
      throw new Error('Order has no shipping address');
    }

    const design = order.designs[0];
    if (!design) {
      throw new Error('Design not found');
    }

    if (!design.approvalStatus) {
      throw new Error('Design must be approved before submitting to Printful');
    }

    // Build Printful order items
    const printfulItems: PrintfulOrderItem[] = [];

    for (const item of order.items) {
      const variantId = getPrintfulVariantId(
        item.product.printfulId,
        item.color,
        item.size
      );

      if (!variantId) {
        throw new Error(
          `Cannot map product ${item.product.name} (${item.color}, ${item.size}) to Printful variant`
        );
      }

      printfulItems.push({
        variant_id: variantId,
        quantity: item.quantity,
        retail_price: item.unitPrice.toString(),
        name: `${item.product.name} - ${item.color} - ${item.size}`,
        files: [
          {
            url: design.imageUrl,
            type: 'default',
            // Default positioning for front print
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 1800,
              top: 300,
              left: 0,
            },
          },
        ],
      });
    }

    // Build recipient info
    const recipient: PrintfulRecipient = {
      name: order.address.name,
      address1: order.address.address1,
      city: order.address.city,
      state_code: order.address.state || '',
      country_code: order.address.country,
      zip: order.address.zip,
      phone: order.address.phone || undefined,
    };

    // Build Printful order request
    const printfulOrderData: PrintfulOrderRequest = {
      recipient,
      items: printfulItems,
      retail_costs: {
        currency: 'USD',
        subtotal: order.totalAmount.toString(),
        shipping: '0.00',
        tax: '0.00',
        total: order.totalAmount.toString(),
      },
      external_id: order.orderNumber,
    };

    console.log('Creating Printful order:', JSON.stringify(printfulOrderData, null, 2));

    // Create order in Printful
    const response = await printfulApi.post('/orders', printfulOrderData);

    const printfulOrder: PrintfulOrderResponse = response.data.result;

    console.log(`✓ Printful order created: ${printfulOrder.id}`);

    // Update our order with Printful order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        printfulOrderId: printfulOrder.id.toString(),
        status: 'SUBMITTED',
      },
    });

    return {
      success: true,
      printfulOrderId: printfulOrder.id,
    };
  } catch (error: any) {
    console.error('❌ Error creating Printful order:', error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Get Printful order status
 * @param printfulOrderId - Printful order ID
 * @returns Order status information
 */
export async function getPrintfulOrderStatus(printfulOrderId: string): Promise<any> {
  try {
    const response = await printfulApi.get(`/orders/${printfulOrderId}`);
    return response.data.result;
  } catch (error: any) {
    console.error('Error fetching Printful order:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch Printful order');
  }
}

/**
 * Confirm Printful order for fulfillment
 * @param printfulOrderId - Printful order ID
 * @returns Confirmation result
 */
export async function confirmPrintfulOrder(
  printfulOrderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await printfulApi.post(`/orders/${printfulOrderId}/confirm`);

    console.log(`✓ Printful order ${printfulOrderId} confirmed for fulfillment`);

    return { success: true };
  } catch (error: any) {
    console.error('Error confirming Printful order:', error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data?.error?.message || 'Failed to confirm Printful order',
    };
  }
}

/**
 * Webhook handler for Printful status updates
 * @param webhookData - Webhook payload from Printful
 */
export async function handlePrintfulWebhook(webhookData: any): Promise<void> {
  try {
    const { type, data } = webhookData;

    console.log(`Received Printful webhook: ${type}`);

    if (type === 'order_updated') {
      const printfulOrderId = data.order.id.toString();
      const status = data.order.status;

      // Find our order by Printful ID
      const order = await prisma.order.findFirst({
        where: { printfulOrderId },
        include: {
          user: true,
        },
      });

      if (!order) {
        console.error(`Order not found for Printful ID: ${printfulOrderId}`);
        return;
      }

      // Ignore duplicate status updates
      if (order.fulfillmentStatus === status) {
        console.log(`Skipping duplicate Printful status ${status} for order ${order.orderNumber}`);
        return;
      }

      // Extract tracking information from shipments
      const tracking = data.order.shipments?.[0];
      const trackingNumber = tracking?.tracking_number;
      const trackingUrl = tracking?.tracking_url;

      // Map Printful status to our order status
      let newStatus = order.status;
      const wasNotShipped = order.status !== 'SHIPPED' && order.status !== 'DELIVERED';

      if (status === 'fulfilled') {
        newStatus = 'SHIPPED';
      } else if (status === 'shipped') {
        newStatus = 'SHIPPED';
      } else if (status === 'canceled') {
        newStatus = 'DESIGN_PENDING'; // Reset to allow re-submission
      }

      // Update order status and tracking info
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          fulfillmentStatus: status,
          trackingNumber: trackingNumber || order.trackingNumber,
          shippedAt: newStatus === 'SHIPPED' && !order.shippedAt ? new Date() : order.shippedAt,
        },
      });

      console.log(`✓ Order ${order.orderNumber} status updated to ${newStatus}`);

      // Send shipped email if order just transitioned to SHIPPED status
      if (newStatus === 'SHIPPED' && wasNotShipped) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        sendOrderShipped({
          customerName: order.user.firstName || order.user.email,
          customerEmail: order.user.email,
          orderNumber: order.orderNumber,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          orderUrl: `${frontendUrl}/orders/${order.id}`,
        }).catch((error) => {
          console.error('Failed to send order shipped email:', error);
        });
      }
    }
  } catch (error: any) {
    console.error('Error handling Printful webhook:', error);
    throw error;
  }
}

export default printfulApi;
