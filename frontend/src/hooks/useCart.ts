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
const CART_UPDATE_EVENT = 'gptees-cart-updated';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount and listen for updates
  useEffect(() => {
    const loadCart = () => {
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
          setCart([]);
        }
      } else {
        setCart([]);
      }
      setIsLoaded(true);
    };

    loadCart();

    // Listen for custom event to sync state across components
    const handleCartUpdate = () => loadCart();
    
    // Listen for both custom event (same tab) and storage event (cross-tab)
    window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // Helper to save cart and notify other components
  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    setCart(newCart);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event(CART_UPDATE_EVENT));
  };

  /**
   * Add item to cart
   */
  const addToCart = (item: CartItem) => {
    // We read from localStorage first to ensure we have the latest state
    // This prevents race conditions if multiple components try to update
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    let currentCart: CartItem[] = [];
    
    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    // Check if item with same product, size, color, and tier already exists
    const existingIndex = currentCart.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.size === item.size &&
        i.color === item.color &&
        i.tier === item.tier
    );

    let newCart: CartItem[];
    if (existingIndex >= 0) {
      // Update quantity
      newCart = [...currentCart];
      newCart[existingIndex].quantity += item.quantity;
    } else {
      // Add new item
      newCart = [...currentCart, item];
    }
    
    saveCart(newCart);
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (index: number) => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return;
    
    const currentCart = JSON.parse(storedCart) as CartItem[];
    const newCart = currentCart.filter((_, i) => i !== index);
    saveCart(newCart);
  };

  /**
   * Update item quantity
   */
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return;

    const currentCart = JSON.parse(storedCart) as CartItem[];
    const newCart = [...currentCart];
    
    if (newCart[index]) {
      newCart[index].quantity = quantity;
      saveCart(newCart);
    }
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
    saveCart([]);
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