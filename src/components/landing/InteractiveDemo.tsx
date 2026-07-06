"use client";

import React, { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

const TABS = ["Study Guide", "Summary", "Quiz", "Match Game"] as const;
type Tab = typeof TABS[number];

/* ─── Study Guide Panel ─── */
function StudyGuidePanel() {
  const concepts = [
    { n: "1", name: "Aggregate Demand (AD)", desc: "The total demand for goods and services at a given price level. AD = C + I + G + (X − M)." },
    { n: "2", name: "The Multiplier Effect", desc: "A change in expenditure produces a magnified change in national income through successive rounds of spending." },
    { n: "3", name: "Demand-Pull Inflation", desc: "When aggregate demand persistently exceeds productive capacity, causing the general price level to rise." },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 animate-fade-in">
      {/* Left — Raw Input (Stylized PDF Document) */}
      <div className="flex flex-col gap-3">
        <p className="font-sans text-[10px] font-extrabold tracking-wider text-[var(--foreground-muted)] uppercase">
          Source Material
        </p>
        <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[20px] p-6 relative overflow-hidden h-full flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-3.5 h-3.5 rounded bg-blue-500 shadow-[0_0_8px_rgba(74,124,245,0.3)]" />
            <span className="font-sans text-xs font-bold text-[var(--foreground)] truncate">ECO 201: Lecture Notes.pdf</span>
          </div>
          
          {/* Stylized scanned notes text paragraphs */}
          <div className="space-y-4 font-mono text-[11px] leading-relaxed text-[var(--foreground-secondary)] opacity-80 flex-1">
            <div className="border-l border-[var(--border-3)] pl-3">
              <span className="text-[var(--foreground)] font-bold">Aggregate Demand (AD)</span> is the sum of spending in the economy, calculated by adding consumer spending (C), business investments (I), government expenditure (G), and net exports (X - M).
            </div>
            <div className="border-l border-[var(--border-3)] pl-3">
              <span className="text-[var(--foreground)] font-bold">The Multiplier Effect</span> is the phenomenon where a change in autonomous spending results in a larger change in equilibrium GDP.
            </div>
            <div className="border-l border-[var(--border-3)] pl-3">
              <span className="text-[var(--foreground)] font-bold">Demand-Pull Inflation</span> occurs when aggregate demand rises too fast relative to aggregate supply, bidding up prices.
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[var(--border)]/50">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={12} />
            </div>
            <span className="font-sans text-xs font-bold text-emerald-400">Scan Complete & Key Concepts Extracted</span>
          </div>
        </div>
      </div>

      {/* Right — Generated Output */}
      <div className="flex flex-col gap-3">
        <p className="font-sans text-[10px] font-extrabold tracking-wider text-blue-400 uppercase">
          The Professor's Archive
        </p>
        <div className="bg-[var(--bg-2)] border border-blue-500/15 rounded-[20px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between h-full relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-blue-500">
            <Sparkles size={120} />
          </div>
          
          <div>
            <div className="font-heading text-base font-black text-[var(--foreground)]">Macroeconomics: ECO 201</div>
            <div className="font-sans text-xs text-[var(--foreground-muted)] mb-4 font-bold">Chapter 3: Aggregate Demand & Supply</div>
            <div className="h-[1px] bg-[var(--border)] mb-4" />
            
            <div className="space-y-4">
              {concepts.map(c => (
                <div key={c.n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 text-blue-400 font-sans text-xs font-black">
                    {c.n}
                  </div>
                  <div>
                    <div className="font-sans text-xs font-black text-[var(--foreground)] mb-0.5">{c.name}</div>
                    <div className="font-sans text-[11px] text-[var(--foreground-secondary)] leading-relaxed font-medium">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="font-sans text-xs text-blue-400 font-extrabold mt-6 pt-4 border-t border-[var(--border)]/50">
            + 7 more key concepts detected
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Summary Panel ─── */
function SummaryPanel() {
  const paras = [
    "Aggregate demand (AD) represents the total spending in an economy: household consumption (C), business investment (I), government spending (G), and net exports (X minus M). When AD increases, firms respond by raising output, but only up to the economy's full employment level.",
    "The multiplier effect means a small injection of spending has an outsized impact on national income. If the Marginal Propensity to Consume (MPC) is 0.8, the multiplier is 5, meaning every ₦1 of new investment creates ₦5 of income. This is why government spending is a powerful macroeconomic lever.",
    "Demand-pull inflation occurs when aggregate demand grows faster than productive capacity. Cost-push inflation occurs when supply-side costs rise, typically through oil prices or wage increases. Knowing which type is driving inflation determines the correct policy response.",
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <p className="font-sans text-[10px] font-extrabold tracking-wider text-violet-400 uppercase mb-2">The Quick Version</p>
        <h3 className="font-heading text-lg font-black text-[var(--foreground)]">Just the essentials</h3>
      </div>
      <div className="space-y-4">
        {paras.map((p, i) => (
          <div key={i} className="p-5 bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl flex flex-col gap-3">
            <div className="w-8 h-0.5 bg-violet-500 rounded-full" />
            <p className="font-sans text-xs md:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">{p}</p>
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
    <div className="max-w-xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <p className="font-sans text-[10px] font-extrabold tracking-wider text-blue-400 uppercase mb-1">Test Yourself</p>
        <p className="font-sans text-xs text-[var(--foreground-muted)] font-bold">Question 2: Macroeconomics</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-[var(--bg-3)] rounded-full overflow-hidden">
        <div className="w-[16.7%] h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(74,124,245,0.5)]" />
      </div>

      {/* Question Card */}
      <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[24px] p-6 md:p-8">
        <p className="font-heading text-base md:text-lg font-black text-[var(--foreground)] mb-6 leading-snug">
          What describes the Multiplier Effect?
        </p>
        <div className="flex flex-col gap-3">
          {options.map(opt => {
            const isCorrect = opt.state === "correct";
            return (
              <div 
                key={opt.letter} 
                className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                  isCorrect 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-[var(--bg-3)] border-[var(--border)] text-[var(--foreground-secondary)]"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black ${
                  isCorrect 
                    ? "bg-emerald-500 text-black" 
                    : "bg-[var(--border)] text-[var(--foreground-muted)]"
                }`}>
                  {opt.letter}
                </div>
                <span className="font-sans text-xs font-bold leading-normal">{opt.text}</span>
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
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <p className="font-sans text-[10px] font-extrabold tracking-wider text-violet-400 uppercase mb-1">Study Game</p>
        <p className="font-sans text-xs text-[var(--foreground-muted)] font-bold">Connect the ideas. 3 of 8 matched.</p>
      </div>

      <div className="w-full h-1 bg-[var(--bg-3)] rounded-full overflow-hidden">
        <div className="w-[37.5%] h-full bg-violet-500 rounded-full shadow-[0_0_8px_rgba(150,115,245,0.5)]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c, i) => {
          const isMatched = c.state === "matched";
          const isSelected = c.state === "selected";
          return (
            <div 
              key={i} 
              className={`h-16 rounded-xl border flex items-center justify-center p-3 text-center cursor-pointer font-sans text-[11px] font-black leading-snug transition-all select-none ${
                isMatched 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default" 
                  : isSelected 
                    ? "bg-violet-500/10 border-violet-500 text-[var(--foreground)] shadow-[0_0_15px_rgba(150,115,245,0.2)]" 
                    : "bg-[var(--bg-2)] border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--bg-3)] hover:-translate-y-0.5 active:translate-y-0 duration-200"
              }`}
            >
              {c.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("Study Guide");

  return (
    <section className="relative w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* Section Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <h2 className="font-heading text-3xl md:text-5xl font-black text-[var(--foreground)] leading-none tracking-tight">
            Turn your notes into <br className="hidden sm:inline" />
            <span className="text-blue-500 text-shadow-[0_0_30px_rgba(74,124,245,0.15)]">something useful.</span>
          </h2>
          <p className="font-sans text-xs md:text-sm font-medium text-[var(--foreground-secondary)] opacity-80 max-w-md mt-2">
            This is what happens when you drop an ECO 201 lecture here. No fluff, just what you need to pass.
          </p>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex justify-center overflow-x-auto pb-2 scrollbar-none">
          <div className="p-1.5 flex gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-2)] shadow-sm">
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-full font-sans text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--border)] text-blue-500 border border-[var(--blue-border)]"
                      : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display Container */}
        <div className="relative overflow-hidden border border-[var(--border)] rounded-[32px] bg-gradient-to-br from-[var(--bg-2)] to-[var(--bg)] p-6 md:p-10 lg:p-12 min-h-[420px] flex flex-col justify-center">
          <div key={activeTab} className="relative z-10 w-full">
            {activeTab === "Study Guide" && <StudyGuidePanel />}
            {activeTab === "Summary" && <SummaryPanel />}
            {activeTab === "Quiz" && <QuizPanel />}
            {activeTab === "Match Game" && <MatchGamePanel />}
          </div>
        </div>

      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
