/**
 * @module pages/CheckoutSuccessPage
 * @description Checkout success page after payment
 * @since 2025-11-21
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { useCart } from '../hooks/useCart';
import { apiGet } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import { useAuth } from '@clerk/clerk-react';
import type { OrderSummary } from '../types/order';

/**
 * @component
 * @description Checkout success page confirming payment completion and displaying next steps. Auto-redirects to design page after brief delay.
 *
 * @returns {JSX.Element} The rendered checkout success page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
 */
export default function CheckoutSuccessPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { getToken } = useAuth();
  const [isCleared, setIsCleared] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const hasTrackedPaid = useRef(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear cart after successful payment (only once)
    if (!isCleared) {
      clearCart();
      setIsCleared(true);
    }
  }, [clearCart, isCleared]);

  useEffect(() => {
    if (orderId) {
      trackEvent('checkout.success.view', {
        order_id: orderId,
        session_id: sessionId || 'none',
      });
      void loadOrder();
    }
  }, [orderId, sessionId]);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setIsLoadingOrder(true);
      const token = await getToken();
      if (!token) return;
      const response = await apiGet(`/api/orders/${orderId}`, token);
      const order = response?.data;
      if (!order) return;

      const itemTotal = (order.items || []).reduce(
        (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
        0
      );
      const shipping = Math.max(0, Number(order.totalAmount) - itemTotal);

      setOrderSummary({
        totalAmount: Number(order.totalAmount),
        items: (order.items || []).map((i: any) => ({
          productName: i.product.name,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
        shipping,
        tier: order.designTier,
        country: order.address?.country || 'US',
        promoCode: order.promoCode
          ? {
              code: order.promoCode.code,
              type: order.promoCode.type,
              percentOff: order.promoCode.percentOff,
              productTier: order.promoCode.productTier,
            }
          : null,
      });
    } catch (error) {
      console.error('Failed to load order summary', error);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  useEffect(() => {
    if (orderSummary && orderId && !hasTrackedPaid.current) {
      hasTrackedPaid.current = true;
      trackEvent('order.paid', {
        order_id: orderId,
        amount: Number(orderSummary.totalAmount.toFixed(2)),
        shipping: Number((orderSummary.shipping ?? 0).toFixed(2)),
        item_count: orderSummary.items.length,
        tier: orderSummary.tier || null,
        country: orderSummary.country || null,
      });
    }
  }, [orderSummary, orderId]);

  useEffect(() => {
    if (!orderId) return;
    const timeout = setTimeout(() => {
      trackEvent('checkout.success.redirect_to_design', { order_id: orderId });
      navigate(`/design?orderId=${orderId}`, { replace: true });
    }, 600);
    return () => clearTimeout(timeout);
  }, [orderId, navigate]);

  // confirmPayment and handleShare removed from UI (no-op stubs deleted)

  if (!orderId) {
    return (
      <div className="container-max py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Invalid Session</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">No order information found.</p>
          <Link to="/#quickstart">
            <Button variant="primary">Start another design</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-10 w-10 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Design locked & paid
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your order is locked with your latest design and fit. We&apos;re sending you to your
            design page for a final look.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            If you&apos;re not redirected, use the button below.
          </p>
        </div>

        {/* Order Info */}
        <div className="rounded-lg bg-white p-5 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            What&apos;s next?
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 dark:bg-primary-900 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-primary-600 dark:text-primary-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Review your locked design
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We applied your latest design and fit. You can view it in My Designs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 dark:bg-primary-900 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-primary-600 dark:text-primary-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  We&apos;ll print & ship
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our team is moving it to production. You&apos;ll get tracking as soon as it ships.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 dark:bg-primary-900 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                <span className="text-primary-600 dark:text-primary-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Need tweaks?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If something looks off, reach out within 24 hours at team@gptees.app.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            onClick={() => navigate(`/design?orderId=${orderId}`)}
            className="flex-1 py-4 text-lg"
          >
            View my locked design
          </Button>
        </div>

        {/* Order Details (collapsible) */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="text-primary-800 dark:text-primary-200 flex w-full items-center justify-between text-sm font-semibold"
          >
            <span>Order details</span>
            <span>{detailsOpen ? 'Hide' : 'Show'}</span>
          </button>
          {detailsOpen && (
            <div className="text-primary-800 dark:text-primary-200 mt-3 space-y-1 text-sm">
              <p>
                <strong>Order ID:</strong> {orderId}
              </p>
              {sessionId && (
                <p>
                  <strong>Session ID:</strong> {sessionId}
                </p>
              )}
              {isLoadingOrder && <p>Loading order details...</p>}
              {orderSummary && (
                <div className="space-y-1">
                  <p>
                    <strong>Items:</strong> $
                    {orderSummary.items
                      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
                      .toFixed(2)}
                  </p>
                  <p>
                    <strong>Shipping:</strong> ${(orderSummary.shipping ?? 0).toFixed(2)}
                  </p>
                  <p className="text-base">
                    <strong>Total Paid:</strong> ${orderSummary.totalAmount.toFixed(2)}
                  </p>
                  {orderSummary.promoCode && (
                    <p>
                      <strong>Code Applied:</strong> {orderSummary.promoCode.code} (
                      {orderSummary.promoCode.type === 'FREE_PRODUCT'
                        ? `Free ${orderSummary.promoCode.productTier || 'tee'}`
                        : `${orderSummary.promoCode.percentOff || 0}% off`}
                      )
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Support */}
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <p className="font-semibold">Need help?</p>
          <p className="mt-1">
            Email us at{' '}
            <a
              className="text-primary-600 dark:text-primary-400 underline"
              href="mailto:team@gptees.app"
            >
              team@gptees.app
            </a>{' '}
            and we&rsquo;ll jump in.
          </p>
        </div>

        {/* Email Confirmation */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          A confirmation email has been sent to your email address
        </p>
      </div>
    </div>
  );
}
