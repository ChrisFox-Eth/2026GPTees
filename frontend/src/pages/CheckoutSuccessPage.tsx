/**
 * @module pages/CheckoutSuccessPage
 * @description Checkout success page after payment
 * @since 2025-11-21
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/Button';
import { useCart } from '../hooks/useCart';
import { apiGet } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import { useAuth } from '@clerk/clerk-react';

interface OrderItem {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

interface OrderSummary {
  totalAmount: number;
  items: OrderItem[];
  shipping?: number;
  tier?: string;
  country?: string;
  promoCode?: {
    code: string;
    type: string;
    percentOff?: number | null;
    productTier?: string | null;
  } | null;
}

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
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Session</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No order information found.
          </p>
          <Link to="/shop">
            <Button variant="primary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your order has been placed successfully. We&apos;re sending you to the design page to finish your artwork.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">If you&apos;re not redirected, use the button below.</p>
        </div>

        {/* Order Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            What's Next?
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Design Your GPTee</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tell us what to print and we&rsquo;ll craft the artwork.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Confirm Your Design</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approve your one-of-one artwork so we can print.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">We Print & Ship</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">We&rsquo;ll print it and send tracking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={() => navigate(`/design?orderId=${orderId}`)}
            className="flex-1 text-lg py-4"
          >
            Generate My Design
          </Button>
        </div>

        {/* Order Details (collapsible) */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-sm font-semibold text-primary-800 dark:text-primary-200"
          >
            <span>Order details</span>
            <span>{detailsOpen ? 'Hide' : 'Show'}</span>
          </button>
          {detailsOpen && (
            <div className="mt-3 space-y-1 text-sm text-primary-800 dark:text-primary-200">
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
                      <strong>Code Applied:</strong>{' '}
                      {orderSummary.promoCode.code} (
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
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold">Need help?</p>
          <p className="mt-1">
            Email us at{' '}
            <a className="text-primary-600 dark:text-primary-400 underline" href="mailto:team@gptees.app">
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
