/**
 * @module pages/AccountPage
 * @description User account page with order history
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { apiGet } from '../utils/api';
import { Button } from '@components/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import { trackEvent } from '@utils/analytics';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  designTier: string;
  designsGenerated: number;
  maxDesigns: number;
  createdAt: string;
  items: any[];
  designs: any[];
  fulfillmentStatus?: string | null;
  trackingNumber?: string | null;
}

function AccountContent(): JSX.Element {
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrders();
    }
  }, [isLoaded, isSignedIn]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await apiGet('/api/orders', token);
      setOrders(response.data || []);
      setError(null);
      trackEvent('account.orders.loaded', {
        order_count: (response.data || []).length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
      console.error('Error fetching orders:', err);
      trackEvent('account.orders.error', {
        message: err?.message || 'unknown',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING_PAYMENT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      DESIGN_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      DESIGN_APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      SUBMITTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      SHIPPED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status] || styles.PENDING_PAYMENT}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="container-max py-8">
      {/* User Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </p>
      </div>

      {/* Orders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Order History
        </h2>

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
            <button
              onClick={fetchOrders}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
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
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </h3>
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
                  <span>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>{order.designTier} Tier</span>
                  <span>•</span>
                  <span>
                    Designs: {order.designsGenerated}/{order.maxDesigns === 9999 ? '∞' : order.maxDesigns}
                  </span>
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
                        href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(order.trackingNumber)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {order.trackingNumber}
                      </a>
                    </>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No orders yet
            </h3>
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
