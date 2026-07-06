import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, Target, Book, Brain, Shield, ArrowRight, Trophy } from "lucide-react";

type SubjectData = {
  name: string;
  intent: string;
  bestTools: { name: string; why: string }[];
  tips: string[];
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
    tips: ["Visual recall for anatomy diagrams", "Mnemonic AI generation", "Concept layering"],
    faq: [{ q: "Can AI explain Biology practicals?", a: "Yes, AI can simulate the logic of a practical experiment and explain the expected observations." }]
  },
  math: {
    name: "Mathematics",
    intent: "problem-solving, formula derivation, and logical proofs",
    bestTools: [
      { name: "Claude 3.5 Sonnet", why: "Unmatched for step-by-step logical derivation." },
      { name: "Photomath", why: "Rapid recognition of handwritten formulas." }
    ],
    tips: ["Variable manipulation drills", "Logic-first proofing", "Pattern recognition"],
    faq: [{ q: "Will AI solve my math homework?", a: "It can, but the smart student uses it to understand the 'why' behind the derivation." }]
  },
  jamb: {
    name: "JAMB (UTME)",
    intent: "acing the 2026 CBT exam with speed and accuracy",
    bestTools: [
      { name: "The Professor AI", why: "Custom JAMB CBT simulator and syllabus-synced quizzes." },
      { name: "Past Question AI", why: "Analyzing 10 years of trends." }
    ],
    tips: ["CBT interface desensitization", "Time-pressure sprints", "Use of English study"],
    faq: [{ q: "What is the best AI for JAMB 2026?", a: "The Professor AI is the only platform with a dedicated JAMB 2026 strategy engine." }]
  },
  waec: {
    name: "WAEC (WASSCE)",
    intent: "understanding the West African curriculum and marking scheme",
    bestTools: [
      { name: "The Professor AI", why: "Syllabus-locked extraction and essay plan generation." },
      { name: "MySchool", why: "Verified past question database." }
    ],
    tips: ["Marking scheme analysis", "Essay logic structuring", "Objective speed runs"],
    faq: [{ q: "Can AI help with WAEC practicals?", a: "It provides the underlying theory and step-by-step logic expected by WAEC examiners." }]
  },
  sat: {
    name: "SAT Prep",
    intent: "acing the Digital SAT with adaptive logic and speed",
    bestTools: [
      { name: "Khan Academy", why: "Official partner for foundational practice." },
      { name: "The Professor AI", why: "Intensive logic drills for the Reading & Writing modules." }
    ],
    tips: ["Contextual vocabulary tips", "Math logic shortcuts", "Desmos study"],
    faq: [{ q: "Is the SAT still relevant?", a: "In 2026, it remains the gold standard for global university benchmarking." }]
  },
  gcse: {
    name: "GCSE & A Levels",
    intent: "achieving Grade 9/A* performance through curriculum study",
    bestTools: [
      { name: "Save My Exams", why: "Topic-specific practice papers." },
      { name: "The Professor AI", why: "Forcing active recall on specific exam board specifications (AQA, OCR, Edexcel)." }
    ],
    tips: ["Specification-locked revision", "Keyword extraction for marks", "Spaced recall cycles"],
    faq: [{ q: "Does AI know the AQA spec?", a: "The Professor AI can be locked to specific PDF specifications to ensure total alignment." }]
  },
  medical: {
    name: "Medical Students",
    intent: "managing the cognitive load of anatomy, pharmacology, and pathology",
    bestTools: [
      { name: "Osmosis", why: "High-quality visual learning." },
      { name: "The Professor AI", why: "Turning massive clinical textbooks into high-fidelity diagnostic simulations." }
    ],
    tips: ["Pathology logic mapping", "Drug mechanism mnemonics", "Case-study simulations"],
    faq: [{ q: "Can AI replace medical textbooks?", a: "No, but it acts as a high-speed extractor for the core logic buried in those textbooks." }]
  },
  engineering: {
    name: "Engineering",
    intent: "understanding physical principles, complex math, and systems design",
    bestTools: [
      { name: "Wolfram Alpha", why: "Computational engine for complex calculus." },
      { name: "The Professor AI", why: "De-jargonizing physical principles and thermal dynamics." }
    ],
    tips: ["First-principles derivation", "Formula relationship mapping", "System stress-testing"],
    faq: [{ q: "Can AI help with CAD logic?", a: "It can explain the underlying geometric and physical constraints of a design." }]
  },
  "college-prep": {
    name: "College Prep",
    intent: "bridging the gap between high school and university life",
    bestTools: [
      { name: "The Professor AI", why: "Teaching the 'Smart Study' mindset before you reach campus." }
    ],
    tips: ["Note-taking architecture", "Time-block planning", "Academic writing logic"],
    faq: [{ q: "When should I start college prep?", a: "The earlier you build the 'Academic Weapon' mindset, the easier your first year will be." }]
  },
  "exam-anxiety": {
    name: "Exam Anxiety",
    intent: "building the psychological calm that comes from total competence",
    bestTools: [
      { name: "The Professor AI", why: "Simulating the exam environment until the fear vanishes." }
    ],
    tips: ["Exposure therapy via quizzes", "Confidence building sprints", "Logic grounding"],
    faq: [{ q: "Does AI help with stress?", a: "Preparation is the best antidote to anxiety. Competence breeds calm." }]
  }
};

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
