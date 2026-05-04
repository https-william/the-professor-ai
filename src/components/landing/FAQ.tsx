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
    a: "The basic plan is free — with a limited number of monthly generations. The premium plan (unlimited uploads, PDF export, advanced quiz settings, and study analytics) is priced for Nigerian students specifically. Semester billing is available — you pay for the exam period, not the full year. Exact pricing is on the Pricing page.",
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
      background: "#12121F",
      borderTop: "0.5px solid rgba(245,240,232,0.06)",
      borderBottom: "0.5px solid rgba(245,240,232,0.06)",
      padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="section-label" style={{ textAlign: "center" }}>FREQUENTLY ASKED</span>
          <h2 style={{
            fontFamily: "'Galaxie Copernicus','Source Serif 4',Georgia,serif",
            fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
            fontWeight: 500,
            color: "#F5F0E8",
            marginTop: 0,
          }}>
            Every question. Honest answers.
          </h2>
        </div>

        {/* Accordion */}
        <div>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  borderBottom: i < FAQS.length - 1 ? "0.5px solid rgba(245,240,232,0.08)" : "none",
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
                    padding: "20px 0",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    const span = e.currentTarget.querySelector("span") as HTMLElement;
                    if (span) span.style.color = "rgba(245,158,11,0.9)";
                  }}
                  onMouseLeave={(e) => {
                    const span = e.currentTarget.querySelector("span") as HTMLElement;
                    if (span) span.style.color = "#F5F0E8";
                  }}
                >
                  <span style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#F5F0E8",
                    transition: "color 150ms ease",
                    flex: 1,
                    paddingRight: "16px",
                  }}>
                    {faq.q}
                  </span>
                  <svg
                    width="20" height="20" viewBox="0 0 20 20" fill="none"
                    style={{
                      color: "rgba(245,240,232,0.4)",
                      transition: "transform 200ms ease",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Answer */}
                <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                  <p style={{
                    fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif",
                    fontSize: "15px",
                    color: "rgba(245,240,232,0.6)",
                    lineHeight: 1.75,
                    paddingBottom: isOpen ? "0" : undefined,
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
