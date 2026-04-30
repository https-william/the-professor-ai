import React from "react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import LandingFeatures from "@/components/landing/LandingFeatures";
import TerminalDemo from "@/components/landing/TerminalDemo";

import { 
  Zap, 
  Layers, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Upload,
  Sparkles,
  Trophy,
  Download
} from "lucide-react";
import SEOHead, { getOrgSchema, getWebsiteSchema, getWebApplicationSchema } from "@/components/SEOHead";
import SocialProof from "@/components/landing/SocialProof";
import PainSection from "@/components/landing/PainSection";
import Testimonials from "@/components/landing/Testimonials";
import LandingPricing from "@/components/landing/LandingPricing";
import FAQ from "@/components/landing/FAQ";
import StandardContainer from "@/components/ui/StandardContainer";

export default function LandingPage() {
  return (
    <>
      <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-amber-500/30 overflow-x-hidden">
        {/* ═══ Advanced AEO/SEO Layer ═══ */}
        <SEOHead type="Organization" data={getOrgSchema()} />
        <SEOHead type="WebSite" data={getWebsiteSchema()} />
        <SEOHead type="WebApplication" data={getWebApplicationSchema()} />

        {/* ═══════════════════════════════════════════════
            HERO — "Learning is as simple as ~~ABC~~ XYZ."
            Floating dance + shimmer sweep
           ═══════════════════════════════════════════════ */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-5 pt-24 md:pt-28 pb-16 md:pb-20 z-10">
          <StandardContainer className="flex flex-col items-center">
            {/* Header Scroll Sentinel */}
            <div data-header-sentinel className="absolute top-0 left-0 h-1 w-full pointer-events-none" />
            
            {/* Headline — Impeccable Typography */}
            <h1 className="text-center leading-[1.05] mb-6 md:mb-8 animate-fade-in-up font-galaxie tracking-tight" style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)" }}>
              {/* Line 1: "Learning is as" */}
              <span className="block font-medium text-[var(--foreground)]">
                Learning is as
              </span>

              {/* Line 2: "simple as  ~~ABC~~  XYZ." */}
              <span className="block font-bold mt-1">
                <span
                  style={{
                    background: "linear-gradient(135deg, #2563EB 0%, #EA580C 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  simple as{" "}
                </span>

                {/* "ABC" — crossed out, floating */}
                <span className="relative inline-block mx-0.5 md:mx-2 align-middle animate-float-abc" style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}>
                  <span className="font-bold text-[var(--foreground)] opacity-10">ABC</span>
                  <span
                    className="absolute left-[-3px] right-[-3px] top-1/2 h-[2px] md:h-[3px] -rotate-12 pointer-events-none"
                    style={{ background: "var(--foreground)", opacity: 0.2 }}
                  />
                </span>

                {/* "XYZ." — Premium shimmer + float */}
                <span
                  className="inline-block animate-float-xyz relative"
                >
                  <span 
                    className="absolute inset-0 bg-clip-text text-transparent opacity-80"
                    style={{
                      background: "linear-gradient(90deg, #1D4ED8 0%, #C2410C 50%, #1D4ED8 100%)",
                      backgroundSize: "200% 100%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "shimmer-sweep 4s linear infinite",
                    }}
                  >
                    XYZ.
                  </span>
                  <span className="relative" style={{
                      background: "linear-gradient(135deg, #60A5FA 0%, #FB923C 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                  }}>
                    XYZ.
                  </span>
                </span>
              </span>
            </h1>

            {/* Sub */}
            <div className="text-center mb-10 md:mb-12 animate-fade-in-up animation-delay-200">
              <p className="text-sm md:text-base text-[var(--foreground-secondary)] leading-relaxed">
                Stop reading.{" "}
                <span className="font-semibold text-[var(--foreground)]">Start learning.</span>
              </p>
              <p className="text-sm md:text-base text-[var(--foreground-secondary)] mt-1">
                Upload materials and ace your exams.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up animation-delay-300 w-full sm:w-auto">
              <Link href="/signup" className="btn-skeuo-primary text-sm md:text-base px-7 md:px-8 py-3 md:py-3.5 w-full sm:w-auto justify-center group font-bold" style={{ background: "var(--foreground)", color: "var(--background)", boxShadow: "none" }}>
                Start Session
                <ArrowRight size={20} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </StandardContainer>

          {/* Scroll indicator — hidden on mobile */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-[var(--foreground-secondary)] opacity-80 animate-bounce z-10">
            <span className="text-xs tracking-widest uppercase font-medium">scroll</span>
            <ChevronDown size={20} strokeWidth={1.5} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            TERMINAL PREVIEW — macOS interface showcase
           ═══════════════════════════════════════════════ */}
        <section className="relative w-full py-10 md:py-20 px-5 md:px-6 z-10">
          <StandardContainer narrow>
            {/* Ambient glow behind the terminal */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 65%)",
                filter: "blur(60px)",
              }}
            />

            {/* Terminal card */}
            <div className="relative rounded-2xl overflow-hidden transition-colors duration-300"
              style={{
                background: "var(--background-secondary)",
                border: "1px solid var(--border)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 1px rgba(255,255,255,0.06)",
              }}
            >
              {/* macOS title bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]" />
                </div>
                <span className="ml-3 text-[11px] text-[var(--foreground-muted)] font-medium tracking-wide opacity-60">The Professor — Study Session</span>
              </div>

              {/* Terminal content — animated typewriter */}
              <TerminalDemo />
            </div>
          </StandardContainer>
        </section>

        <SocialProof />
        
        <PainSection />

        {/* ═══════════════════════════════════════════════
            HOW IT WORKS — Refined claymorphism + visual flow
           ═══════════════════════════════════════════════ */}
        <section id="how-it-works" className="relative w-full py-20 md:py-32 px-5 md:px-6 z-10 border-t border-[var(--border)]">
          <StandardContainer>
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--foreground-secondary)] mb-4">
                How it works
              </p>
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-4 md:mb-5 tracking-tight">
                The Frictionless Path to Mastery
              </h2>
              <p className="text-sm md:text-base text-[var(--foreground-secondary)] max-w-md mx-auto mb-16 md:mb-24">
                Upload your syllabus. Choose your weapon. Conquer the material.
              </p>

              {/* Steps row with pure negative space */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start relative">
                {/* Connecting line — desktop only */}
                <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent z-0" />

                {[
                  {
                    step: "01", icon: Upload, title: "Upload Anything",
                    desc: "PDF, DOCX, plain text — lecture notes, textbook chapters, whatever you have.",
                  },
                  {
                    step: "02", icon: Sparkles, title: "Pick Your Weapon",
                    desc: "Flashcards, quiz, summary, mind map — choose your exact study mode.",
                  },
                  {
                    step: "03", icon: Trophy, title: "Master It",
                    desc: "AI content tuned to your material. Walk into the exam confident.",
                  },
                ].map((item, i) => (
                  <div key={item.step} className="relative z-10 flex flex-col items-center group">
                    {/* Minimalist Icon Ring */}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--background)] border border-[var(--border)] mb-6 group-hover:scale-110 group-hover:border-[var(--foreground)] transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    >
                      <item.icon 
                        size={20} 
                        strokeWidth={1.5}
                        className="text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)] transition-colors duration-500"
                      />
                    </div>

                    {/* Step label */}
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-3 text-[var(--foreground-muted)]">
                      Step {item.step}
                    </p>
                    <h3 className="font-heading text-lg font-bold text-[var(--foreground)] mb-2.5">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed max-w-[240px] mx-auto">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </StandardContainer>
        </section>

        {/* ═══════════════════════════════════════════════
            FEATURES — Bento Grid with visual previews
           ═══════════════════════════════════════════════ */}
        <section className="relative w-full py-20 md:py-28 px-5 md:px-6 z-10">
          <StandardContainer>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--foreground-muted)] mb-4">
                Your arsenal
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
                Cheat Codes for Your Degree.
              </h2>
            </div>

            <LandingFeatures />
          </StandardContainer>
        </section>

        <Testimonials />
        <FAQ />


      {/* ═══════════════════════════════════════════════
          CTA — Layered Volumetric Depth
          3 depth layers: outer glow → glass → clay content
         ═══════════════════════════════════════════════ */}
      <section className="relative w-full px-5 md:px-6 z-10" style={{ paddingBlock: "clamp(5rem, 8vw, 9rem)" }}>
        <StandardContainer narrow>
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
                className="relative rounded-[calc(clamp(1.5rem,3vw,2.5rem)-1px)] overflow-hidden transition-colors duration-300"
                style={{
                  background: "var(--background-secondary)",
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
                  <div className="absolute top-8 left-8 w-20 h-20 rounded-full animate-float-abc pointer-events-none"
                    style={{ background: "var(--secondary-bg)", filter: "blur(40px)" }}
                  />
                  <div className="absolute bottom-12 right-12 w-28 h-28 rounded-full animate-float-xyz pointer-events-none"
                    style={{ background: "var(--accent-bg)", filter: "blur(40px)" }}
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
                        background: "linear-gradient(90deg, #3B82F6, #F97316, #3B82F6)",
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
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center">
                    <Link
                      href="/signup"
                      className="btn-skeuo-primary justify-center group"
                      style={{ fontSize: "clamp(0.85rem, 1.25vw, 1rem)", padding: "clamp(0.875rem, 1.5vw, 1.1rem) clamp(1.75rem, 3.5vw, 2.75rem)" }}
                    >
                      Get Started for Free
                      <Zap className="w-[18px] h-[18px] group-hover:rotate-12 transition-transform ml-1" strokeWidth={1.5} />
                    </Link>
                  </div>

                  {/* Trust signals — embedded in the card */}
                  <div
                    className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[var(--foreground-muted)]"
                    style={{ marginTop: "clamp(1.5rem, 3vw, 2.5rem)", fontSize: "clamp(0.7rem, 1vw, 0.8rem)" }}
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} strokeWidth={1.5} className="text-[var(--success)]" />
                      No credit card
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                      100 free credits
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Lock size={14} strokeWidth={1.5} className="text-[var(--secondary)]" />
                      Your data stays yours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StandardContainer>
      </section>

      {/* Old Footer removed to prevent duplication. Global Footer handles this. */}
      </main>
    </>
  );
}

