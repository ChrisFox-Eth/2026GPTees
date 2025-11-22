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
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-4xl">👕</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Starting at</p>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ${Number(product.basePrice).toFixed(2)}
            </p>
          </div>

          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors duration-200">
            Customize
          </button>
        </div>

        {/* Available Colors Preview */}
        <div className="mt-3 flex items-center gap-2">
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
