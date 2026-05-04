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
          <span key={f} className="format-pill">{f}</span>
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
            background: "#F59E0B",
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
          <span key={f} className="format-pill">{f}</span>
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
        fontFamily: "'Outfit', sans-serif",
        fontSize: "12px",
        color: "rgba(245,158,11,0.6)",
        marginTop: "14px",
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
        background: "#08080E",
        padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 64px" }}>
        <span className="section-label" style={{ textAlign: "center" }}>HOW IT WORKS</span>
        <h2 style={{
          fontFamily: "'Galaxie Copernicus', 'Source Serif 4', Georgia, serif",
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 500,
          color: "#F5F0E8",
          textAlign: "center",
          marginTop: 0,
        }}>
          From notes to exam-ready. In under <span style={{ color: "#F59E0B" }}>60 seconds.</span>
        </h2>
      </div>

      {/* Timeline */}
      <div className="timeline-container" style={{ position: "relative" }}>
        {/* Center Line */}
        <div className="timeline-line" style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1px",
          top: "48px",
          bottom: "48px",
          background: "linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.2) 10%, rgba(245,158,11,0.2) 90%, transparent 100%)",
        }} />

        {STEPS.map((step, i) => (
          <div
            key={i}
            className="timeline-step animate-up"
            style={{
              position: "relative",
              display: "flex",
              justifyContent: step.side === "right" ? "flex-end" : "flex-start",
              marginBottom: i < STEPS.length - 1 ? "80px" : 0,
              transitionDelay: `${i * 150}ms`,
            }}
          >
            {/* Step Node */}
            <div className="timeline-node" style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: "24px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#12121F",
              border: "2px solid rgba(245,158,11,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              transition: "all 250ms ease",
              cursor: "default",
            }}>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#F59E0B",
              }}>
                {step.num}
              </span>
            </div>

            {/* Step Content Card */}
            <div
              className="timeline-card"
              style={{
                width: "46%",
                background: "#12121F",
                border: "1px solid rgba(245,240,232,0.08)",
                borderRadius: "1.5rem",
                padding: "28px 24px",
              }}
            >
              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "19px",
                fontWeight: 700,
                color: "#F5F0E8",
                marginBottom: "8px",
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: "'Tiempos Text', 'Source Serif 4', Georgia, serif",
                fontSize: "14px",
                color: "rgba(245,240,232,0.58)",
                lineHeight: 1.75,
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
      `}</style>
    </section>
  );
}
