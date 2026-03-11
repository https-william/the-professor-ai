"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";
import { Grainient, GlassCard } from "@/components/ui/VisualEffects";

const FEATURES = [
  {
    icon: "style",
    title: "Flashcards",
    desc: "Spaced-repetition cards anchored in cognitive science. Not just Q&A — mnemonic hooks included.",
    color: "var(--accent)",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    icon: "quiz",
    title: "Quiz Engine",
    desc: "Adaptive multiple-choice with distractors designed to probe real understanding, not pattern-matching.",
    color: "var(--secondary)",
    bg: "rgba(99,102,241,0.08)",
  },
  {
    icon: "summarize",
    title: "Smart Summary",
    desc: "Organized by concept, not page order. Includes common mistakes section so you avoid the classic traps.",
    color: "#6366F1",
    bg: "rgba(99,102,241,0.08)",
  },
  {
    icon: "account_tree",
    title: "Mind Maps",
    desc: "Hierarchical visual webs that make relationships between concepts click in seconds.",
    color: "#F97316",
    bg: "rgba(249,115,22,0.08)",
  },
  {
    icon: "school",
    title: "Ask The Professor",
    desc: "FAMAS-method explanations: Framework → Analogy → Mechanism → Application → Summary. Every time.",
    color: "var(--accent)",
    bg: "rgba(245,158,11,0.08)",
  },
];

const COMPARISON = [
  { them: "Chatbot that guesses what to study", us: "Reads YOUR notes, builds from YOUR syllabus" },
  { them: "Generic flashcards anyone could make", us: "Spaced-repetition with mnemonic anchors" },
  { them: "Wall of text 'summaries'", us: "Structured by concept, not page number" },
  { them: "One AI provider — one point of failure", us: "4-provider cascade: Kimi → Trinity → Gemini → Groq" },
];

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      <Grainient className="fixed inset-0 z-0 opacity-40" />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 px-4 py-4">
        <div
          className="max-w-5xl mx-auto flex items-center justify-between px-5 py-2.5 rounded-2xl"
          style={{
            background: "rgba(8,8,14,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(245,240,232,0.08)",
            boxShadow: scrollY > 20 ? "0 4px 20px rgba(0,0,0,0.4), 0 0 60px rgba(245,158,11,0.04)" : "none",
            transition: "box-shadow 0.3s ease",
          }}
        >
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <span className="text-sm font-bold tracking-widest text-[var(--foreground-muted)] uppercase">
              The Professor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
            >
              <span className="material-symbols-outlined text-xl">
                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
              </span>
            </button>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm px-5 py-2"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 z-10">
        <div className="text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="gold-badge mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-soft" />
            Multi-Provider AI Engine · Live
          </div>

          {/* Headline */}
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8 animate-fade-in-up">
            <span className="text-[var(--foreground)]">Your syllabus,</span>
            <br />
            <span className="text-gradient-gold">decoded.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-3 leading-relaxed animate-fade-in-up animation-delay-200">
            Upload your notes. Get flashcards, quizzes, summaries, and mind maps — all grounded in cognitive science.
          </p>
          <p className="text-base text-[var(--foreground-muted)] max-w-xl mx-auto mb-12 animate-fade-in-up animation-delay-300">
            Not a chatbot. A study engine that actually read your material.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-400">
            <Link
              href="/signup"
              className="btn-primary text-base px-10 py-4 flex items-center justify-center gap-2 group"
            >
              Start Learning — It&apos;s Free
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <a
              href="#features"
              className="btn-secondary text-base px-10 py-4 flex items-center justify-center gap-2"
            >
              See What It Does
              <span className="material-symbols-outlined">expand_more</span>
            </a>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--foreground-muted)] animate-fade-in-up animation-delay-500">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[var(--success)] text-base">verified</span>
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[var(--accent)] text-base">stars</span>
              100 free credits
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[var(--secondary)] text-base">lock</span>
              Your data stays yours
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[var(--foreground-muted)] animate-bounce">
          <span className="text-xs tracking-widest uppercase font-medium">scroll</span>
          <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── Problem Section ── */}
      <section
        id="problem"
        data-reveal
        className={`relative py-24 px-6 z-10 transition-all duration-700 ${isVisible("problem") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="gold-badge mb-4 inline-flex">Sound familiar?</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-12 leading-tight">
            The old way of studying is broken.
          </h2>
          <div className="space-y-5">
            {[
              "You've highlighted more text than you've actually understood.",
              "That textbook has been 'in progress' since Week 2.",
              "Exam's tomorrow. Your notes look like abstract art.",
            ].map((text, i) => (
              <div
                key={i}
                className={`py-5 px-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-left transition-all duration-500`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <p className="text-[var(--foreground-secondary)] text-lg">
                  <span className="text-red-400 mr-2">✗</span> &quot;{text}&quot;
                </p>
              </div>
            ))}
          </div>
          <div className={`mt-10 transition-all duration-700`} style={{ transitionDelay: "600ms" }}>
            <p className="text-[var(--accent)] font-heading text-xl font-semibold">
              There&apos;s a smarter way.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section
        id="features"
        data-reveal
        className={`relative py-24 px-6 z-10 transition-all duration-700 ${isVisible("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="gold-badge mb-4 inline-flex">What it does</p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-[var(--foreground)] leading-tight">
              Six ways to master any subject
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <GlassCard
                key={feat.title}
                className={`p-6 scholar-card transition-all duration-500`}
                style={{ transitionDelay: `${i * 80}ms`, opacity: isVisible("features") ? 1 : 0 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: feat.bg, color: feat.color }}
                >
                  <span className="material-symbols-outlined text-2xl">{feat.icon}</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--foreground)] mb-2">{feat.title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{feat.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section
        id="compare"
        data-reveal
        className={`relative py-24 px-6 z-10 transition-all duration-700 ${isVisible("compare") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="gold-badge mb-4 inline-flex">The difference</p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-[var(--foreground)] leading-tight">
              Not just another AI wrapper
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3 flex items-center justify-center">
              <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Others</span>
            </div>
            <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 py-3 flex items-center justify-center">
              <span className="text-sm font-bold text-[var(--accent)] uppercase tracking-wider">The Professor</span>
            </div>
          </div>

          <div className="space-y-3">
            {COMPARISON.map((row, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-3">
                <GlassCard className="px-5 py-4 flex items-start gap-3">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                  <p className="text-sm text-[var(--foreground-secondary)]">{row.them}</p>
                </GlassCard>
                <GlassCard className="px-5 py-4 flex items-start gap-3 border-[var(--accent)]/15">
                  <span className="text-[var(--accent)] mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-sm text-[var(--foreground)]">{row.us}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how"
        data-reveal
        className={`relative py-24 px-6 z-10 transition-all duration-700 ${isVisible("how") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="gold-badge mb-4 inline-flex">Dead simple</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-16 leading-tight">
            Three steps to exam-ready
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "upload", title: "Upload Anything", desc: "PDF, DOCX, plain text. Lecture notes, textbook chapters, anything." },
              { step: "02", icon: "auto_awesome", title: "Pick Your Tool", desc: "Flashcards for retention, quiz for testing, summary for review, mind map for the big picture." },
              { step: "03", icon: "emoji_events", title: "Actually Learn It", desc: "Study with AI content tuned to your exact material. Walk into your exam confident." },
            ].map((item) => (
              <GlassCard key={item.step} className="p-7 text-center scholar-card group">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)" }}
                >
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <div className="font-heading text-4xl font-bold text-[var(--accent)]/20 mb-3">{item.step}</div>
                <h3 className="font-heading text-lg font-bold text-[var(--foreground)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        id="cta"
        data-reveal
        className={`relative py-32 px-6 z-10 transition-all duration-700 ${isVisible("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-12 md:p-16 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(99,102,241,0.06) 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
              boxShadow: "0 0 60px rgba(245,158,11,0.08)",
            }}
          >
            {/* Background blur */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(245,158,11,0.2), transparent 60%)" }} />

            <div className="relative z-10">
              <h2 className="font-heading text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-5 leading-tight">
                Your next exam
                <br />
                <span className="text-gradient-gold">is not optional.</span>
              </h2>
              <p className="text-[var(--foreground-secondary)] text-lg mb-10 max-w-lg mx-auto">
                Join students who stopped highlighting and started actually learning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="btn-primary text-base px-10 py-4 flex items-center justify-center gap-2 group">
                  Get 100 Free Credits
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">bolt</span>
                </Link>
                <Link href="/login" className="btn-secondary text-base px-10 py-4 flex items-center justify-center">
                  Already have an account?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 px-6 text-center border-t border-[var(--border)]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <BrandLogo size="sm" />
          <span className="text-sm font-bold tracking-widest text-[var(--foreground-muted)] uppercase">The Professor</span>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">
          © 2026 The Professor. Built for students who actually want to learn.
        </p>
      </footer>
    </main>
  );
}
