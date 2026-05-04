"use client";

import React, { useState } from "react";

const TABS = ["Study Guide", "Summary", "Quiz", "Match Game"] as const;
type Tab = typeof TABS[number];

/* ─── Study Guide Panel ─── */
function StudyGuidePanel() {
  const concepts = [
    { n: "1", name: "Aggregate Demand (AD)", desc: "The total demand for goods and services at a given price level. AD = C + I + G + (X − M)." },
    { n: "2", name: "The Multiplier Effect", desc: "A change in expenditure produces a magnified change in national income through successive rounds of spending." },
    { n: "3", name: "Demand-Pull Inflation", desc: "When aggregate demand persistently exceeds productive capacity, causing the general price level to rise." },
  ];
  const bars = [92, 78, 100, 55, 83, 67, 44, 90, 71, 60];

  return (
    <div className="demo-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
      {/* Left — Raw Input */}
      <div>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(245,240,232,0.3)", textTransform: "uppercase" as const, marginBottom: "10px" }}>
          YOUR UPLOADED NOTES
        </p>
        <div style={{ background: "rgba(18,18,31,0.9)", border: "1px solid rgba(245,240,232,0.08)", borderRadius: "1rem", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#F59E0B"><rect width="12" height="12" rx="2" /></svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(245,240,232,0.5)" }}>ECO 201 — Lecture Notes.pdf</span>
          </div>
          {bars.map((w, i) => (
            <div key={i} style={{ height: "9px", background: "rgba(245,240,232,0.08)", borderRadius: "4px", marginBottom: "7px", width: `${w}%` }} />
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#1aab76" strokeWidth="1.5" /><path d="M4 7l2 2 4-4" stroke="#1aab76" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "11px", color: "#1aab76" }}>Processed successfully</span>
          </div>
        </div>
      </div>

      {/* Right — Generated Output */}
      <div>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(245,158,11,0.7)", textTransform: "uppercase" as const, marginBottom: "10px" }}>
          GENERATED STUDY GUIDE
        </p>
        <div style={{ background: "rgba(18,18,31,0.9)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: "1rem", padding: "20px" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: 700, color: "#F5F0E8", marginBottom: "2px" }}>Macroeconomics — ECO 201</div>
          <div style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "12px", color: "rgba(245,240,232,0.45)", marginBottom: "14px" }}>Chapter 3: Aggregate Demand & Supply</div>
          <div style={{ height: "0.5px", background: "rgba(245,240,232,0.08)", marginBottom: "14px" }} />
          {concepts.map(c => (
            <div key={c.n} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "11px", fontWeight: 700, color: "#F59E0B" }}>{c.n}</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: 600, color: "#F5F0E8", marginBottom: "2px" }}>{c.name}</div>
                <div style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "12px", color: "rgba(245,240,232,0.5)", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "11px", color: "rgba(245,158,11,0.5)", fontStyle: "italic", marginTop: "4px" }}>+ 7 more key concepts</div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .demo-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Summary Panel ─── */
function SummaryPanel() {
  const paras = [
    "Aggregate demand (AD) represents the total spending in an economy: household consumption (C), business investment (I), government spending (G), and net exports (X minus M). When AD increases, firms respond by raising output — but only up to the economy's full employment level.",
    "The multiplier effect means a small injection of spending has an outsized impact on national income. If the Marginal Propensity to Consume (MPC) is 0.8, the multiplier is 5 — meaning every ₦1 of new investment creates ₦5 of income. This is why government spending is a powerful macroeconomic lever.",
    "Demand-pull inflation occurs when aggregate demand grows faster than productive capacity. Cost-push inflation occurs when supply-side costs rise — typically through oil prices or wage increases. Knowing which type is driving inflation determines the correct policy response.",
  ];

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(245,158,11,0.7)", textTransform: "uppercase" as const, marginBottom: "10px" }}>CONCISE SUMMARY</p>
      <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "16px", fontWeight: 700, color: "#F5F0E8", marginBottom: "20px" }}>
        TL;DR — What you actually need to know for this exam
      </h3>
      {paras.map((p, i) => (
        <div key={i} style={{ marginBottom: i < paras.length - 1 ? "24px" : 0 }}>
          <div style={{ width: "28px", height: "1.5px", background: "#F59E0B", marginBottom: "10px" }} />
          <p style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "15px", color: "rgba(245,240,232,0.65)", lineHeight: 1.8 }}>{p}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Quiz Panel ─── */
function QuizPanel() {
  const options = [
    { letter: "A", text: "A change in the money supply that directly increases consumer prices", state: "default" },
    { letter: "B", text: "A change in spending that produces a magnified change in national income through re-spending cycles", state: "correct" },
    { letter: "C", text: "The effect of interest rates on household savings behavior", state: "default" },
    { letter: "D", text: "Government intervention to reduce fiscal deficits through spending cuts", state: "default" },
  ];

  return (
    <div>
      <p className="section-label" style={{ textAlign: "center", marginBottom: "4px" }}>TEST YOURSELF</p>
      <p style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "14px", color: "rgba(245,240,232,0.45)", textAlign: "center", marginBottom: "8px" }}>Question 2 of 12 — Macroeconomics</p>
      {/* Progress */}
      <div style={{ width: "100%", height: "4px", background: "rgba(245,240,232,0.08)", borderRadius: "2px", marginBottom: "24px" }}>
        <div style={{ width: "16.7%", height: "100%", background: "#F59E0B", borderRadius: "2px" }} />
      </div>
      {/* Question Card */}
      <div style={{ background: "rgba(18,18,31,0.9)", border: "1px solid rgba(245,240,232,0.09)", borderRadius: "1.25rem", padding: "24px 28px" }}>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: 600, color: "#F5F0E8", marginBottom: "20px", lineHeight: 1.4 }}>
          Which of the following correctly describes the Multiplier Effect in macroeconomics?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {options.map(opt => {
            const isCorrect = opt.state === "correct";
            return (
              <div key={opt.letter} style={{
                background: isCorrect ? "rgba(26,171,118,0.1)" : "rgba(245,240,232,0.04)",
                border: `1px solid ${isCorrect ? "rgba(26,171,118,0.35)" : "rgba(245,240,232,0.1)"}`,
                borderRadius: "0.875rem",
                padding: "13px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
              }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: isCorrect ? "rgba(26,171,118,0.2)" : "rgba(245,240,232,0.07)",
                  border: `1px solid ${isCorrect ? "rgba(26,171,118,0.3)" : "rgba(245,240,232,0.12)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", fontWeight: 700, color: isCorrect ? "#34d39a" : "rgba(245,240,232,0.5)" }}>{opt.letter}</span>
                </div>
                <span style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "14px", color: isCorrect ? "#34d39a" : "rgba(245,240,232,0.7)", flex: 1 }}>{opt.text}</span>
                {isCorrect && (
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "10px", fontWeight: 700, color: "#1aab76", background: "rgba(26,171,118,0.12)", borderRadius: "4px", padding: "2px 7px", marginLeft: "auto", whiteSpace: "nowrap" }}>✓ Correct</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Feedback */}
        <div style={{ background: "rgba(26,171,118,0.06)", border: "1px solid rgba(26,171,118,0.15)", borderRadius: "0.875rem", padding: "12px 16px", marginTop: "16px" }}>
          <p style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "13px", color: "rgba(26,171,118,0.85)", lineHeight: 1.6 }}>
            The multiplier (k) = 1 ÷ (1 − MPC). With an MPC of 0.8, k = 5. An injection of ₦1,000 generates ₦5,000 of national income through successive rounds of consumption.
          </p>
        </div>
      </div>
      {/* Nav buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
        <button className="btn-ghost" style={{ opacity: 0.35, cursor: "not-allowed" }}>← Previous</button>
        <button className="btn-indigo">Next Question →</button>
      </div>
    </div>
  );
}

/* ─── Match Game Panel ─── */
function MatchGamePanel() {
  const cards = [
    { text: "Aggregate Demand", state: "matched" },
    { text: "Multiplier Effect", state: "default" },
    { text: "AD = C+I+G+NX", state: "matched" },
    { text: "Demand-Pull Inflation", state: "selected" },
    { text: "k = 1 ÷ (1−MPC)", state: "default" },
    { text: "Fiscal Policy", state: "default" },
    { text: "↑AD exceeds AS capacity", state: "default" },
    { text: "Govt spending / tax tool", state: "default" },
  ];

  return (
    <div>
      <p className="section-label" style={{ textAlign: "center", marginBottom: "4px" }}>MATCH GAME</p>
      <p style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "14px", color: "rgba(245,240,232,0.45)", textAlign: "center", marginBottom: "8px" }}>Match each term to its definition. 3 of 8 matched.</p>
      <div style={{ width: "100%", height: "4px", background: "rgba(245,240,232,0.08)", borderRadius: "2px", marginBottom: "20px" }}>
        <div style={{ width: "37.5%", height: "100%", background: "#F59E0B", borderRadius: "2px" }} />
      </div>
      <div className="match-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {cards.map((c, i) => {
          const isMatched = c.state === "matched";
          const isSelected = c.state === "selected";
          return (
            <div key={i} style={{
              height: "88px", borderRadius: "1rem", padding: "12px",
              display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              cursor: isMatched ? "default" : "pointer",
              transition: "all 200ms",
              background: isMatched ? "rgba(26,171,118,0.1)" : isSelected ? "rgba(245,158,11,0.1)" : "rgba(18,18,31,0.9)",
              border: isMatched ? "1px solid rgba(26,171,118,0.3)" : isSelected ? "1.5px solid #F59E0B" : "1px solid rgba(245,240,232,0.09)",
              color: isMatched ? "#34d39a" : isSelected ? "#F5F0E8" : "rgba(245,240,232,0.65)",
              fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif",
              fontSize: "12px", lineHeight: 1.4,
            }}>
              {c.text}
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", color: "rgba(245,158,11,0.5)", textAlign: "center", fontStyle: "italic", marginTop: "16px" }}>
        Tap &apos;Demand-Pull Inflation&apos; and match it to its definition.
      </p>
      <style jsx>{`
        @media (max-width: 768px) {
          .match-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("Study Guide");

  return (
    <section style={{
      background: "#12121F",
      borderTop: "0.5px solid rgba(245,240,232,0.06)",
      borderBottom: "0.5px solid rgba(245,240,232,0.06)",
      padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <span className="section-label" style={{ textAlign: "center" }}>SEE IT IN ACTION</span>
          <h2 style={{ fontFamily: "'Galaxie Copernicus','Source Serif 4',Georgia,serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 500, color: "#F5F0E8", marginTop: 0 }}>
            Your notes. Transformed.
          </h2>
          <p style={{ fontFamily: "'Tiempos Text','Source Serif 4',Georgia,serif", fontSize: "15px", color: "rgba(245,240,232,0.5)", marginTop: "8px" }}>
            Demo built from a real ECO 201 lecture on Macroeconomics. Your results will come from your own notes.
          </p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "36px" }}>
          <div style={{
            display: "inline-flex",
            background: "rgba(8,8,14,0.7)",
            border: "1px solid rgba(245,240,232,0.09)",
            borderRadius: "9999px",
            padding: "4px",
            gap: "2px",
          }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: "13px",
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? "#08080E" : "rgba(245,240,232,0.45)",
                  padding: "9px 22px",
                  borderRadius: "9999px",
                  background: activeTab === tab ? "#F59E0B" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 200ms, color 200ms",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Panel */}
        <div style={{
          background: "#08080E",
          border: "1px solid rgba(245,240,232,0.09)",
          borderRadius: "1.5rem",
          padding: "32px",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,240,232,0.03) inset",
          minHeight: "340px",
          marginTop: "24px",
        }}>
          <div key={activeTab} style={{ animation: "fadeIn 250ms ease" }}>
            {activeTab === "Study Guide" && <StudyGuidePanel />}
            {activeTab === "Summary" && <SummaryPanel />}
            {activeTab === "Quiz" && <QuizPanel />}
            {activeTab === "Match Game" && <MatchGamePanel />}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
