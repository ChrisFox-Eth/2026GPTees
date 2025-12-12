/**
 * @module pages/OrderDetailPage
 * @description Order detail page with designs and shipping info
 * @since 2025-11-22
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiGet, apiPost } from '../utils/api';
import { Button } from '@components/ui/Button';
import { trackEvent } from '@utils/analytics';
import type { Order, DesignPreview } from '../types/order';

/**
 * @function OrderDetailContent
 * @description Order detail content component displaying order items, designs, shipping info, and approval controls
 *
 * @returns {JSX.Element} The order detail content
 *
 * @example
 * // Used as main component export
 * export default function OrderDetailPage() {
 *   return <OrderDetailContent />;
 * }
 */
function OrderDetailContent(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const formatStatus = (status?: string | null) =>
    status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown';

  useEffect(() => {
    if (id && isLoaded && isSignedIn) {
      fetchOrder();
    }
  }, [id, isLoaded, isSignedIn]);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        setError('Authentication required. Please sign in again.');

        return;
      }

      const response = await apiGet(`/api/orders/${id}`, token);

      setOrder(response.data);

      setError(null);

      trackEvent('account.order_detail.loaded', {
        order_id: id,

        status: response.data?.status,

        design_count: response.data?.designs?.length ?? 0,
      });
    } catch (err: any) {
      console.error('Error loading order', err);

      setError(err.message || 'Failed to load order');

      trackEvent('account.order_detail.error', {
        order_id: id,

        message: err?.message || 'unknown',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDesign = async (designId: string) => {
    if (!order) return;
    try {
      setIsApproving(designId);
      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        setIsApproving(null);
        return;
      }
      await apiPost(`/api/designs/${designId}/approve`, {}, token);
      setOrder({
        ...order,
        status: 'DESIGN_APPROVED',
        designs: order.designs.map((d) => (d.id === designId ? { ...d, approvalStatus: true } : d)),
      });
      trackEvent('design.approval.submit', {
        order_id: order.id,
        design_id: designId,
        surface: 'order_detail',
      });
    } catch (err: any) {
      console.error('Error approving design:', err);
      setError(err?.message || 'Failed to approve design.');
      trackEvent('design.approval.error', {
        order_id: order?.id,
        design_id: designId,
        message: err?.message || 'unknown',
        surface: 'order_detail',
      });
    } finally {
      setIsApproving(null);
    }
  };

  const handleShareDesign = async (design: DesignPreview) => {
    const landingUrl =
      'https://gptees.app/?utm_source=customer_share&utm_medium=design&utm_campaign=ugc';
    const shareTarget = design.imageUrl || landingUrl;
    const shareText = `I just designed this custom tee on GPTees. What do you think? Start yours here: ${landingUrl}`;

    try {
      setShareFeedback(null);
      const supportsNativeShare =
        typeof navigator !== 'undefined' && typeof navigator.share === 'function';

      if (supportsNativeShare) {
        await navigator.share({
          title: 'My custom tee design',
          text: shareText,
          url: shareTarget,
        });
        setShareFeedback('Shared! Copy the link below to post anywhere else.');
        trackEvent('design.share.success', {
          order_id: order?.id ?? id,
          design_id: design.id,
          method: 'web-share',
          surface: 'order_detail',
        });
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\nPreview: ${shareTarget}`);
        setShareFeedback('Link copied—paste it to get feedback and invite friends.');
        trackEvent('design.share.success', {
          order_id: order?.id ?? id,
          design_id: design.id,
          method: 'clipboard',
          surface: 'order_detail',
        });
        return;
      }

      window.prompt('Copy this link to share your design:', `${shareText} Preview: ${shareTarget}`);
      setShareFeedback('Copy the link above to share your design anywhere.');
      trackEvent('design.share.success', {
        order_id: order?.id ?? id,
        design_id: design.id,
        method: 'prompt',
        surface: 'order_detail',
      });
    } catch (err: any) {
      console.error('Error sharing design:', err);
      setShareFeedback(
        'Could not share right now. Copy the preview link manually and keep creating.'
      );
      trackEvent('design.share.error', {
        order_id: order?.id ?? id,
        design_id: design.id,
        message: err?.message || 'unknown',
        surface: 'order_detail',
      });
    }
  };

  if (!id) {
    return (
      <div className="container-max py-12">
        <p className="text-gray-700 dark:text-gray-200">Order ID is missing.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-max flex justify-center py-12">
        <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-max py-12">
        <div className="rounded border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-300">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  const approvedDesignId = order.designs.find((d) => d.approvalStatus)?.id;

  return (
    <div className="container-max space-y-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>

          <div className="space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{new Date(order.createdAt).toLocaleString()}</span>

            <span>|</span>

            <span>Order: {formatStatus(order.status)}</span>

            {order.fulfillmentStatus && (
              <>
                <span>|</span>

                <span>Fulfillment: {formatStatus(order.fulfillmentStatus)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/account">
            <Button variant="secondary" size="sm">
              Back to Orders
            </Button>
          </Link>

          {order.status === 'PAID' && order.designsGenerated < order.maxDesigns && (
            <Link to={`/design?orderId=${order.id}`}>
              <Button variant="primary" size="sm">
                Create Draft
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Items</h2>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="text-gray-800 dark:text-gray-200">
                    <p className="font-semibold">{item.product?.name || 'Product'}</p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.size} | {item.color} | Qty {item.quantity}
                    </p>
                  </div>

                  <div className="font-semibold text-gray-900 dark:text-white">
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Designs</h2>

              {order.designs.length === 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">No designs yet</span>
              )}
            </div>

            {shareFeedback && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 text-primary-800 dark:text-primary-200 mb-3 rounded-lg border p-3 text-sm">
                {shareFeedback}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {order.designs.map((design) => (
                <div
                  key={design.id}
                  className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="bg-gray-100 dark:bg-gray-900">
                    <img
                      src={design.imageUrl}
                      alt={design.prompt}
                      className="h-48 w-full object-contain"
                    />
                  </div>

                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 font-sans text-sm text-gray-700 dark:text-gray-300">
                      {design.prompt}
                    </p>

                    <p className="font-sans text-xs text-gray-500 dark:text-gray-500">
                      {design.approvalStatus ? 'Approved' : design.status}
                    </p>

                    <div className="mt-3 flex flex-col gap-2">
                      {!design.approvalStatus &&
                        design.status === 'COMPLETED' &&
                        !approvedDesignId && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveDesign(design.id)}
                            isDisabled={isApproving === design.id}
                          >
                            <span className="font-sans">{isApproving === design.id ? 'Approving...' : 'Approve This Design'}</span>
                          </Button>
                        )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleShareDesign(design)}
                        isDisabled={design.status !== 'COMPLETED'}
                      >
                        <span className="font-sans">Share this design</span>
                      </Button>

                      <p className="font-sans text-[11px] text-gray-500 dark:text-gray-500">
                        Sharing uses your device share sheet when available; otherwise we copy a
                        link.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>

            <div className="mb-1 flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Tier</span>

              <span>{order.designTier}</span>
            </div>

            <div className="mb-1 flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Designs</span>

              <span>
                {order.designsGenerated}/
                {order.maxDesigns === 9999 ? 'unlimited' : order.maxDesigns}
              </span>
            </div>

            {order.promoCode && (
              <div className="mb-1 flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Code</span>

                <span>
                  {order.promoCode.code} (
                  {order.promoCode.type === 'FREE_PRODUCT'
                    ? `Free ${order.promoCode.productTier || 'tee'}`
                    : `${order.promoCode.percentOff || 0}% off`}
                  )
                </span>
              </div>
            )}

            <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              <span>Total</span>

              <span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Shipping</h2>

            {order.address ? (
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>{order.address.name}</p>

                <p>{order.address.address1}</p>

                {order.address.address2 && <p>{order.address.address2}</p>}

                <p>
                  {order.address.city}, {order.address.state} {order.address.zip}
                </p>

                <p>{order.address.country}</p>

                {order.address.phone && <p>Phone: {order.address.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No shipping address on file.
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Tracking</h2>

            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>Status: {formatStatus(order.fulfillmentStatus || order.status)}</p>

              {order.trackingNumber ? (
                <p>
                  Tracking #:{' '}
                  <a
                    href={`https://myorders.co/tracking/${encodeURIComponent(order.trackingNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {order.trackingNumber}
                  </a>
                </p>
              ) : (
                <p>Tracking #: Not yet available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @component
 * @description Order detail page displaying comprehensive order information including items, designs, shipping address, tracking, and design approval/sharing controls.
 *
 * @returns {JSX.Element} The rendered order detail page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/orders/:id" element={<OrderDetailPage />} />
 */
export default function OrderDetailPage(): JSX.Element {
  return <OrderDetailContent />;
}
