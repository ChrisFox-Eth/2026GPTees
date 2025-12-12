/**
 * @module pages/CartPage
 * @description Shopping cart page
 * @since 2025-11-21
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useCart } from '../hooks/useCart';
import { Button } from '@components/ui/Button';
import { trackEvent } from '@utils/analytics';

/**
 * @component
 * @description Shopping cart page displaying cart items with quantity controls, pricing breakdown, and checkout flow. Features responsive design with mobile sticky checkout bar.
 *
 * @returns {JSX.Element} The rendered shopping cart page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/cart" element={<CartPage />} />
 */
export default function CartPage(): JSX.Element {
  const { cart, removeFromCart, updateQuantity, getSubtotal, getTotalItems } = useCart();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();

  const handleCheckout = () => {
    trackEvent('cart.checkout.start', {
      item_count: totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      is_signed_in: isSignedIn,
    });

    if (!isSignedIn) {
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="container-max py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 text-6xl" aria-hidden="true">
            Cart
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Your cart is empty
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Start designing to add your first GPTee.
          </p>
          <Link to="/#quickstart">
            <Button variant="primary">Start a new design</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-6 pb-24 sm:py-8 lg:pb-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:mb-8 sm:text-3xl dark:text-white">
        Shopping Cart
      </h1>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Submit your size and color to unlock your design preview after checkout. Each cart holds one
        Limitless GPTee with studio access.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {cart.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 overflow-hidden rounded-lg bg-white p-4 shadow sm:flex-row sm:p-6 dark:bg-gray-800"
            >
              {/* Product Image */}
              <div className="h-24 w-24 flex-shrink-0 rounded bg-gray-200 dark:bg-gray-700">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="h-full w-full rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-xs tracking-wide text-gray-500 uppercase">
                    Preview coming soon
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="min-w-0 flex-grow">
                <h3 className="mb-1 text-lg font-semibold break-words text-gray-900 dark:text-white">
                  {item.productName}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Size: {item.size}</p>
                  <p>Color: {item.color}</p>
                  <p className="font-medium">Limitless redraws included</p>
                  {item.bundle && (
                    <p className="text-primary-700 dark:text-primary-300 text-xs">
                      Bundle applied: 2 tees, 10% off tier price
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Explore options until you're ready.
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="h-8 w-8 rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="h-8 w-8 rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start justify-between gap-3 text-right sm:block sm:justify-end sm:text-right">
                <p className="text-lg font-bold whitespace-nowrap text-gray-900 dark:text-white">
                  ${((item.basePrice + item.tierPrice) * item.quantity).toFixed(2)}
                </p>
                <p className="mt-1 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                  ${(item.basePrice + item.tierPrice).toFixed(2)} each
                </p>
                {item.bundleDiscount && item.bundleDiscount > 0 && (
                  <p className="text-primary-600 dark:text-primary-300 text-xs">
                    Savings: ${(item.bundleDiscount * item.quantity).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary - Desktop */}
        <div className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-20 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items ({totalItems})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {!isSignedIn && (
              <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                Sign in to proceed to checkout
              </div>
            )}

            <Button variant="primary" onClick={handleCheckout} className="mb-3 w-full">
              {isSignedIn ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            </Button>

            <Link to="/#quickstart">
              <Button variant="secondary" className="w-full">
                Continue designing
              </Button>
            </Link>

            {/* Tier Info */}
            <div className="bg-primary-50 dark:bg-primary-900/20 mt-6 rounded-lg p-4">
              <h3 className="text-primary-900 dark:text-primary-100 mb-2 font-semibold">
                What's next?
              </h3>
              <ul className="text-primary-800 dark:text-primary-200 space-y-1 text-sm">
                <li>• Complete payment</li>
                <li>• We craft your artwork and share it</li>
                <li>• Approve, then we print & ship</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Checkout Bar */}
        <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden dark:border-gray-700 dark:bg-gray-800">
          <div className="container-max flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${subtotal.toFixed(2)}
              </p>
            </div>
            <Button variant="primary" onClick={handleCheckout} className="max-w-xs flex-1">
              {isSignedIn ? 'Checkout' : 'Sign In to Checkout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
