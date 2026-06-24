"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { glossaryTerms } from "@/lib/blog/glossary";

type TermData = {
  term: string;
  definition: string;
  extendedDefinition: string;
  faqs: { question: string; answer: string }[];
  relatedTerms: string[];
};

interface GlossaryTermClientProps {
  term: TermData;
}

function playPadSwell() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "triangle";
    
    osc.frequency.setValueAtTime(220, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 1.2); 
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 1.2);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.8); 
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.5); 
    
    osc.start();
    osc.stop(ctx.currentTime + 1.6);
  } catch (e) {
    console.error("Audio failed", e);
  }
}

export default function GlossaryTermClient({ term }: GlossaryTermClientProps) {
  useEffect(() => {
    playPadSwell();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-[var(--foreground)] pt-32 pb-20 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--amber)]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--violet)]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <Link 
          href="/glossary"
          className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-12 transition-colors font-bold uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Library / Glossary
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-2 text-[var(--amber)] mb-4">
             <Sparkles className="w-4 h-4 fill-current" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Core Concept</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight italic uppercase">
            {term.term}
          </h1>
          <GlassmorphicCard 
            intensity="medium" 
            radius="40px" 
            glowColor="rgba(229, 169, 60, 0.06)"
            className="p-8 md:p-10 border border-white/5 shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <BookOpen className="w-20 h-20 text-[var(--amber)]" />
            </div>
            <p className="text-xl md:text-2xl text-white leading-relaxed font-serif italic relative z-10">
              "{term.definition}"
            </p>
          </GlassmorphicCard>
        </header>

        <section className="prose prose-invert max-w-none mb-20">
          <h2 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.4em] mb-8">Deep Dive</h2>
          <p className="text-[var(--foreground)] leading-relaxed text-xl font-medium font-serif opacity-90">
            {term.extendedDefinition}
          </p>
        </section>

        {term.faqs.length > 0 && (
          <section className="mb-20">
            <h2 className="text-2xl font-black text-white mb-10 flex items-center gap-3 italic uppercase">
              <MessageSquare className="w-6 h-6 text-[var(--amber)]" /> FAQs
            </h2>
            <div className="space-y-6">
              {term.faqs.map((faq, i) => (
                <GlassmorphicCard 
                  key={i} 
                  intensity="light" 
                  radius="24px"
                  className="p-8 border border-white/5 shadow-sm"
                >
                  <h3 className="font-black text-lg text-white mb-3 italic uppercase">{faq.question}</h3>
                  <p className="text-[var(--foreground-muted)] leading-relaxed font-medium font-serif">{faq.answer}</p>
                </GlassmorphicCard>
              ))}
            </div>
          </section>
        )}

        {term.relatedTerms.length > 0 && (
          <section className="pt-16 border-t border-white/5">
            <h2 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.4em] mb-8">Connect the Dots</h2>
            <div className="flex flex-wrap gap-4">
              {term.relatedTerms.map((slug) => {
                const related = glossaryTerms.find(t => t.slug === slug);
                if (!related) return null;
                return (
                  <Link 
                    key={slug}
                    href={`/glossary/${slug}`}
                    className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[var(--amber)]/40 hover:bg-white/[0.05] hover:text-[var(--amber)] text-sm font-bold transition-all hover:scale-105 active:scale-95 text-[var(--foreground-secondary)]"
                  >
                    {related.term}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
