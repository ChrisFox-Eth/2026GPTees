/**
 * @module pages/CheckoutPage
 * @description Checkout page that captures shipping and starts Stripe checkout
 * @since 2025-11-22
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiPost } from '../utils/api';
import { useCart } from '../hooks/useCart';
import { Button } from '@components/Button';

interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
}

const SHIPPING_STORAGE_KEY = 'gptees_shipping_address';

export default function CheckoutPage(): JSX.Element {
  const navigate = useNavigate();
  const { cart, getSubtotal, isLoaded } = useCart();
  const { getToken } = useAuth();

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

  const subtotal = getSubtotal();

  useEffect(() => {
    // Wait for cart to load from localStorage before redirecting
    if (!isLoaded) return;
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart.length, isLoaded, navigate]);

  // Load saved shipping info for faster mobile checkout
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

      const response = await apiPost(
        '/api/payments/create-checkout-session',
        {
          items: cart,
          shippingAddress: {
            ...shipping,
            address2: shipping.address2 || undefined,
            phone: shipping.phone || undefined,
          },
        },
        token
      );

      // Remember shipping info for the next checkout
      localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(shipping));

      const checkoutUrl = response.data.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-max py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shipping Details</h1>

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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={shipping.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                placeholder="For delivery updates"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Starting checkout...' : 'Proceed to Payment'}
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {cart.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.size} / {item.color} / {item.tier}
                  </p>
                </div>
                <div className="text-right text-gray-900 dark:text-white">
                  ${(item.basePrice + item.tierPrice).toFixed(2)} x {item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Items</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
