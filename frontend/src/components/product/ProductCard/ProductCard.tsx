/**
 * @module components/product/ProductCard
 * @description Product card component for displaying products in the shop page
 * @since 2025-11-21
 */

import type { ProductCardProps } from './ProductCard.types';

export type { ProductCardProps } from './ProductCard.types';

/**
 * @component
 * @description Displays a clickable product card with image, details, pricing, and available colors.
 * Shows the Limitless GPTee pricing model with unlimited redraws included.
 *
 * @param {ProductCardProps} props - Component props
 * @param {Product} props.product - Product data including name, description, image, colors, and sizes
 * @param {() => void} props.onClick - Callback function triggered when card is clicked
 *
 * @returns {JSX.Element} Rendered product card with hover effects and keyboard accessibility
 *
 * @example
 * <ProductCard
 *   product={productData}
 *   onClick={() => setSelectedProduct(productData)}
 * />
 */
export default function ProductCard({ product, onClick }: ProductCardProps): JSX.Element {
  const LIMITLESS_PRICE = 54.99;
  const startingPrice = LIMITLESS_PRICE;
  const deliveryText = 'Ships in 5-8 business days';

  return (
    <div
      onClick={onClick}
      className="group focus-within:ring-primary-500 cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 focus-within:ring-2 hover:shadow-xl dark:bg-gray-800"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-200 dark:bg-gray-700">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, 25vw"
            width={640}
            height={640}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs tracking-wide text-gray-400 uppercase">Image coming soon</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>

        {product.description && (
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Limitless GPTee</p>
            <p className="text-primary-600 dark:text-primary-400 text-xl font-bold">
              ${startingPrice.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Unlimited redraws included · {deliveryText}
            </p>
          </div>

          <button className="bg-primary-600 hover:bg-primary-700 rounded-md px-4 py-2 text-white transition-colors duration-200">
            Start a Limitless tee
          </button>
        </div>

        {/* Available Colors Preview */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Colors:</span>
          <div className="flex gap-1">
            {product.colors.slice(0, 5).map((color, idx) => (
              <div
                key={idx}
                className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
