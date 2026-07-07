"use client";

import React from "react";
import { ArrowRight, Brain, Sparkles, Flame, CheckCircle2, ShieldCheck, Zap, Layers, BookOpen } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[92dvh] flex flex-col justify-between pt-32 pb-16 md:pt-36 md:pb-24 px-4 md:px-8 lg:px-12 overflow-hidden bg-transparent z-10 max-w-7xl mx-auto">

      {/* Main Hero Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center my-auto py-8">
        
        {/* Left Column — Monumental Typography & Tactile CTA (Col-Span 7) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left relative z-10">
          
          {/* Typographic Kicker */}
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] mb-6 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--blue)] shadow-[0_0_10px_rgba(74,124,245,0.8)] animate-pulse" />
            <span>The Midnight Scholar&apos;s Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-[48px] sm:text-[64px] md:text-[76px] lg:text-[88px] leading-[0.98] font-black text-[var(--foreground)] tracking-tight mb-8">
            Your notes. <br />
            Just the <span className="text-[var(--blue)] drop-shadow-[0_0_30px_rgba(74,124,245,0.35)]">good parts.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-base sm:text-lg md:text-xl font-medium text-[var(--foreground-secondary)] opacity-90 max-w-xl leading-relaxed mb-10">
            Uni is a lot, we get it. Drop your lectures, PDFs, or raw notes here and we&apos;ll transform them into structured study guides, active recall decks, and practice exams—so you can actually enjoy your day and get your sleep back.
          </p>

          {/* Skeuomorphic 3D Tactile CTA Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="px-10 py-5 rounded-2xl flex items-center justify-center gap-3 bg-[var(--blue)] text-white font-sans font-black text-sm uppercase tracking-wider shadow-[0_8px_30px_rgba(74,124,245,0.35),inset_0_2px_0_0_rgba(255,255,255,0.25),inset_0_-3px_0_0_rgba(0,0,0,0.2)] hover:bg-[var(--blue)]/90 hover:shadow-[0_8px_40px_rgba(74,124,245,0.5)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 text-decoration-none"
            >
              <span>Get Started — Free</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href="#how-it-works"
              className="px-8 py-5 rounded-2xl flex items-center justify-center gap-2 border border-[var(--border)] bg-[var(--bg-2)]/80 hover:bg-[var(--bg-2)] hover:border-[var(--border-2)] text-[var(--foreground)] font-sans font-bold text-sm uppercase tracking-wider transition-all duration-300 text-decoration-none"
            >
              <span>Explore Study Lab</span>
            </Link>
          </div>

          {/* Instant Trust Badge */}
          <div className="flex items-center gap-6 mt-10 pt-6 border-t border-[var(--border)]/60 text-xs font-bold text-[var(--foreground-muted)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-[var(--blue)]" />
              <span>Ready in 30 seconds</span>
            </div>
          </div>

        </div>

        {/* Right Column — The Scholar's Creed / Academic Architecture (Col-Span 5) */}
        <div className="lg:col-span-5 w-full flex flex-col gap-6 relative">
          
          {/* Editorial Principles Panel */}
          <div className="p-8 md:p-10 rounded-[32px] bg-[var(--bg-2)]/90 border border-[var(--border)] shadow-[0_30px_70px_rgba(0,0,0,0.35)] flex flex-col gap-8 relative overflow-hidden">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--blue)] via-indigo-500 to-emerald-400" />

            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <span className="font-heading text-xs font-black tracking-[0.2em] text-[var(--foreground)] uppercase">
                Academic Architecture
              </span>
              <span className="font-mono text-[10px] text-[var(--blue)] font-bold px-2.5 py-1 rounded-full bg-[var(--blue)]/10 border border-[var(--blue)]/20">
                v2.4 Engine
              </span>
            </div>

            {/* Pillar 1: Active Recall */}
            <div className="flex flex-col gap-2 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-[var(--blue)]">01 / ACTIVE RECALL</span>
                <Brain size={16} className="text-[var(--blue)] opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
              <p className="font-sans text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">
                Testing memory retrieval strengthens neural pathways <span className="text-[var(--foreground)] font-bold">300% faster</span> than passive re-reading. We build flashcards that force genuine recall.
              </p>
            </div>

            <div className="h-[1px] bg-[var(--border)]/50" />

            {/* Pillar 2: Spaced Repetition */}
            <div className="flex flex-col gap-2 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-indigo-400">02 / SPACED REPETITION</span>
                <Layers size={16} className="text-indigo-400 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
              <p className="font-sans text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">
                Calibrated review intervals intercept forgetting curves right before memory decay occurs. Your bed misses you; let algorithm timing save your nights.
              </p>
            </div>

            <div className="h-[1px] bg-[var(--border)]/50" />

            {/* Pillar 3: Feynman Synthesis */}
            <div className="flex flex-col gap-2 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-emerald-400">03 / FEYNMAN SYNTHESIS</span>
                <BookOpen size={16} className="text-emerald-400 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </div>
              <p className="font-sans text-xs sm:text-sm text-[var(--foreground-secondary)] leading-relaxed font-medium">
                Complex lectures distilled into plain-spoken axioms. No academic fluff, no textbook padding—just the core mechanics you need to ace your paper.
              </p>
            </div>

            {/* Bottom Status */}
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-bold">
              <span>Calibrated for university exams</span>
              <span className="flex items-center gap-1.5 text-orange-400">
                <Flame size={14} className="fill-orange-400" /> 98.4% Pass Rate
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Social Proof Ticker at Bottom of Hero */}
      <div className="w-full overflow-hidden relative pt-12 pb-6 mask-image-horizontal border-t border-[var(--border)]/40 mt-8">
        <div className="flex gap-8 whitespace-nowrap animate-ticker">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              {[
                { name: "Tunde", action: "aced his mid-terms" },
                { name: "Amaka", action: "saved 4 hours today" },
                { name: "Ifeanyi", action: "turned 50 slides into 5 pages" },
                { name: "Bolu", action: "is finally sleeping 8 hours" },
                { name: "Chinelo", action: "passed her nursing exam" },
                { name: "Femi", action: "aced his SAT prep" },
                { name: "Zainab", action: "summarized 30 lectures" },
                { name: "Emeka", action: "is ready for his finals" },
                { name: "Adaeze", action: "made a law guide in seconds" },
                { name: "Chidi", action: "finished his JAMB revision" },
                { name: "Bolaji", action: "understands his math now" },
                { name: "Funke", action: "saved her whole weekend" }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-2)] hover:bg-[var(--border)] transition-colors select-none"
                >
                  <span className="font-sans text-xs font-bold text-[var(--foreground)]">
                    {item.name}
                  </span>
                  <span className="font-sans text-xs font-medium text-[var(--foreground-muted)]">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: fit-content;
          animation: ticker 45s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
        .mask-image-horizontal {
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </section>
  );
}
