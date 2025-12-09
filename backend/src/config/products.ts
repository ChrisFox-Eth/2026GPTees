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
    name: 'Limitless Tee',
    slug: 'basic-tee',
    description: 'Custom GPTee with premium quality printing',
    basePrice: 0,  // Tier pricing includes everything (shirt + printing + design)
    printfulId: '71', // Bella + Canvas 3001
    category: 'T_SHIRT',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Blue', hex: '#000080' },
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
