import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Globe, Trophy } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "2026 AI Exam Guides | WAEC, JAMB, NECO, SAT & GCSE Preparation",
  description: "Strategic AI-powered preparation guides for major 2026 regional and international exams.",
};

const exams = [
  {
    slug: "jamb",
    name: "JAMB 2026",
    description: "Dominating the Computer Based Test (CBT) with AI simulations.",
    color: "from-emerald-500/20 to-emerald-900/20",
    border: "border-emerald-500/20",
    icon: Trophy
  },
  {
    slug: "waec",
    name: "WAEC 2026",
    description: "Mastering the marking scheme with logic-based essay prep.",
    color: "from-blue-500/20 to-blue-900/20",
    border: "border-blue-500/20",
    icon: GraduationCap
  },
  {
    slug: "neco",
    name: "NECO 2026",
    description: "High-fidelity summaries for the SSCE curriculum.",
    color: "from-amber-500/20 to-amber-900/20",
    border: "border-amber-500/20",
    icon: BookOpen
  },
  {
    slug: "sat",
    name: "SAT Prep",
    description: "AI-driven adaptive testing for the Digital SAT era.",
    color: "from-purple-500/20 to-purple-900/20",
    border: "border-purple-500/20",
    icon: Globe
  }
];

export default function ExamsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-black uppercase tracking-widest mb-6">
             <Trophy className="w-3 h-3" /> National & International
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">The 2026 <br/> Exam Vault</h1>
          <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto font-medium">
            Strategic AI blueprints for every major milestone. Don't just study—execute with a marking-scheme-aware strategy.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {exams.map((exam) => (
            <Link 
              key={exam.slug}
              href={`/exams/${exam.slug}`}
              className={`group relative p-10 rounded-[40px] border-2 ${exam.border} bg-gradient-to-br ${exam.color} transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                 <exam.icon size={80} strokeWidth={1} />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-4 group-hover:translate-x-2 transition-transform duration-300">{exam.name}</h2>
                <p className="text-lg text-[var(--foreground-secondary)] font-medium mb-8 max-w-sm">
                  {exam.description}
                </p>
                <div className="inline-flex items-center gap-2 text-[var(--foreground)] font-black text-xs uppercase tracking-[0.2em]">
                  View Blueprint <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-32 p-12 rounded-[48px] bg-[var(--background-secondary)] border border-[var(--border)] text-center">
           <BrandLogo size="lg" className="mx-auto mb-8 opacity-20" />
           <h3 className="text-2xl font-black mb-4">Don't see your exam?</h3>
           <p className="text-[var(--foreground-muted)] mb-8 font-medium">Our AI can ingest any syllabus. Launch the Hub to create a custom study pack.</p>
           <Link href="/signup" className="px-8 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-all">
              Launch Global Revision Hub
           </Link>
        </section>
      </div>
    </div>
  );
}
