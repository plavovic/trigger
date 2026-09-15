import { FrameSequenceStory } from "@/components/sections/FrameSequenceStory";
import { FAQSection } from "@/components/FAQSection";
import { ProductsCarousel } from "@/components/ProductsCarousel";
import { ScrollHeartbeat } from "@/components/ScrollHeartbeat";
import { SmoothScroll } from "@/components/SmoothScroll";

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <FrameSequenceStory />
        <ProductsCarousel />
        <FAQSection />
        <footer className="site-footer">
          <div className="footer-brand">
            <img src="/logo.png" alt="Triger" />
            <p>FEED THE RESPONSE.</p>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <a href="#products-title">Products</a>
            <a href="#faq-title">FAQs</a>
            <a href="mailto:hello@trigerbaits.com">Contact</a>
          </nav>
          <p className="footer-note">© 2026 Triger Baits. Built to trigger the bite.</p>
          <ScrollHeartbeat />
        </footer>
      </main>
    </SmoothScroll>
  );
}
