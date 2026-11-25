"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type ApiProduct, type User } from '@/lib/api';
import { displayProduct, fallbackProducts, type Product } from '@/lib/products';
type Store = {
  user: User | null; products: Product[]; loading: boolean; error: string;
  authenticate: (mode: 'login' | 'register', data: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener('triger-auth-expired', expired);
    return () => window.removeEventListener('triger-auth-expired', expired);
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      const [catalog, session] = await Promise.allSettled([api<ApiProduct[]>('/products'), api<User>('/auth/me')]);
      if (!active) return;
      if (catalog.status === 'fulfilled') setProducts(catalog.value.map(displayProduct));
      else setError('');
      if (session.status === 'fulfilled') setUser(session.value);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);
  async function authenticate(mode: 'login' | 'register', data: Record<string, string>) {
    setUser(await api<User>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) }));
  }
  async function logout() { await api('/auth/logout', { method: 'POST' }); setUser(null); }
  return <Context value={{ user, products, loading, error, authenticate, logout }}>{children}</Context>;
}
export function useStore() { const value = useContext(Context); if (!value) throw new Error('StoreProvider required'); return value; }
