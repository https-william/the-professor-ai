"use client";

import React from "react";

const TESTIMONIALS = [
  {
    barOpacity: 1,
    quote: "I uploaded my BIO 202 notes at 11 PM the night before my practical. Within 20 minutes I had a full study guide, a quiz I could actually fail, and a match game that made me laugh while I learned. Passed the practical. Came back the next day for CHM 201.",
    name: "Adaeze O.",
    detail: "300L · Biochemistry · UNN",
    initials: "AO",
  },
  {
    barOpacity: 0.5,
    quote: "The quiz exposed everything I thought I knew but actually didn't. That moment of failing your own notes before the real exam — that's the feature. Everything else is a bonus.",
    name: "Tomiwa A.",
    detail: "200L · Economics · Covenant University",
    initials: "TA",
  },
  {
    barOpacity: 0.3,
    quote: "I'm in 400L Medicine. Every hour counts. The Professor turns 3 hours of anatomy reading into a 40-minute session. I don't understand why I waited until third year to find this.",
    name: "Chukwuemeka E.",
    detail: "400L · Medicine · UNILAG",
    initials: "CE",
  },
];

export default function TestimonialsSection() {
  return (
    <section style={{
      background: "var(--bg)",
      padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
      maxWidth: "1100px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span className="section-label" style={{ textAlign: "center", color: "var(--blue)" }}>STUDENT STORIES</span>
        <h2 style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 900,
          color: "var(--text)",
          marginTop: "12px",
          letterSpacing: "-0.03em"
        }}>
          From upload to exam-ready.
        </h2>
      </div>

      {/* Cards */}
      <div className="testimonials-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
      }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="card-redesign animate-up" style={{ 
            transitionDelay: `${i * 100}ms`,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "24px",
            padding: "32px"
          }}>
            {/* Accent bar */}
            <div style={{
              width: "32px",
              height: "3px",
              background: "var(--blue)",
              opacity: t.barOpacity,
              borderRadius: "2px",
              marginBottom: "20px",
            }} />

            {/* Stars */}
            <div style={{ display: "flex", gap: "2px", marginBottom: "14px" }}>
              {[...Array(5)].map((_, j) => (
                <span key={j} style={{ color: "var(--blue)", fontSize: "14px" }}>★</span>
              ))}
            </div>

            {/* Quote */}
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--text)",
              lineHeight: 1.6,
              fontStyle: "italic",
            }}>
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "var(--blue-dim)",
                border: "1px solid var(--blue-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "var(--blue)",
                }}>
                  {t.initials}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-3)", fontWeight: 500 }}>{t.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
