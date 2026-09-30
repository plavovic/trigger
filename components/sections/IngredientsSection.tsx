"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type CSSProperties } from "react";

gsap.registerPlugin(ScrollTrigger);

// Sample formula: replace with the confirmed product ingredients.
const ingredients = [
  { percentage: 40, description: "Fishmeal — the foundation of the mix." },
  { percentage: 25, description: "Birdfood — texture in every bite." },
  { percentage: 15, description: "Milk proteins — a smooth, balanced base." },
  { percentage: 10, description: "Yeast — depth in the flavour profile." },
  { percentage: 10, description: "Natural attractors — the finishing touch." },
];

export function IngredientsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".ingredients-row").forEach((row, index) => {
          const count = row.querySelector<HTMLElement>(".ingredients-count");
          const counter = { value: 0 };
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: row, start: "top 88%", end: "top 58%", scrub: true, invalidateOnRefresh: true },
          });
          timeline.fromTo(row, { opacity: 0, y: 28 }, { opacity: 1, y: 0, ease: "none" }, 0);
          timeline.to(counter, {
            value: ingredients[index].percentage,
            ease: "none",
            onUpdate: () => { if (count) count.textContent = String(Math.round(counter.value)); },
          }, 0);
        });
        return () => {
          sectionRef.current?.querySelectorAll<HTMLElement>(".ingredients-count").forEach((count, index) => {
            count.textContent = String(ingredients[index].percentage);
          });
        };
      });
    }, sectionRef);
    return () => { media.revert(); context.revert(); };
  }, []);

  return (
    <section ref={sectionRef} id="ingridients" className="ingredients-section" aria-labelledby="ingredients-title">
      <h2 id="ingredients-title" className="ingredients-title"><span>TRIGGER</span> INGRIDIENTS</h2>
      <ol className="ingredients-list">
        {ingredients.map((ingredient, index) => (
          <li key={ingredient.description} className="ingredients-row" style={{ "--ingredient-index": index } as CSSProperties}>
            <strong className="ingredients-percentage" aria-label={`${ingredient.percentage} percent`}>
              <span aria-hidden="true"><span className="ingredients-count">{ingredient.percentage}</span>%</span>
            </strong>
            <span className="ingredients-description">{ingredient.description}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
