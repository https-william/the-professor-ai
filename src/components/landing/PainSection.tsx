"use client";

import React from "react";
import { BookOpen, AlertCircle, Sparkles } from "lucide-react";

const CARDS = [
  {
    icon: <BookOpen className="text-blue-400" size={24} />,
    title: "You have notes. You don't have time.",
    body: "Your lecture notes from a full semester stack up to hundreds of pages. Reading all of it the night before an exam is not a strategy — it's a coin flip disguised as studying.",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/20",
  },
  {
    icon: <AlertCircle className="text-indigo-400" size={24} />,
    title: "Re-reading feels like studying. It isn't.",
    body: "Every time you re-read your notes, your brain says 'I know this.' It is lying to you. Recognition and recall are not the same — and only one of them works when the invigilator says 'you may begin.' The fluency illusion destroys well-prepared students.",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/20",
  },
  {
    icon: <Sparkles className="text-purple-400" size={24} />,
    title: "ChatGPT doesn't know your lecturer.",
    body: "Generic AI tools give generic answers. They don't know what Prof. Adeyemi emphasized in week 7, or what questions always appear on the BIO 202 paper at your institution. Your notes do. The Professor uses them — and only them.",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/20",
  },
];

export default function PainSection() {
  return (
    <section id="features" className="w-full py-20 px-4 md:px-8 lg:px-12 bg-transparent max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center flex flex-col items-center gap-3 max-w-2xl mx-auto mb-16">
        <span className="font-sans text-[10px] font-extrabold tracking-[0.4em] text-blue-500 uppercase">
          The Problem
        </span>
        <h2 className="font-heading text-3xl md:text-5xl font-black text-[var(--foreground)] leading-none tracking-tight">
          You&apos;re not struggling. <br />
          The tools are.
        </h2>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARDS.map((card, i) => (
          <div 
            key={i} 
            className={`p-8 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] ${card.hoverBorder} hover-lift-md transition-all duration-300 flex flex-col gap-5`}
          >
            {/* Icon Wrapper */}
            <div className={`w-12 h-12 rounded-2xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0`}>
              {card.icon}
            </div>

            {/* Title */}
            <h3 className="font-heading text-lg font-black text-[var(--foreground)] tracking-tight">
              {card.title}
            </h3>

            {/* Body */}
            <p className="font-sans text-xs md:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
