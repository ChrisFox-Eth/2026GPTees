/**
 * @module pages/AccountPage
 * @description User account page with order history and design previews  reorder
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { apiGet } from '../utils/api';
import { Button } from '@components/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { trackEvent } from '@utils/analytics';
import { useCart } from '../hooks/useCart';

interface OrderItem {
  id: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  product: {
    id?: string;
    name: string;
    imageUrl?: string | null;
  };
}

interface DesignPreview {
  id: string;
  imageUrl?: string | null;
  prompt: string;
  approvalStatus?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  designTier: string;
  designsGenerated: number;
  maxDesigns: number;
  createdAt: string;
  items: OrderItem[];
  designs: DesignPreview[];
  fulfillmentStatus?: string | null;
  trackingNumber?: string | null;
  promoCode?: {
    code: string;
    type: string;
    percentOff?: number | null;
    productTier?: string | null;
  } | null;
}

function AccountContent(): JSX.Element {
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING_PAYMENT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      SHIPPED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || styles.PENDING_PAYMENT}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const handleReorder = (order: Order, design: DesignPreview) => {
    const firstItem = order.items?.[0];
    const basePrice = firstItem ? Number(firstItem.unitPrice) : 0;
    const productName = firstItem?.product?.name || 'GPTee';
    const productId = firstItem?.product?.id || `${order.id}-design`;
    const color = firstItem?.color || 'Black';
    const size = firstItem?.size || 'XL';

    addToCart({
      productId,
      productName,
      size,
      color,
      tier: order.designTier === 'BASIC' ? 'BASIC' : 'PREMIUM',
      quantity: 1,
      basePrice,
      tierPrice: 0,
      imageUrl: design.imageUrl || firstItem?.product?.imageUrl || null,
    });

    trackEvent('account.design.reorder', {
      order_id: order.id,
      design_id: design.id,
      product_id: productId,
      tier: order.designTier,
    });
  };

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        // Adjust endpoint as appropriate in your API
        const data = await apiGet('/orders', token);
        if (!mounted) return;
        setOrders(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order History</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">Your previous GPTee orders and generated designs.</p>
      </div>

      {/* Loading State */}
      {loading && <div className="text-sm text-gray-600">Loading orders...</div>}

      {/* Error State */}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Orders */}
      {!loading && orders.length === 0 && <div className="text-sm text-gray-600">No orders found.</div>}

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Order #{order.orderNumber}</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{order.totalAmount ? `$${order.totalAmount.toFixed(2)}` : ''}</div>
              </div>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* Items */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items?.map((it) => (
                  <div key={it.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                      {it.product?.imageUrl ? <img src={it.product.imageUrl} alt={it.product.name} className="w-full h-full object-contain" /> : <div className="text-xs text-gray-500">No image</div>}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{it.product?.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{it.size} • {it.color} • Qty {it.quantity}</div>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200">${Number(it.unitPrice).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Designs */}
            {order.designs?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Designs</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.designs.map((design) => (
                    <div
                      key={design.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center h-32">
                        {design.imageUrl ? (
                          <img
                            src={design.imageUrl}
                            alt={design.prompt}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Design preview coming soon</div>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 px-3 py-2">{design.prompt}</p>
                      <div className="px-3 pb-3">
                        <Button variant="secondary" size="sm" onClick={() => handleReorder(order, design)}>
                          Buy this design again
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
