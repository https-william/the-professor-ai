"use client";

import React from "react";
import { Brain, Zap, Target } from "lucide-react";

const PILLARS = [
  {
    icon: <Brain className="text-blue-500" size={20} />,
    title: "Actually learn it",
    body: "Reading notes for hours is exhausting and, let's be honest, kind of boring. We help you actually get it, so you can stop re-reading the same page 42 times."
  },
  {
    icon: <Zap className="text-blue-500" size={20} />,
    title: "Save your late nights",
    body: "Get what you need to pass in seconds. More sleep, less stress, and more time to focus on what actually matters. Simple as that."
  },
  {
    icon: <Target className="text-blue-500" size={20} />,
    title: "Made for your class",
    body: "We don't just give you random info from the web. We use your own notes, so you're studying exactly what your lecturer wants."
  }
];

export default function TheManifesto() {
  return (
    <section className="w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        
        {/* Left Side: Title */}
        <div className="flex flex-col items-start gap-4">
          <span className="font-sans text-[10px] font-extrabold tracking-[0.4em] text-blue-500 uppercase">
            Why We're Here
          </span>
          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-black text-[var(--foreground)] leading-[1.05] tracking-tight">
            Studying shouldn't <br />
            be <span className="text-blue-500 text-shadow-[0_0_30px_rgba(59,130,246,0.15)]">this hard.</span>
          </h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-[var(--foreground-secondary)] opacity-85 font-medium max-w-lg mt-2">
            Let's be real — uni is a lot of work. We built The Professor to cut through the noise and give you <span className="text-blue-500 font-extrabold">just the good parts</span> of your notes, so you can spend less time studying and more time living.
          </p>
        </div>

        {/* Right Side: Cards */}
        <div className="flex flex-col gap-4">
          {PILLARS.map((pillar, i) => (
            <div 
              key={i} 
              className="p-6 md:p-8 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] hover:border-blue-500/25 hover-lift-sm transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                  {pillar.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-sm md:text-base font-black text-[var(--foreground)] mb-1.5">{pillar.title}</h3>
                  <p className="font-sans text-xs md:text-sm text-[var(--foreground-muted)] leading-relaxed font-medium">{pillar.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
