/**
 * @module components/product/ProductModal
 * @description Product customization modal for selecting size, color, and tier options
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@components/ui/Button';
import { Toast } from '@components/ui/Toast';
import { ImagePlaceholder } from '@components/ui/ImagePlaceholder';
import { useCart } from '@hooks/useCart';
import { trackEvent } from '@utils/analytics';
import type { ProductModalProps } from './ProductModal.types';

/**
 * @component
 * @description Full-screen modal for product customization. Allows users to select size, color,
 * and tier (Limitless GPTee), then either add to cart or buy now. Displays pricing, delivery
 * information, and includes a mobile cart summary bar. Handles authentication flow for checkout.
 *
 * @param {ProductModalProps} props - Component props
 * @param {Product} props.product - Product data with available sizes, colors, and details
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {() => void} props.onClose - Callback to close the modal
 *
 * @returns {JSX.Element | null} Rendered modal or null if not open
 *
 * @example
 * <ProductModal
 *   product={selectedProduct}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 * />
 */
export default function ProductModal({
  product,
  isOpen,
  onClose,
}: ProductModalProps): JSX.Element | null {
  const preferredSize = product.sizes.find((s) => s === 'XL') || product.sizes[0];
  const preferredColor =
    product.colors.find((c) => c.name.toLowerCase() === 'black') || product.colors[0];

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

  /**
   * @description Handles size selection change and tracks analytics event
   * @param {string} size - Selected size value
   */
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    trackEvent('shop.product.option_change', {
      product_id: product.id,
      option_type: 'size',
      option_value: size,
    });
  };

  /**
   * @description Handles color selection change and tracks analytics event
   * @param {string} colorName - Name of selected color
   */
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

  /**
   * @description Adds product to cart with selected options, tracks analytics, shows toast notification, and closes modal
   */
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
      ? `Added another item. Cart now has ${existingItems + quantity} item${
          existingItems + quantity !== 1 ? 's' : ''
        }.`
      : 'Added to cart. Your design draft will be ready after checkout.';
    setToastMessage(message);
    setShowToast(true);
    onClose();
  };

  /**
   * @description Navigates to checkout if user is signed in, otherwise redirects to auth page
   */
  const goToCheckout = () => {
    if (isSignedIn) {
      navigate('/checkout');
    } else {
      navigate('/auth');
    }
  };

  /**
   * @description Adds product to cart with selected options, tracks analytics, and proceeds to checkout
   */
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
      ? `Added another item. Cart now has ${existingItems + quantity} item${
          existingItems + quantity !== 1 ? 's' : ''
        }.`
      : 'Added to cart. Your design draft will be ready after checkout.';
    setToastMessage(message);
    onClose();
    goToCheckout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 md:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          className="relative w-full max-w-5xl rounded-lg bg-surface p-6 pb-16 shadow-lifted md:p-8 md:pb-8 dark:bg-surface-dark"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
            aria-label="Close product modal"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            {/* Product Image */}
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface-2 dark:bg-paper-dark">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlaceholder aspectRatio="4/5" label="Product image" />
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-6 space-y-3">
                <h2 id="product-modal-title" className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl dark:text-ink-dark">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="font-sans text-base leading-relaxed text-muted dark:text-muted-dark">
                    {product.description}
                  </p>
                )}
                <ul className="space-y-1.5 font-sans text-sm text-muted dark:text-muted-dark">
                  <li>• Premium Bella+Canvas 3001 construction</li>
                  <li>• Vibrant, long-lasting prints</li>
                  <li>• {deliveryText}</li>
                </ul>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="mb-3 block font-sans text-sm font-medium text-ink dark:text-ink-dark">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`rounded-md border px-4 py-2 font-sans text-sm transition-colors ${
                        selectedSize === size
                          ? 'border-accent bg-accent-soft text-accent dark:border-accent-dark dark:bg-accent-dark/10 dark:text-accent-dark'
                          : 'border-surface-2 text-ink hover:border-accent/50 dark:border-surface-dark dark:text-ink-dark dark:hover:border-accent-dark/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="mb-3 block font-sans text-sm font-medium text-ink dark:text-ink-dark">
                  Color: {selectedColor.name}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorChange(color.name)}
                      className={`h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColor.name === color.name
                          ? 'scale-110 border-accent dark:border-accent-dark'
                          : 'border-surface-2 hover:border-accent/50 dark:border-surface-dark dark:hover:border-accent-dark/50'
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
                <div className="w-full rounded-lg border border-accent/20 bg-accent-soft p-5 text-left dark:border-accent-dark/20 dark:bg-accent-dark/10">
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
                      Limitless
                    </p>
                    <p className="font-display text-2xl font-semibold text-accent dark:text-accent-dark">
                      ${tierPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-muted dark:text-muted-dark">
                    Studio access with optional exploration—create your unique design with confidence.
                  </p>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="mt-auto border-t border-surface-2/50 pt-6 dark:border-surface-dark/50">
                <div className="mb-5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-sans text-sm text-muted dark:text-muted-dark">Total</p>
                    <p className="font-display text-3xl font-semibold text-ink dark:text-ink-dark">
                      ${totalPrice.toFixed(2)}
                    </p>
                  </div>
                  {bundleDeal && (
                    <p className="font-sans text-xs text-muted dark:text-muted-dark">
                      Includes 2 items with 10% tier discount
                    </p>
                  )}
                  <p className="font-sans text-xs text-muted dark:text-muted-dark">
                    Your design draft will be ready for review after checkout
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="secondary" onClick={handleAddToCart} className="flex-1">
                    Add to Cart
                  </Button>
                  <Button variant="primary" onClick={handleBuyNow} className="flex-1">
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
        <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden">
          <div className="flex items-center justify-between gap-3 border-t border-surface-2/50 bg-surface p-4 shadow-lifted dark:border-surface-dark/50 dark:bg-surface-dark">
            <div>
              <p className="font-sans text-xs text-muted dark:text-muted-dark">Cart</p>
              <p className="font-sans text-sm font-semibold text-ink dark:text-ink-dark">
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
