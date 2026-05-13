"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "What file types can I upload?",
    a: "PDF documents, PowerPoint slides (.pptx), Word files (.docx), and images (JPG, PNG, WEBP) — including photos of handwritten notes. If your notes exist in any readable format, The Professor can work with them. Yes, this includes WhatsApp-forwarded lecture slides.",
  },
  {
    q: "Do I need to create an account before I start?",
    a: "No. You can upload your notes and receive a preview of your study guide before creating an account. Creating a free account saves your study pack, enables streaks, and gives you access to the quiz and match game. The first generation is always free.",
  },
  {
    q: "How accurate are the study guides and quizzes?",
    a: "The Professor extracts content directly from your uploaded material — it does not hallucinate or add external information. The study guide and quiz reflect exactly what is in your notes. If your notes contain an error, the output will too. We recommend using it alongside, not instead of, your own judgment.",
  },
  {
    q: "Is this considered academic dishonesty?",
    a: "No. The Professor is a study aid — equivalent to highlighting your notes, making flashcards, or studying with a tutor. It helps you understand and recall your own material. It does not write essays, generate assignments, or produce work for submission. How you use what you learn is always your responsibility.",
  },
  {
    q: "How much does it cost?",
    a: "The Professor is free for students. Our mission is to democratize elite study strategies, ensuring every scholar has access to the best AI tools regardless of their budget. Unlimited uploads, active recall sets, and study analytics are all part of the core experience.",
  },
  {
    q: "Does it work for science, engineering, and medical courses?",
    a: "Yes. The Professor works for any text-based lecture content — including medical anatomy, engineering theory, law, economics, and the sciences. It does not solve mathematical equations or generate chemical formulae, but it handles concept-heavy, definition-heavy, and theory-heavy content extremely well.",
  },
  {
    q: "What happens to my uploaded notes?",
    a: "Your uploaded files are used only to generate your study pack. They are stored securely and associated only with your account. We do not sell, share, or use your notes to train our models. You can delete any uploaded document from your account at any time.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <section style={{
      background: "transparent",
      padding: "clamp(100px, 15vw, 160px) clamp(24px, 6vw, 80px)",
      position: "relative"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <span className="section-label mb-6" style={{ color: "var(--blue)", letterSpacing: "0.4em" }}>FREQUENTLY ASKED</span>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.2rem, 5vw, 4rem)",
            fontWeight: 900,
            color: "var(--foreground)",
            marginTop: "12px",
            lineHeight: 0.95,
            letterSpacing: "-0.04em"
          }}>
            Every question. <br />
            <span style={{ color: "var(--blue)", textShadow: "0 0 30px var(--blue-glow)" }}>Honest answers.</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="scholar-card overflow-hidden" style={{ borderRadius: "40px", padding: "16px" }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  borderBottom: i < FAQS.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  background: isOpen ? "var(--bg-2)" : "transparent",
                  borderRadius: isOpen ? "24px" : "0",
                  marginTop: isOpen && i > 0 ? "8px" : "0",
                  marginBottom: isOpen && i < FAQS.length - 1 ? "8px" : "0",
                }}
              >
                {/* Question */}
                <button
                  onClick={() => toggle(i)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "32px",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "18px",
                    fontWeight: 900,
                    color: isOpen ? "var(--foreground)" : "var(--foreground-muted)",
                    transition: "color 300ms ease",
                    flex: 1,
                    paddingRight: "24px",
                    letterSpacing: "-0.01em"
                  }}>
                    {faq.q}
                  </span>
                  <div
                    className={isOpen ? "btn-skeuo" : "w-10 h-10 rounded-xl bg-[var(--bg-3)] border border-[var(--border)]"}
                    style={{
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.4s ease",
                      transform: isOpen ? "rotate(135deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={20} className={isOpen ? "text-[var(--blue)]" : "text-[var(--foreground-muted)]"} />
                  </div>
                </button>

                {/* Answer */}
                <div 
                  style={{
                    maxHeight: isOpen ? "500px" : "0",
                    overflow: "hidden",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    opacity: isOpen ? 1 : 0
                  }}
                >
                  <p style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "16px",
                    color: "var(--foreground-secondary)",
                    lineHeight: 1.7,
                    padding: "0 32px 32px 32px",
                    fontWeight: 500,
                    opacity: 0.8
                  }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
