/**
 * @module config/products
 * @description Product catalog configuration
 * @since 2025-11-21
 */

/**
 * @interface ColorOption
 * @description Product color option
 * @property {string} name - Color name (e.g., "Black", "Navy")
 * @property {string} hex - Hex color code (e.g., "#000000")
 */
export interface ColorOption {
  name: string;
  hex: string;
}

/**
 * @interface ProductConfig
 * @description Product configuration schema
 * @property {string} name - Product display name
 * @property {string} slug - URL-friendly product slug
 * @property {string} description - Product description
 * @property {number} basePrice - Base product price (0 for tier-based pricing)
 * @property {string} printfulId - Printful product ID
 * @property {string} category - Product category
 * @property {string[]} sizes - Available sizes
 * @property {ColorOption[]} colors - Available colors
 * @property {string} imageUrl - Product image URL (optional)
 */
export interface ProductConfig {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  printfulId: string;
  category: string;
  sizes: string[];
  colors: ColorOption[];
  imageUrl?: string;
}

/**
 * @constant PRODUCTS
 * @description Available product catalog
 * Currently supports Bella + Canvas 3001 (Limitless Tee)
 */
export const PRODUCTS: ProductConfig[] = [
  {
    name: 'Limitless Tee',
    slug: 'basic-tee',
    description: 'Custom GPTee with premium quality printing',
    basePrice: 0,  // Tier pricing includes everything (shirt + printing + design)
    printfulId: '71', // Bella + Canvas 3001
    category: 'T_SHIRT',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Black', hex: '#0b0b0b' },
      { name: 'Gray', hex: '#3E3C3D' },
      { name: 'Navy', hex: '#212642' },
      { name: 'White', hex: '#FFFFFF' },
    ],
  }
  // {
  //   name: 'Premium Tee',
  //   slug: 'premium-tee',
  //   description: 'Premium tier; unlimited design generations',
  //   basePrice: 29.99,
  //   printfulId: '71', // Same base product, price differs by tier in-app
  //   category: 'T_SHIRT',
  //   sizes: ['S', 'M', 'L', 'XL', '2XL'],
  //   colors: [
  //     { name: 'Black', hex: '#000000' },
  //     { name: 'Gray', hex: '#808080' },
  //     { name: 'Blue', hex: '#000080' },
  //     { name: 'White', hex: '#FFFFFF' },
  //   ],
  // },
];
