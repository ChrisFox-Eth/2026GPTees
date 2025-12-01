/**
 * @module services/printful
 * @description Printful API service for order fulfillment
 * @since 2025-11-21
 */

import axios, { AxiosInstance } from 'axios';
import { OrderStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { sendOrderShipped } from './email.service.js';

/**
 * Printful API client configuration (v2)
 */
const printfulApi: AxiosInstance = axios.create({
  baseURL: 'https://api.printful.com',
  headers: {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const STORE_HEADERS = PRINTFUL_STORE_ID ? { 'X-PF-Store-Id': PRINTFUL_STORE_ID } : {};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

interface PrintfulLayer {
  type: 'file';
  url: string;
  position?: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

interface PrintfulPlacement {
  placement: string;
  technique: string;
  layers: PrintfulLayer[];
}

interface PrintfulOrderItem {
  source: 'catalog';
  catalog_variant_id: number;
  quantity: number;
  name?: string;
  retail_price?: string;
  placements: PrintfulPlacement[];
}

interface PrintfulOrderRequest {
  recipient: PrintfulRecipient;
  order_items: PrintfulOrderItem[];
  external_id?: string;
  retail_costs?: {
    currency: string;
    subtotal: string;
    shipping?: string;
    tax?: string;
    total?: string;
  };
  store_id?: string;
}

interface PrintfulOrderResponse {
  id: number;
  external_id?: string;
  status: string;
  shipments?: any[];
  retail_costs?: {
    calculation_status?: string;
  };
}

/**
 * Map product color names to Printful variant IDs
 * This is a simplified mapping - in production, you'd query Printful's variant API
 * or maintain a complete mapping table in your database
 */
const COLOR_VARIANT_MAP: Record<string, Record<string, Record<string, number>>> = {
  '71': {
    // Bella+Canvas 3001 tee
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
    Blue: {
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
};

async function logFulfillmentEvent(params: {
  orderId?: string;
  printfulOrderId?: string;
  type: string;
  status?: string;
  payload?: unknown;
}) {
  try {
    await prisma.fulfillmentEvent.create({
      data: {
        orderId: params.orderId,
        printfulOrderId: params.printfulOrderId,
        type: params.type,
        status: params.status,
        payload: params.payload as any,
      },
    });
  } catch (err) {
    console.error('Failed to log fulfillment event', err);
  }
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  'UNITED STATES': 'US',
  'UNITED STATES OF AMERICA': 'US',
  USA: 'US',
  US: 'US',
  CANADA: 'CA',
  CA: 'CA',
  AUSTRALIA: 'AU',
  AU: 'AU',
  'UNITED KINGDOM': 'GB',
  UK: 'GB',
};

const STATE_CODE_MAP: Record<string, string> = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
};

function normalizeCountryCode(country: string | null | undefined): string {
  if (!country) return '';
  const normalized = country.trim().toUpperCase();
  return COUNTRY_CODE_MAP[normalized] || (normalized.length === 2 ? normalized : normalized.slice(0, 2));
}

function normalizeStateCode(state: string | null | undefined): string {
  if (!state) return '';
  const normalized = state.trim().toUpperCase();
  return STATE_CODE_MAP[normalized] || normalized;
}

/**
 * Get Printful variant ID from product, color, and size
 */
export function getPrintfulVariantId(
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
 * Create a Printful order from an approved design (v2 API)
 * @param orderId - Database order ID
 * @param designId - Approved design ID
 * @returns Printful order response
 */
export async function createPrintfulOrder(
  orderId: string,
  designId: string
): Promise<{ success: boolean; printfulOrderId?: number; error?: string }> {
  let order: any;
  try {
    // Fetch order with all related data
    order = await prisma.order.findUnique({
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

    // Build Printful order items (v2)
    const printfulItems: PrintfulOrderItem[] = order.items.map((item: any) => {
      const variantId = getPrintfulVariantId(item.product.printfulId, item.color, item.size);

      if (!variantId) {
        throw new Error(
          `Cannot map product ${item.product.name} (${item.color}, ${item.size}) to Printful variant`
        );
      }

      const isApparel = item.product.category === 'T_SHIRT' || item.product.category === 'HOODIE';
      const placement = isApparel ? 'front' : 'default';
      const technique = isApparel ? 'dtg' : 'stock-mug';

      const placements: PrintfulPlacement[] = [
        {
          placement,
          technique,
          layers: [
            {
              type: 'file',
              url: design.imageUrl,
            },
          ],
        },
      ];

      return {
        source: 'catalog',
        catalog_variant_id: variantId,
        quantity: item.quantity,
        // Printful rejects zero retail_price values; ensure we always send a positive amount.
        retail_price: Math.max(Number(item.unitPrice) || 0, 0.01).toFixed(2),
        name: `${item.product.name} - ${item.color} - ${item.size}`,
        placements,
      };
    });

    // Build recipient info (normalized codes for Printful)
    const recipient: PrintfulRecipient = {
      name: order.address.name,
      address1: order.address.address1,
      city: order.address.city,
      state_code: normalizeStateCode(order.address.state),
      country_code: normalizeCountryCode(order.address.country),
      zip: order.address.zip,
      phone: order.address.phone || undefined,
    };

    // Build Printful order request
    const printfulOrderData: PrintfulOrderRequest = {
      recipient,
      order_items: printfulItems,
      external_id: order.orderNumber,
      retail_costs: {
        currency: 'USD',
        subtotal: order.totalAmount.toString(),
        shipping: Math.max(
          0,
          order.totalAmount -
            order.items.reduce(
              (acc: number, item: any) => acc + Number(item.unitPrice) * item.quantity,
              0
            )
        ).toFixed(2),
        tax: '0.00',
        total: order.totalAmount.toString(),
      },
      store_id: PRINTFUL_STORE_ID,
    };

    console.log('Creating Printful v2 order:', JSON.stringify(printfulOrderData, null, 2));
    await logFulfillmentEvent({
      orderId,
      type: 'printful_order_create_started',
      payload: printfulOrderData,
    });

    // Create order in Printful (draft)
    const response = await printfulApi.post('/v2/orders', printfulOrderData, {
      headers: STORE_HEADERS,
    });

    const printfulOrder: PrintfulOrderResponse =
      response.data?.result ?? response.data?.data ?? response.data;

    const printfulOrderId = printfulOrder?.id?.toString();

    console.log(`Printful order created (draft): ${printfulOrderId}`);
    await logFulfillmentEvent({
      orderId,
      printfulOrderId,
      type: 'printful_order_created',
      status: printfulOrder?.status,
      payload: printfulOrder,
    });

    if (!printfulOrderId) {
      throw new Error('Printful did not return an order ID');
    }

    await waitForPrintfulOrderReady(printfulOrderId);

    // Confirm order for fulfillment (retry a few times if costs are still calculating)
    let confirmed = false;
    let lastError: any;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const confirmResult = await confirmPrintfulOrder(printfulOrderId);
      if (confirmResult.success) {
        confirmed = true;
        break;
      }
      lastError = confirmResult.error;
      if (
        lastError?.includes('calculations still running') ||
        lastError?.includes('design is still processing')
      ) {
        await waitForPrintfulOrderReady(printfulOrderId);
      }
      await sleep(3000);
    }

    if (!confirmed) {
      throw new Error(lastError || 'Failed to confirm Printful order');
    }

    // Update our order with Printful order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        printfulOrderId,
        status: 'SUBMITTED',
        fulfillmentStatus: printfulOrder.status,
      },
    });

    await logFulfillmentEvent({
      orderId,
      printfulOrderId,
      type: 'printful_order_confirmed',
      status: 'confirmed',
    });

    return {
      success: true,
      printfulOrderId: printfulOrder.id,
    };
  } catch (error: any) {
    const message = error.response?.data?.error?.message || error.message;

    // If order already exists in Printful, reclaim it
    if (message?.includes('External ID validation error') && order?.orderNumber) {
      const existingOrder = await fetchPrintfulOrderByExternalId(order.orderNumber);
      if (existingOrder?.id) {
        console.log(`Re-using existing Printful order ${existingOrder.id} for ${order.orderNumber}`);

        await prisma.order.update({
          where: { id: orderId },
          data: {
            printfulOrderId: existingOrder.id.toString(),
            status: 'SUBMITTED',
            fulfillmentStatus: existingOrder.status,
          },
        });

        await logFulfillmentEvent({
          orderId,
          printfulOrderId: existingOrder.id.toString(),
          type: 'printful_order_reclaimed',
          status: existingOrder.status,
          payload: existingOrder,
        });

        // Attempt confirmation if needed
        if (existingOrder.status !== 'fulfilled' && existingOrder.status !== 'shipped') {
          await confirmPrintfulOrder(existingOrder.id.toString());
        }

        return { success: true, printfulOrderId: existingOrder.id };
      }
    }

    console.error('❌ Error creating Printful order:', error.response?.data || error.message);

    await logFulfillmentEvent({
      orderId,
      type: 'printful_order_error',
      status: 'failed',
      payload: error.response?.data || { message },
    });

    // Surface failure on the order so it can be retried or shown in UI.
    if (orderId) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            fulfillmentStatus: `ERROR: ${message}`,
            status: order?.status || 'DESIGN_APPROVED',
          },
        });
      } catch (updateErr) {
        console.error('Failed to persist Printful error to order', updateErr);
      }
    }

    return {
      success: false,
      error: message,
    };
  }
}

async function fetchPrintfulOrderByExternalId(
  externalId: string
): Promise<PrintfulOrderResponse | null> {
  try {
    const response = await printfulApi.get(`/v2/orders/@${externalId}`, { headers: STORE_HEADERS });
    return response.data?.result ?? response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('Error fetching Printful order by external_id:', error.response?.data || error.message);
    return null;
  }
}

async function waitForPrintfulOrderReady(
  printfulOrderId: string,
  attempts = 6,
  delayMs = 3000
): Promise<PrintfulOrderResponse | null> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const order = await getPrintfulOrderStatus(printfulOrderId);
    const calculationStatus = order?.retail_costs?.calculation_status;
    if (!calculationStatus || calculationStatus === 'done') {
      return order;
    }
    await sleep(delayMs);
  }
  return null;
}

export function mapOrderStatusFromPrintful(status?: string): {
  orderStatus?: OrderStatus;
  markShipped?: boolean;
  markDelivered?: boolean;
} {
  switch (status) {
    case 'draft':
    case 'pending':
    case 'being_fulfilled':
    case 'inprocess':
      return { orderStatus: OrderStatus.SUBMITTED };
    case 'partial':
    case 'fulfilled':
    case 'shipped':
      return { orderStatus: OrderStatus.SHIPPED, markShipped: true };
    case 'delivered':
      return { orderStatus: OrderStatus.DELIVERED, markShipped: true, markDelivered: true };
    case 'canceled':
      return { orderStatus: OrderStatus.CANCELLED };
    default:
      return {};
  }
}

/**
 * Get Printful order status
 * @param printfulOrderId - Printful order ID
 * @returns Order status information
 */
export async function getPrintfulOrderStatus(printfulOrderId: string): Promise<any> {
  try {
    const response = await printfulApi.get(`/v2/orders/${printfulOrderId}`, { headers: STORE_HEADERS });
    return response.data?.result ?? response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('Error fetching Printful order:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch Printful order');
  }
}

/**
 * Sync all orders that have a Printful ID to ensure local status is current
 */
export async function syncAllPrintfulOrders(): Promise<{
  total: number;
  updated: number;
  results: Array<{
    orderId: string;
    orderNumber: string;
    printfulOrderId: string;
    fromStatus: string;
    toStatus: string;
    fulfillmentStatus: string | null;
    trackingNumber?: string;
    error?: string;
  }>;
}> {
  const orders = await prisma.order.findMany({
    where: { printfulOrderId: { not: null } },
  });

  let updated = 0;
  const results: Array<{
    orderId: string;
    orderNumber: string;
    printfulOrderId: string;
    fromStatus: string;
    toStatus: string;
    fulfillmentStatus: string | null;
    trackingNumber?: string;
    error?: string;
  }> = [];

  for (const order of orders) {
    try {
      const status = await getPrintfulOrderStatus(order.printfulOrderId!);
      const tracking = status?.shipments?.[0];
      const trackingNumber = tracking?.tracking_number || order.trackingNumber;

      const statusMapping = mapOrderStatusFromPrintful(status?.status);
      const derivedStatus = statusMapping.orderStatus || order.status;

      const dataToUpdate: any = {
        fulfillmentStatus: status?.status || order.fulfillmentStatus,
        trackingNumber,
      };

      if (order.status !== derivedStatus) {
        dataToUpdate.status = derivedStatus;
      }
      if (statusMapping.markShipped && !order.shippedAt) {
        dataToUpdate.shippedAt = new Date();
      }
      if (statusMapping.markDelivered && !order.deliveredAt) {
        dataToUpdate.deliveredAt = new Date();
      }

      const hasChanges =
        dataToUpdate.status ||
        dataToUpdate.fulfillmentStatus !== order.fulfillmentStatus ||
        dataToUpdate.trackingNumber !== order.trackingNumber ||
        dataToUpdate.shippedAt ||
        dataToUpdate.deliveredAt;

      if (hasChanges) {
        await prisma.order.update({
          where: { id: order.id },
          data: dataToUpdate,
        });
        updated += 1;
      }

      results.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        printfulOrderId: order.printfulOrderId!,
        fromStatus: order.status,
        toStatus: dataToUpdate.status || order.status,
        fulfillmentStatus: dataToUpdate.fulfillmentStatus || order.fulfillmentStatus,
        trackingNumber,
      });
    } catch (error: any) {
      results.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        printfulOrderId: order.printfulOrderId!,
        fromStatus: order.status,
        toStatus: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        trackingNumber: order.trackingNumber || undefined,
        error: error?.message || 'Failed to sync order',
      });
    }
  }

  return {
    total: orders.length,
    updated,
    results,
  };
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
    await printfulApi.post(`/v2/orders/${printfulOrderId}/confirmation`, undefined, {
      headers: STORE_HEADERS,
    });

    console.log(`Printful order ${printfulOrderId} confirmed for fulfillment`);

    return { success: true };
  } catch (error: any) {
    console.error('Error confirming Printful order:', error.response?.data || error.message);

    await logFulfillmentEvent({
      printfulOrderId,
      type: 'printful_order_confirm_error',
      status: 'failed',
      payload: error.response?.data || { message: error.message },
    });

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

    await logFulfillmentEvent({
      type: 'printful_webhook',
      status: type,
      printfulOrderId: data?.order?.id?.toString(),
      payload: webhookData,
    });

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

      const statusMapping = mapOrderStatusFromPrintful(status);
      const derivedStatus = statusMapping.orderStatus || order.status;
      const wasNotShipped = order.status !== 'SHIPPED' && order.status !== 'DELIVERED';

      // Extract tracking information from shipments
      const tracking = data.order.shipments?.[0];
      const trackingNumber = tracking?.tracking_number;
      const trackingUrl = tracking?.tracking_url;

      const shouldUpdate =
        order.fulfillmentStatus !== status ||
        order.status !== derivedStatus ||
        (statusMapping.markShipped && !order.shippedAt) ||
        (statusMapping.markDelivered && !order.deliveredAt) ||
        (!!trackingNumber && trackingNumber !== order.trackingNumber);

      if (!shouldUpdate) {
        console.log(`Skipping duplicate Printful status ${status} for order ${order.orderNumber}`);
        return;
      }

      // Update order status and tracking info
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: derivedStatus,
          fulfillmentStatus: status,
          trackingNumber: trackingNumber || order.trackingNumber,
          shippedAt:
            statusMapping.markShipped && !order.shippedAt ? new Date() : order.shippedAt,
          deliveredAt:
            statusMapping.markDelivered && !order.deliveredAt ? new Date() : order.deliveredAt,
        },
      });

      console.log(`Order ${order.orderNumber} status updated to ${derivedStatus}`);

      // Send shipped email if order just transitioned to SHIPPED status
      if (derivedStatus === 'SHIPPED' && wasNotShipped) {
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
    await logFulfillmentEvent({
      type: 'printful_webhook_error',
      status: 'failed',
      payload: { message: error.message },
    });
    throw error;
  }
}

export default printfulApi;




