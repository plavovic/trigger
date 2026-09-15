"use client";

import { useState } from "react";
import Link from "next/link";
import { products } from "@/lib/products";

const featuredProducts = products.slice(0, 3);

export function ProductsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const product = featuredProducts[currentIndex];

  const move = (direction: number) => {
    setCurrentIndex((index) => (index + direction + featuredProducts.length) % featuredProducts.length);
  };

  return (
    <section className="products-section" aria-labelledby="products-title">
      <h2 id="products-title" className="products-title">FEATURED <span>PRODUCTS</span></h2>
      <div className="products-carousel" aria-live="polite">
        {featuredProducts.map((item, index) => {
          const position = (index - currentIndex + featuredProducts.length) % featuredProducts.length;
          const positionName = position === 0 ? "front" : position === 1 ? "right" : "left";

          return (
            <div className={`product-slide product-slide-${positionName}`} key={item.image}>
              <img src={item.image} alt={item.name} />
            </div>
          );
        })}
      </div>
      <div className="products-controls" aria-label="Product carousel controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous product">&lt;</button>
        <span>{String(currentIndex + 1).padStart(2, "0")} / {String(featuredProducts.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next product">&gt;</button>
      </div>
      <div className="product-info">
        <p className="product-counter">PRODUCT {String(currentIndex + 1).padStart(2, "0")}</p>
        <h3 className={product.accent ? `product-accent-${product.accent}` : ""}>
          TRIGGER BAITS - <span>{product.name}</span>
        </h3>
        <p>{product.description}</p>
        <Link className="add-to-cart" href="/products">ALL PRODUCTS</Link>
      </div>
    </section>
  );
}
