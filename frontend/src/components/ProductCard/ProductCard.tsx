/**
 * @module components/ProductCard
 * @description Product card component for shop page
 * @since 2025-11-21
 */

import { Product } from '../../types/product';

export interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps): JSX.Element {
  const LIMITLESS_PRICE = 54.99;
  const startingPrice = LIMITLESS_PRICE;
  const deliveryText = 'Ships in 5-8 business days';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden group focus-within:ring-2 focus-within:ring-primary-500"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Product Image */}
      <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, 25vw"
            width={640}
            height={640}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs uppercase tracking-wide">Image coming soon</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Limitless GPTee</p>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ${startingPrice.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unlimited redraws included · {deliveryText}</p>
          </div>

          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200">
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
                className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"
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
