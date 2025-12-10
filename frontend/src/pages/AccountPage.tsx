/**
 * @module pages/AccountPage
 * @description User account page with order history and reorder support
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@components/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiGet } from '../utils/api';
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
  imageUrl: string;
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
const statusStyles: Record<string, string> = {
  PENDING_PAYMENT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  DESIGN_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  DESIGN_APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  SUBMITTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  SHIPPED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
};

const formatPromo = (promo?: Order['promoCode']) => {
  if (!promo) return null;
  const isGift = promo.type === 'FREE_PRODUCT';
  const detail = isGift ? `Free ${promo.productTier || 'tee'}` : `${promo.percentOff || 0}% off`;
  return `${promo.code} (${detail})`;
};

const getStatusBadge = (status: string) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusStyles[status] || statusStyles.PENDING_PAYMENT}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const reorderEligibleStatuses = ['PAID', 'DESIGN_APPROVED', 'SUBMITTED', 'SHIPPED', 'DELIVERED'];

function AccountContent(): JSX.Element {
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void fetchOrders();
    }
  }, [isLoaded, isSignedIn]);

const fetchOrders = async () => {
   try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const response = await apiGet('/api/orders', token);
      setOrders(response.data || []);
      setError(null);
      trackEvent('account.orders.loaded', { order_count: (response.data || []).length });
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
      console.error('Error fetching orders:', err);
      trackEvent('account.orders.error', { message: err?.message || 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (order: Order, design: DesignPreview) => {
    const firstItem = order.items?.[0];
    const productId = firstItem?.product?.id || `${order.id}-design`;
    const productName = firstItem?.product?.name || 'GPTee';
    const size = firstItem?.size || 'XL';
    const color = firstItem?.color || 'Black';
    const basePrice = firstItem ? Number(firstItem.unitPrice) : 0;

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
return (
    <div className="container-max py-8">
      {/* User Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Account</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </p>
      </div>

      {/* Orders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order History</h2>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-400">{error}</p>
            <button onClick={fetchOrders} className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-400 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{order.designTier} Tier</span>
                  <span>•</span>
                  <span>Designs: {order.designsGenerated}/{order.maxDesigns === 9999 ? '∞' : order.maxDesigns}</span>
                  {order.fulfillmentStatus && (
                    <>
                      <span>•</span>
                      <span>Fulfillment: {order.fulfillmentStatus}</span>
                    </>
                  )}
                  {order.trackingNumber && (
                    <>
                      <span>•</span>
                      <span>Tracking: </span>
                      <a
                        href={`https://myorders.co/tracking/${encodeURIComponent(order.trackingNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {order.trackingNumber}
                      </a>
                    </>
                  )}
                  {order.promoCode && (
                    <>
                      <span>•</span>
                      <span>Code: {formatPromo(order.promoCode)}</span>
                    </>
                  )}
                </div>
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
                                <img src={design.imageUrl} alt={design.prompt} className="w-full h-full object-contain" />
                              ) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400">Design preview coming soon</div>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 px-3 py-2">{design.prompt}</p>
                            <div className="px-3 pb-3">
                              <Link to={`/design?orderId=${order.id}`}>
                                <Button variant="secondary" size="sm">
                                  Open design
                                </Button>
                              </Link>
                              {reorderEligibleStatuses.includes(order.status) && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="mt-2 w-full"
                                  onClick={() => handleReorder(order, design)}
                                >
                                  Reorder this design
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-3 flex-wrap">
                  {(order.status === 'PENDING_PAYMENT' || order.status === 'DESIGN_PENDING') && (
                    <Link to={`/checkout?orderId=${order.id}`}>
                      <Button variant="primary" size="sm">
                        Checkout to print
                      </Button>
                    </Link>
                  )}
                  {order.status === 'DESIGN_PENDING' && (
                    <Link to={`/design?orderId=${order.id}`}>
                      <Button variant="secondary" size="sm">
                        Review & Approve
                      </Button>
                    </Link>
                  )}
                  {order.status === 'PAID' && order.designsGenerated < order.maxDesigns && (
                    <Link to={`/design?orderId=${order.id}`}>
                      <Button variant="primary" size="sm">
                        Generate Design
                      </Button>
                      </Link>
                  )}
                  {order.status === 'PAID' && (
                    <Link to={`/design?orderId=${order.id}`}>
                      <Button variant="secondary" size="sm">
                        Design Page
                      </Button>
                    </Link>
                  )}
                  {order.designs.length > 0 && (
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="secondary" size="sm">
                        View Designs ({order.designs.length})
                      </Button>
                    </Link>
                  )}
                  <Link to={`/orders/${order.id}`}>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start shopping to create your first one-of-one GPTee!
              </p>
            <Link to="/shop">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </div>
        )}
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
