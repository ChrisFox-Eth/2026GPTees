/**
 * @module pages/CheckoutPage
 * @description Checkout page that captures shipping and starts Stripe checkout
 * @since 2025-11-22
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiPost, apiGet } from '@utils/api';
import { useCart } from '../hooks/useCart';
import { Button } from '@components/ui/Button';
import { trackEvent } from '@utils/analytics';
import { calculateShipping } from '@utils/shipping';
import { ExamplesGallery } from '@components/sections/ExamplesGallery';
import {
  HAPPY_HOLIDAYS_CHECKOUT_OPT_OUT_KEY,
  HAPPY_HOLIDAYS_CODE,
  formatHappyHolidaysEndsShort,
  isHappyHolidaysActive,
} from '@utils/holidayPromo';
import type { Order, OrderItem, ShippingAddress } from '../types/order';
import type { AppliedCodeInfo } from '../types/promo';

const SHIPPING_STORAGE_KEY = 'gptees_shipping_address';

/**
 * @component
 * @description Checkout page capturing shipping details and initiating Stripe payment. Supports both cart checkout and preview order checkout with promo/gift code validation.
 *
 * @returns {JSX.Element} The rendered checkout page with shipping form and order summary
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/checkout" element={<CheckoutPage />} />
 */
export default function CheckoutPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, getSubtotal, isLoaded } = useCart();
  const { getToken } = useAuth();
  const orderIdParam = searchParams.get('orderId');
  const isPreviewCheckout = Boolean(orderIdParam);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [shipping, setShipping] = useState<ShippingAddress>({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedCodeInfo, setAppliedCodeInfo] = useState<AppliedCodeInfo | null>(null);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [autoPromoAttempted, setAutoPromoAttempted] = useState(false);

  const activeItems: Array<OrderItem | (typeof cart)[number]> = isPreviewCheckout
    ? previewOrder?.items || []
    : cart;
  const subtotal = isPreviewCheckout
    ? previewOrder?.items.reduce(
        (total, item) => total + Number(item.unitPrice) * item.quantity,
        0
      ) || 0
    : getSubtotal();
  const shippingCost = calculateShipping({ country: shipping.country });
  const { discountedItemsTotal, discountAmount } = (() => {
    if (!appliedCodeInfo) {
      return { discountedItemsTotal: subtotal, discountAmount: 0 };
    }

    if (appliedCodeInfo.type === 'FREE_PRODUCT') {
      const firstItem = activeItems[0];
      const itemTotal = firstItem
        ? isPreviewCheckout
          ? Number((firstItem as OrderItem).unitPrice) * (firstItem as OrderItem).quantity
          : ((firstItem as any).unitPrice ??
              ((firstItem as any).basePrice || 0) + ((firstItem as any).tierPrice || 0)) *
            (firstItem as any).quantity
        : subtotal;
      const discount = activeItems.length === 1 ? itemTotal : 0;
      return {
        discountedItemsTotal: Math.max(0, subtotal - discount),
        discountAmount: Math.min(discount, subtotal),
      };
    }

    const percent = appliedCodeInfo.percentOff ?? 0;
    const discount = Math.min(subtotal * (percent / 100), subtotal);
    return {
      discountedItemsTotal: Math.max(0, subtotal - discount),
      discountAmount: discount,
    };
  })();
  const totalWithShipping = discountedItemsTotal + shippingCost;
  useEffect(() => {
    if (!isLoaded || isPreviewCheckout) return;
    if (cart.length === 0) {
      trackEvent('checkout.redirect.cart_empty', {});
      navigate('/cart');
    }
  }, [cart.length, isLoaded, isPreviewCheckout, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ShippingAddress;
        setShipping((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore malformed saved data
      }
    }
  }, []);

  useEffect(() => {
    if (!orderIdParam) return;
    const loadPreviewOrder = async () => {
      try {
        setIsLoadingPreview(true);
        const token = await getToken();
        if (!token) {
          setError('Authentication required. Please sign in again.');
          return;
        }
        const response = await apiGet(`/api/orders/${orderIdParam}`, token);
        setPreviewOrder(response.data as Order);
      } catch (err: any) {
        console.error('Error fetching preview order:', err);
        setError(err?.message || 'Failed to load preview order. Please try again.');
      } finally {
        setIsLoadingPreview(false);
      }
    };
    loadPreviewOrder();
  }, [orderIdParam, getToken]);

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShipping((prev) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }
      if (isPreviewCheckout && !previewOrder) {
        setError('Preview order is still loading. Please try again.');
        return;
      }

      trackEvent('checkout.payment.start', {
        item_count: activeItems.length,
        order_id: orderIdParam || undefined,
        subtotal: Number(subtotal.toFixed(2)),
        country: shipping.country,
        has_state: Boolean(shipping.state),
        has_phone: Boolean(shipping.phone),
        shipping: Number(shippingCost.toFixed(2)),
      });

      const payload: Record<string, unknown> = {
        shippingAddress: {
          ...shipping,
          address2: shipping.address2 || undefined,
          phone: shipping.phone || undefined,
        },
        code: appliedCode || undefined,
      };

      if (isPreviewCheckout && orderIdParam) {
        payload.orderId = orderIdParam;
      } else {
        payload.items = cart;
      }

      const response = await apiPost('/api/payments/create-checkout-session', payload, token);

      trackEvent('checkout.session_created', {
        order_id: response.data.orderId || orderIdParam,
        session_id: response.data.sessionId,
        shipping: Number(shippingCost.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
      });

      localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(shipping));

      const checkoutUrl = response.data.url as string | undefined;
      const orderId = response.data.orderId as string | undefined;
      const freeOrder = response.data.freeOrder as boolean | undefined;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else if (orderId) {
        navigate(`/checkout/success?order_id=${orderId}${freeOrder ? '' : ''}`);
      } else {
        throw new Error('No checkout URL returned from server.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      trackEvent('checkout.payment.error', {
        message: err?.message || 'unknown',
      });
      setError(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCode = useCallback(async (rawCode: string, source: 'auto' | 'user') => {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      if (source === 'user') {
        setCodeError('Enter a code to apply.');
      }
      return;
    }

    try {
      setIsApplyingCode(true);
      setCodeError(null);
      setCodeMessage(null);
      setCodeInput(trimmed);
      const token = await getToken();
      const res = await apiGet(`/api/promo/validate?code=${encodeURIComponent(trimmed)}`, token || undefined);
      setAppliedCode(res?.data?.code || trimmed);
      setAppliedCodeInfo({
        code: res?.data?.code || trimmed,
        type: res?.data?.type,
        percentOff: res?.data?.percentOff,
        productTier: res?.data?.productTier,
      });
      setCodeMessage(
        res?.data?.type === 'FREE_PRODUCT'
          ? `Gift code applied for a ${res?.data?.productTier || 'tee'}`
          : `Promo code applied: ${res?.data?.percentOff || 0}% off`
      );
      trackEvent('checkout.code.applied', {
        code: res?.data?.code || trimmed,
        type: res?.data?.type || 'unknown',
        source,
      });
    } catch (err: any) {
      setAppliedCode(null);
      setAppliedCodeInfo(null);
      setCodeMessage(null);
      if (source === 'user') {
        setCodeError(err?.message || 'Could not validate code.');
      } else {
        setCodeInput('');
      }
      trackEvent('checkout.code.error', {
        code: trimmed,
        message: err?.message || 'unknown',
        source,
      });
    } finally {
      setIsApplyingCode(false);
    }
  }, [getToken]);

  const handleApplyCode = async () => {
    await applyCode(codeInput, 'user');
  };

  const handleRemoveCode = () => {
    if (appliedCode && appliedCode.toUpperCase() === HAPPY_HOLIDAYS_CODE) {
      localStorage.setItem(HAPPY_HOLIDAYS_CHECKOUT_OPT_OUT_KEY, '1');
    }
    setAppliedCode(null);
    setAppliedCodeInfo(null);
    setCodeMessage(null);
    setCodeError(null);
    setCodeInput('');
    trackEvent('checkout.code.removed', {});
  };

  useEffect(() => {
    if (autoPromoAttempted) return;
    if (appliedCode) return;
    if (!isHappyHolidaysActive()) return;
    if (localStorage.getItem(HAPPY_HOLIDAYS_CHECKOUT_OPT_OUT_KEY) === '1') return;

    setAutoPromoAttempted(true);
    applyCode(HAPPY_HOLIDAYS_CODE, 'auto').catch(() => {
      // no-op (errors are handled inside applyCode)
    });
  }, [appliedCode, autoPromoAttempted, applyCode]);

  if (isPreviewCheckout && isLoadingPreview) {
    return (
      <div className="container-max py-12">
        <div className="flex items-center justify-center py-12">
          <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

  if (isPreviewCheckout && !previewOrder) {
    return (
      <div className="container-max py-12">
        <div className="mx-auto max-w-xl rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Preview order not found
          </h1>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            We could not load your preview order. Return to your designs and try again.
          </p>
          <Button variant="primary" onClick={() => navigate('/design')}>
            Back to designs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-6 pb-24 sm:py-8 lg:pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          Checkout
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Complete your order in just a few steps
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          Printed & fulfilled by Printful - Secure payments via Stripe - Ships in 5-8 business days
        </p>
        {isPreviewCheckout && previewOrder && (
          <div className="mt-3 hidden! rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Reusing preview order {previewOrder.orderNumber}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Your idea and designs stay attached. Add shipping below and we will reuse this order
              for checkout.
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 hidden!">
        <ExamplesGallery />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Shipping Form */}
        <div className="rounded-lg bg-white p-4 shadow sm:p-6 lg:col-span-2 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 sm:mb-6 dark:text-white">
            Shipping Details
          </h2>

          {error && (
            <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                value={shipping.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                name="name"
                autoComplete="name"
                placeholder="Jane Doe"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address Line 1
              </label>
              <input
                type="text"
                value={shipping.address1}
                onChange={(e) => handleInputChange('address1', e.target.value)}
                name="address1"
                autoComplete="address-line1"
                placeholder="123 Main St"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address Line 2 (optional)
              </label>
              <input
                type="text"
                value={shipping.address2 || ''}
                onChange={(e) => handleInputChange('address2', e.target.value)}
                name="address2"
                autoComplete="address-line2"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
              <input
                type="text"
                value={shipping.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                name="city"
                autoComplete="address-level2"
                placeholder="Austin"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                State/Region
              </label>
              <input
                type="text"
                value={shipping.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                name="state"
                autoComplete="address-level1"
                placeholder="TX"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Postal Code
              </label>
              <input
                type="text"
                value={shipping.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                name="postal"
                autoComplete="postal-code"
                inputMode="numeric"
                placeholder="78701"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
              <input
                type="text"
                value={shipping.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                name="country"
                autoComplete="country"
                placeholder="US"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                required
              />
            </div>

            {shipping.country !== 'US' && shipping.country !== 'CA' && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone (recommended for international shipping)
                </label>
                <input
                  type="tel"
                  value={shipping.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                  placeholder="For delivery updates"
                />
              </div>
            )}
            {(shipping.country === 'US' || shipping.country === 'CA') && (
              <div className="space-y-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowPhone(!showPhone)}
                  className="text-primary-600 dark:text-primary-300 text-sm hover:underline"
                >
                  {showPhone ? 'Hide phone' : 'Add phone for delivery updates (optional)'}
                </button>
                {showPhone && (
                  <input
                    type="tel"
                    value={shipping.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                    placeholder="For delivery updates"
                  />
                )}
              </div>
            )}

            {/* Promo/Gift Code */}
            <div className="rounded-lg border border-gray-200 p-4 md:col-span-2 dark:border-gray-700">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Have a gift or promo code?
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                  disabled={Boolean(appliedCode)}
                />
                {appliedCode ? (
                  <Button
                    variant="secondary"
                    onClick={handleRemoveCode}
                    className="w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleApplyCode}
                    disabled={isApplyingCode}
                    className="w-full sm:w-auto"
                  >
                    {isApplyingCode ? 'Applying...' : 'Apply'}
                  </Button>
                )}
              </div>
              {codeMessage && (
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">{codeMessage}</p>
              )}
              {appliedCode && appliedCode.toUpperCase() === HAPPY_HOLIDAYS_CODE && isHappyHolidaysActive() && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Holiday promo ends {formatHappyHolidaysEndsShort()}. Excludes gift cards.
                </p>
              )}
              {codeError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{codeError}</p>
              )}
              {!appliedCode && isHappyHolidaysActive() && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Holiday promo: code <span className="font-mono">{HAPPY_HOLIDAYS_CODE}</span> auto-applies (ends{' '}
                  {formatHappyHolidaysEndsShort()}).
                </p>
              )}
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Shopping for someone else?{' '}
                <Link to="/gift" className="text-primary-600 hover:underline dark:text-primary-300">
                  Buy a gift card
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Desktop Submit Button */}
          <div className="mt-6 hidden lg:block">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleCheckout}
                disabled={
                  isSubmitting ||
                  (!isPreviewCheckout && cart.length === 0) ||
                  (isPreviewCheckout && !previewOrder)
                }
                className="w-full px-8 md:w-auto"
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
              </Button>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ships in 5-8 business days • Studio access included
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary - Desktop */}
        <div className="sticky top-20 hidden self-start rounded-lg bg-white p-4 shadow sm:p-6 lg:block dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
              What is included
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>• Super-soft GPTee</li>
              <li>• Artwork crafted from your words</li>
              <li>• Printful fulfillment & shipping</li>
            </ul>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Why go Limitless? Create with confidence.
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Ships in 5-8 business days.
            </p>
          </div>

          <div className="mb-6 space-y-4">
            {activeItems.map((item, idx) => {
              const productName = isPreviewCheckout
                ? (item as OrderItem).product?.name || 'Custom GPTee'
                : (item as any).productName;
              const unitPrice = isPreviewCheckout
                ? Number((item as OrderItem).unitPrice)
                : Number(
                    (item as any).unitPrice ??
                      ((item as any).basePrice || 0) + ((item as any).tierPrice || 0)
                  );

              return (
                <div key={`${item.productId}-${idx}`} className="flex justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{productName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.size} / {item.color} / Limitless redraws
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Explore options before approval.
                    </p>
                    {!isPreviewCheckout && (item as any).bundle && (
                      <p className="text-primary-700 dark:text-primary-300 text-xs">
                        Bundle: 2 tees • 10% off tier price (savings $
                        {(((item as any).bundleDiscount ?? 0) * (item as any).quantity).toFixed(2)})
                      </p>
                    )}
                  </div>
                  <div className="text-right text-gray-900 dark:text-white">
                    ${unitPrice.toFixed(2)} x {item.quantity}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Items</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-700 dark:text-green-300">
                <span>Discount</span>
                <span>- ${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              <span>Total</span>
              <span>${totalWithShipping.toFixed(2)}</span>
            </div>
            {totalWithShipping === 0 && (
              <p className="text-primary-700 dark:text-primary-300 text-xs">
                This order will complete without Stripe.
              </p>
            )}
          </div>
        </div>

        {/* Mobile Sticky Checkout Button */}
        <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden dark:border-gray-700 dark:bg-gray-800">
          <div className="container-max">
            <p className="mb-2 text-center text-xs text-gray-600 dark:text-gray-400">
              Ships in 5-8 business days • Studio access included
            </p>
            <Button
              variant="primary"
              onClick={handleCheckout}
              disabled={
                isSubmitting ||
                (!isPreviewCheckout && cart.length === 0) ||
                (isPreviewCheckout && !previewOrder)
              }
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : `Pay $${totalWithShipping.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
