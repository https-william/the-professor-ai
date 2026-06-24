"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Globe, Trophy } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import TiltCard from "@/components/ui/TiltCard";

interface ExamItem {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  themeKey: 'jamb' | 'waec' | 'neco' | 'sat';
}

const exams: ExamItem[] = [
  {
    slug: "jamb",
    name: "JAMB 2026",
    description: "Acing the Computer Based Test (CBT) with AI simulations.",
    icon: Trophy,
    themeKey: "jamb"
  },
  {
    slug: "waec",
    name: "WAEC 2026",
    description: "Understanding the marking scheme with logic-based essay prep.",
    icon: GraduationCap,
    themeKey: "waec"
  },
  {
    slug: "neco",
    name: "NECO 2026",
    description: "High-fidelity summaries for the SSCE curriculum.",
    icon: BookOpen,
    themeKey: "neco"
  },
  {
    slug: "sat",
    name: "SAT Prep",
    description: "AI-driven adaptive testing for the Digital SAT era.",
    icon: Globe,
    themeKey: "sat"
  }
];

const THEMES = {
  jamb: {
    color: "var(--emerald)",
    glowColor: "rgba(43, 178, 136, 0.15)",
    borderClass: "hover:border-[var(--emerald)]/40"
  },
  waec: {
    color: "var(--blue)",
    glowColor: "rgba(74, 124, 245, 0.15)",
    borderClass: "hover:border-[var(--blue)]/40"
  },
  neco: {
    color: "var(--amber)",
    glowColor: "rgba(229, 169, 60, 0.15)",
    borderClass: "hover:border-[var(--amber)]/40"
  },
  sat: {
    color: "var(--violet)",
    glowColor: "rgba(150, 115, 245, 0.15)",
    borderClass: "hover:border-[var(--violet)]/40"
  }
};

export default function ExamsClient() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[var(--foreground)] pt-32 pb-20 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--violet)]/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--amber)]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--amber)] text-[10px] font-black uppercase tracking-widest mb-6">
             <Trophy className="w-3 h-3" /> National & International
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight italic uppercase">
            The 2026 <br/> Exam Vault
          </h1>
          <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto font-medium font-serif leading-relaxed">
            Smart AI blueprints for every major milestone. Don't just study—execute with a marking-scheme-aware plan.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {exams.map((exam) => {
            const theme = THEMES[exam.themeKey];
            return (
              <Link 
                key={exam.slug}
                href={`/exams/${exam.slug}`}
                className="group select-none outline-none block"
              >
                <TiltCard glowColor={theme.glowColor} borderRadius="28px" className="h-full">
                  <GlassmorphicCard 
                    intensity="medium"
                    radius="28px"
                    className={`relative p-10 border border-white/5 transition-all duration-300 flex flex-col justify-between h-full overflow-hidden ${theme.borderClass}`}
                  >
                    <div 
                      className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ color: theme.color }}
                    >
                       <exam.icon size={80} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                      <h2 
                        className="text-3xl font-black mb-4 group-hover:translate-x-2 transition-transform duration-300 italic uppercase"
                        style={{ color: theme.color }}
                      >
                        {exam.name}
                      </h2>
                      <p className="text-lg text-[var(--foreground-secondary)] font-medium mb-8 max-w-sm font-serif">
                        {exam.description}
                      </p>
                      <div className="inline-flex items-center gap-2 text-[var(--foreground)] font-black text-xs uppercase tracking-[0.2em]">
                        View Blueprint <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </GlassmorphicCard>
                </TiltCard>
              </Link>
            );
          })}
        </div>
 
        <section className="mt-32">
          <GlassmorphicCard intensity="medium" radius="32px" className="p-12 border border-white/5 text-center">
             <BrandLogo size="lg" className="mx-auto mb-8 opacity-20" />
             <h3 className="text-2xl font-black mb-4 italic uppercase">Don't see your exam?</h3>
             <p className="text-[var(--foreground-muted)] mb-8 font-medium font-serif">Our AI can ingest any syllabus. Launch the Hub to create a custom study pack.</p>
             <Link href="/signup" className="inline-block px-8 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-[0.98] transition-all">
                Launch Global Revision Hub
             </Link>
          </GlassmorphicCard>
        </section>
      </div>
    </div>
  );
}
