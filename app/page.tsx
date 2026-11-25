import { FrameSequenceStory } from "@/components/sections/FrameSequenceStory";
import { FAQSection } from "@/components/FAQSection";
import { ProductsCarousel } from "@/components/ProductsCarousel";
import { SiteFooter } from "@/components/SiteChrome";
import { SmoothScroll } from "@/components/SmoothScroll";

export default function Home() {
  return (
    <SmoothScroll>
      <main id="top" className="min-h-screen">
        <FrameSequenceStory />
        <ProductsCarousel />
        <FAQSection />
        <SiteFooter />
      </main>
    </SmoothScroll>
  );
}
