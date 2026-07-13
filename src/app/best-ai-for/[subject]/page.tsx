import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, Target, Book, Brain, Shield, ArrowRight, Trophy } from "lucide-react";

import { subjects } from "@/lib/blog/subjects";

export async function generateStaticParams() {
  return Object.keys(subjects).map((subject) => ({
    subject,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> {
  const { subject } = await params;
  const data = subjects[subject];
  if (!data) return { title: "Subject Not Found" };

  return {
    title: `Best AI for ${data.name} Students (2026) | Smart Revision Guide`,
    description: `How to use AI for ${data.name} to study 3x faster. Discover the best tools for ${data.intent}.`,
    keywords: [`best ai for ${subject}`, `${data.name} study tools`, "ai revision guide"],
  };
}

export default async function SubjectSEOPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const data = subjects[subject];
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <header className="mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent)] mb-3 flex items-center gap-2">
             <Trophy className="w-3 h-3" />
             <span>Subject Authority</span>
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-[var(--foreground)]">
             Best AI for {data.name} Students (2026)
          </h1>
          <p className="text-xl text-[var(--foreground-muted)] leading-relaxed font-medium">
             In 2026, general AI is not enough. You need specific logic for {data.intent}. Here is the smart guide to acing {data.name}.
          </p>
        </header>

        {/* Tools List */}
        <section className="space-y-6 mb-20">
           <h2 className="text-2xl font-bold mb-8 text-[var(--foreground)]">The Recommended Stack</h2>
           {data.bestTools.map((tool, i) => (
             <div key={i} className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] flex flex-col md:flex-row justify-between items-center gap-6 shadow-[var(--shadow-sm)]">
                <div>
                   <h3 className="text-xl font-bold mb-1 text-[var(--accent)]">{tool.name}</h3>
                   <p className="text-sm text-[var(--foreground-muted)]">{tool.why}</p>
                </div>
                <Link href="/signup" className="px-6 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-xs tracking-widest hover-scale-lg active:scale-95 transition-all">
                   Try Tool
                </Link>
             </div>
           ))}
        </section>

        {/* The Tips */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
           {data.tips.map((tip, i) => (
             <div key={i} className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--accent-glow)] transition-all">
                <Zap className="w-6 h-6 text-[var(--accent)] mb-4" />
                <h4 className="font-bold mb-2 text-[var(--foreground)]">{tip}</h4>
                <p className="text-xs text-[var(--foreground-muted)] opacity-60">Smartly implemented via the 'Professor Recall Loop'.</p>
             </div>
           ))}
        </section>

        {/* Conversion */}
        <div className="p-12 rounded-[40px] bg-[var(--accent-bg)] border border-[var(--accent-glow)] text-center">
           <h2 className="text-3xl font-black mb-6 uppercase text-[var(--accent)]">Ready to ace {data.name}?</h2>
           <p className="text-[var(--foreground-muted)] mb-10 max-w-lg mx-auto font-medium">
              Join the circle of students who use AI as a tool, not a crutch.
           </p>
           <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest hover-scale-lg active:scale-95 transition-all shadow-xl">
              Join the Lab <ArrowRight className="w-4 h-4" />
           </Link>
        </div>
      </div>
    </div>
  );
}
