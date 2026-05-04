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
    title: "We built this for late nights in Ota.",
    body: "Not San Francisco. Every decision — the language, the features, the pricing, the upload formats — was made with one person in mind: a Nigerian university student sitting up at 3 AM with an exam in 10 hours. This is an African product, for African students, built by one of them.",
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
        background: "#08080E",
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
            background: "linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.15) 20%, rgba(245,158,11,0.15) 80%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Left Column */}
        <div className="animate-up" style={{ position: "sticky", top: "120px" }}>
          <span className="section-label">OUR PHILOSOPHY</span>

          <h2 style={{
            fontFamily: "'Galaxie Copernicus', 'Source Serif 4', Georgia, serif",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 500,
            lineHeight: 1.2,
            color: "#F5F0E8",
            marginTop: 0,
          }}>
            Study guides don&apos;t fail students. Studying the{" "}
            <span style={{ color: "#F59E0B", fontStyle: "normal" }}>wrong things</span>{" "}
            does.
          </h2>

          <div style={{
            width: "40px",
            height: "1.5px",
            background: "#F59E0B",
            borderRadius: "1px",
            marginTop: "28px",
          }} />

          <p style={{
            fontFamily: "'Tiempos Text', 'Source Serif 4', Georgia, serif",
            fontSize: "14px",
            color: "rgba(245,240,232,0.45)",
            lineHeight: 1.7,
            marginTop: "16px",
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
              {/* Amber accent line */}
              <div style={{
                width: "32px",
                height: "1.5px",
                background: "#F59E0B",
                marginBottom: "16px",
              }} />

              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "17px",
                fontWeight: 700,
                color: "#F5F0E8",
                marginBottom: "8px",
              }}>
                {block.title}
              </h3>

              <p style={{
                fontFamily: "'Tiempos Text', 'Source Serif 4', Georgia, serif",
                fontSize: "15px",
                color: "rgba(245,240,232,0.58)",
                lineHeight: 1.75,
                maxWidth: "580px",
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
            display: block !important;
          }
          .philosophy-grid > div:first-child {
            position: static !important;
            margin-bottom: 40px;
          }
        }
      `}</style>
    </section>
  );
}
