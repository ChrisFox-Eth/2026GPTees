/**
 * @module components/ProductModal
 * @description Product customization modal
 * @since 2025-11-21
 */

import { useState } from 'react';
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
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PREMIUM'>('PREMIUM');
  const [bundleDeal, setBundleDeal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { addToCart, getTotalItems, getSubtotal } = useCart();
  const cartItems = getTotalItems();
  const cartSubtotal = getSubtotal();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  if (!isOpen) return null;

  const tierPricing = product.tierPricing || {};
  const basicTier = tierPricing['BASIC'];
  const premiumTier = tierPricing['PREMIUM'];

  const basePrice = Number(product.basePrice);
  const tierPriceRaw = tierPricing[selectedTier]?.price ?? 0;
  const tierPrice = bundleDeal ? tierPriceRaw * 0.9 : tierPriceRaw; // 10% off with bundle
  const quantity = bundleDeal ? 2 : 1;
  const totalPrice = (basePrice + tierPrice) * quantity;
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

  const handleTierChange = (tier: 'BASIC' | 'PREMIUM') => {
    setSelectedTier(tier);
    trackEvent('shop.product.option_change', {
      product_id: product.id,
      option_type: 'tier',
      option_value: tier,
    });
  };

  const handleBundleToggle = () => {
    const next = !bundleDeal;
    setBundleDeal(next);
    trackEvent('shop.upsell.bundle_toggle', {
      product_id: product.id,
      bundle_enabled: next,
    });
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: selectedColor.name,
      tier: selectedTier,
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
      tier: selectedTier,
      price: totalPrice,
    });

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
    addToCart({
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: selectedColor.name,
      tier: selectedTier,
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
      tier: selectedTier,
      price: totalPrice,
      is_signed_in: isSignedIn,
    });

    onClose();
    goToCheckout();
  };

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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Design Tier
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleTierChange('BASIC')}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      selectedTier === 'BASIC'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Classic (1 design) - ${Number(basicTier?.price ?? 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {basicTier?.description || 'One custom design crafted from your prompt'}
                        </p>
                      </div>
                      {selectedTier === 'BASIC' && <span className="text-primary-600 text-sm">Selected</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => handleTierChange('PREMIUM')}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      selectedTier === 'PREMIUM'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Limitless redraws - ${Number(premiumTier?.price ?? 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {premiumTier?.description || 'We redraw until you love it—no extra charges'}
                        </p>
                      </div>
                      {selectedTier === 'PREMIUM' && <span className="text-primary-600 text-sm">Selected</span>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Bundle Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bundle & Save
                </label>
                <div className="flex items-center justify-between border border-gray-300 dark:border-gray-600 rounded-lg p-4 gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Buy 2, save 10% on tier</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We will duplicate this tee (same size and color) and apply 10% off the tier price.
                    </p>
                  </div>
                  <button
                    onClick={handleBundleToggle}
                    className={`w-14 h-8 rounded-full border transition-colors flex items-center ${
                      bundleDeal
                        ? 'bg-primary-600 border-primary-600 justify-end'
                        : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 justify-start'
                    }`}
                    aria-pressed={bundleDeal}
                    aria-label="Toggle bundle discount"
                  >
                    <span className="w-6 h-6 bg-white rounded-full shadow" />
                  </button>
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
          message="Added to cart!"
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
