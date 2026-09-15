"use client";

import { useState } from "react";
import Link from "next/link";

const products = [
  {
    image: "/product01.png",
    title: "TRIGGER BAITS - WORKHORSE EVERYDAY BOILIES",
    description: "Feed the Response. Standard everyday bait.",
  },
  {
    image: "/product02.png",
    title: "TRIGGER BAITS - THE ONE FRANKFURTER SAUSAGE BOILIES",
    description: "Feed the Response. The classic savoury choice.",
    accentClass: "product-accent-red",
  },
  {
    image: "/product03.png",
    title: "TRIGGER BAITS - PURPLE KRAKEN SQUID & PLUM BOILIES",
    description: "Feed the Response. Advanced flavour profile.",
    accentClass: "product-accent-purple",
  },
];

export function ProductsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const product = products[currentIndex];

  const move = (direction: number) => {
    setCurrentIndex((index) => (index + direction + products.length) % products.length);
  };

  return (
    <section className="products-section" aria-labelledby="products-title">
      <h2 id="products-title" className="products-title">FEATURED <span>PRODUCTS</span></h2>
      <div className="products-carousel" aria-live="polite">
        {products.map((item, index) => {
          const position = (index - currentIndex + products.length) % products.length;
          const positionName = position === 0 ? "front" : position === 1 ? "right" : "left";

          return (
            <div className={`product-slide product-slide-${positionName}`} key={item.image}>
              <img src={item.image} alt={item.title} />
            </div>
          );
        })}
      </div>
      <div className="products-controls" aria-label="Product carousel controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous product">&lt;</button>
        <span>{String(currentIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next product">&gt;</button>
      </div>
      <div className="product-info">
        <p className="product-counter">PRODUCT {String(currentIndex + 1).padStart(2, "0")}</p>
        <h3 className={product.accentClass}>
          {currentIndex === 0 ? <>TRIGGER BAITS - <span>WORKHORSE</span> EVERYDAY BOILIES</> : currentIndex === 1 ? <>TRIGGER BAITS - <span>THE ONE</span> FRANKFURTER SAUSAGE BOILIES</> : <>TRIGGER BAITS - <span>PURPLE KRAKEN</span> SQUID &amp; PLUM BOILIES</>}
        </h3>
        <p>{product.description}</p>
        <Link className="add-to-cart" href="/products">ALL PRODUCTS</Link>
      </div>
    </section>
  );
}
