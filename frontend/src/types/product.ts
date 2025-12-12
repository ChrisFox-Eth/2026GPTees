/**
 * @module types/product
 * @description Product type definitions
 * @since 2025-11-21
 */

/**
 * @interface ColorOption
 * @description Represents a color variant option available for a product
 *
 * @property {string} name - Display name of the color (e.g., 'Navy Blue', 'Forest Green')
 * @property {string} hex - Hexadecimal color code for visual representation (e.g., '#1a2b3c')
 */
export interface ColorOption {
  name: string;
  hex: string;
}

/**
 * @interface Product
 * @description Complete product definition with variants, pricing tiers, and Printful integration
 *
 * @property {string} id - Unique product identifier
 * @property {string} name - Product display name
 * @property {string} slug - URL-friendly product identifier for routing
 * @property {string | null} description - Product description text, null if not provided
 * @property {number} basePrice - Base price in cents before tier pricing
 * @property {string} printfulId - Printful product identifier for fulfillment integration
 * @property {string} category - Product category classification (e.g., 't-shirt', 'hoodie')
 * @property {string[]} sizes - Array of available size options (e.g., ['S', 'M', 'L', 'XL'])
 * @property {ColorOption[]} colors - Array of available color variants with hex codes
 * @property {string | null} imageUrl - URL to product image, null if not available
 * @property {boolean} isActive - Whether the product is currently available for purchase
 * @property {Date} createdAt - Timestamp when the product was created
 * @property {Date} updatedAt - Timestamp of the last product update
 * @property {Record<string, Object>} [tierPricing] - Pricing tiers with design limits (optional)
 * @property {string} tierPricing[].name - Display name of the pricing tier
 * @property {number} tierPricing[].price - Price for this tier in cents
 * @property {number} tierPricing[].maxDesigns - Maximum design generations allowed for this tier
 * @property {string} tierPricing[].description - Description of what this tier includes
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  printfulId: string;
  category: string;
  sizes: string[];
  colors: ColorOption[];
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tierPricing?: Record<
    string,
    {
      name: string;
      price: number;
      maxDesigns: number;
      description: string;
    }
  >;
}
