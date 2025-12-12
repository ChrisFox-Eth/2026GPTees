/**
 * @module components/product/ProductCard
 * @description Product card component for displaying products in the shop page
 * @since 2025-11-21
 */

import { motion } from 'framer-motion';
import { hoverLift } from '@utils/motion';
import { ImagePlaceholder } from '@components/ui/ImagePlaceholder';
import type { ProductCardProps } from './ProductCard.types';

export type { ProductCardProps } from './ProductCard.types';

/**
 * @component
 * @description Displays a clickable product card with image, details, pricing, and available colors.
 * Editorial minimal lookbook style with generous whitespace and subtle hover effects.
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
    <motion.div
      {...hoverLift}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-lg border border-surface-2/50 bg-surface shadow-soft transition-shadow duration-300 focus-within:ring-2 focus-within:ring-accent hover:shadow-medium dark:border-surface-dark/50 dark:bg-surface-dark dark:focus-within:ring-accent-dark"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2 dark:bg-paper-dark">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            width={640}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder aspectRatio="4/5" label="Product image" />
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            {product.name}
          </h3>

          {product.description && (
            <p className="line-clamp-2 font-sans text-sm leading-relaxed text-muted dark:text-muted-dark">
              {product.description}
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-surface-2/50 pt-4 dark:border-surface-dark/50">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-sans text-sm text-muted dark:text-muted-dark">Limitless</p>
              <p className="font-display text-2xl font-semibold text-accent dark:text-accent-dark">
                ${startingPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-muted dark:text-muted-dark">{deliveryText}</p>

          {/* Available Colors Preview */}
          <div className="flex items-center gap-2 pt-2">
            <span className="font-sans text-xs text-muted dark:text-muted-dark">
              {product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}
            </span>
            <div className="flex gap-1.5">
              {product.colors.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="h-4 w-4 rounded-full border border-surface-2 dark:border-surface-dark"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="font-sans text-xs text-muted dark:text-muted-dark">
                  +{product.colors.length - 5}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
