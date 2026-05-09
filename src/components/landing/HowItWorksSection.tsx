"use client";

import React from "react";

const STEPS = [
  {
    num: "01",
    title: "Upload anything.",
    body: "Drag in your PDF, photograph your handwritten notes, paste a WhatsApp-forwarded document. We handle the mess — that's the point.",
    side: "right" as const,
    extra: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
        {["PDF", "DOCX", "JPG / PNG", "Voice notes", "WhatsApp forwards"].map(f => (
          <span key={f} className="format-pill" style={{ background: "var(--blue-dim)", border: "1px solid var(--blue-border)", color: "var(--blue)", fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "99px" }}>{f}</span>
        ))}
      </div>
    ),
  },
  {
    num: "02",
    title: "The Professor reads it.",
    body: "In 15–30 seconds, our AI extracts every key concept, identifies what's testable, and structures your material into a complete learning session calibrated to your exact content.",
    side: "left" as const,
    extra: (
      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
        {[0, 160, 320].map(delay => (
          <div key={delay} style={{
            width: "7px", height: "7px",
            borderRadius: "50%",
            background: "var(--blue)",
            animation: `dotPulse 1.2s ease-in-out ${delay}ms infinite`,
          }} />
        ))}
      </div>
    ),
  },
  {
    num: "03",
    title: "Get your full study pack.",
    body: "A structured study guide. A concise summary. A quiz built from your own notes. A match game. Four learning modes, one upload, zero wasted time.",
    side: "right" as const,
    extra: (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
        {["Study Guide", "Summary", "Quiz", "Match Game"].map(f => (
          <span key={f} className="format-pill" style={{ background: "var(--blue-dim)", border: "1px solid var(--blue-border)", color: "var(--blue)", fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "99px" }}>{f}</span>
        ))}
      </div>
    ),
  },
  {
    num: "04",
    title: "Study smarter. Every day.",
    body: "Track your quiz accuracy over time. Watch your comprehension scores climb. Set a daily study goal and let The Professor remind you before your streak breaks.",
    side: "left" as const,
    extra: (
      <div style={{
        fontFamily: "var(--font-sans)",
        fontSize: "12px",
        color: "var(--amber)",
        marginTop: "14px",
        fontWeight: 600
      }}>
        🔥 Keep your streak — The Professor will remind you
      </div>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "var(--bg)",
        padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 80px" }}>
        <span className="section-label mb-6" style={{ color: "var(--blue)", letterSpacing: "0.4em" }}>HOW IT WORKS</span>
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(2.2rem, 5vw, 4rem)",
          fontWeight: 900,
          color: "var(--foreground)",
          textAlign: "center",
          marginTop: "12px",
          lineHeight: 0.95,
          letterSpacing: "-0.04em"
        }}>
          From notes to exam-ready. <br />
          In under <span style={{ color: "var(--blue)", textShadow: "0 0 30px var(--blue-glow)" }}>60 seconds.</span>
        </h2>
      </div>

      {/* Timeline */}
      <div className="timeline-container" style={{ position: "relative" }}>
        {/* Center Line */}
        <div className="timeline-line" style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "2px",
          top: "48px",
          bottom: "48px",
          background: "linear-gradient(180deg, transparent 0%, var(--blue-border) 10%, var(--blue-border) 90%, transparent 100%)",
        }} />

        {STEPS.map((step, i) => (
          <div
            key={i}
            className="timeline-step animate-up group"
            style={{
              position: "relative",
              display: "flex",
              justifyContent: step.side === "right" ? "flex-end" : "flex-start",
              marginBottom: i < STEPS.length - 1 ? "100px" : 0,
              transitionDelay: `${i * 150}ms`,
            }}
          >
            {/* Step Node */}
            <div className="timeline-node" style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: "24px",
              width: "56px",
              height: "56px",
              borderRadius: "20px",
              background: "var(--blue-dim)",
              border: "1px solid var(--blue-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              cursor: "default",
              boxShadow: "0 0 25px var(--blue-glow)"
            }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "18px",
                fontWeight: 900,
                color: "var(--blue)",
              }}>
                {step.num}
              </span>
            </div>

            {/* Step Content Card */}
            <div
              className="scholar-card"
              style={{
                width: "44%",
                padding: "40px",
                borderRadius: "32px",
              }}
            >
              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontSize: "24px",
                fontWeight: 900,
                color: "var(--foreground)",
                marginBottom: "16px",
                letterSpacing: "-0.02em"
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: "16px",
                color: "var(--foreground-secondary)",
                lineHeight: 1.6,
                fontWeight: 500,
                opacity: 0.8
              }}>
                {step.body}
              </p>
              {step.extra}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .timeline-line {
            left: 22px !important;
            transform: none !important;
          }
          .timeline-node {
            left: 22px !important;
            transform: translateX(-50%) !important;
          }
          .timeline-step {
            justify-content: flex-end !important;
          }
          .timeline-card {
            width: calc(100% - 60px) !important;
            margin-left: 60px;
          }
        }
        @keyframes dotPulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
