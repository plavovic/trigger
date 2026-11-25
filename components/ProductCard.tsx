"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { useLanguage } from "@/components/LanguageProvider";

type ProductCardProps = {
  product: Product;
  onAddToCart: (productId: string) => Promise<boolean>;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const { language } = useLanguage();
  const german = language === "de";
  const germanCopy: Record<string, { name: string; description: string }> = {
    product01: { name: "Workhorse", description: "Ein zuverlässiger Alltagsköder für sichere Sessions." },
    product02: { name: "The One", description: "Ein markantes Profil, das eine Reaktion auslöst." },
    product03: { name: "Purple Kraken", description: "Ein tiefes, charaktervolles Profil für schwierige Gewässer." },
  };
  const copy = german ? germanCopy[product.id] : undefined;

  useEffect(() => {
    if (!isAdded) return;
    const timeoutId = window.setTimeout(() => setIsAdded(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [isAdded]);

  const addProduct = async () => {
    setBusy(true);
    try { setIsAdded(await onAddToCart(product.id)); }
    finally { setBusy(false); }
  };

  return (
    <button
      className={`product-card${product.accent ? ` product-card-${product.accent}` : ""}`}
      type="button"
      disabled={busy}
      onClick={addProduct}
      aria-label={`Add ${product.name} to cart`}
    >
      <span className="product-card-perforation" aria-hidden="true" />
      <span className="product-card-topline">
        <span>TRIGER BAITS</span>
        <span>{german ? "PRODUKT" : "PRODUCT"} {product.number}</span>
      </span>
      <span className="product-card-image-wrap">
        <img className="product-card-image" src={product.image} alt={product.name} />
      </span>
      <span className="product-card-details">
        <span className="product-card-number">{german ? "PRODUKT" : "PRODUCT"} {product.number}</span>
        <span className="product-card-name">{copy?.name ?? product.name}</span>
        <span className="product-card-description">{copy?.description ?? product.description}</span>
        <span className="product-card-bottomline">
          <span className="product-card-price">{product.price}</span>
          <span className="product-card-status" aria-live="polite">{isAdded ? (german ? "HINZUGEFÜGT" : "ADDED") : (german ? "IN DEN WARENKORB" : "ADD TO CART")}</span>
        </span>
      </span>
      <span className="product-card-barcode" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
    </button>
  );
}
