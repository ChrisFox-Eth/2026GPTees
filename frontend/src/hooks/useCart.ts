/**
 * @module hooks/useCart
 * @description Custom hook for shopping cart management with localStorage persistence
 * and cross-tab synchronization. Provides full cart CRUD operations with analytics tracking.
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';
import { trackEvent } from '@utils/analytics';

/**
 * @interface CartItem
 * @description Represents a single item in the shopping cart
 *
 * @property {string} productId - Unique product identifier
 * @property {string} productName - Display name of the product
 * @property {string} size - Selected size (e.g., 'S', 'M', 'L', 'XL')
 * @property {string} color - Selected color variant
 * @property {'LIMITLESS' | 'PREMIUM'} tier - Design tier level
 * @property {number} quantity - Number of items
 * @property {number} basePrice - Base product price in cents
 * @property {number} tierPrice - Additional tier price in cents
 * @property {string | null} imageUrl - URL to product/design image
 * @property {boolean} [bundle] - Whether item is part of a bundle
 * @property {number} [bundleDiscount] - Per-unit discount on tier price when bundled (in cents)
 */
export interface CartItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  tier: 'LIMITLESS' | 'PREMIUM';
  quantity: number;
  basePrice: number;
  tierPrice: number;
  imageUrl: string | null;
  bundle?: boolean;
  bundleDiscount?: number;
}

/**
 * @constant {string} CART_STORAGE_KEY
 * @description LocalStorage key for persisting cart data
 * @private
 */
const CART_STORAGE_KEY = 'gptees_cart';

/**
 * @constant {string} CART_UPDATE_EVENT
 * @description Custom event name for cross-component cart synchronization
 * @private
 */
const CART_UPDATE_EVENT = 'gptees-cart-updated';

/**
 * @hook useCart
 * @description Manages shopping cart state with localStorage persistence and cross-tab sync.
 * Automatically loads cart on mount and syncs across browser tabs via storage events.
 *
 * @returns {UseCartReturn} Cart state and operations
 * @returns {CartItem[]} return.cart - Current cart items array
 * @returns {boolean} return.isLoaded - Whether cart has been loaded from storage
 * @returns {(item: CartItem) => void} return.addToCart - Add or increment item in cart
 * @returns {(index: number) => void} return.removeFromCart - Remove item by index
 * @returns {(index: number, quantity: number) => void} return.updateQuantity - Update item quantity
 * @returns {() => void} return.clearCart - Remove all items from cart
 * @returns {(productId: string, oldSize: string, oldColor: string, updated: Partial<Pick<CartItem, 'size' | 'color' | 'imageUrl'>>) => void} return.updateItemVariant - Update size/color variant
 * @returns {() => number} return.getTotalItems - Get total quantity across all items
 * @returns {() => number} return.getSubtotal - Get cart subtotal in cents
 *
 * @example
 * const { cart, addToCart, removeFromCart, getTotalItems } = useCart();
 *
 * // Add item to cart
 * addToCart({
 *   productId: 'tee-001',
 *   productName: 'Classic Tee',
 *   size: 'M',
 *   color: 'Black',
 *   tier: 'PREMIUM',
 *   quantity: 1,
 *   basePrice: 2500,
 *   tierPrice: 500,
 *   imageUrl: '/images/tee.png'
 * });
 *
 * // Display cart count
 * console.log(`${getTotalItems()} items in cart`);
 *
 * @fires cart.item.add - When item is added to cart
 * @fires cart.item.remove - When item is removed from cart
 * @fires cart.item.quantity_change - When item quantity changes
 * @fires cart.item.variant_update - When item size/color changes
 * @fires cart.clear - When cart is cleared
 */
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
            bundleDiscount: item.bundleDiscount ? Number(item.bundleDiscount) : undefined,
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

  /**
   * @function saveCart
   * @description Persists cart to localStorage and dispatches update event
   * @param {CartItem[]} newCart - New cart state to save
   * @private
   */
  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    setCart(newCart);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event(CART_UPDATE_EVENT));
  };

  /**
   * @function addToCart
   * @description Adds an item to cart, or increments quantity if item with same
   * productId, size, color, and tier already exists. Reads from localStorage first
   * to prevent race conditions across components.
   *
   * @param {CartItem} item - Item to add to cart
   * @fires cart.item.add
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

    const existingQuantity = existingIndex >= 0 ? currentCart[existingIndex].quantity : 0;
    const newQuantity = existingQuantity + item.quantity;
    trackEvent('cart.item.add', {
      product_id: item.productId,
      product_name: item.productName,
      tier: item.tier.toLowerCase(),
      size: item.size,
      color: item.color,
      quantity_added: item.quantity,
      quantity_total: newQuantity,
      has_image: Boolean(item.imageUrl),
      base_price: item.basePrice,
      tier_price: item.tierPrice,
      bundle: item.bundle || false,
    });
  };

  /**
   * @function removeFromCart
   * @description Removes an item from the cart by its index position
   *
   * @param {number} index - Array index of item to remove
   * @fires cart.item.remove
   */
  const removeFromCart = (index: number) => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return;

    const currentCart = JSON.parse(storedCart) as CartItem[];
    const removedItem = currentCart[index];
    const newCart = currentCart.filter((_, i) => i !== index);
    saveCart(newCart);

    if (removedItem) {
      trackEvent('cart.item.remove', {
        product_id: removedItem.productId,
        product_name: removedItem.productName,
        tier: removedItem.tier.toLowerCase(),
        size: removedItem.size,
        color: removedItem.color,
        quantity_removed: removedItem.quantity,
        remaining_items: newCart.length,
      });
    }
  };

  /**
   * @function updateQuantity
   * @description Updates the quantity of an item in the cart. If quantity is 0 or less,
   * the item is removed from the cart.
   *
   * @param {number} index - Array index of item to update
   * @param {number} quantity - New quantity value
   * @fires cart.item.quantity_change
   * @fires cart.item.remove - If quantity <= 0
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
      const previousQuantity = newCart[index].quantity;
      newCart[index].quantity = quantity;
      saveCart(newCart);
      trackEvent('cart.item.quantity_change', {
        product_id: newCart[index].productId,
        product_name: newCart[index].productName,
        from: previousQuantity,
        to: quantity,
      });
    }
  };

  /**
   * @function clearCart
   * @description Removes all items from the cart
   * @fires cart.clear
   */
  const clearCart = () => {
    saveCart([]);
    trackEvent('cart.clear', {});
  };

  /**
   * @function updateItemVariant
   * @description Updates size, color, and/or image for the first cart item
   * matching the given productId, oldSize, and oldColor combination.
   *
   * @param {string} productId - Product ID to match
   * @param {string} oldSize - Current size to match
   * @param {string} oldColor - Current color to match
   * @param {Partial<Pick<CartItem, 'size' | 'color' | 'imageUrl'>>} updated - New values to apply
   * @fires cart.item.variant_update
   */
  const updateItemVariant = (
    productId: string,
    oldSize: string,
    oldColor: string,
    updated: Partial<Pick<CartItem, 'size' | 'color' | 'imageUrl'>>
  ) => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return;

    const currentCart = JSON.parse(storedCart) as CartItem[];
    const index = currentCart.findIndex(
      (item) => item.productId === productId && item.size === oldSize && item.color === oldColor
    );

    if (index === -1) return;

    const newCart = [...currentCart];
    newCart[index] = { ...newCart[index], ...updated };
    saveCart(newCart);

    trackEvent('cart.item.variant_update', {
      product_id: productId,
      from_size: oldSize,
      from_color: oldColor,
      to_size: updated.size || oldSize,
      to_color: updated.color || oldColor,
      has_image: Boolean(updated.imageUrl || newCart[index].imageUrl),
    });
  };

  /**
   * @function getTotalItems
   * @description Calculates total quantity of all items in cart
   * @returns {number} Sum of all item quantities
   */
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * @function getSubtotal
   * @description Calculates cart subtotal (basePrice + tierPrice) * quantity for all items
   * @returns {number} Subtotal in cents
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
    updateItemVariant,
    getTotalItems,
    getSubtotal,
  };
}
