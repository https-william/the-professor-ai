"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import BrandLogo from "@/components/ui/BrandLogo";
import DemoPlayground from "@/components/landing/DemoPlayground";
import { DecryptedText, GradientText } from "@/components/ui/TextEffects";
import { Grainient, GlassCard } from "@/components/ui/VisualEffects";

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  // Scroll tracking for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      {/* Animated Background */}
      <Grainient className="fixed inset-0 opacity-40 z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3 rounded-full bg-[var(--background)]/60 backdrop-blur-xl border border-[var(--border)]/50 shadow-sm">
          <div className="flex items-center gap-3 pl-2">
            <BrandLogo size="md" />
            <DecryptedText
              text="The Professor"
              className="text-lg font-semibold text-[var(--foreground)]"
              animateOn="hover"
              speed={70}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
            >
              <span className="material-symbols-outlined text-xl">
                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
              </span>
            </button>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-medium shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 hover:scale-105 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================
                SECTION 1: HERO
               ============================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)]/50 border border-[var(--border)] backdrop-blur-md text-sm text-[var(--foreground-secondary)] mb-8 shadow-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span>Now Live: Kimi AI Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-[var(--foreground)] animate-fade-in-up">
            As Simple as{" "}
            <span className="relative inline-block mx-2">
              <span className="text-3xl md:text-5xl text-[var(--foreground-muted)] line-through decoration-[var(--error)] decoration-2 opacity-60">
                abc
              </span>
            </span>{" "}
            <GradientText className="animate-gradient font-extrabold text-6xl md:text-8xl">
              .xyz
            </GradientText>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-4 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            AI that actually did the reading.
          </p>
          <p className="text-base text-[var(--foreground-muted)] max-w-xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Upload your notes. Get flashcards, quizzes, lessons, and podcasts.
            Your syllabus, decoded.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-white text-lg font-semibold shadow-xl shadow-[var(--accent)]/25 hover:shadow-2xl hover:shadow-[var(--accent)]/35 hover:scale-[1.02] transition-all"
            >
              Start Learning Free
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-lg font-semibold hover:bg-[var(--background-tertiary)] hover:border-[var(--foreground-muted)] transition-all"
            >
              Try Demo
              <span className="material-symbols-outlined">play_circle</span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--foreground-muted)] animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--success)]">verified</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--accent)]">stars</span>
              <span>100 free credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--secondary)]">lock</span>
              <span>Your data stays yours</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <span className="material-symbols-outlined text-[var(--foreground-muted)]">expand_more</span>
        </div>
      </section>

      {/* ============================================
                SECTION 2: THE PROBLEM
               ============================================ */}
      <section
        id="problem"
        data-reveal
        className={`relative py-24 px-6 transition-all duration-1000 ${isVisible("problem") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-12">
            Sound familiar?
          </h2>

          <div className="space-y-6">
            {[
              { text: "You've highlighted more lines than you've understood.", delay: 0 },
              { text: "That textbook has been 'in progress' since Week 2.", delay: 0.2 },
              { text: "Exam's tomorrow. Your notes look like abstract art.", delay: 0.4 },
            ].map((item, i) => (
              <p
                key={i}
                className={`text-xl md:text-2xl text-[var(--foreground-secondary)] transition-all duration-700 ${isVisible("problem") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                style={{ transitionDelay: `${item.delay + 0.2}s` }}
              >
                "{item.text}"
              </p>
            ))}
          </div>

          <div className={`mt-12 transition-all duration-700 ${isVisible("problem") ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "1s" }}>
            <p className="text-lg text-[var(--accent)] font-medium">
              There&apos;s a better way. →
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
                SECTION 3: INTERACTIVE DEMO
               ============================================ */}
      <section
        id="demo"
        data-reveal
        className={`relative py-24 px-6 bg-[var(--background-secondary)] transition-all duration-1000 ${isVisible("demo") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              Try it. No signup needed.
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              This is what The Professor does with your notes. Explore freely.
            </p>
          </div>

          <DemoPlayground />

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Like this? Upload YOUR notes
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
                SECTION 4: FEATURES (PSYCHOLOGY-FIRST)
               ============================================ */}
      <section
        id="features"
        data-reveal
        className={`relative py-24 px-6 transition-all duration-1000 ${isVisible("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              What you get (and what you avoid)
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              We&apos;re not selling features. We&apos;re selling your peace of mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "style",
                title: "AI Flashcards",
                gain: "10x faster retention",
                avoid: "Hours of manual card-making",
                pun: "Know it before you forget it. Again.",
              },
              {
                icon: "quiz",
                title: "Smart Quizzes",
                gain: "Confidence before the test",
                avoid: "Surprise exam blindspots",
                pun: "Exposes what you think you know.",
              },
              {
                icon: "school",
                title: "Instant Classes",
                gain: "'Aha!' moments on demand",
                avoid: "Confusion and frustration",
                pun: "Your textbook's jealous already.",
              },
              {
                icon: "podcasts",
                title: "Audio Lessons",
                gain: "Learn while you walk",
                avoid: "Hours stuck at a desk",
                pun: "Study buddy who never flakes.",
              },
            ].map((feature, i) => (
              <GlassCard
                key={i}
                className={`p-6 transition-all duration-500 hover:scale-[1.02] ${isVisible("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[var(--accent)]">{feature.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{feature.title}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2 text-[var(--success)]">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        {feature.gain}
                      </p>
                      <p className="flex items-center gap-2 text-[var(--error)]/70">
                        <span className="material-symbols-outlined text-base">cancel</span>
                        {feature.avoid}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-[var(--foreground-muted)] italic">
                      "{feature.pun}"
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
                SECTION 5: TRUST (HONEST)
               ============================================ */}
      <section
        id="trust"
        data-reveal
        className={`relative py-24 px-6 bg-[var(--background-secondary)] transition-all duration-1000 ${isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6">
            Built for students, by students who failed first.
          </h2>
          <p className="text-lg text-[var(--foreground-secondary)] mb-8">
            We built The Professor because we were tired of failing exams.
            Now we don&apos;t. You&apos;re welcome.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <div className="px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground-secondary)]">
              🚀 Just Launched
            </div>
            <div className="px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground-secondary)]">
              Powered by Kimi AI
            </div>
            <div className="px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground-secondary)]">
              Gemini Fallback
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] inline-block">
            <p className="text-[var(--foreground-secondary)] mb-2">
              <strong className="text-[var(--foreground)]">Skeptical? Good.</strong>
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              Try the demo above. If it doesn&apos;t help, roast us on Twitter. We dare you.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
                SECTION 6: FINAL CTA
               ============================================ */}
      <section
        id="cta"
        data-reveal
        className={`relative py-32 px-6 transition-all duration-1000 ${isVisible("cta") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
            Don&apos;t let your grades become a cautionary tale.
          </h2>
          <p className="text-lg text-[var(--foreground-secondary)] mb-10">
            Your future self called. They said start now.
          </p>

          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[#EF4444] text-white text-xl font-bold shadow-2xl shadow-[var(--accent)]/30 hover:shadow-[var(--accent)]/50 hover:scale-[1.02] transition-all"
          >
            Start Learning Free
            <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>

          <p className="mt-6 text-sm text-[var(--foreground-muted)]">
            No credit card required • 100 free credits • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="text-sm text-[var(--foreground-muted)]">The Professor © 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
            <Link href="/help" className="hover:text-[var(--foreground)] transition-colors">Help</Link>
            <Link href="/settings" className="hover:text-[var(--foreground)] transition-colors">Privacy</Link>
            <a href="https://twitter.com" target="_blank" rel="noopener" className="hover:text-[var(--foreground)] transition-colors">Twitter</a>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
    </main>
  );
}
