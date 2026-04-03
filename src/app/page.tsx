"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">

      {/* Subtle ambient radial glow — replaces Grainient */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(99,102,241,0.06) 0%, transparent 70%)",
      }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 40% at 30% 70%, rgba(245,158,11,0.04) 0%, transparent 60%)",
      }} />

      {/* ═══════════════════════════════════════════════
          NAVIGATION — Floating Jelly Glass Pill
          Mobile: compact, no theme toggle
         ═══════════════════════════════════════════════ */}
      <nav className="fixed top-0 w-full z-50 px-3 md:px-4 py-3 md:py-4">
        <div
          className="max-w-5xl mx-auto flex items-center justify-between px-4 md:px-5 py-2 md:py-2.5 rounded-full"
          style={{
            background: "rgba(8,8,14,0.75)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1.5px solid rgba(255,255,255,0.06)",
            borderTop: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: scrollY > 20
              ? "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)"
              : "inset 0 1px 1px rgba(255,255,255,0.05)",
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <BrandLogo size="sm" />
            <span className="text-xs md:text-sm font-bold tracking-widest text-[var(--foreground-muted)] uppercase group-hover:text-[var(--foreground)] transition-colors hidden sm:inline">
              The Professor
            </span>
          </Link>

          {/* Right — Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Theme toggle — hidden on mobile */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
            >
              <span className="material-symbols-outlined text-xl">
                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
              </span>
            </button>
            <Link
              href="/login"
              className="px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
            >
              Log in
            </Link>
            <Link href="/signup" className="btn-jelly text-xs md:text-sm px-4 md:px-5 py-1.5 md:py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO — "Learning is as simple as ~~ABC~~ XYZ."
          Floating dance + shimmer sweep
         ═══════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-5 pt-24 md:pt-28 pb-16 md:pb-20 z-10">
        {/* Headline */}
        <h1 className="text-center leading-[1.08] mb-6 md:mb-8 animate-fade-in-up">
          {/* Line 1: "Learning is as" */}
          <span className="block font-heading text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold text-[var(--foreground)] tracking-tight">
            Learning is as
          </span>

          {/* Line 2: "simple as  ~~ABC~~  XYZ." */}
          <span className="block font-heading text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mt-1">
            {/* "simple as " — purple gradient */}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              simple as{" "}
            </span>

            {/* "ABC" — crossed out, floating */}
            <span className="relative inline-block text-base sm:text-xl md:text-2xl lg:text-3xl mx-0.5 md:mx-1 align-middle animate-float-abc">
              <span className="font-heading font-bold text-[var(--foreground)] opacity-15">ABC</span>
              <span
                className="absolute left-[-3px] right-[-3px] top-1/2 h-[1.5px] md:h-[2px] -rotate-12 pointer-events-none"
                style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.7), rgba(239,68,68,0.25))" }}
              />
            </span>

            {/* "XYZ." — rainbow + shimmer + float */}
            <span
              className="inline-block text-5xl sm:text-6xl md:text-8xl lg:text-[7rem]"
              style={{
                background: "linear-gradient(90deg, #818cf8, #c084fc, #f472b6, #fb923c, #facc15, #818cf8)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "float-xyz 7s ease-in-out infinite, shimmer-sweep 4s linear infinite",
              }}
            >
              XYZ.
            </span>
          </span>
        </h1>

        {/* Sub */}
        <div className="text-center mb-10 md:mb-12 animate-fade-in-up animation-delay-200">
          <p className="text-sm md:text-base text-[var(--foreground-secondary)] leading-relaxed">
            Stop reading.{" "}
            <span className="font-semibold text-[var(--foreground)]">Start learning.</span>
          </p>
          <p className="text-sm md:text-base text-[var(--foreground-muted)] mt-1">
            Upload materials and ace your exams.
          </p>
        </div>

        {/* CTA Buttons — stack on mobile */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 animate-fade-in-up animation-delay-300 w-full sm:w-auto">
          <Link href="/signup" className="btn-jelly text-sm md:text-base px-7 md:px-8 py-3 md:py-3.5 w-full sm:w-auto justify-center group">
            Start Session
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
          <a href="#how-it-works" className="btn-jelly-ghost text-sm md:text-base px-7 md:px-8 py-3 md:py-3.5 w-full sm:w-auto justify-center">
            How It Works
          </a>
        </div>

        {/* Scroll indicator — hidden on mobile */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-[var(--foreground-muted)] animate-bounce z-10">
          <span className="text-xs tracking-widest uppercase font-medium">scroll</span>
          <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TERMINAL PREVIEW — macOS interface showcase
         ═══════════════════════════════════════════════ */}
      <section className="relative w-full py-10 md:py-20 px-5 md:px-6 z-10">
        <div className="max-w-3xl mx-auto">

          {/* Ambient glow behind the terminal */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 65%)",
              filter: "blur(60px)",
            }}
          />

          {/* Terminal card */}
          <div className="relative rounded-xl overflow-hidden"
            style={{
              background: "rgba(12,12,22,0.95)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {/* macOS title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[11px] text-white/20 font-medium tracking-wide">The Professor — Neural Session</span>
            </div>

            {/* Terminal content */}
            <div className="p-5 md:p-7 font-mono text-[13px] md:text-sm leading-relaxed space-y-3">
              <p className="text-white/25">
                <span className="text-white/40">&gt;</span> Initiating Neural Scan...
              </p>
              <p className="text-[#28C840]/70">
                <span className="text-white/40">&gt;</span> parsing_vector_space: <span className="text-[#28C840]">100%</span>
              </p>

              <div className="h-px bg-white/[0.04] my-4" />

              <p>
                <span className="text-[#818CF8] font-semibold">user</span>
                <span className="text-white/15">:</span>{" "}
                <span className="text-white/50">Explain Quantum Entanglement like I&apos;m 5.</span>
              </p>

              <div className="mt-3">
                <p>
                  <span className="text-[#F59E0B] font-semibold">professor</span>
                  <span className="text-white/15">:</span>{" "}
                  <span className="text-white/60">
                    Imagine two magic dice. No matter how far apart they are—even across the galaxy—if you roll a 6 on one, the other <span className="text-white/80 font-medium">INSTANTLY</span> shows a 6. They are spooky soulmates.
                  </span>
                </p>
              </div>

              {/* Blinking cursor */}
              <div className="flex items-center gap-0.5 mt-2">
                <span className="w-2 h-4 bg-[#818CF8] animate-pulse rounded-[1px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — Refined claymorphism + visual flow
         ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--foreground-muted)] mb-4">
            How it works
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-4 md:mb-5 tracking-tight">
            Three steps to mastery
          </h2>
          <p className="text-sm md:text-base text-[var(--foreground-muted)] max-w-md mx-auto mb-14 md:mb-20">
            No setup. No learning curve. Just results.
          </p>

          {/* Steps row with connecting arrows */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-0 items-start">
            {[
              {
                step: "01", icon: "upload", title: "Upload Anything",
                desc: "PDF, DOCX, plain text — lecture notes, textbook chapters, whatever you have.",
                color: "#818CF8", gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
              },
              {
                step: "02", icon: "auto_awesome", title: "Pick Your Weapon",
                desc: "Flashcards, quiz, summary, mind map — choose your study mode.",
                color: "#F59E0B", gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
              },
              {
                step: "03", icon: "emoji_events", title: "Master It",
                desc: "AI content tuned to your exact material. Walk in confident.",
                color: "#34D399", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
              },
            ].map((item, i) => (
              <React.Fragment key={item.step}>
                {/* Card */}
                <div
                  className="clay-card relative p-6 md:p-8 text-center group overflow-hidden hover:-translate-y-1 transition-all duration-400"
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-[15%] right-[15%] h-[2px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: item.color }}
                  />

                  {/* Watermark step number */}
                  <span
                    className="absolute -top-4 -right-2 font-heading text-[7rem] md:text-[8rem] font-black leading-none pointer-events-none select-none"
                    style={{ color: item.color, opacity: 0.04 }}
                  >
                    {item.step}
                  </span>

                  {/* Icon pill with glow */}
                  <div
                    className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: `${item.color}15`,
                      boxShadow: `0 4px 20px ${item.color}20, inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 3px rgba(0,0,0,0.2)`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-2xl md:text-3xl transition-all duration-300"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                  </div>

                  {/* Step label */}
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: item.color, opacity: 0.7 }}>
                    Step {item.step}
                  </p>

                  {/* Title */}
                  <h3 className="font-heading text-lg md:text-xl font-bold text-[var(--foreground)] mb-2.5">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed max-w-[260px] mx-auto">
                    {item.desc}
                  </p>
                </div>

                {/* Connecting arrow — only between cards, desktop only */}
                {i < 2 && (
                  <div key={`arrow-${i}`} className="hidden md:flex items-center justify-center px-2 pt-20">
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ color: "var(--foreground-muted)", opacity: 0.3 }}
                    >
                      chevron_right
                    </span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES — Bento Grid with visual previews
         ═══════════════════════════════════════════════ */}
      <section className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--foreground-muted)] mb-4">
              Your arsenal
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
              Four tools. Zero fluff.
            </h2>
          </div>

          {/* Bento Grid — asymmetric layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 auto-rows-auto">

            {/* ─── FLASHCARDS — wide hero card (spans 7 cols) ─── */}
            <div className="clay-card md:col-span-7 p-6 md:p-8 group cursor-default relative overflow-hidden min-h-[220px] md:min-h-[260px] flex flex-col justify-between">
              {/* Visual: Stacked cards */}
              <div className="absolute top-6 right-6 md:top-8 md:right-8 w-[140px] md:w-[180px] h-[100px] md:h-[130px]">
                {[2, 1, 0].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-xl border transition-transform duration-500 group-hover:rotate-0"
                    style={{
                      width: "100%",
                      height: "70%",
                      bottom: `${i * 8}px`,
                      right: `${i * 6}px`,
                      transform: `rotate(${(i - 1) * 4}deg)`,
                      background: i === 0 ? "rgba(245,158,11,0.12)" : "rgba(30,30,52,0.7)",
                      borderColor: i === 0 ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)",
                      zIndex: 3 - i,
                    }}
                  >
                    {i === 0 && (
                      <div className="p-3 md:p-4">
                        <div className="w-2/3 h-1.5 rounded-full bg-white/15 mb-2" />
                        <div className="w-full h-1 rounded-full bg-white/8 mb-1.5" />
                        <div className="w-4/5 h-1 rounded-full bg-white/8" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="relative z-10 max-w-[55%] md:max-w-[60%]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-2xl text-[#F59E0B]">style</span>
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#F59E0B]/70">Most Popular</span>
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">
                  Flashcards
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  Spaced-repetition cards with mnemonic hooks. Not just Q&A — built to make concepts stick.
                </p>
              </div>
            </div>

            {/* ─── QUIZ ENGINE — tall narrow card (spans 5 cols) ─── */}
            <div className="clay-card md:col-span-5 p-6 md:p-8 group cursor-default relative overflow-hidden min-h-[220px] md:min-h-[260px] flex flex-col">
              <div className="relative z-10 mb-6">
                <span className="material-symbols-outlined text-2xl text-[#818CF8] mb-3 block">quiz</span>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">
                  Quiz Engine
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  Adaptive MCQs with distractors designed to probe real understanding.
                </p>
              </div>

              {/* Visual: MCQ option bubbles */}
              <div className="mt-auto space-y-2">
                {["A", "B", "C", "D"].map((letter, i) => (
                  <div
                    key={letter}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-300"
                    style={{
                      background: i === 1 ? "rgba(129,140,248,0.12)" : "rgba(30,30,52,0.5)",
                      border: `1px solid ${i === 1 ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{
                        background: i === 1 ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.04)",
                        color: i === 1 ? "#818CF8" : "var(--foreground-muted)",
                      }}
                    >
                      {letter}
                    </span>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${[60, 85, 45, 70][i]}%`,
                        background: i === 1 ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.06)",
                      }}
                    />
                    {i === 1 && (
                      <span className="material-symbols-outlined text-sm text-[#818CF8] ml-auto flex-shrink-0">check_circle</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── SMART SUMMARY — wide bottom-left (spans 5 cols) ─── */}
            <div className="clay-card md:col-span-5 p-6 md:p-8 group cursor-default relative overflow-hidden min-h-[200px] md:min-h-[240px] flex flex-col">
              <div className="relative z-10 mb-5">
                <span className="material-symbols-outlined text-2xl text-[#6366F1] mb-3 block">summarize</span>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">
                  Smart Summary
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  Organized by concept, not page order. Includes common mistakes section.
                </p>
              </div>

              {/* Visual: Organized text blocks */}
              <div className="mt-auto space-y-3">
                {[
                  { label: "Key Concept", w: "90%" },
                  { label: "Supporting Detail", w: "75%" },
                  { label: "Common Mistake", w: "60%" },
                ].map((line, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className="w-1 h-5 rounded-full flex-shrink-0"
                      style={{ background: i === 2 ? "rgba(239,68,68,0.4)" : `rgba(99,102,241,${0.4 - i * 0.1})` }}
                    />
                    <div>
                      <div className="text-[9px] font-bold tracking-wider uppercase mb-0.5"
                        style={{ color: i === 2 ? "rgba(239,68,68,0.5)" : "rgba(99,102,241,0.5)" }}
                      >
                        {line.label}
                      </div>
                      <div className="h-1 rounded-full bg-white/8" style={{ width: line.w }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── ORAL EXAM PREP — wide bottom-right (spans 7 cols) ─── */}
            <div className="clay-card md:col-span-7 p-6 md:p-8 group cursor-default relative overflow-hidden min-h-[200px] md:min-h-[240px] flex flex-col justify-between">
              <div className="relative z-10 max-w-[65%]">
                <span className="material-symbols-outlined text-2xl text-[#34D399] mb-3 block">record_voice_over</span>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">
                  Oral Exam Prep
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  Real-time AI viva voce. Practice answering under pressure before the real thing.
                </p>
              </div>

              {/* Visual: Voice waveform */}
              <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex items-end gap-[3px] h-16 md:h-20">
                {Array.from({ length: 24 }).map((_, i) => {
                  const heights = [30, 50, 35, 70, 45, 85, 60, 40, 75, 55, 90, 42, 65, 38, 80, 50, 35, 72, 48, 88, 55, 40, 68, 45];
                  return (
                    <div
                      key={i}
                      className="w-[3px] md:w-[3.5px] rounded-full transition-all"
                      style={{
                        height: `${heights[i]}%`,
                        background: `rgba(52,211,153,${0.15 + (heights[i] / 100) * 0.25})`,
                        animation: `waveform ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA — Layered Volumetric Depth
          3 depth layers: outer glow → glass → clay content
         ═══════════════════════════════════════════════ */}
      <section className="relative w-full px-5 md:px-6 z-10" style={{ paddingBlock: "clamp(5rem, 8vw, 9rem)" }}>
        <div className="max-w-4xl mx-auto">

          {/* Layer 1: Outer glow ring — furthest depth */}
          <div
            className="relative rounded-[clamp(1.5rem,3vw,2.5rem)] p-[1px]"
            style={{
              background: "linear-gradient(135deg, rgba(129,140,248,0.2), rgba(192,132,252,0.1), rgba(245,158,11,0.15))",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4), 0 0 60px rgba(99,102,241,0.06)",
            }}
          >
            {/* Layer 2: Glass panel — mid depth */}
            <div
              className="relative rounded-[calc(clamp(1.5rem,3vw,2.5rem)-1px)] overflow-hidden"
              style={{
                background: "rgba(14,14,24,0.85)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
              }}
            >
              {/* Ambient top glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(129,140,248,0.15), transparent 70%)",
              }} />

              {/* Noise texture for depth */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Layer 3: Inner clay content — closest to viewer */}
              <div
                className="relative z-10 text-center"
                style={{ padding: "clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 4rem)" }}
              >
                {/* Floating decorative orbs */}
                <div className="absolute top-8 left-8 w-20 h-20 rounded-full animate-float-abc pointer-events-none opacity-60"
                  style={{ background: "radial-gradient(circle, rgba(129,140,248,0.08), transparent 70%)" }}
                />
                <div className="absolute bottom-12 right-12 w-28 h-28 rounded-full animate-float-xyz pointer-events-none opacity-40"
                  style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 70%)" }}
                />

                <h2
                  className="font-heading font-bold text-[var(--foreground)] leading-[1.1] tracking-tight"
                  style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)", marginBottom: "clamp(0.75rem, 2vw, 1.25rem)" }}
                >
                  Your next exam
                  <br />
                  <span
                    className="animate-shimmer-sweep"
                    style={{
                      background: "linear-gradient(90deg, #818cf8, #c084fc, #f472b6, #fb923c, #facc15, #818cf8)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    is not optional.
                  </span>
                </h2>

                <p
                  className="text-[var(--foreground-secondary)] max-w-md mx-auto"
                  style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)", marginBottom: "clamp(2rem, 4vw, 3rem)" }}
                >
                  Join students who stopped highlighting and started learning.
                </p>

                {/* CTA buttons — clay pills */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    href="/signup"
                    className="btn-jelly justify-center group"
                    style={{ fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)", padding: "clamp(0.75rem, 1.5vw, 1rem) clamp(1.5rem, 3vw, 2.5rem)" }}
                  >
                    Get 100 Free Credits
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform text-lg">bolt</span>
                  </Link>
                  <Link
                    href="/login"
                    className="btn-jelly-ghost justify-center"
                    style={{ fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)", padding: "clamp(0.75rem, 1.5vw, 1rem) clamp(1.5rem, 3vw, 2.5rem)" }}
                  >
                    Already have an account?
                  </Link>
                </div>

                {/* Trust signals — embedded in the card */}
                <div
                  className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[var(--foreground-muted)]"
                  style={{ marginTop: "clamp(1.5rem, 3vw, 2.5rem)", fontSize: "clamp(0.7rem, 1vw, 0.8rem)" }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[var(--success)]" style={{ fontSize: "14px" }}>verified</span>
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[var(--accent)]" style={{ fontSize: "14px" }}>bolt</span>
                    100 free credits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[var(--secondary)]" style={{ fontSize: "14px" }}>lock</span>
                    Your data stays yours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER — Layered with frosted separator
         ═══════════════════════════════════════════════ */}
      <footer className="relative z-10" style={{ paddingBlock: "clamp(2rem, 4vw, 3.5rem)" }}>
        {/* Frosted separator line */}
        <div className="mx-auto mb-8" style={{
          maxWidth: "clamp(200px, 30vw, 400px)",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(129,140,248,0.15), rgba(255,255,255,0.08), transparent)",
        }} />

        <div className="max-w-5xl mx-auto px-5 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left — Brand */}
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" />
              <span className="font-semibold text-[var(--foreground-muted)]" style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)" }}>
                The Professor
              </span>
            </div>

            {/* Center — Links */}
            <div className="flex items-center gap-6">
              {[
                { label: "Features", href: "#how-it-works" },
                { label: "Pricing", href: "/settings/billing" },
                { label: "Privacy", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                  style={{ fontSize: "clamp(0.7rem, 1vw, 0.8rem)" }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right — Copyright */}
            <p className="text-[var(--foreground-muted)] opacity-50" style={{ fontSize: "clamp(0.65rem, 0.9vw, 0.75rem)" }}>
              © 2026 The Professor
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
