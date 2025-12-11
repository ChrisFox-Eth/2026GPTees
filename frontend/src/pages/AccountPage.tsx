/**
 * @module pages/AccountPage
 * @description User account page with design-first focus and past orders
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@components/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiGet, apiPost } from '../utils/api';
import { trackEvent } from '@utils/analytics';

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
  PENDING_PAYMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DESIGN_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  DESIGN_APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  SUBMITTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  SHIPPED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  CANCELLED: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  REFUNDED: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

const getStatusBadge = (status: string) => (
  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

const previewStatuses = ['PENDING_PAYMENT', 'DESIGN_PENDING'];
const pastOrderStatuses = ['PAID', 'DESIGN_APPROVED', 'SUBMITTED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const isDurableUrl = (url?: string | null) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return !(lower.includes('oaidalle') || lower.includes('openai'));
};

const getCloneCandidate = (order: Order): DesignPreview | null => {
  const approved = order.designs.find((d) => d.approvalStatus && isDurableUrl(d.imageUrl));
  if (approved) return approved;
  const completed = order.designs.find((d) => isDurableUrl(d.imageUrl));
  return completed || null;
};

function AccountContent(): JSX.Element {
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'designs' | 'past'>('designs');
  const [reordering, setReordering] = useState<string | null>(null);

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

  const handleReorder = async (order: Order, design?: DesignPreview | null) => {
    const designToClone = design || getCloneCandidate(order);
    if (!designToClone) {
      setError('This design cannot be reordered right now. Please regenerate.');
      return;
    }
    const firstItem = order.items?.[0];
    if (!firstItem?.product?.id) {
      setError('Cannot reorder: missing product info.');
      return;
    }
    try {
      setReordering(order.id);
      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const newOrderResp = await apiPost(
        '/api/orders/preview',
        {
          productId: firstItem.product.id,
          color: firstItem.color,
          size: firstItem.size,
          tier: 'LIMITLESS',
          quantity: 1,
        },
        token
      );
      const newOrderId = newOrderResp?.data?.id;
      if (!newOrderId) {
        throw new Error('Failed to create preview order for reorder.');
      }

      await apiPost(
        '/api/designs/clone',
        { sourceDesignId: designToClone.id, targetOrderId: newOrderId },
        token
      );

      trackEvent('account.design.reorder_new_preview', {
        source_order_id: order.id,
        new_order_id: newOrderId,
        design_id: designToClone.id,
      });

      navigate(`/design?orderId=${newOrderId}`);
    } catch (err: any) {
      console.error('Error reordering design:', err);
      setError(err?.message || 'Failed to reorder this design. Please try again.');
    } finally {
      setReordering(null);
    }
  };

  const designsList = useMemo(
    () => orders.filter((o) => previewStatuses.includes(o.status)),
    [orders]
  );
  const pastList = useMemo(
    () => orders.filter((o) => pastOrderStatuses.includes(o.status)),
    [orders]
  );

  const renderDesignCard = (order: Order) => (
    <div
      key={order.id}
      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-primary-400/80 hover:shadow transition bg-gray-50 dark:bg-gray-900/60"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Design preview</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        <span className="text-gray-400">•</span>
        <span>{order.designTier} tier</span>
        <span className="text-gray-400">•</span>
        <span>Designs: {order.designsGenerated}/{order.maxDesigns === 9999 ? '∞' : order.maxDesigns}</span>
      </div>

      {order.designs?.length > 0 && (
        <div className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {order.designs.map((design) => (
              <div
                key={design.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
              >
                <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center h-40">
                  {design.imageUrl ? (
                    <img src={design.imageUrl} alt={design.prompt} className="max-h-36 object-contain" />
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Design preview coming soon</div>
                  )}
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 px-3 py-2">
                  {design.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3 flex-wrap">
        <Link to={`/design?orderId=${order.id}`}>
          <Button variant="primary" size="sm">
            Open design
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderPastCard = (order: Order) => {
    const cloneCandidate = getCloneCandidate(order);
    return (
      <div
        key={order.id}
        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-primary-400/80 hover:shadow transition bg-gray-50 dark:bg-gray-900/60"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Past order</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right space-y-1">
            {getStatusBadge(order.status)}
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              ${Number(order.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-3">
          <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
          <span className="text-gray-400">•</span>
          <span>{order.designTier} tier</span>
          {order.trackingNumber && (
            <>
              <span className="text-gray-400">•</span>
              <span>Tracking:</span>
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
        </div>

        {order.designs?.length > 0 && (
          <div className="mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.designs.map((design) => (
                <div
                  key={design.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center h-32">
                    {design.imageUrl ? (
                      <img src={design.imageUrl} alt={design.prompt} className="max-h-28 object-contain" />
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Design preview coming soon</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 px-3 py-2">
                    {design.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3 flex-wrap">
          <Link to={`/orders/${order.id}`}>
            <Button variant="primary" size="sm">
              View details
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleReorder(order, cloneCandidate)}
            isDisabled={!cloneCandidate}
            isLoading={reordering === order.id}
          >
            Reorder this design
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container-max py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Designs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.firstName ? `Welcome back, ${user.firstName}.` : 'Welcome back.'} Open your latest design to choose color/fit and checkout from the design page.
          </p>
        </div>
        <Link to="/#quickstart">
          <Button variant="primary" size="sm">Start a new design</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'designs' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('designs')}
        >
          Designs
        </Button>
        <Button
          variant={activeTab === 'past' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('past')}
        >
          Past orders
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-400">{error}</p>
            <button onClick={fetchOrders} className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && activeTab === 'designs' && (
          <>
            {designsList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No designs yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start a new preview to create your first one-of-one GPTee.
                </p>
                <Link to="/#quickstart">
                  <Button variant="primary">Start a new design</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {designsList.map(renderDesignCard)}
              </div>
            )}
          </>
        )}

        {!loading && !error && activeTab === 'past' && (
          <>
            {pastList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No past orders yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Once your tees ship, they will show here with tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastList.map(renderPastCard)}
              </div>
            )}
          </>
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
