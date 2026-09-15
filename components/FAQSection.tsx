"use client";

import { useState } from "react";

const faqs = [
  { question: "What makes Trigger Baits different?", answer: "Our baits are built around considered flavour profiles and ingredients that help keep carp feeding. Each mix is developed to be dependable session after session." },
  { question: "Which bait should I start with?", answer: "Workhorse is a reliable everyday choice for most waters. If you want something more distinctive, Purple Kraken or The One offer a deeper, more characterful profile." },
  { question: "Do you ship across the UK?", answer: "Yes. We ship orders across the UK, with delivery details and current lead times shown at checkout." },
  { question: "How should I store my boilies?", answer: "Keep them sealed in a cool, dry place away from direct sunlight. Once opened, use the bag's resealable closure to help preserve freshness." },
  { question: "Can I ask for help choosing a product?", answer: "Absolutely. Send us the details of your venue, target fish, and the conditions you expect, and we will point you towards a sensible starting setup." },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="faq-heading">
        <p className="faq-kicker">NEED TO KNOW</p>
        <h2 id="faq-title">FREQUENTLY ASKED <span>QUESTIONS</span></h2>
        <p>We&apos;re happy to answer your questions</p>
      </div>
      <div className="faq-list">
        {faqs.map((faq, index) => {
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