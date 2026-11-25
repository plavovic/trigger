"use client";

import { useStore } from "@/components/StoreProvider";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/components/CartProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useLanguage } from "@/components/LanguageProvider";

export function ProductsGrid() {
  const { addToCart, error: cartError } = useCart();
  const { products, loading, error } = useStore();
  const { language } = useLanguage();
  const german = language === "de";

  return (
    <main className="collection-page products-page products-collection">
      <SiteHeader />
      <header className="products-collection-header">
        <p className="products-collection-kicker">{german ? "DIE KOLLEKTION / 001" : "THE COLLECTION / 001"}</p>
        <h1>{german ? <>ALLE <span>PRODUKTE</span></> : <>ALL <span>PRODUCTS</span></>}</h1>
        <p>{german ? "Präzisionsköder, entwickelt für die Reaktion." : "Precision bait, made to feed the response."}</p>
      </header>
      <section className="products-grid" aria-label="Product collection">
        {loading && <p role="status">Loading products…</p>}
        {error && <p role="alert">{error}</p>}
        {cartError && <p role="alert">{cartError}</p>}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </section>
      <SiteFooter />
    </main>
  );
}
