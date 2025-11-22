/**
 * @module components/ProductModal
 * @description Product customization modal
 * @since 2025-11-21
 */

import { useState } from 'react';
import { Product } from '../../types/product';
import { Button } from '@components/Button';
import { useCart } from '../../hooks/useCart';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const TIER_PRICES = {
  BASIC: 24.99,
  PREMIUM: 34.99,
};

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps): JSX.Element | null {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PREMIUM'>('BASIC');
  const [quantity] = useState(1);

  const { addToCart } = useCart();

  if (!isOpen) return null;

  const basePrice = Number(product.basePrice);
  const tierPrice =
    product.tierPricing?.[selectedTier]?.price ??
    (selectedTier === 'PREMIUM' ? TIER_PRICES.PREMIUM : TIER_PRICES.BASIC);
  const totalPrice = basePrice + tierPrice;

  const handleAddToCart = () => {
    console.log('Adding to cart:', {
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: selectedColor.name,
      tier: selectedTier,
      quantity,
      basePrice,
      tierPrice,
    });
    
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
    });
    
    console.log('Item added to cart, closing modal');
    onClose();
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
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-6xl">👕</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-6">{product.description}</p>
              )}

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size
                </label>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
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
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor.name === color.name
                          ? 'border-primary-600 scale-110'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
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
                    onClick={() => setSelectedTier('BASIC')}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      selectedTier === 'BASIC'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Basic - ${(
                            product.tierPricing?.BASIC?.price ?? TIER_PRICES.BASIC
                          ).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.tierPricing?.BASIC?.description || 'Generate 1 AI design'}
                        </p>
                      </div>
                      {selectedTier === 'BASIC' && <span className="text-primary-600">✓</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTier('PREMIUM')}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      selectedTier === 'PREMIUM'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Premium - ${(
                            product.tierPricing?.PREMIUM?.price ?? TIER_PRICES.PREMIUM
                          ).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.tierPricing?.PREMIUM?.description || 'Unlimited AI design regeneration'}
                        </p>
                      </div>
                      {selectedTier === 'PREMIUM' && <span className="text-primary-600">✓</span>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Price</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddToCart}
                  className="w-full"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
