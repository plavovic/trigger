"use client";

import { products } from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export function CartView() {
  const { cart, itemCount, removeFromCart } = useCart();
  const cartProducts = products.filter((product) => cart[product.id]);

  return (
    <main className="collection-page cart-page">
      <SiteHeader />
      <section className="cart-content" aria-labelledby="cart-title">
        <p className="products-collection-kicker">YOUR SELECTION / 001</p>
        <h1 id="cart-title">YOUR <span>CART</span></h1>
        {cartProducts.length === 0 ? (
          <p className="cart-empty">Your collection is waiting to be triggered.</p>
        ) : (
          <div className="cart-list">
            {cartProducts.map((product) => (
              <article className="cart-item" key={product.id}>
                <img src={product.image} alt={product.name} />
                <div>
                  <p className="product-card-number">PRODUCT {product.number}</p>
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                </div>
                <strong>{cart[product.id]} × {product.price}</strong>
                <button type="button" onClick={() => removeFromCart(product.id)}>REMOVE</button>
              </article>
            ))}
          </div>
        )}
        {cartProducts.length > 0 && <p className="cart-total">{itemCount} PRODUCT{itemCount === 1 ? "" : "S"} IN CART</p>}
      </section>
      <SiteFooter />
    </main>
  );
}