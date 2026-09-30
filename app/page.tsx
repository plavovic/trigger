import { FrameSequenceStory } from "@/components/sections/FrameSequenceStory";
import { FAQSection } from "@/components/FAQSection";
import { ProductsCarousel } from "@/components/ProductsCarousel";
import { SiteFooter } from "@/components/SiteChrome";
import { SmoothScroll } from "@/components/SmoothScroll";
import { IngredientsSection } from "@/components/sections/IngredientsSection";

export default function Home() {
  return (
    <SmoothScroll>
      <main id="top" className="min-h-screen">
        <FrameSequenceStory />
        <IngredientsSection />
        <ProductsCarousel />
        <FAQSection />
        <SiteFooter />
      </main>
    </SmoothScroll>
  );
}
