"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, type ApiCart } from '@/lib/api';
import { useStore } from './StoreProvider';
import { displayProduct, type Product } from '@/lib/products';

type CartContextValue = {
  cart: Record<string, number>;
  itemCount: number;
  addToCart: (productId: string) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  loading: boolean;
  error: string;
  subtotal: string | null;
  cartProducts: Product[];
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "triger-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useStore();
  // Reset state and pending operations when the authenticated account changes.
  return <CartState key={user?.id ?? 'guest'}>{children}</CartState>;
}

function CartState({ children }: { children: ReactNode }) {
  const { user, products } = useStore();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [serverCart, setServerCart] = useState<ApiCart | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  function storeGuest(next: Record<string, number>) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Storage may be disabled. */ }
  }
  async function refreshCart() {
    if (!user || !mounted.current) return;
    const result = await api<ApiCart>('/cart');
    if (!mounted.current) return;
    setServerCart(result);
    setCart(Object.fromEntries(result.items.map(item => [item.product.id, item.quantity])));
  }
  useEffect(() => {
    let active = true;
    mounted.current = true;
    if (!user) {
      void Promise.resolve().then(() => {
        if (!active) return;
        try {
          const data = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
          if (data && typeof data === 'object' && !Array.isArray(data)) setCart(Object.fromEntries(Object.entries(data).filter(([, quantity]) => Number.isInteger(quantity) && Number(quantity) > 0 && Number(quantity) <= 99)) as Record<string, number>);
        } catch { /* Ignore invalid guest selections. */ }
      });
      return () => { active = false; mounted.current = false; };
    }
    api<ApiCart>('/cart').then(result => {
      if (!active) return;
      setServerCart(result); setCart(Object.fromEntries(result.items.map(item => [item.product.id, item.quantity])));
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load cart'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [user]);
  async function addToCart(productId: string) {
    if (!user) {
      setCart(current => { const next = { ...current, [productId]: Math.min(99, (current[productId] ?? 0) + 1) }; storeGuest(next); return next; });
      return true;
    }
    const operation = queue.current.then(async () => {
      if (!mounted.current) return false;
      setError(''); setLoading(true);
      try { await api('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) }); await refreshCart(); return true; }
      catch (err) { setError(err instanceof Error ? err.message : 'Unable to update cart'); return false; }
      finally { setLoading(false); }
    });
    queue.current = operation;
    return operation;
  }
  async function removeFromCart(productId: string) {
    if (!user) { const next = { ...cart }; delete next[productId]; setCart(next); storeGuest(next); return; }
    const operation = queue.current.then(async () => {
      if (!mounted.current) return;
      setError(''); setLoading(true);
      try {
        const current = await api<ApiCart>('/cart');
        const item = current.items.find(item => item.product.id === productId);
        if (item) await api(`/cart/items/${item.id}`, { method: 'DELETE' });
        await refreshCart();
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update cart'); }
      finally { setLoading(false); }
    });
    queue.current = operation;
    await operation;
  }

  const itemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartProducts = serverCart ? serverCart.items.map((item, index) => displayProduct(item.product, index)) : products.filter(product => cart[product.id]);

  return <CartContext value={{ cart, cartProducts, itemCount, addToCart, removeFromCart, loading, error, subtotal: serverCart?.subtotal ?? null, refreshCart }}>{children}</CartContext>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
