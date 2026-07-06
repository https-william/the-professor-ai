import { Metadata } from "next";
import Link from "next/link";
import { Zap, CheckCircle2, Star, ArrowLeftRight, TrendingUp, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Best AI Tools for Students (2026) | Elite Academic Stack",
  description: "The definitive guide to the best AI study tools in 2026. Comparing The Professor, Claude, Perplexity, and more for elite academic performance.",
  keywords: ["best ai for students", "ai study tools 2026", "study tools for college", "exam prep ai", "best ai tutor"],
};

const tools = [
  {
    name: "The Professor AI",
    category: "Smart Study & Exams",
    bestFor: "Retrieval Practice, Exam Simulation, High-Fidelity Flashcards",
    rating: "9.9/10",
    pros: ["100% syllabus alignment", "Zero-distraction UI", "Advanced active recall engine"],
    cons: ["Academic focus only (not for general AI chat)"]
  },
  {
    name: "Claude 3.5 Sonnet",
    category: "Logic & STEM",
    bestFor: "Complex Math, Coding, Logical Reasoning",
    rating: "9.7/10",
    pros: ["Superior reasoning", "Large context window", "Human-like prose"],
    cons: ["Can be slow during peak hours", "Limited free tier"]
  },
  {
    name: "Perplexity",
    category: "Research & Fact-Finding",
    bestFor: "Citing sources, live web research, quick answers",
    rating: "9.5/10",
    pros: ["Instant citations", "Clean UI", "Good mobile app"],
    cons: ["Lacks specialized study workflows", "Summaries can be superficial"]
  }
];

export default function PillarPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground-secondary)] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent)] mb-3 flex items-center justify-center gap-2">
             <Trophy className="w-3 h-3" />
             <span>2026 Definitive Guide</span>
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
             Best AI Tools for Students (2026): The Elite Stack
          </h1>
          <p className="text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
             Stop using general-purpose bots for specialized academic study. This is the definitive list of AI utilities that will actually improve your grades, not just your GPT dependencies.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.02]">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-white/5">
                    <th className="p-6 text-sm font-black uppercase text-white/30">Tool</th>
                    <th className="p-6 text-sm font-black uppercase text-white/30">Primary Intent</th>
                    <th className="p-6 text-sm font-black uppercase text-white/30">Smart Grade</th>
                 </tr>
              </thead>
              <tbody>
                 {tools.map((tool, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                       <td className="p-6 font-bold text-white">{tool.name}</td>
                       <td className="p-6 text-sm text-white/50">{tool.bestFor}</td>
                       <td className="p-6">
                          <span className="px-3 py-1 rounded-full bg-[var(--accent-bg)]/20 text-[var(--accent)] text-xs font-bold">
                             {tool.rating}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Deep Dives */}
        <div className="space-y-12">
           {tools.map((tool, i) => (
              <div key={i} className="p-8 md:p-12 rounded-[40px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                 <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1">
                       <h2 className="text-3xl font-bold text-white mb-4">{tool.name}</h2>
                       <p className="text-[12px] font-black text-[var(--accent)] uppercase tracking-widest mb-6">{tool.category}</p>
                       <p className="text-lg text-white/60 mb-8 leading-relaxed">
                          {tool.bestFor}. Unlike generic assistants, {tool.name} focuses on the core intent of {tool.category.toLowerCase()}.
                       </p>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <h4 className="text-sm font-bold text-white mb-4">Key Wins</h4>
                             <ul className="space-y-3">
                                {tool.pros.map((pro, j) => (
                                   <li key={j} className="flex items-start gap-3 text-sm text-white/50">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      {pro}
                                   </li>
                                ))}
                             </ul>
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-white mb-4">Limitations</h4>
                             <ul className="space-y-3">
                                {tool.cons.map((con, j) => (
                                   <li key={j} className="flex items-start gap-3 text-sm text-white/30 italic">
                                      <TrendingUp className="w-4 h-4 text-rose-500/50 mt-0.5 flex-shrink-0 rotate-180" />
                                      {con}
                                   </li>
                                ))}
                             </ul>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>

        {/* Conversion Section */}
        <div className="mt-24 p-12 rounded-[50px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
           <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-[var(--background)] mb-6">Experience the Evolution</h2>
              <p className="text-[var(--background)]/70 max-w-2xl mx-auto mb-10 text-lg">
                 Stop reading about the tools. Start using the one built for academic success. 
              </p>
              <Link href="/signup" className="inline-block px-12 py-5 rounded-3xl bg-[var(--background)] text-white font-black uppercase tracking-[0.2em] shadow-2xl hover-scale-lg transition-all">
                 Join the Lab
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
