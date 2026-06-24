"use client";

import Link from "next/link";
import { glossaryTerms } from "@/lib/blog/glossary";
import { Brain, Search, ArrowRight, BookOpen } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import TiltCard from "@/components/ui/TiltCard";

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[var(--foreground-secondary)] pt-32 pb-20 relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--amber)]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--violet)]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--amber)] text-[10px] font-black uppercase tracking-widest mb-6">
             <BookOpen className="w-3 h-3" /> Cognitive Toolkit
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight italic uppercase">
            Study Intelligence Glossary
          </h1>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto font-medium font-serif leading-relaxed">
            The foundation of smart learning. Understand the concepts, frameworks, and terminology that power high-efficiency academic success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {glossaryTerms.map((term) => (
            <Link 
              key={term.slug}
              href={`/glossary/${term.slug}`}
              className="group block select-none outline-none"
            >
              <TiltCard glowColor="rgba(229, 169, 60, 0.12)" borderRadius="24px" className="h-full">
                <GlassmorphicCard 
                  intensity="medium"
                  radius="24px"
                  className="p-6 border border-white/5 group-hover:border-[var(--amber)]/40 transition-all flex flex-col justify-between h-full"
                >
                  <div>
                    <h2 className="text-xl font-black text-white mb-2 group-hover:text-[var(--amber)] transition-colors italic uppercase">
                      {term.term}
                    </h2>
                    <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 font-serif font-medium leading-relaxed">
                      {term.definition}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-[var(--amber)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                    View Definition <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </div>
                </GlassmorphicCard>
              </TiltCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
