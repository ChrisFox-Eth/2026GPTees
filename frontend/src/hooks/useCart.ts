/**
 * @module hooks/useCart
 * @description Custom hook for shopping cart management
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  tier: 'BASIC' | 'PREMIUM';
  quantity: number;
  basePrice: number;
  tierPrice: number;
  imageUrl: string | null;
}

const CART_STORAGE_KEY = 'gptees_cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart) as CartItem[];
        // Coerce numeric fields in case they were saved as strings
        const normalized = parsed.map((item) => ({
          ...item,
          basePrice: Number(item.basePrice),
          tierPrice: Number(item.tierPrice),
          quantity: Number(item.quantity),
        }));
        setCart(normalized);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  /**
   * Add item to cart
   */
  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      // Check if item with same product, size, color, and tier already exists
      const existingIndex = prevCart.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.color === item.color &&
          i.tier === item.tier
      );

      if (existingIndex >= 0) {
        // Update quantity
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += item.quantity;
        return newCart;
      } else {
        // Add new item
        return [...prevCart, item];
      }
    });
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  /**
   * Update item quantity
   */
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart((prevCart) => {
      const newCart = [...prevCart];
      newCart[index].quantity = quantity;
      return newCart;
    });
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
    setCart([]);
  };

  /**
   * Get total items in cart
   */
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * Get cart subtotal
   */
  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = (item.basePrice + item.tierPrice) * item.quantity;
      return total + itemTotal;
    }, 0);
  };

  return {
    cart,
    isLoaded,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getSubtotal,
  };
}
