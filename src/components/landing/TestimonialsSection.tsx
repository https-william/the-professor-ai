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
      background: "#08080E",
      padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
      maxWidth: "1100px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span className="section-label" style={{ textAlign: "center" }}>STUDENT STORIES</span>
        <h2 style={{
          fontFamily: "'Galaxie Copernicus','Source Serif 4',Georgia,serif",
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 500,
          color: "#F5F0E8",
          marginTop: 0,
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
          <div key={i} className="card-redesign animate-up" style={{ transitionDelay: `${i * 100}ms` }}>
            {/* Accent bar */}
            <div style={{
              width: "32px",
              height: "3px",
              background: `rgba(245,158,11,${t.barOpacity})`,
              borderRadius: "2px",
              marginBottom: "20px",
            }} />

            {/* Stars */}
            <div style={{ display: "flex", gap: "2px", marginBottom: "14px" }}>
              {[...Array(5)].map((_, j) => (
                <span key={j} style={{ color: "#F59E0B", fontSize: "14px" }}>★</span>
              ))}
            </div>

            {/* Quote */}
            <p style={{
              fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "#F5F0E8",
              lineHeight: 1.75,
              fontStyle: "italic",
            }}>
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1c1c30, #12121F)",
                border: "1px solid rgba(245,240,232,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "rgba(245,240,232,0.5)",
                }}>
                  {t.initials}
                </span>
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", fontWeight: 700, color: "#F5F0E8" }}>{t.name}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", color: "rgba(245,240,232,0.4)" }}>{t.detail}</div>
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
