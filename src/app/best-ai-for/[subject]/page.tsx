import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, Target, Book, Brain, Shield, ArrowRight, Trophy } from "lucide-react";

type SubjectData = {
  name: string;
  intent: string;
  bestTools: { name: string; why: string }[];
  hacks: string[];
  faq: { q: string; a: string }[];
};

const subjects: Record<string, SubjectData> = {
  biology: {
    name: "Biology",
    intent: "memorizing complex systems, biochemical pathways, and terminology",
    bestTools: [
      { name: "The Professor AI", why: "For neural mapping of complex metabolic cycles." },
      { name: "Anki", why: "For cellular terminology repetition." }
    ],
    hacks: ["Visual recall for anatomy diagrams", "Mnemonic AI generation", "Concept layering"],
    faq: [{ q: "Can AI explain Biology practicals?", a: "Yes, AI can simulate the logic of a practical experiment and explain the expected observations." }]
  },
  math: {
    name: "Mathematics",
    intent: "problem-solving, formula derivation, and logical proofs",
    bestTools: [
      { name: "Claude 3.5 Sonnet", why: "Unmatched for step-by-step logical derivation." },
      { name: "Photomath", why: "Rapid recognition of handwritten formulas." }
    ],
    hacks: ["Variable manipulation drills", "Logic-first proofing", "Pattern recognition"],
    faq: [{ q: "Will AI solve my math homework?", a: "It can, but the Strategic Master uses it to understand the 'why' behind the derivation." }]
  },
  jamb: {
    name: "JAMB (UTME)",
    intent: "crushing the 2026 CBT exam with speed and accuracy",
    bestTools: [
      { name: "The Professor AI", why: "Custom JAMB CBT simulator and syllabus-synced quizzes." },
      { name: "Past Question AI", why: "Analyzing 10 years of trends." }
    ],
    hacks: ["CBT interface desensitization", "Time-pressure sprints", "Use of English strategy"],
    faq: [{ q: "What is the best AI for JAMB 2026?", a: "The Professor AI is the only platform with a dedicated JAMB 2026 strategy engine." }]
  }
};

export async function generateStaticParams() {
  return Object.keys(subjects).map((subject) => ({
    subject,
  }));
}

export async function generateMetadata({ params }: { params: { subject: string } }): Promise<Metadata> {
  const data = subjects[params.subject];
  if (!data) return { title: "Subject Not Found" };

  return {
    title: `Best AI for ${data.name} Students (2026) | Elite Revision Guide`,
    description: `How to use AI for ${data.name} to study 3x faster. Discover the best tools for ${data.intent}.`,
    keywords: [`best ai for ${params.subject}`, `${params.subject} study tools`, "ai revision guide"],
  };
}

export default function SubjectSEOPage({ params }: { params: { subject: string } }) {
  const data = subjects[params.subject];
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)] text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg)]/20 border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-black uppercase tracking-widest mb-6">
             <Trophy className="w-3 h-3" /> Subject Authority
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
             Best AI for {data.name} Students (2026)
          </h1>
          <p className="text-xl text-white/50 leading-relaxed">
             In 2026, general AI is not enough. You need specific logic for {data.intent}. Here is the strategist's guide to dominating {data.name}.
          </p>
        </header>

        {/* Tools List */}
        <section className="space-y-6 mb-20">
           <h2 className="text-2xl font-bold mb-8">The Recommended Stack</h2>
           {data.bestTools.map((tool, i) => (
             <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-xl font-bold mb-1 text-[var(--accent)]">{tool.name}</h3>
                   <p className="text-sm text-white/50">{tool.why}</p>
                </div>
                <Link href="/signup" className="px-6 py-3 rounded-xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
                   Try Tool
                </Link>
             </div>
           ))}
        </section>

        {/* The Hacks */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
           {data.hacks.map((hack, i) => (
             <div key={i} className="p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
                <Zap className="w-6 h-6 text-[var(--accent)] mb-4" />
                <h4 className="font-bold mb-2">{hack}</h4>
                <p className="text-xs text-white/30">Strategically implemented via the 'Professor Recall Loop'.</p>
             </div>
           ))}
        </section>

        {/* Conversion */}
        <div className="p-12 rounded-[40px] bg-[var(--accent-bg)]/20 border border-[var(--accent-glow)] text-center">
           <h2 className="text-3xl font-black mb-6 uppercase">Ready to dominate {data.name}?</h2>
           <p className="text-white/50 mb-10 max-w-lg mx-auto">
              Join the elite circle of students who use AI as a weapon, not a crutch.
           </p>
           <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all">
              Join the Lab <ArrowRight className="w-4 h-4" />
           </Link>
        </div>
      </div>
    </div>
  );
}
