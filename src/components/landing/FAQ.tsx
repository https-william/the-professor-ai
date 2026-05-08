"use client";

import React, { useState } from "react";

const FAQS = [
  {
    q: "What file types can I upload?",
    a: "PDF documents, Word files (.docx), images (JPG, PNG, WEBP) — including photos of handwritten notes — and voice recordings. If your notes exist in any readable format, The Professor can work with them. Yes, this includes WhatsApp-forwarded lecture slides.",
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
      background: "var(--bg-2)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <span className="section-label" style={{ textAlign: "center", color: "var(--blue)" }}>FREQUENTLY ASKED</span>
          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 900,
            color: "var(--text)",
            marginTop: "12px",
            letterSpacing: "-0.03em"
          }}>
            Every question. <span style={{ color: "var(--blue)" }}>Honest answers.</span>
          </h2>
        </div>

        {/* Accordion */}
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "32px", padding: "16px", border: "1px solid var(--border)" }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  borderBottom: i < FAQS.length - 1 ? "1px solid var(--border)" : "none",
                  borderRadius: i === 0 ? "24px 24px 0 0" : i === FAQS.length - 1 ? "0 0 24px 24px" : "0",
                  transition: "background 0.3s ease",
                  background: isOpen ? "rgba(255,255,255,0.02)" : "transparent"
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
                    padding: "24px",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: isOpen ? "var(--blue)" : "var(--text)",
                    transition: "color 150ms ease",
                    flex: 1,
                    paddingRight: "16px",
                  }}>
                    {faq.q}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: isOpen ? "var(--blue)" : "var(--bg-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none"
                      style={{
                        color: isOpen ? "white" : "var(--text-3)",
                      }}
                    >
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>

                {/* Answer */}
                <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                  <p style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    color: "var(--text-2)",
                    lineHeight: 1.75,
                    padding: "0 24px 24px 24px",
                    fontWeight: 500
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
