'use client';

import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  bagId: string;
  bagName: string;
  merchantId: string;
  merchantName: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  pickupWindow: { start: any; end: any };
  imageUrl?: string;
}

interface CartContextValue {
  cartItems: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  updateQuantity: (bagId: string, quantity: number) => void;
  removeItem: (bagId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue>({
  cartItems: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  function addItem(item: Omit<CartItem, 'quantity'>, quantity: number) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.bagId === item.bagId);
      if (existing) {
        return prev.map((i) =>
          i.bagId === item.bagId
            ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock) }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }

  function updateQuantity(bagId: string, quantity: number) {
    setCartItems((prev) =>
      prev.map((i) => (i.bagId === bagId ? { ...i, quantity } : i))
    );
  }

  function removeItem(bagId: string) {
    setCartItems((prev) => prev.filter((i) => i.bagId !== bagId));
  }

  function clearCart() {
    setCartItems([]);
  }

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
