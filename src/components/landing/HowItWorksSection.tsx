"use client";

import React from "react";

const STEPS = [
  {
    num: "01",
    title: "Upload anything.",
    body: "Drag in your PDF, photograph your handwritten notes, paste a WhatsApp-forwarded document. We handle the mess — that's the point.",
    side: "right" as const,
    extra: (
      <div className="flex flex-wrap gap-1.5 mt-4">
        {["PDF", "DOCX", "PPTX", "JPG / PNG", "WhatsApp forwards"].map(f => (
          <span 
            key={f} 
            className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider"
          >
            {f}
          </span>
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
      <div className="flex gap-1.5 mt-4">
        {[0, 160, 320].map(delay => (
          <div 
            key={delay} 
            className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" 
            style={{ animationDelay: `${delay}ms` }}
          />
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
      <div className="flex flex-wrap gap-1.5 mt-4">
        {["Study Guide", "Summary", "Quiz", "Match Game"].map(f => (
          <span 
            key={f} 
            className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider"
          >
            {f}
          </span>
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
      <div className="text-xs font-bold text-amber-500 mt-4 flex items-center gap-1.5">
        🔥 Keep your streak — The Professor will remind you
      </div>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent max-w-6xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center flex flex-col items-center gap-3 max-w-2xl mx-auto mb-20">
        <span className="font-sans text-[10px] font-extrabold tracking-[0.4em] text-amber-500 uppercase">
          How It Works
        </span>
        <h2 className="font-heading text-3xl md:text-5xl font-black text-[var(--foreground)] leading-none tracking-tight">
          From notes to exam-ready <br className="hidden sm:inline" />
          in under <span className="text-amber-500 text-shadow-[0_0_30px_rgba(229,169,60,0.15)]">60 seconds.</span>
        </h2>
      </div>

      {/* Timeline Grid Container */}
      <div className="relative">
        {/* Center Vertical Timeline Line */}
        <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 w-[1.5px] top-6 bottom-6 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent pointer-events-none" />

        {/* Steps List */}
        <div className="flex flex-col gap-12 md:gap-24">
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 0;
            const nodeStyle = isEven 
              ? "bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-amber-500/5"
              : "bg-violet-500/10 border border-violet-500/25 text-violet-400 shadow-violet-500/5";
            const hoverBorder = isEven 
              ? "hover:border-amber-500/20" 
              : "hover:border-violet-500/20";
            return (
              <div
                key={i}
                className={`relative flex items-start justify-end md:justify-start ${
                  step.side === "right" ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Timeline Node Circle */}
                <div className={`absolute left-0 md:left-1/2 md:-translate-x-1/2 top-4 w-14 h-14 rounded-2xl flex items-center justify-center font-mono text-base font-black select-none z-10 ${nodeStyle}`}>
                  {step.num}
                </div>

                {/* Step Card Content */}
                <div className={`w-[calc(100%-72px)] md:w-[44%] p-6 md:p-8 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] hover-lift-sm transition-all duration-300 ${hoverBorder}`}>
                  <h3 className="font-heading text-lg md:text-xl font-black text-[var(--foreground)] tracking-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="font-sans text-xs md:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">
                    {step.body}
                  </p>
                  {step.extra}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
