"use client";

import Link from "next/link";
import { glossaryTerms } from "@/lib/blog/glossary";
import { Brain, Search, ArrowRight } from "lucide-react";

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground-secondary)] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-4 tracking-tight">Study Intelligence Glossary</h1>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto font-medium">
            The semantic foundation of elite learning. Master the definitions that drive academic dominance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossaryTerms.map((term) => (
            <Link 
              key={term.slug}
              href={`/glossary/${term.slug}`}
              className="group p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--accent)] transition-colors">
                {term.term}
              </h2>
              <p className="text-sm text-white/40 line-clamp-2">
                {term.definition}
              </p>
              <div className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                View Definition <ArrowRight className="ml-2 w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
