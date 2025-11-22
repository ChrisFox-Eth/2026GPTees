/**
 * @module types/product
 * @description Product type definitions
 * @since 2025-11-21
 */

export interface ColorOption {
  name: string;
  hex: string;
}

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
