"use client";

import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/components/CartProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export function ProductsGrid() {
  const { addToCart } = useCart();

  return (
    <main className="collection-page products-page products-collection">
      <SiteHeader />
      <header className="products-collection-header">
        <p className="products-collection-kicker">THE COLLECTION / 001</p>
        <h1>ALL <span>PRODUCTS</span></h1>
        <p>Precision bait, made to feed the response.</p>
      </header>
      <section className="products-grid" aria-label="Product collection">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}