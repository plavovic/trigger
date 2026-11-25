"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollFrameSequence, type ScrollFrameSequenceHandle } from "@/components/ScrollFrameSequence";
import { FRAME_COUNT } from "@/lib/frameSequence";
import { SiteHeader } from "@/components/SiteChrome";
import { useLanguage } from "@/components/LanguageProvider";

export function FrameSequenceStory() {
  const shellRef = useRef<HTMLElement | null>(null);
  const sequenceRef = useRef<ScrollFrameSequenceHandle | null>(null);
  const currentFrameRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const { language } = useLanguage();
  const german = language === "de";

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      sequenceRef.current?.renderFrame(Math.floor(FRAME_COUNT / 2));
      return;
    }

    let rafId = 0;
    let targetFrame = 0;

    const updateTargetFromScroll = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const shellTop = shell.offsetTop;
      const scrollDistance = Math.max(1, shell.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, (window.scrollY - shellTop) / scrollDistance));

      targetFrame = Math.max(0, Math.min(FRAME_COUNT - 1, progress * (FRAME_COUNT - 1)));
      setProgress(progress);
    };

    const step = () => {
      updateTargetFromScroll();
      const distance = targetFrame - currentFrameRef.current;
      currentFrameRef.current += distance * 0.12;
      sequenceRef.current?.renderFrame(currentFrameRef.current);
      rafId = requestAnimationFrame(step);
    };

    const onScroll = () => {
      updateTargetFromScroll();
    };

    updateTargetFromScroll();
    rafId = requestAnimationFrame(step);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={shellRef} className="story-shell" aria-label="Frame sequence story">
    <div className="story-root">
        <ScrollFrameSequence
          ref={sequenceRef}
          className="sequence-canvas"
        />
        <div className="story-shade" aria-hidden="true" />
        <SiteHeader />
        <div
          className="story-hero-copy"
          style={{ opacity: Math.max(0, 1 - progress / 0.34) }}
        >
          <p className="story-eyebrow">FORMEL / 01</p>
          <h1>{german ? <>ENTWICKELT, UM <span>DEN BISS</span> AUSZULÖSEN</> : <>BUILT TO <span>TRIGGER</span> THE BITE</>}</h1>
          <p className="story-scroll-cue">{german ? "ZUM ENTHÜLLEN SCROLLEN" : "SCROLL TO REVEAL"} <i /></p>
        </div>
        <div
          className="story-mid-copy"
          style={{ opacity: Math.max(0, Math.min(1, (progress - 0.2) / 0.16)) * Math.max(0, 1 - Math.max(0, progress - 0.68) / 0.2) }}
        >
          <div className="story-mid-block story-mid-top-left">
            <strong>{german ? "WISSENSCHAFT IN JEDEM BOILIE" : "SCIENCE IN EVERY BOILIE"}</strong>
            <p>{german ? "Präzise entwickelte Leistung, verfeinert zu einem Produkt, das sich so außergewöhnlich anfühlt, wie es performt." : "Precision-engineered performance, refined into a product that feels as exceptional as it performs."}</p>
          </div>
          <div className="story-mid-block story-mid-bottom-right">
            <strong>{german ? "100 STÜCK, UM KARPFEN ZU VERFÜHREN" : "100 PIECES CRAFTED TO TEMPT THE CARP"}</strong>
            <p>{german ? "Jedes Stück ist entwickelt, um Karpfen anzulocken und ihnen zu widerstehen unmöglich zu machen." : "Every piece is formulated to attract and make unendurable for prey."}</p>
          </div>
        </div>
        <div
          className="story-final-copy"
          style={{ opacity: Math.max(0, Math.min(1, (progress - 0.55) / 0.2)) }}
        >
          <div className="story-detail story-detail-top-left">
            <strong>01 — PRECISION CORE</strong>
            <p>Engineered for consistent performance and long-term reliability.</p>
          </div>
          <div className="story-detail story-detail-top-right">
            <strong>02 — ADVANCED MATERIALS</strong>
            <p>Selected for their balance of strength, weight, durability, and tactile quality.</p>
          </div>
          <div className="story-detail story-detail-bottom-left">
            <strong>03 — CONTROLLED PROCESS</strong>
            <p>Every component is developed and assembled with precision to maintain the intended performance.</p>
          </div>
          <div className="story-detail story-detail-bottom-right">
            <strong>04 — REFINED FINISH</strong>
            <p>The final layer of engineering is restraint - removing everything unnecessary until only what matters remains.</p>
          </div>
        </div>
        <div className="story-final-copy translated-story-final-copy" style={{ opacity: Math.max(0, Math.min(1, (progress - 0.55) / 0.2)) }}>
          <div className="story-detail story-detail-top-left"><strong>{german ? "01 — PRÄZISIONSKERN" : "01 — PRECISION CORE"}</strong><p>{german ? "Für konstante Leistung und langfristige Zuverlässigkeit entwickelt." : "Engineered for consistent performance and long-term reliability."}</p></div>
          <div className="story-detail story-detail-top-right"><strong>{german ? "02 — FORTSCHRITTLICHE MATERIALIEN" : "02 — ADVANCED MATERIALS"}</strong><p>{german ? "Ausgewählt für die Balance aus Stärke, Gewicht, Haltbarkeit und Haptik." : "Selected for their balance of strength, weight, durability, and tactile quality."}</p></div>
          <div className="story-detail story-detail-bottom-left"><strong>{german ? "03 — KONTROLLIERTER PROZESS" : "03 — CONTROLLED PROCESS"}</strong><p>{german ? "Jede Komponente wird präzise entwickelt und gefertigt, um die gewünschte Leistung zu erhalten." : "Every component is developed and assembled with precision to maintain the intended performance."}</p></div>
          <div className="story-detail story-detail-bottom-right"><strong>{german ? "04 — VERFEINERTE AUSFÜHRUNG" : "04 — REFINED FINISH"}</strong><p>{german ? "Die letzte Ebene der Entwicklung ist Zurückhaltung — alles Unnötige wird entfernt, bis nur das Wesentliche bleibt." : "The final layer of engineering is restraint - removing everything unnecessary until only what matters remains."}</p></div>
        </div>
      </div>
    </section>
  );
}
