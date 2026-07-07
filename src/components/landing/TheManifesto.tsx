"use client";

import React from "react";
import { Brain, Zap, Target } from "lucide-react";

const AXIOMS = [
  {
    num: "01",
    title: "Actually learn it",
    body: "Reading notes for hours is exhausting and, let's be honest, kind of boring. We help you actually get it, so you can stop re-reading the same page 42 times.",
    color: "text-blue-400",
  },
  {
    num: "02",
    title: "Save your late nights",
    body: "Get what you need to pass in seconds. More sleep, less stress, and more time to focus on what actually matters. Simple as that.",
    color: "text-indigo-400",
  },
  {
    num: "03",
    title: "Made for your class",
    body: "We don't just give you random info from the web. We use your own notes, so you're studying exactly what your lecturer wants.",
    color: "text-purple-400",
  }
];

export default function TheManifesto() {
  return (
    <section className="w-full py-24 px-4 md:px-8 lg:px-12 bg-transparent max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        
        {/* Left Side: Title & Narrative (Col-Span 5) */}
        <div className="lg:col-span-5 flex flex-col items-start gap-6 sticky top-32">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>The Manifesto</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--foreground)] leading-[1.02] tracking-tight">
            Studying shouldn&apos;t <br />
            be <span className="text-[var(--blue)] drop-shadow-[0_0_20px_rgba(74,124,245,0.25)]">this hard.</span>
          </h2>
          <p className="font-sans text-base md:text-lg leading-relaxed text-[var(--foreground-secondary)] opacity-90 font-medium max-w-md">
            Let&apos;s be real: uni is a lot of work. We built The Professor to cut through the noise and give you <span className="text-[var(--foreground)] font-bold">just the good parts</span> of your notes, so you can spend less time studying and more time living.
          </p>
        </div>

        {/* Right Side: Editorial Axiom List (Col-Span 7) */}
        <div className="lg:col-span-7 flex flex-col divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {AXIOMS.map((axiom, i) => (
            <div
              key={i}
              className="py-8 md:py-10 flex flex-col sm:flex-row items-start gap-6 sm:gap-10 group hover:pl-4 transition-all duration-300"
            >
              <div className={`font-mono text-xl md:text-2xl font-black ${axiom.color} opacity-80 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5`}>
                AXIOM / {axiom.num}
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-xl md:text-2xl font-black text-[var(--foreground)] mb-3 tracking-tight group-hover:text-[var(--blue)] transition-colors">
                  {axiom.title}
                </h3>
                <p className="font-sans text-sm md:text-base text-[var(--foreground-secondary)] leading-relaxed font-medium">
                  {axiom.body}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
