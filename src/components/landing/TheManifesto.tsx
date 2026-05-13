"use client";

import React from "react";
import { Sparkles, Brain, Zap, Target } from "lucide-react";

const PILLARS = [
  {
    icon: <Brain className="text-[var(--blue)]" size={20} />,
    title: "Actually learn it",
    body: "Reading notes for hours is exhausting and, let's be honest, kind of boring. We help you actually get it, so you can stop re-reading the same page 42 times."
  },
  {
    icon: <Zap className="text-[var(--blue)]" size={20} />,
    title: "Save your late nights",
    body: "Get what you need to pass in seconds. More sleep, less stress, and more time to ignore your group chat. Simple as that."
  },
  {
    icon: <Target className="text-[var(--blue)]" size={20} />,
    title: "Made for your class",
    body: "We don't just give you random info from the web. We use your own notes, so you're studying exactly what your lecturer wants."
  }
];

export default function TheManifesto() {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="animate-up">
          <span className="section-label text-[var(--blue)] mb-6 block">WHY WE'RE HERE</span>
          <h2 className="text-4xl md:text-6xl font-black text-[var(--foreground)] leading-none tracking-tight mb-8">
            Studying shouldn't <br />
            be <span className="text-[var(--blue)]">this hard.</span>
          </h2>
          <p className="text-xl text-[var(--foreground-secondary)] font-medium leading-relaxed opacity-80 max-w-xl">
            Let's be real — uni is a lot of work. We built The Professor to cut through the noise and give you <span className="text-[var(--blue)] font-bold">just the good parts</span> of your notes, so you can spend less time studying and more time living.
          </p>
        </div>

        <div className="grid gap-6">
          {PILLARS.map((pillar, i) => (
            <div key={i} className="scholar-card p-8 animate-up" style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center shrink-0">
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{pillar.title}</h3>
                  <p className="text-[var(--foreground-muted)] font-medium leading-snug">{pillar.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
