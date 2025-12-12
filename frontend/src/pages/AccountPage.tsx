/**
 * @module pages/AccountPage
 * @description User account page with design-first focus and past orders
 * @since 2025-11-21
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@components/ui/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiGet, apiPost } from '../utils/api';
import { trackEvent } from '@utils/analytics';
import type { Order, DesignPreview } from '../types/order';

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
  <span
    className={`rounded px-2 py-1 text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}
  >
    {status.replace(/_/g, ' ')}
  </span>
);

const previewStatuses = ['PENDING_PAYMENT', 'DESIGN_PENDING'];
const pastOrderStatuses = [
  'PAID',
  'DESIGN_APPROVED',
  'SUBMITTED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

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

/**
 * @function AccountContent
 * @description Protected content component displaying user's designs and past orders with reorder functionality
 *
 * @returns {JSX.Element} The account page content with designs and orders tabs
 *
 * @example
 * // Used within ProtectedRoute wrapper
 * <ProtectedRoute>
 *   <AccountContent />
 * </ProtectedRoute>
 */
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
      className="hover:border-primary-400/80 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow dark:border-gray-700 dark:bg-gray-900/60"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Design preview</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">{getStatusBadge(order.status)}</div>
      </div>

      {order.designs?.length > 0 && (
        <div className="mt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {order.designs.map((design) => (
              <div
                key={design.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex h-40 items-center justify-center bg-gray-100 dark:bg-gray-800">
                  {design.imageUrl ? (
                    <img
                      src={design.imageUrl}
                      alt={design.prompt}
                      className="max-h-36 object-contain"
                    />
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Design preview coming soon
                    </div>
                  )}
                </div>
                <p className="line-clamp-3 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                  {design.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to={`/design?orderId=${order.id}`}>
          <Button variant="primary" size="sm">
            Open design
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderPastCard = (order: Order) => {
    return (
      <div
        key={order.id}
        className="hover:border-primary-400/80 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow dark:border-gray-700 dark:bg-gray-900/60"
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Past order</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1 text-right">
            {getStatusBadge(order.status)}
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              ${Number(order.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {order.designs.map((design) => (
                <div
                  key={design.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex h-32 items-center justify-center bg-gray-100 dark:bg-gray-800">
                    {design.imageUrl ? (
                      <img
                        src={design.imageUrl}
                        alt={design.prompt}
                        className="max-h-28 object-contain"
                      />
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Design preview coming soon
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                    {design.prompt}
                  </p>
                  <div className="flex flex-col gap-2 px-3 pb-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReorder(order, design)}
                      isDisabled={reordering === order.id}
                      isLoading={reordering === order.id}
                    >
                      Reorder this design
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/orders/${order.id}`}>
            <Button variant="primary" size="sm">
              View details
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="container-max space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">My Designs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.firstName ? `Welcome back, ${user.firstName}.` : 'Welcome back.'} Open your
            latest design to choose color/fit and checkout from the design page.
          </p>
        </div>
        <Link to="/#quickstart">
          <Button variant="primary" size="sm">
            Start a new design
          </Button>
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

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-800 dark:text-red-400">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && activeTab === 'designs' && (
          <>
            {designsList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-5xl">🛍️</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  No designs yet
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Start a new preview to create your first one-of-one GPTee.
                </p>
                <Link to="/#quickstart">
                  <Button variant="primary">Start a new design</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">{designsList.map(renderDesignCard)}</div>
            )}
          </>
        )}

        {!loading && !error && activeTab === 'past' && (
          <>
            {pastList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-5xl">📦</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  No past orders yet
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Once your tees ship, they will show here with tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-4">{pastList.map(renderPastCard)}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * @component
 * @description Main account page component that wraps AccountContent with authentication protection. Displays user designs, past orders, and reorder functionality.
 *
 * @returns {JSX.Element} The rendered account page with protected content
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/account" element={<AccountPage />} />
 */
export default function AccountPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
