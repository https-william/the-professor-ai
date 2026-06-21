"use client";

import React from "react";

const TESTIMONIALS = [
  {
    quote: "I uploaded my BIO 202 notes at 11 PM the night before my practical. Within 20 minutes I had a full study guide, a quiz I could actually fail, and a match game that made me laugh while I learned. Passed the practical. Came back the next day for CHM 201.",
    name: "Adaeze O.",
    detail: "300L · Biochemistry · UNN",
    initials: "AO",
  },
  {
    quote: "The quiz exposed everything I thought I knew but actually didn't. That moment of failing your own notes before the real exam — that's the feature. Everything else is a bonus.",
    name: "Tomiwa A.",
    detail: "200L · Economics · Covenant University",
    initials: "TA",
  },
  {
    quote: "I'm in 400L Medicine. Every hour counts. The Professor turns 3 hours of anatomy reading into a 40-minute session. I don't understand why I waited until third year to find this.",
    name: "Chukwuemeka E.",
    detail: "400L · Medicine · UNILAG",
    initials: "CE",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent max-w-6xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center flex flex-col items-center gap-3 max-w-2xl mx-auto mb-16">
        <h2 className="font-heading text-3xl md:text-5xl font-black text-[var(--foreground)] leading-none tracking-tight">
          From upload to exam-ready.
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <div 
            key={i} 
            className="p-8 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] hover:border-blue-500/20 hover-lift-sm transition-all duration-300 flex flex-col justify-between gap-6"
          >
            {/* Top Card Group: Stars + Quote */}
            <div className="flex flex-col gap-4">
              {/* Soft visual indicator line instead of random glows */}
              <div className="w-8 h-[2px] bg-blue-500 rounded-full" />
              
              {/* Star icons */}
              <div className="flex items-center gap-0.5 text-blue-500 text-xs">
                {[...Array(5)].map((_, j) => (
                  <span key={j}>★</span>
                ))}
              </div>

              {/* Quote text */}
              <p className="font-sans text-xs md:text-sm leading-relaxed text-[var(--foreground)] font-medium italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            {/* Bottom Group: Author info */}
            <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]/50">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 font-sans text-xs font-black text-blue-400">
                {t.initials}
              </div>
              <div className="min-w-0">
                <div className="font-sans text-xs font-black text-[var(--foreground)] truncate">{t.name}</div>
                <div className="font-sans text-[10px] text-[var(--foreground-muted)] font-bold truncate">{t.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
