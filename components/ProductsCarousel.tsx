"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { useLanguage } from "@/components/LanguageProvider";

export function ProductsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { products, loading, error } = useStore();
  const { language } = useLanguage();
  const german = language === "de";
  const featuredProducts = products.slice(0, 3);
  const product = featuredProducts[currentIndex];
  const germanCopy: Record<string, { name: string; description: string }> = {
    product01: { name: "Workhorse", description: "Ein zuverlässiger Alltagsköder für sichere Sessions." },
    product02: { name: "The One", description: "Ein markantes Profil, das eine Reaktion auslöst." },
    product03: { name: "Purple Kraken", description: "Ein tiefes, charaktervolles Profil für schwierige Gewässer." },
  };
  const copy = product && german ? germanCopy[product.id] : undefined;

  const move = (direction: number) => {
    setCurrentIndex((index) => (index + direction + featuredProducts.length) % featuredProducts.length);
  };

  if (!product) return <section className="products-section" id="products-title"><p role={error ? "alert" : "status"}>{loading ? "Loading products…" : error || "No products available."}</p></section>;

  return (
    <section className="products-section" aria-labelledby="products-title">
      <h2 id="products-title" className="products-title">{german ? <>AUSGEWÄHLTE <span>PRODUKTE</span></> : <>FEATURED <span>PRODUCTS</span></>}</h2>
      <div className="products-carousel" aria-live="polite">
        {featuredProducts.map((item, index) => {
          const position = (index - currentIndex + featuredProducts.length) % featuredProducts.length;
          const positionName = position === 0 ? "front" : position === 1 ? "right" : "left";

          return (
            <div className={`product-slide product-slide-${positionName}`} key={item.image}>
          <img src={item.image} alt={germanCopy[item.id]?.name ?? item.name} />
            </div>
          );
        })}
      </div>
      <div className="products-controls" aria-label={german ? "Produktkarussell-Steuerung" : "Product carousel controls"}>
        <button type="button" onClick={() => move(-1)} aria-label={german ? "Vorheriges Produkt" : "Previous product"}>&lt;</button>
        <span>{String(currentIndex + 1).padStart(2, "0")} / {String(featuredProducts.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label={german ? "Nächstes Produkt" : "Next product"}>&gt;</button>
      </div>
      <div className="product-info">
        <p className="product-counter">{german ? "PRODUKT" : "PRODUCT"} {String(currentIndex + 1).padStart(2, "0")}</p>
        <h3 className={product.accent ? `product-accent-${product.accent}` : ""}>
          TRIGGER BAITS - <span>{copy?.name ?? product.name}</span>
        </h3>
        <p>{copy?.description ?? product.description}</p>
        <Link className="add-to-cart" href="/products">{german ? "ALLE PRODUKTE" : "ALL PRODUCTS"}</Link>
      </div>
    </section>
  );
}
