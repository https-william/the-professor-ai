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
import LandingUpload from "@/components/landing/LandingUpload";
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
            HERO — "Drop your notes. Walk into any exam ready."
            Floating dance + shimmer sweep
           ═══════════════════════════════════════════════ */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-5 pt-24 md:pt-28 pb-16 md:pb-20 z-10">
          <StandardContainer className="flex flex-col items-center">
            {/* Header Scroll Sentinel */}
            <div data-header-sentinel className="absolute top-0 left-0 h-1 w-full pointer-events-none" />
            
            {/* Headline — Impeccable Typography */}
            <h1 className="text-center leading-[1.05] mb-6 md:mb-8 animate-fade-in-up font-galaxie tracking-tight" style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
              <span className="block font-medium text-[var(--foreground)]">
                Drop your notes.
              </span>
              <span className="block font-bold mt-2">
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
                    Walk into any <br className="md:hidden" /> exam ready.
                  </span>
                  <span className="relative" style={{
                      background: "linear-gradient(135deg, #60A5FA 0%, #FB923C 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                  }}>
                    Walk into any <br className="md:hidden" /> exam ready.
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

            {/* Primary Action — The Upload Box */}
            <div className="w-full max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
              <LandingUpload />
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
      {/* ═══════════════════════════════════════════════
          FINAL CTA — The Demo
         ═══════════════════════════════════════════════ */}
      <section className="relative w-full px-5 md:px-6 z-10" style={{ paddingBlock: "clamp(5rem, 8vw, 9rem)" }}>
        <StandardContainer narrow>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading font-black text-[var(--foreground)] leading-[1.1] tracking-tighter mb-6" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
              Ready to kill <br className="hidden md:block" /> that exam?
            </h2>
            <p className="text-[var(--foreground-secondary)] max-w-md mx-auto mb-12 text-lg">
              Upload your notes now. No account needed for your first session.
            </p>
            
            <LandingUpload compact />
          </div>
        </StandardContainer>
      </section>

      {/* Old Footer removed to prevent duplication. Global Footer handles this. */}
      </main>
    </>
  );
}

