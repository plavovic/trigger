"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  onAddToCart: (productId: string) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isAdded) return;
    const timeoutId = window.setTimeout(() => setIsAdded(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [isAdded]);

  const addProduct = () => {
    onAddToCart(product.id);
    setIsAdded(true);
  };

  return (
    <button
      className={`product-card${product.accent ? ` product-card-${product.accent}` : ""}`}
      type="button"
      onClick={addProduct}
      aria-label={`Add ${product.name} to cart`}
    >
      <span className="product-card-perforation" aria-hidden="true" />
      <span className="product-card-topline">
        <span>TRIGER BAITS</span>
        <span>PRODUCT {product.number}</span>
      </span>
      <span className="product-card-image-wrap">
        <img className="product-card-image" src={product.image} alt={product.name} />
      </span>
      <span className="product-card-details">
        <span className="product-card-number">PRODUCT {product.number}</span>
        <span className="product-card-name">{product.name}</span>
        <span className="product-card-description">{product.description}</span>
        <span className="product-card-bottomline">
          <span className="product-card-price">{product.price}</span>
          <span className="product-card-status" aria-live="polite">{isAdded ? "ADDED" : "ADD TO CART"}</span>
        </span>
      </span>
      <span className="product-card-barcode" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
    </button>
  );
}