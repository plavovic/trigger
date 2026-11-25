"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ScrollHeartbeat } from "@/components/ScrollHeartbeat";
import { useLanguage } from "@/components/LanguageProvider";

export function SiteHeader() {
  const { itemCount } = useCart();
  const { language, toggleLanguage } = useLanguage();
  const german = language === "de";

  return (
    <header className="story-nav" aria-label="Main navigation">
      <Link className="story-brand-link" href="/#top" aria-label="Triger home">
        <img className="story-brand" src="/logo.png" alt="Triger logo" />
      </Link>
      <nav className="story-nav-links">
        <Link href="/about">{german ? "ÜBER UNS" : "ABOUT"}</Link>
        <Link href="/products">{german ? "PRODUKTE" : "PRODUCTS"}</Link>
        <Link className="site-cart-link" href="/cart">
          {german ? "WARENKORB" : "CART"}
          {itemCount > 0 && <span className="cart-count" aria-label={`${itemCount} products in cart`}>{itemCount}</span>}
        </Link>
        <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label={`Switch to ${language === "en" ? "German" : "English"}`}>
          {language.toUpperCase()}
        </button>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const { language } = useLanguage();
  const german = language === "de";
  return (
    <footer className="site-footer collection-footer">
      <div className="footer-brand">
        <img src="/logo.png" alt="Triger" />
        <p>{german ? "FÜTTERE DIE REAKTION." : "FEED THE RESPONSE."}</p>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link href="/#products-title">{german ? "Produkte" : "Products"}</Link>
        <Link href="/#faq-title">FAQs</Link>
        <a href="mailto:hello@trigerbaits.com">{german ? "Kontakt" : "Contact"}</a>
      </nav>
      <p className="footer-note">© 2026 Triger Baits. Built to trigger the bite.</p>
      <ScrollHeartbeat />
    </footer>
  );
}
