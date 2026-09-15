"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type CartContextValue = {
  cart: Record<string, number>;
  itemCount: number;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "triger-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedCart = window.localStorage.getItem(storageKey);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart) as Record<string, number>);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, isHydrated]);

  const addToCart = (productId: string) => {
    setCart((currentCart) => ({
      ...currentCart,
      [productId]: (currentCart[productId] ?? 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => {
      const nextCart = { ...currentCart };
      delete nextCart[productId];
      return nextCart;
    });
  };

  const itemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);

  return <CartContext value={{ cart, itemCount, addToCart, removeFromCart }}>{children}</CartContext>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}