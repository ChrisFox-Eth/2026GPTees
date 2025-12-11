/**
 * @module pages/CartPage
 * @description Shopping cart page
 * @since 2025-11-21
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useCart } from '../hooks/useCart';
import { Button } from '@components/Button';
import { trackEvent } from '@utils/analytics';

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
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4" aria-hidden="true">Cart</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Start shopping to add your first GPTee.
          </p>
          <Link to="/shop">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-6 sm:py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">Shopping Cart</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Submit your size and color to unlock your design preview after checkout. Each cart holds one Limitless GPTee with unlimited redraws.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 flex flex-col sm:flex-row gap-4 overflow-hidden"
            >
              {/* Product Image */}
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover rounded"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-wide px-2 text-gray-500">
                    Preview coming soon
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 break-words">
                  {item.productName}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Size: {item.size}</p>
                  <p>Color: {item.color}</p>
                  <p className="font-medium">Limitless redraws included</p>
                  {item.bundle && (
                    <p className="text-xs text-primary-700 dark:text-primary-300">
                      Bundle applied: 2 tees, 10% off tier price
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Unlimited redraws until you approve.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-right sm:text-right flex sm:block items-start justify-between sm:justify-end gap-3">
                <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  ${((item.basePrice + item.tierPrice) * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                  ${(item.basePrice + item.tierPrice).toFixed(2)} each
                </p>
                {item.bundleDiscount && item.bundleDiscount > 0 && (
                  <p className="text-xs text-primary-600 dark:text-primary-300">
                    Savings: ${(item.bundleDiscount * item.quantity).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary - Desktop */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items ({totalItems})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {!isSignedIn && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-4 text-sm text-yellow-800 dark:text-yellow-400">
                Sign in to proceed to checkout
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleCheckout}
              className="w-full mb-3"
            >
              {isSignedIn ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            </Button>

            <Link to="/shop">
              <Button variant="secondary" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            {/* Tier Info */}
            <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                What's next?
              </h3>
              <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
                <li>• Complete payment</li>
                <li>• We craft your artwork and share it</li>
                <li>• Approve, then we print & ship</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Checkout Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 lg:hidden z-30 shadow-lg">
          <div className="container-max flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${subtotal.toFixed(2)}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleCheckout}
              className="flex-1 max-w-xs"
            >
              {isSignedIn ? 'Checkout' : 'Sign In to Checkout'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
