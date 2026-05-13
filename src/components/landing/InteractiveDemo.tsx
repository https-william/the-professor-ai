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
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.15em", color: "var(--text-3)", textTransform: "uppercase" as const, marginBottom: "12px" }}>
          SOURCE MATERIAL
        </p>
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "1.25rem", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ width: "12px", height: "12px", background: "var(--blue)", borderRadius: "3px" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, color: "var(--text-2)" }}>ECO 201 — Lecture Notes.pdf</span>
          </div>
          {bars.map((w, i) => (
            <div key={i} style={{ height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "4px", marginBottom: "8px", width: `${w}%` }} />
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "var(--emerald-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="var(--emerald)" strokeWidth="2"><path d="M2 5l2 2 4-4" /></svg>
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--emerald)", fontWeight: 700 }}>Synthesized</span>
          </div>
        </div>
      </div>

      {/* Right — Generated Output */}
      <div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.15em", color: "var(--blue-text)", textTransform: "uppercase" as const, marginBottom: "12px" }}>
          THE PROFESSOR'S ARCHIVE
        </p>
        <div style={{ background: "var(--bg-2)", border: "1px solid var(--blue-border)", borderRadius: "1.25rem", padding: "24px", boxShadow: "0 0 40px var(--blue-glow)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 900, color: "var(--text)", marginBottom: "4px" }}>Macroeconomics — ECO 201</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-3)", marginBottom: "16px", fontWeight: 600 }}>Chapter 3: Aggregate Demand & Supply</div>
          <div style={{ height: "1px", background: "var(--blue-border)", opacity: 0.3, marginBottom: "16px" }} />
          {concepts.map(c => (
            <div key={c.n} style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", border: "1px solid var(--blue-border)" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 900, color: "var(--blue)" }}>{c.n}</span>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 800, color: "var(--text)", marginBottom: "2px" }}>{c.name}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6, fontWeight: 500 }}>{c.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--blue-text)", fontStyle: "italic", marginTop: "8px", fontWeight: 700 }}>+ 7 more key concepts detected</div>
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
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.15em", color: "var(--blue-text)", textTransform: "uppercase" as const, marginBottom: "16px", textAlign: "center" }}>THE QUICK VERSION</p>
      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 900, color: "var(--text)", marginBottom: "24px", textAlign: "center" }}>
        Just the essentials
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {paras.map((p, i) => (
          <div key={i} style={{ padding: "16px", background: "var(--bg-2)", borderRadius: "1rem", border: "1px solid var(--border)" }}>
            <div style={{ width: "32px", height: "2px", background: "var(--blue)", marginBottom: "12px" }} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6, fontWeight: 500 }}>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Quiz Panel ─── */
function QuizPanel() {
  const options = [
    { letter: "A", text: "A change in the money supply that directly increases prices", state: "default" },
    { letter: "B", text: "A change in spending that produces a magnified change in income", state: "correct" },
    { letter: "C", text: "The effect of interest rates on household savings", state: "default" },
    { letter: "D", text: "Government intervention to reduce deficits through cuts", state: "default" },
  ];

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.15em", color: "var(--blue-text)", textTransform: "uppercase" as const, marginBottom: "8px", textAlign: "center" }}>TEST YOURSELF</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-3)", textAlign: "center", marginBottom: "20px", fontWeight: 600 }}>Question 2 — Macroeconomics</p>
      {/* Progress */}
      <div style={{ width: "100%", height: "4px", background: "var(--bg-2)", borderRadius: "2px", marginBottom: "24px" }}>
        <div style={{ width: "16.7%", height: "100%", background: "var(--blue)", borderRadius: "2px", boxShadow: "0 0 10px var(--blue-glow)" }} />
      </div>
      {/* Question Card */}
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "1.5rem", padding: "clamp(16px, 4vw, 32px)" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(16px, 3vw, 18px)", fontWeight: 800, color: "var(--text)", marginBottom: "20px", lineHeight: 1.4 }}>
          What describes the Multiplier Effect?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map(opt => {
            const isCorrect = opt.state === "correct";
            return (
              <div key={opt.letter} style={{
                background: isCorrect ? "var(--emerald-dim)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isCorrect ? "var(--emerald-border)" : "var(--border)"}`,
                borderRadius: "1rem",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: isCorrect ? "var(--emerald)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 900, color: isCorrect ? "#000" : "var(--text-3)" }}>{opt.letter}</span>
                </div>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: isCorrect ? "var(--emerald)" : "var(--text-2)", flex: 1, fontWeight: 600, lineHeight: 1.3 }}>{opt.text}</span>
              </div>
            );
          })}
        </div>
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
    { text: "Govt spending tool", state: "default" },
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.15em", color: "var(--blue-text)", textTransform: "uppercase" as const, marginBottom: "8px", textAlign: "center" }}>STUDY GAME</p>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-3)", textAlign: "center", marginBottom: "20px", fontWeight: 600 }}>Connect the ideas. 3 of 8 matched.</p>
      <div style={{ width: "100%", height: "4px", background: "var(--bg-2)", borderRadius: "2px", marginBottom: "24px" }}>
        <div style={{ width: "37.5%", height: "100%", background: "var(--blue)", borderRadius: "2px" }} />
      </div>
      <div className="match-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {cards.map((c, i) => {
          const isMatched = c.state === "matched";
          const isSelected = c.state === "selected";
          return (
            <div key={i} style={{
              height: "clamp(60px, 12vw, 80px)", borderRadius: "1rem", padding: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              cursor: isMatched ? "default" : "pointer",
              transition: "all 200ms",
              background: isMatched ? "var(--emerald-dim)" : isSelected ? "var(--blue-dim)" : "var(--bg-2)",
              border: isMatched ? "1px solid var(--emerald-border)" : isSelected ? "1.5px solid var(--blue)" : "1px solid var(--border)",
              color: isMatched ? "var(--emerald)" : isSelected ? "var(--text)" : "var(--text-3)",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "clamp(10px, 2.5vw, 12px)", lineHeight: 1.2,
              boxShadow: isSelected ? "0 0 20px var(--blue-glow)" : "none"
            }}>
              {c.text}
            </div>
          );
        })}
      </div>
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
      background: "transparent",
      padding: "clamp(60px, 10vw, 120px) clamp(16px, 5vw, 80px)",
      position: "relative"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="section-label mb-4" style={{ color: "var(--blue)", letterSpacing: "0.4em" }}>LIVE PREVIEW</span>
          <h2 style={{ 
            fontFamily: "var(--font-heading)", 
            fontSize: "clamp(2rem, 5vw, 3.5rem)", 
            fontWeight: 900, 
            color: "var(--foreground)", 
            lineHeight: 1.1,
            letterSpacing: "-0.03em" 
          }}>
            Turn your notes into <br />
            <span style={{ color: "var(--blue)", textShadow: "0 0 30px var(--blue-glow)" }}>something useful.</span>
          </h2>
          <p style={{ 
            fontFamily: "var(--font-sans)", 
            fontSize: "15px", 
            color: "var(--foreground-secondary)", 
            marginTop: "16px", 
            fontWeight: 500, 
            maxWidth: "600px", 
            margin: "16px auto 0",
            opacity: 0.7
          }}>
            This is what happens when you drop an ECO 201 lecture here. No fluff, just what you need to pass.
          </p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
          <div className="glass-panel p-1.5 flex gap-1" style={{ borderRadius: "9999px", minWidth: "max-content" }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "btn-skeuo text-[var(--blue)] px-4 sm:px-8 py-2.5" : "px-4 sm:px-8 py-2.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 900,
                  borderRadius: "9999px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase"
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Panel */}
        <div className="scholar-card relative overflow-hidden" style={{
          padding: "clamp(16px, 5vw, 64px)",
          borderRadius: "32px",
          background: "linear-gradient(165deg, var(--bg-2), var(--bg))",
          minHeight: "450px",
        }}>
          {/* Ambient Glow */}
          <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%", background: "var(--blue-dim)", filter: "blur(120px)", opacity: 0.1, pointerEvents: "none" }} />
          
          <div key={activeTab} className="relative z-10" style={{ animation: "fadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
            {activeTab === "Study Guide" && <StudyGuidePanel />}
            {activeTab === "Summary" && <SummaryPanel />}
            {activeTab === "Quiz" && <QuizPanel />}
            {activeTab === "Match Game" && <MatchGamePanel />}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
