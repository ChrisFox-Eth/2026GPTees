/**
 * @module pages/CheckoutPage
 * @description Checkout page that captures shipping and starts Stripe checkout
 * @since 2025-11-22
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiPost, apiGet } from '@utils/api';
import { useCart } from '../hooks/useCart';
import { Button } from '@components/Button';
import { trackEvent } from '@utils/analytics';
import { calculateShipping } from '@utils/shipping';
import { ExamplesGallery } from '@components/ExamplesGallery';
import type { Order, OrderItem, ShippingAddress } from '../types/order';
import type { AppliedCodeInfo } from '../types/promo';

const SHIPPING_STORAGE_KEY = 'gptees_shipping_address';

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

  const activeItems: Array<OrderItem | (typeof cart)[number]> =
    isPreviewCheckout ? previewOrder?.items || [] : cart;
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
          : ((firstItem as any).basePrice + (firstItem as any).tierPrice) * (firstItem as any).quantity
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
  const activeTier = isPreviewCheckout ? previewOrder?.designTier : cart[0]?.tier;

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

  const handleApplyCode = async () => {
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setCodeError('Enter a code to apply.');
      return;
    }

    try {
      setIsApplyingCode(true);
      setCodeError(null);
      setCodeMessage(null);
      const token = await getToken();
      if (!token) {
        setCodeError('Authentication required. Please sign in.');
        return;
      }
      const res = await apiGet(`/api/promo/validate?code=${encodeURIComponent(trimmed)}`, token);
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
      });
    } catch (err: any) {
      setAppliedCode(null);
      setAppliedCodeInfo(null);
      setCodeMessage(null);
      setCodeError(err?.message || 'Could not validate code.');
      trackEvent('checkout.code.error', {
        code: trimmed,
        message: err?.message || 'unknown',
      });
    } finally {
      setIsApplyingCode(false);
    }
  };

  const handleRemoveCode = () => {
      setAppliedCode(null);
      setAppliedCodeInfo(null);
      setCodeMessage(null);
      setCodeError(null);
      setCodeInput('');
      trackEvent('checkout.code.removed', {});
    };

  if (isPreviewCheckout && isLoadingPreview) {
    return (
      <div className="container-max py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (isPreviewCheckout && !previewOrder) {
    return (
      <div className="container-max py-12">
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Preview order not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
    <div className="container-max py-6 sm:py-8 pb-24 lg:pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Complete your order in just a few steps</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Printed & fulfilled by Printful - Secure payments via Stripe - Ships in 5-8 business days
        </p>
        {isPreviewCheckout && previewOrder && (
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">
              Reusing preview order {previewOrder.orderNumber}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Your prompt and designs stay attached. Add shipping below and we will reuse this order for checkout.
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <ExamplesGallery />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Shipping Details</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-6">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={shipping.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                name="name"
                autoComplete="name"
                placeholder="Jane Doe"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={shipping.address1}
                onChange={(e) => handleInputChange('address1', e.target.value)}
                name="address1"
                autoComplete="address-line1"
                placeholder="123 Main St"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 2 (optional)
              </label>
              <input
                type="text"
                value={shipping.address2}
                onChange={(e) => handleInputChange('address2', e.target.value)}
                name="address2"
                autoComplete="address-line2"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={shipping.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                name="city"
                autoComplete="address-level2"
                placeholder="Austin"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State/Region
              </label>
              <input
                type="text"
                value={shipping.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                name="state"
                autoComplete="address-level1"
                placeholder="TX"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={shipping.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                name="country"
                autoComplete="country"
                placeholder="US"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                required
              />
            </div>

            {(shipping.country !== 'US' && shipping.country !== 'CA') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone (recommended for international shipping)
                </label>
                <input
                type="tel"
                value={shipping.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                placeholder="For delivery updates"
              />
            </div>
            )}
            {(shipping.country === 'US' || shipping.country === 'CA') && (
              <div className="md:col-span-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPhone(!showPhone)}
                  className="text-sm text-primary-600 dark:text-primary-300 hover:underline"
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
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                    placeholder="For delivery updates"
                  />
                )}
              </div>
            )}

            {/* Promo/Gift Code */}
            <div className="md:col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Have a gift or promo code?
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                  disabled={Boolean(appliedCode)}
                />
                {appliedCode ? (
                  <Button variant="secondary" onClick={handleRemoveCode} className="w-full sm:w-auto">
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
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">{codeMessage}</p>
              )}
              {codeError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{codeError}</p>
              )}
            </div>
          </div>

          {/* Desktop Submit Button */}
          <div className="mt-6 hidden lg:block">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="primary"
                onClick={handleCheckout}
                disabled={
                  isSubmitting ||
                  (!isPreviewCheckout && cart.length === 0) ||
                  (isPreviewCheckout && !previewOrder)
                }
                className="w-full md:w-auto px-8"
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
              </Button>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ships in 5-8 business days • {activeTier === 'PREMIUM' ? 'Unlimited redraws' : '1 artwork included'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary - Desktop */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hidden lg:block sticky top-20 self-start">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">What is included</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Super-soft GPTee</li>
              <li>• Artwork crafted from your words</li>
              <li>• Printful fulfillment & shipping</li>
            </ul>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Why go Limitless? We redraw until you love it.</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ships in 5-8 business days.</p>
          </div>

          <div className="space-y-4 mb-6">
            {activeItems.map((item, idx) => {
              const productName = isPreviewCheckout
                ? ((item as OrderItem).product?.name || 'Custom GPTee')
                : (item as any).productName;
              const itemTier = isPreviewCheckout ? previewOrder?.designTier : (item as any).tier;
              const unitPrice = isPreviewCheckout
                ? Number((item as OrderItem).unitPrice)
                : (item as any).basePrice + (item as any).tierPrice;

              return (
                <div key={`${item.productId}-${idx}`} className="flex justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{productName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.size} / {item.color} / {itemTier === 'PREMIUM' ? 'Limitless redraws' : 'Classic (1 artwork)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {itemTier === 'PREMIUM' ? 'Unlimited redraws until approval.' : 'Includes 1 artwork.'}
                    </p>
                    {!isPreviewCheckout && (item as any).bundle && (
                      <p className="text-xs text-primary-700 dark:text-primary-300">
                        Bundle: 2 tees • 10% off tier price (savings ${
                          (((item as any).bundleDiscount ?? 0) * (item as any).quantity).toFixed(2)
                        })
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

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
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
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
              <span>Total</span>
              <span>${totalWithShipping.toFixed(2)}</span>
            </div>
            {totalWithShipping === 0 && (
              <p className="text-xs text-primary-700 dark:text-primary-300">
                This order will complete without Stripe.
              </p>
            )}
          </div>
        </div>

        {/* Mobile Sticky Checkout Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 lg:hidden z-30 shadow-lg">
          <div className="container-max">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
              Ships in 5-8 business days • {activeTier === 'PREMIUM' ? 'Unlimited redraws' : '1 artwork included'}
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
