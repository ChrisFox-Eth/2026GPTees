/**
 * @module components/ProductModal
 * @description Product customization modal
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Product } from '../../types/product';
import { Button } from '@components/Button';
import { Toast } from '@components/Toast';
import { useCart } from '../../hooks/useCart';
import { trackEvent } from '@utils/analytics';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps): JSX.Element | null {
  const preferredSize = product.sizes.find((s) => s === 'XL') || product.sizes[0];
  const preferredColor = product.colors.find((c) => c.name.toLowerCase() === 'black') || product.colors[0];

  const [selectedSize, setSelectedSize] = useState(preferredSize);
  const [selectedColor, setSelectedColor] = useState(preferredColor);
  const [bundleDeal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Added to cart!');

  const { addToCart, getTotalItems, getSubtotal } = useCart();
  const cartItems = getTotalItems();
  const cartSubtotal = getSubtotal();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const LIMITLESS_PRICE = 54.99;
  const basePrice = 0;
  const tierPriceRaw = LIMITLESS_PRICE;
  const tierPrice = LIMITLESS_PRICE;
  const quantity = 1;
  const totalPrice = tierPrice * quantity;
  const deliveryText = 'Ships in 5-8 business days';

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    trackEvent('shop.product.option_change', {
      product_id: product.id,
      option_type: 'size',
      option_value: size,
    });
  };

  const handleColorChange = (colorName: string) => {
    const color = product.colors.find((c) => c.name === colorName);
    if (!color) return;
    setSelectedColor(color);
    trackEvent('shop.product.option_change', {
      product_id: product.id,
      option_type: 'color',
      option_value: color.name,
    });
  };

  const handleAddToCart = () => {
    const existingItems = getTotalItems();

    addToCart({
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: selectedColor.name,
      tier: 'LIMITLESS',
      quantity,
      basePrice,
      tierPrice,
      imageUrl: product.imageUrl,
      bundle: bundleDeal,
      bundleDiscount: bundleDeal ? tierPriceRaw * 0.1 : undefined,
    });

    trackEvent('shop.product.add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      tier: 'LIMITLESS',
      price: totalPrice,
    });

    const message = existingItems
      ? `Added another tee of this design. Cart now has ${existingItems + quantity} item${
          existingItems + quantity !== 1 ? 's' : ''
        }.`
      : 'Added your design setup. Submit your size, color, and tier to see the artwork after checkout.';
    setToastMessage(message);
    setShowToast(true);
    onClose();
  };

  const goToCheckout = () => {
    if (isSignedIn) {
      navigate('/checkout');
    } else {
      navigate('/auth');
    }
  };

  const handleBuyNow = () => {
    const existingItems = getTotalItems();

    addToCart({
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: selectedColor.name,
      tier: 'LIMITLESS',
      quantity,
      basePrice,
      tierPrice,
      imageUrl: product.imageUrl,
      bundle: bundleDeal,
      bundleDiscount: bundleDeal ? tierPriceRaw * 0.1 : undefined,
    });

    trackEvent('shop.product.buy_now', {
      product_id: product.id,
      product_name: product.name,
      tier: 'LIMITLESS',
      price: totalPrice,
      is_signed_in: isSignedIn,
    });

    const message = existingItems
      ? `Added another tee of this design. Cart now has ${existingItems + quantity} item${
          existingItems + quantity !== 1 ? 's' : ''
        }.`
      : 'Added your design setup. Submit your size and color to see the artwork after checkout.';
    setToastMessage(message);
    onClose();
    goToCheckout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 pb-16 md:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close product modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm uppercase tracking-wide">Image coming soon</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{deliveryText}</p>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size
                </label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        selectedSize === size
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color: {selectedColor.name}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorChange(color.name)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor.name === color.name
                          ? 'border-primary-600 scale-110'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      aria-label={`Choose ${color.name}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tier Selection */}
              <div className="mb-6">
                <div className="w-full p-4 border rounded-lg text-left bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Limitless redraws - ${tierPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We redraw until you love it—no extra charges. Unlimited designs included.
                  </p>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="mt-auto">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Price</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${totalPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{deliveryText}</p>
                  {bundleDeal && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Includes 2 items with 10% tier discount.
                    </p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    After you lock size, color, and tier, we will reveal your design preview for approval.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleAddToCart}
                    className="flex-1"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleBuyNow}
                    className="flex-1"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Summary Bar */}
      {cartItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-[60] md:hidden">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cart</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {cartItems} item{cartItems !== 1 ? 's' : ''} · ${cartSubtotal.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/cart')}>
                View
              </Button>
              <Button variant="primary" size="sm" onClick={goToCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
          action={{
            label: 'View Cart',
            onClick: () => navigate('/cart'),
          }}
        />
      )}
    </div>
  );
}
