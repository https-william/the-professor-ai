"use client";

import React from "react";

const BLOCKS = [
  {
    title: "The fluency illusion is real.",
    body: "Reading your notes feels like learning. It isn't. Your brain recognizes material it has already seen and mistakes that recognition for mastery. Every student who has ever studied hard and still blanked in the exam hall knows this feeling. Recognition and recall are not the same cognitive process — and only one of them works when an invigilator is watching.",
  },
  {
    title: "Active recall is the only thing that works.",
    body: "Decades of cognitive science are unambiguous: the act of retrieving information — not re-reading it — is what builds durable, exam-ready memory. The Professor converts your notes into a quiz, a structured study guide, and a match game because these are the only formats that wire knowledge in rather than just passing it through your short-term memory.",
  },
  {
    title: "Built for the high-stakes grind.",
    body: "Not Silicon Valley. Every decision — the language, the features, the accessibility, the upload formats — was made with one person in mind: the student sitting up at 3 AM with an exam in 10 hours. This is a tool for the dedicated, the ambitious, and the ones who refuse to leave their grades to chance.",
  },
];

export default function PhilosophySection() {
  return (
    <section
      id="about"
      style={{
        padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
        maxWidth: "1100px",
        margin: "0 auto",
        background: "var(--bg)",
        position: "relative",
      }}
    >
      <div
        className="philosophy-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "40% 1fr",
          gap: "80px",
          alignItems: "start",
          position: "relative",
        }}
      >
        {/* Decorative Vertical Divider */}
        <div
          className="hidden md:block"
          style={{
            position: "absolute",
            left: "40%",
            top: 0,
            bottom: 0,
            width: "1px",
            background: "linear-gradient(180deg, transparent 0%, var(--blue-border) 20%, var(--blue-border) 80%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Left Column */}
        <div className="philosophy-left-col animate-up" style={{ position: "sticky", top: "120px" }}>
          <span className="section-label" style={{ color: "var(--blue)" }}>OUR PHILOSOPHY</span>

          <h2 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            color: "var(--text)",
            marginTop: "12px",
            letterSpacing: "-0.03em"
          }}>
            Study guides don&apos;t fail students. Studying the{" "}
            <span style={{ color: "var(--blue)", fontStyle: "normal" }}>wrong things</span>{" "}
            does.
          </h2>

          <div style={{
            width: "40px",
            height: "2px",
            background: "var(--blue)",
            borderRadius: "1px",
            marginTop: "28px",
          }} />

          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            color: "var(--text-3)",
            lineHeight: 1.6,
            marginTop: "16px",
            fontWeight: 500
          }}>
            The Professor uses your actual notes — not textbooks, not the internet — to build study tools calibrated to exactly what your lecturer taught.
          </p>
        </div>

        {/* Right Column */}
        <div>
          {BLOCKS.map((block, i) => (
            <div
              key={i}
              className="animate-up"
              style={{
                marginBottom: i < BLOCKS.length - 1 ? "40px" : 0,
                transitionDelay: `${i * 150}ms`,
              }}
            >
              {/* Blue accent line */}
              <div style={{
                width: "32px",
                height: "2px",
                background: "var(--blue)",
                marginBottom: "16px",
                opacity: 0.6
              }} />

              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: "12px",
                letterSpacing: "-0.01em"
              }}>
                {block.title}
              </h3>

              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                color: "var(--text-2)",
                lineHeight: 1.65,
                maxWidth: "580px",
                fontWeight: 400
              }}>
                {block.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile override: single column */}
      <style jsx>{`
        @media (max-width: 768px) {
          .philosophy-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 40px !important;
          }
          .philosophy-left-col {
            position: static !important;
            width: 100% !important;
            margin-bottom: 20px;
          }
          .hidden.md\:block {
             display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
