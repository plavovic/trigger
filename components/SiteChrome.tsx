"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ScrollHeartbeat } from "@/components/ScrollHeartbeat";

export function SiteHeader() {
  const { itemCount } = useCart();

  return (
    <header className="story-nav" aria-label="Main navigation">
      <Link className="story-brand-link" href="/#top" aria-label="Triger home">
        <img className="story-brand" src="/logo.png" alt="Triger logo" />
      </Link>
      <nav className="story-nav-links">
        <Link href="/about">ABOUT</Link>
        <Link href="/products">PRODUCTS</Link>
        <Link className="site-cart-link" href="/cart">
          CART
          {itemCount > 0 && <span className="cart-count" aria-label={`${itemCount} products in cart`}>{itemCount}</span>}
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer collection-footer">
      <div className="footer-brand">
        <img src="/logo.png" alt="Triger" />
        <p>FEED THE RESPONSE.</p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <a href="/#products-title">Products</a>
        <a href="/#faq-title">FAQs</a>
        <a href="mailto:hello@trigerbaits.com">Contact</a>
      </nav>
      <p className="footer-note">© 2026 Triger Baits. Built to trigger the bite.</p>
      <ScrollHeartbeat />
    </footer>
  );
}