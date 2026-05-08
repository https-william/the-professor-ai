"use client";

import React from "react";

const CARDS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <rect x="7" y="5" width="10" height="14" rx="1" opacity="0.5" />
        <rect x="10" y="8" width="4" height="8" rx="1" opacity="0.3" />
      </svg>
    ),
    title: "You have notes. You don't have time.",
    body: "Your lecture notes from a full semester stack up to hundreds of pages. Reading all of it the night before an exam is not a strategy — it's a coin flip disguised as studying.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C7 2 3 6 3 11c0 3 1.5 5.5 4 7v4l3-2h2c5 0 9-4 9-9s-4-9-9-9z" />
        <text x="10" y="14" fill="var(--blue)" fontSize="10" fontWeight="900" fontFamily="var(--font-sans)" stroke="none">?</text>
      </svg>
    ),
    title: "Re-reading feels like studying. It isn't.",
    body: "Every time you re-read your notes, your brain says 'I know this.' It is lying to you. Recognition and recall are not the same — and only one of them works when the invigilator says 'you may begin.' The fluency illusion destroys well-prepared students.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="1.5" fill="var(--blue)" stroke="none" />
        <circle cx="15" cy="10" r="1.5" fill="var(--blue)" stroke="none" />
        <path d="M9 15h6" strokeWidth="2" />
        <circle cx="19" cy="5" r="4" fill="var(--bg)" stroke="var(--blue)" strokeWidth="2" />
        <path d="M17.5 3.5L20.5 6.5M20.5 3.5L17.5 6.5" strokeWidth="2" />
      </svg>
    ),
    title: "ChatGPT doesn't know your lecturer.",
    body: "Generic AI tools give generic answers. They don't know what Prof. Adeyemi emphasized in week 7, or what questions always appear on the BIO 202 paper at your institution. Your notes do. The Professor uses them — and only them.",
  },
];

export default function PainSection() {
  return (
    <section
      id="features"
      style={{
        padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
        maxWidth: "1100px",
        margin: "0 auto",
        background: "var(--bg)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 48px" }}>
        <span className="section-label" style={{ textAlign: "center", color: "var(--blue)" }}>THE PROBLEM</span>
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 900,
          color: "var(--text)",
          textAlign: "center",
          marginTop: "12px",
          letterSpacing: "-0.03em"
        }}>
          You&apos;re not struggling. The tools are.
        </h2>
      </div>

      {/* Card Grid */}
      <div
        className="pain-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "48px",
        }}
      >
        {CARDS.map((card, i) => (
          <div key={i} className="card-redesign animate-up" style={{ 
            transitionDelay: `${i * 100}ms`,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "24px",
            padding: "32px"
          }}>
            {/* Icon */}
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "var(--blue-dim)",
              border: "1px solid var(--blue-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {card.icon}
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "19px",
              fontWeight: 800,
              color: "var(--text)",
              marginTop: "24px",
              letterSpacing: "-0.01em"
            }}>
              {card.title}
            </h3>

            {/* Body */}
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              color: "var(--text-2)",
              lineHeight: 1.6,
              marginTop: "12px",
              fontWeight: 400
            }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .pain-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
