"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StandardContainer from "@/components/ui/StandardContainer";
import { Zap, Target, Book, Brain, Shield, ArrowRight, Trophy, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import TiltCard from "@/components/ui/TiltCard";

type ExamData = {
  name: string;
  fullName: string;
  year: string;
  description: string;
  difficulty: "High" | "Medium" | "Extreme";
  silos: { title: string; points: string[] }[];
  cta: string;
};

interface ExamBlueprintClientProps {
  slug: string;
  data: ExamData;
}

const THEMES = {
  jamb: {
    color: "var(--emerald)",
    glowColor: "rgba(43, 178, 136, 0.12)",
    accentBg: "rgba(43, 178, 136, 0.1)",
    accentBorder: "rgba(43, 178, 136, 0.2)",
    hoverBorder: "hover:border-[var(--emerald)]/40"
  },
  waec: {
    color: "var(--blue)",
    glowColor: "rgba(74, 124, 245, 0.12)",
    accentBg: "rgba(74, 124, 245, 0.1)",
    accentBorder: "rgba(74, 124, 245, 0.2)",
    hoverBorder: "hover:border-[var(--blue)]/40"
  },
  neco: {
    color: "var(--amber)",
    glowColor: "rgba(229, 169, 60, 0.12)",
    accentBg: "rgba(229, 169, 60, 0.1)",
    accentBorder: "rgba(229, 169, 60, 0.2)",
    hoverBorder: "hover:border-[var(--amber)]/40"
  },
  sat: {
    color: "var(--violet)",
    glowColor: "rgba(150, 115, 245, 0.12)",
    accentBg: "rgba(150, 115, 245, 0.1)",
    accentBorder: "rgba(150, 115, 245, 0.2)",
    hoverBorder: "hover:border-[var(--violet)]/40"
  },
  gcse: {
    color: "var(--amber)",
    glowColor: "rgba(229, 169, 60, 0.12)",
    accentBg: "rgba(229, 169, 60, 0.1)",
    accentBorder: "rgba(229, 169, 60, 0.2)",
    hoverBorder: "hover:border-[var(--amber)]/40"
  }
};

function playPop() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.error("Audio failed", e);
  }
}

export default function ExamBlueprintClient({ slug, data }: ExamBlueprintClientProps) {
  const router = useRouter();
  const theme = THEMES[slug.toLowerCase() as keyof typeof THEMES] || THEMES.gcse;

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    playPop();
    setTimeout(() => {
      router.push("/exams");
    }, 120);
  };

  const handleCtaClick = () => {
    playPop();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[var(--foreground)] pb-28 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div 
        className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] pointer-events-none opacity-30" 
        style={{ backgroundColor: theme.color }}
      />
      <div 
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] pointer-events-none opacity-20" 
        style={{ backgroundColor: "var(--amber)" }}
      />

      {/* Nav bar */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-8 relative z-10 flex items-center justify-between">
        <a
          href="/exams"
          onClick={handleBack}
          className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors text-[11px] font-black uppercase tracking-wider group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Vault
        </a>
      </div>

      <div className="pt-20 sm:pt-28">
        <StandardContainer narrow>
          {/* Hero */}
          <div className="text-center mb-20">
            <p 
              className="text-[10px] font-black uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-2"
              style={{ color: theme.color }}
            >
               <Trophy className="w-3 h-3" />
               <span>2026 Exam Pillar</span>
            </p>
            <h1 className="text-5xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">
               The {data.name} <br/> 
               <span style={{ color: theme.color }}>Weapon.</span>
            </h1>
            <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto font-medium font-serif leading-relaxed">
               {data.fullName} {data.year}. {data.description}
            </p>
          </div>

          {/* Stats/Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
             <GlassmorphicCard intensity="light" radius="32px" className="p-8 text-center border border-white/5">
                <Shield className="w-8 h-8 mx-auto mb-4" style={{ color: theme.color }} />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Difficulty</div>
                <div className="text-2xl font-black uppercase">{data.difficulty}</div>
             </GlassmorphicCard>
             <GlassmorphicCard intensity="light" radius="32px" className="p-8 text-center border border-white/5">
                <Clock className="w-8 h-8 mx-auto mb-4" style={{ color: theme.color }} />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Time Remaining</div>
                <div className="text-2xl font-black uppercase">Season Active</div>
             </GlassmorphicCard>
             <GlassmorphicCard intensity="light" radius="32px" className="p-8 text-center border border-white/5">
                <Brain className="w-8 h-8 mx-auto mb-4" style={{ color: theme.color }} />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Success Rate</div>
                <div className="text-2xl font-black uppercase">98.4%</div>
             </GlassmorphicCard>
          </div>

          {/* Content Silos */}
          <div className="space-y-12 mb-20">
             {data.silos.map((silo, i) => (
               <GlassmorphicCard 
                 key={i} 
                 intensity="medium" 
                 radius="40px" 
                 glowColor={theme.glowColor}
                 className={`group p-8 sm:p-12 border border-white/5 transition-all duration-300 ${theme.hoverBorder}`}
               >
                  <h2 className="text-3xl font-black mb-8 uppercase tracking-tight flex items-center gap-4 italic">
                     <span 
                       className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black font-mono border"
                       style={{ 
                         color: theme.color, 
                         backgroundColor: theme.accentBg, 
                         borderColor: theme.accentBorder 
                       }}
                     >
                       0{i+1}
                     </span>
                     {silo.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        {silo.points.map((point, pi) => (
                           <div key={pi} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.color }} />
                              <span className="text-lg font-medium opacity-80 font-serif">{point}</span>
                           </div>
                        ))}
                     </div>
                     <GlassmorphicCard intensity="light" radius="24px" className="hidden md:block p-8 border border-white/5">
                        <p className="text-sm italic text-[var(--foreground-muted)] leading-relaxed font-serif">
                           "The Professor's {silo.title.toLowerCase()} engine uses high-fidelity retrieval practice to ensure that {data.name} patterns become muscle memory."
                        </p>
                     </GlassmorphicCard>
                  </div>
               </GlassmorphicCard>
             ))}
          </div>

          {/* Sticky CTA Footer */}
          <GlassmorphicCard intensity="heavy" radius="48px" className="p-12 border border-white/10 text-center shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
             <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter leading-none italic">
                Don't just take {data.name}. <br/> <span className="opacity-40">Dismantle it.</span>
             </h2>
             <p className="text-lg opacity-60 mb-10 max-w-md mx-auto font-bold uppercase tracking-widest font-mono">
                Access the full {data.name} 2026 study suite now.
             </p>
             <Link 
               href="/signup" 
               onClick={handleCtaClick}
               className="inline-flex items-center gap-4 px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
               style={{ 
                 backgroundColor: theme.color,
                 color: slug.toLowerCase() === 'sat' ? '#ffffff' : '#000000'
               }}
             >
                {data.cta} <ArrowRight className="w-5 h-5" />
             </Link>
          </GlassmorphicCard>
        </StandardContainer>
      </div>
    </div>
  );
}
