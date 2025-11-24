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
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Start shopping to add items to your cart
          </p>
          <Link to="/shop">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex gap-4"
            >
              {/* Product Image */}
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    👕
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {item.productName}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Size: {item.size}</p>
                  <p>Color: {item.color}</p>
                  <p className="font-medium">
                    Tier: {item.tier === 'BASIC' ? 'Basic (1 design)' : 'Premium (unlimited designs)'}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-4">
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
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ${((item.basePrice + item.tierPrice) * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${(item.basePrice + item.tierPrice).toFixed(2)} each
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
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
                <li>✓ Complete payment</li>
                <li>✓ Generate AI designs</li>
                <li>✓ We print & ship to you</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
