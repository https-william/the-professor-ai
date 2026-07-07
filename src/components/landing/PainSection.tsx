"use client";

import React from "react";
import { BookOpen, AlertCircle, Sparkles, ArrowUpRight } from "lucide-react";
import TiltCard from "@/components/ui/TiltCard";

export default function PainSection() {
  return (
    <section id="features" className="w-full py-24 px-4 md:px-8 lg:px-12 bg-transparent max-w-7xl mx-auto">
      
      {/* Section Header — Left Aligned Editorial Stance */}
      <div className="flex flex-col items-start gap-3 max-w-3xl mb-16">
        <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>The Illusion of Studying</span>
        </div>
        <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-[var(--foreground)] leading-[1.02] tracking-tight">
          You&apos;re not struggling. <br />
          <span className="text-[var(--foreground-muted)] font-normal">The tools are.</span>
        </h2>
      </div>

      {/* Asymmetrical Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Wide Narrative Block (Spans 2 Columns) */}
        <TiltCard
          maxTilt={4}
          scale={1.01}
          borderRadius="32px"
          glowColor="rgba(74, 124, 245, 0.15)"
          glowOpacity={0.3}
          className="md:col-span-2 p-8 md:p-10 bg-[var(--bg-2)] border border-[var(--border)] hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between gap-8 group relative overflow-hidden"
        >
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
          
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <span className="font-mono text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
              01 / Time Deficit
            </span>
          </div>

          <div>
            <h3 className="font-heading text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight mb-4">
              You have notes. You don&apos;t have time.
            </h3>
            <p className="font-sans text-sm md:text-base text-[var(--foreground-secondary)] leading-relaxed font-medium max-w-xl">
              Your lecture notes from a full semester stack up to hundreds of pages. Reading all of it the night before an exam is not a strategy.
            </p>
            
            <div className="mt-6 p-4 rounded-2xl bg-[var(--bg-3)]/80 border-l-2 border-blue-500 font-serif italic text-sm md:text-base text-[var(--foreground)] opacity-90">
              &ldquo;It&apos;s a coin flip disguised as studying.&rdquo;
            </div>
          </div>
        </TiltCard>

        {/* Card 2: Vertical Focus Block (Spans 1 Column) */}
        <TiltCard
          maxTilt={5}
          scale={1.02}
          borderRadius="32px"
          glowColor="rgba(129, 140, 248, 0.15)"
          glowOpacity={0.3}
          className="md:col-span-1 p-8 md:p-10 bg-[var(--bg-2)] border border-[var(--border)] hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between gap-8 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
            <span className="font-mono text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
              02 / The Trap
            </span>
          </div>

          <div>
            <h3 className="font-heading text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight mb-3">
              Re-reading feels like studying. It isn&apos;t.
            </h3>
            <p className="font-sans text-xs md:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">
              Every time you re-read your notes, your brain says <span className="text-[var(--foreground)] font-bold">&ldquo;I know this.&rdquo;</span> It is lying to you. Recognition and recall are not the same. The fluency illusion destroys well-prepared students.
            </p>
          </div>
        </TiltCard>

        {/* Card 3: Full-Width Horizontal Feature Banner (Spans 3 Columns) */}
        <TiltCard
          maxTilt={2}
          scale={1.008}
          borderRadius="32px"
          glowColor="rgba(192, 132, 252, 0.15)"
          glowOpacity={0.3}
          className="md:col-span-3 p-8 md:p-12 bg-gradient-to-r from-[var(--bg-2)] via-[var(--bg-2)] to-purple-950/20 border border-[var(--border)] hover:border-purple-500/30 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 max-w-3xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <div>
              <div className="font-mono text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                03 / Precision Calibration
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight mb-2">
                ChatGPT doesn&apos;t know your lecturer.
              </h3>
              <p className="font-sans text-sm md:text-base text-[var(--foreground-secondary)] leading-relaxed font-medium">
                Generic AI tools give generic answers. They don&apos;t know what Prof. Adeyemi emphasized in week 7, or what questions always appear on the BIO 202 paper. <span className="text-[var(--foreground)] font-bold">Your notes do.</span> The Professor uses them, and only them.
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--bg-3)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] group-hover:border-purple-500/30 transition-all shrink-0">
            <span>100% Lecture Grounded</span>
            <ArrowUpRight size={16} className="text-purple-400" />
          </div>
        </TiltCard>

      </div>
    </section>
  );
}
