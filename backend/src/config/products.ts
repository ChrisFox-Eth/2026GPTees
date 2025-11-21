/**
 * @module config/products
 * @description Product catalog configuration
 * @since 2025-11-21
 */

export interface ColorOption {
  name: string;
  hex: string;
}

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

export const PRODUCTS: ProductConfig[] = [
  {
    name: 'Basic Tee',
    slug: 'basic-tee',
    description: 'Classic cotton t-shirt, perfect for your custom designs',
    basePrice: 24.99,
    printfulId: '71',
    category: 'T_SHIRT',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Gray', hex: '#808080' },
    ],
  },
  {
    name: 'Premium Tee',
    slug: 'premium-tee',
    description: 'Premium quality cotton t-shirt with enhanced comfort',
    basePrice: 29.99,
    printfulId: '19',
    category: 'T_SHIRT',
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Red', hex: '#FF0000' },
      { name: 'Royal Blue', hex: '#4169E1' },
    ],
  },
  {
    name: 'Hoodie',
    slug: 'hoodie',
    description: 'Comfortable pullover hoodie for cooler days',
    basePrice: 44.99,
    printfulId: '146',
    category: 'HOODIE',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Navy', hex: '#000080' },
    ],
  },
];
