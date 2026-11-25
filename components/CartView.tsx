"use client";

import { useState, useRef } from "react";
import { useStore } from "@/components/StoreProvider";
import { AccountForm } from "@/components/AccountForm";
import { api, type ApiOrder } from "@/lib/api";
import { formatEur } from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useLanguage } from "@/components/LanguageProvider";

export function CartView() {
  const { cart, cartProducts, itemCount, removeFromCart, loading, error, subtotal, refreshCart } = useCart();
  const { user, loading: catalogLoading, error: catalogError } = useStore();
  const { language } = useLanguage();
  const german = language === "de";
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [orderError, setOrderError] = useState('');
  const [ordering, setOrdering] = useState(false);
  const orderKey = useRef<string | null>(null);

  return (
    <main className="collection-page cart-page">
      <SiteHeader />
      <section className="cart-content" aria-labelledby="cart-title">
        <p className="products-collection-kicker">{german ? "DEINE AUSWAHL / 001" : "YOUR SELECTION / 001"}</p>
        <h1 id="cart-title">{german ? <>DEIN <span>WARENKORB</span></> : <>YOUR <span>CART</span></>}</h1>
        <AccountForm />
        {(loading || catalogLoading) && <p role="status">Loading your selection…</p>}
        {(error || catalogError) && <p role="alert">{error || catalogError}</p>}
        {cartProducts.length === 0 ? (
          <p className="cart-empty">{german ? "Deine Auswahl wartet darauf, ausgelöst zu werden." : "Your collection is waiting to be triggered."}</p>
        ) : (
          <div className="cart-list">
            {cartProducts.map((product) => (
              <article className="cart-item" key={product.id}>
                <img src={product.image} alt={product.name} />
                <div>
                  <p className="product-card-number">{german ? "PRODUKT" : "PRODUCT"} {product.number}</p>
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                </div>
                <strong>{cart[product.id]} × {product.price}</strong>
                <button type="button" onClick={() => removeFromCart(product.id)}>{german ? "ENTFERNEN" : "REMOVE"}</button>
              </article>
            ))}
          </div>
        )}
        {cartProducts.length > 0 && <p className="cart-total">{itemCount} {german ? "PRODUKT(E) IM WARENKORB" : `PRODUCT${itemCount === 1 ? "" : "S"} IN CART`}</p>}
        {user && subtotal && <p className="cart-total">{german ? "ZWISCHENSUMME" : "SUBTOTAL"} {formatEur(subtotal)}</p>}
        {user && itemCount > 0 && <button className="add-to-cart" disabled={loading || ordering} onClick={async () => {
          setOrdering(true); setOrderError(''); orderKey.current ??= crypto.randomUUID();
          try { setOrder(await api<ApiOrder>('/orders', { method: 'POST', body: JSON.stringify({ idempotencyKey: orderKey.current }) })); orderKey.current = null; await refreshCart(); }
          catch (err) { setOrderError(err instanceof Error ? err.message : 'Unable to prepare order'); }
          finally { setOrdering(false); }
        }}>{ordering ? 'PREPARING…' : 'PREPARE ORDER (NO PAYMENT)'}</button>}
        {order && <p role="status">Order {order.id}: {formatEur(order.total)}. Payment pending. No payment was taken.</p>}
        {orderError && <p role="alert">{orderError}</p>}
      </section>
      <SiteFooter />
    </main>
  );
}
