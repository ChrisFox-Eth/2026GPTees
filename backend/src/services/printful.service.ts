/**
 * @module services/printful
 * @description Printful API v2 service for print-on-demand order fulfillment. Handles order creation, status synchronization, webhook processing, and variant mapping for apparel products.
 * @since 2025-11-21
 */

import axios, { AxiosInstance } from 'axios';
import { OrderStatus } from '@prisma/client';
import prisma from '../config/database.js';
import { sendOrderShipped } from './email.service.js';
import { isOrderActionAllowed } from '../policies/order-policy.js';

/**
 * Printful API client configuration (v2 API)
 * Authenticated with Bearer token and optional store ID header
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

/**
 * @function sleep
 * @description Helper function to pause execution for specified milliseconds
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} Resolves after delay
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Printful API interfaces
 */

/**
 * Printful recipient (shipping address) interface
 * @interface PrintfulRecipient
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
 * Printful variant summary interface for admin lookup
 * @interface PrintfulVariantSummary
 */
export interface PrintfulVariantSummary {
  id: number;
  name: string;
  color: string;
  size: string;
}

/**
 * @function fetchPrintfulProductVariants
 * @description Fetches all available variants for a Printful product by product ID. Used for administrative variant lookup and mapping.
 *
 * @param {string} productId - Printful product ID
 *
 * @returns {Promise<PrintfulVariantSummary[]>} Array of available variants with ID, name, color, and size
 *
 * @throws {Error} When Printful API request fails
 *
 * @example
 * const variants = await fetchPrintfulProductVariants('71');
 * // Returns: [{ id: 4011, name: 'White S', color: 'White', size: 'S' }, ...]
 *
 * @async
 */
export async function fetchPrintfulProductVariants(productId: string): Promise<PrintfulVariantSummary[]> {
  const response = await printfulApi.get(`/products/${productId}`, { headers: STORE_HEADERS });
  const variants = response.data?.result?.variants || response.data?.result?.items || [];
  return variants.map((v: any) => ({
    id: v.id,
    name: v.name,
    color: v.color,
    size: v.size,
  }));
}

/**
 * Static color and size to Printful variant ID mapping
 * Maps Printful product ID -> Color -> Size -> Variant ID
 * Currently supports Bella+Canvas 3001 t-shirt (product ID 71)
 *
 * @constant
 * @type {Record<string, Record<string, Record<string, number>>>}
 *
 * @example
 * const variantId = COLOR_VARIANT_MAP['71']['Black']['M']; // 4017
 */
const COLOR_VARIANT_MAP: Record<string, Record<string, Record<string, number>>> = {
  '71': {
    // Bella+Canvas 3001 tee
    White: {
      S: 4011,
      M: 4012,
      L: 4013,
      XL: 4014,
      '2XL': 4015,
    },
    Black: {
      S: 4016,
      M: 4017,
      L: 4018,
      XL: 4019,
      '2XL': 4020,
    },
    Navy: {
      S: 4111,
      M: 4112,
      L: 4113,
      XL: 4114,
      '2XL': 4115,
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

/**
 * @function logFulfillmentEvent
 * @description Logs fulfillment events to database for auditing and debugging. Silently fails if logging errors occur to prevent disrupting fulfillment flow.
 *
 * @param {Object} params - Event logging parameters
 * @param {string} [params.orderId] - Internal order ID
 * @param {string} [params.printfulOrderId] - Printful order ID
 * @param {string} params.type - Event type identifier
 * @param {string} [params.status] - Event status
 * @param {unknown} [params.payload] - Event payload data
 *
 * @returns {Promise<void>} Resolves when logged or silently on error
 *
 * @async
 */
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

/**
 * Country name to ISO 2-letter country code mapping
 * @constant
 */
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

/**
 * US state name to 2-letter state code mapping
 * @constant
 */
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

/**
 * @function normalizeCountryCode
 * @description Normalizes country name or code to ISO 2-letter country code for Printful API.
 *
 * @param {string | null | undefined} country - Country name or code
 *
 * @returns {string} Normalized 2-letter country code or empty string
 *
 * @example
 * normalizeCountryCode('United States'); // 'US'
 * normalizeCountryCode('US'); // 'US'
 */
function normalizeCountryCode(country: string | null | undefined): string {
  if (!country) return '';
  const normalized = country.trim().toUpperCase();
  return COUNTRY_CODE_MAP[normalized] || (normalized.length === 2 ? normalized : normalized.slice(0, 2));
}

/**
 * @function normalizeStateCode
 * @description Normalizes US state name to 2-letter state code for Printful API.
 *
 * @param {string | null | undefined} state - State name or code
 *
 * @returns {string} Normalized 2-letter state code or original value
 *
 * @example
 * normalizeStateCode('California'); // 'CA'
 * normalizeStateCode('CA'); // 'CA'
 */
function normalizeStateCode(state: string | null | undefined): string {
  if (!state) return '';
  const normalized = state.trim().toUpperCase();
  return STATE_CODE_MAP[normalized] || normalized;
}

/**
 * @function getPrintfulVariantId
 * @description Resolves Printful catalog variant ID from product ID, color, and size. Falls back to black/XL if exact match not found.
 *
 * @param {string} printfulId - Printful product ID (e.g., '71' for Bella+Canvas 3001)
 * @param {string} color - Product color (case-insensitive)
 * @param {string} size - Product size (case-insensitive)
 *
 * @returns {number | null} Printful variant ID or null if not found
 *
 * @example
 * const variantId = getPrintfulVariantId('71', 'Black', 'M');
 * // Returns: 4017
 *
 * @example
 * const variantId = getPrintfulVariantId('71', 'Unknown Color', 'M');
 * // Returns: null (logs error)
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

  const normalizeKey = (value: string) => value?.trim().toLowerCase();

  const resolvedColorKey =
    Object.keys(productMap).find((key) => normalizeKey(key) === normalizeKey(color)) ||
    Object.keys(productMap).find((key) => normalizeKey(key) === 'black') ||
    undefined;

  if (!resolvedColorKey) {
    console.error(`No color map found for ${color} in product ${printfulId}`);
    return null;
  }

  const colorMap = productMap[resolvedColorKey];

  const resolvedSizeKey =
    Object.keys(colorMap).find((key) => normalizeKey(key) === normalizeKey(size)) ||
    Object.keys(colorMap).find((key) => normalizeKey(key) === 'xl') ||
    undefined;

  if (!resolvedSizeKey) {
    console.error(`No variant ID found for size ${size} in ${resolvedColorKey} for product ${printfulId}`);
    return null;
  }

  const variantId = colorMap[resolvedSizeKey];
  return variantId;
}

/**
 * @function createPrintfulOrder
 * @description Creates and confirms a Printful order from an approved design using Printful API v2. Handles order submission, cost calculation, confirmation, and error recovery including duplicate order detection.
 *
 * @param {string} orderId - Internal database order ID
 * @param {string} designId - Approved design ID to print
 *
 * @returns {Promise<{success: boolean, printfulOrderId?: number, error?: string}>} Order creation result
 * @returns {boolean} success - Whether order was successfully created and confirmed
 * @returns {number} [printfulOrderId] - Printful's order ID if successful
 * @returns {string} [error] - Error message if failed
 *
 * @throws {Error} When order not found or in invalid state
 * @throws {Error} When design not approved
 * @throws {Error} When shipping address missing
 * @throws {Error} When variant mapping fails
 *
 * @example
 * const result = await createPrintfulOrder('order-123', 'design-456');
 * if (result.success) {
 *   console.log('Printful order ID:', result.printfulOrderId);
 * }
 *
 * @async
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

    if (!isOrderActionAllowed('order_submit_fulfillment', order.status as OrderStatus)) {
      throw new Error('Order must be paid before submitting to Printful');
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

/**
 * @function fetchPrintfulOrderByExternalId
 * @description Fetches Printful order by external ID (our order number). Used for duplicate detection and order recovery.
 *
 * @param {string} externalId - External order ID (our order number)
 *
 * @returns {Promise<PrintfulOrderResponse | null>} Printful order or null if not found
 *
 * @async
 */
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

/**
 * @function waitForPrintfulOrderReady
 * @description Polls Printful order status until cost calculations are complete. Waits for retail_costs.calculation_status to be 'done'.
 *
 * @param {string} printfulOrderId - Printful order ID to poll
 * @param {number} [attempts=6] - Maximum polling attempts
 * @param {number} [delayMs=3000] - Delay between polling attempts in milliseconds
 *
 * @returns {Promise<PrintfulOrderResponse | null>} Order when ready or null if timeout
 *
 * @async
 */
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

/**
 * @function mapOrderStatusFromPrintful
 * @description Maps Printful order status to internal OrderStatus enum and determines shipping/delivery timestamps.
 *
 * @param {string} [status] - Printful order status
 *
 * @returns {Object} Status mapping result
 * @returns {OrderStatus} [orderStatus] - Mapped internal order status
 * @returns {boolean} [markShipped] - Whether to set shippedAt timestamp
 * @returns {boolean} [markDelivered] - Whether to set deliveredAt timestamp
 *
 * @example
 * const mapping = mapOrderStatusFromPrintful('shipped');
 * // Returns: { orderStatus: 'SHIPPED', markShipped: true }
 */
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
 * @function getPrintfulOrderStatus
 * @description Fetches current order status from Printful API v2.
 *
 * @param {string} printfulOrderId - Printful order ID
 *
 * @returns {Promise<any>} Printful order object with status and shipment data
 *
 * @throws {Error} When Printful API request fails
 *
 * @example
 * const status = await getPrintfulOrderStatus('12345');
 * console.log(status.status); // 'shipped'
 *
 * @async
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
 * @function syncAllPrintfulOrders
 * @description Synchronizes all orders with Printful IDs to ensure local database status matches Printful's current state. Used for admin sync operations and status reconciliation.
 *
 * @returns {Promise<Object>} Sync operation results
 * @returns {number} total - Total number of orders synced
 * @returns {number} updated - Number of orders that had status changes
 * @returns {Array} results - Detailed results for each order including status transitions
 *
 * @example
 * const result = await syncAllPrintfulOrders();
 * console.log(`Synced ${result.total} orders, updated ${result.updated}`);
 *
 * @async
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
 * @function confirmPrintfulOrder
 * @description Confirms a draft Printful order for production and fulfillment. Must be called after order creation and cost calculation completion.
 *
 * @param {string} printfulOrderId - Printful order ID to confirm
 *
 * @returns {Promise<{success: boolean, error?: string}>} Confirmation result
 * @returns {boolean} success - Whether confirmation succeeded
 * @returns {string} [error] - Error message if failed
 *
 * @throws {Error} When confirmation API call fails
 *
 * @example
 * const result = await confirmPrintfulOrder('12345');
 * if (!result.success) {
 *   console.error('Confirmation failed:', result.error);
 * }
 *
 * @async
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
 * @function handlePrintfulWebhook
 * @description Processes Printful webhook events for order status updates. Updates local order status, tracking information, and sends customer notification emails when appropriate.
 *
 * @param {any} webhookData - Webhook payload from Printful
 * @param {string} webhookData.type - Event type (e.g., 'order_updated')
 * @param {Object} webhookData.data - Event data containing order information
 * @param {Object} webhookData.data.order - Printful order object
 * @param {Array} [webhookData.data.order.shipments] - Shipment tracking data
 *
 * @returns {Promise<void>} Resolves when webhook is processed
 *
 * @throws {Error} When webhook processing fails
 *
 * @example
 * await handlePrintfulWebhook({
 *   type: 'order_updated',
 *   data: { order: { id: 123, status: 'shipped' } }
 * });
 *
 * @async
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

