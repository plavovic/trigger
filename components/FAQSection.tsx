"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const faqs = [
  { question: "What makes Trigger Baits different?", answer: "Our baits are built around considered flavour profiles and ingredients that help keep carp feeding. Each mix is developed to be dependable session after session." },
  { question: "Which bait should I start with?", answer: "Workhorse is a reliable everyday choice for most waters. If you want something more distinctive, Purple Kraken or The One offer a deeper, more characterful profile." },
  { question: "Do you ship across the UK?", answer: "Yes. We ship orders across the UK, with delivery details and current lead times shown at checkout." },
  { question: "How should I store my boilies?", answer: "Keep them sealed in a cool, dry place away from direct sunlight. Once opened, use the bag's resealable closure to help preserve freshness." },
  { question: "Can I ask for help choosing a product?", answer: "Absolutely. Send us the details of your venue, target fish, and the conditions you expect, and we will point you towards a sensible starting setup." },
];

const germanFaqs = [
  { question: "Was macht Trigger Baits anders?", answer: "Unsere Köder basieren auf ausgewählten Aromaprofilen und Zutaten, die Karpfen beim Fressen halten. Jede Mischung wird für zuverlässige Ergebnisse bei jeder Session entwickelt." },
  { question: "Mit welchem Köder sollte ich starten?", answer: "Workhorse ist eine zuverlässige Wahl für die meisten Gewässer. Für ein ausgeprägteres Profil bieten Purple Kraken oder The One mehr Charakter." },
  { question: "Versendet ihr in ganz Großbritannien?", answer: "Ja. Wir versenden Bestellungen innerhalb Großbritanniens. Lieferdetails und aktuelle Lieferzeiten werden beim Checkout angezeigt." },
  { question: "Wie sollte ich Boilies lagern?", answer: "Kühl, trocken und vor direkter Sonne geschützt aufbewahren. Nach dem Öffnen den wiederverschließbaren Beutel nutzen." },
  { question: "Könnt ihr bei der Produktauswahl helfen?", answer: "Natürlich. Teile uns Gewässer, Zielfisch und die erwarteten Bedingungen mit – wir empfehlen dir einen passenden Einstieg." },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const german = language === "de";
  const items = german ? germanFaqs : faqs;

  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="faq-heading">
        <p className="faq-kicker">{german ? "WISSENSWERT" : "NEED TO KNOW"}</p>
        <h2 id="faq-title">{german ? <>HÄUFIG GESTELLTE <span>FRAGEN</span></> : <>FREQUENTLY ASKED <span>QUESTIONS</span></>}</h2>
        <p>{german ? "Wir beantworten deine Fragen gerne" : "We're happy to answer your questions"}</p>
      </div>
      <div className="faq-list">
        {items.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div className={`faq-item${isOpen ? " faq-item-open" : ""}`} key={faq.question}>
              <button className="faq-question" type="button" id={`faq-question-${index}`} aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenIndex(isOpen ? null : index)}>
                <span>{faq.question}</span>
                <span className="faq-toggle" aria-hidden="true">{isOpen ? "×" : "+"}</span>
              </button>
              <div className="faq-answer" id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={!isOpen}>
                <p>{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
