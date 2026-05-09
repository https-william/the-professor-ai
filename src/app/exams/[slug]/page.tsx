import { Metadata } from "next";
import { notFound } from "next/navigation";
import StandardContainer from "@/components/ui/StandardContainer";
import { Zap, Target, Book, Brain, Shield, ArrowRight, Trophy, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import NavPill from "@/components/landing/NavPill";

type ExamData = {
  name: string;
  fullName: string;
  year: string;
  description: string;
  difficulty: "High" | "Medium" | "Extreme";
  silos: { title: string; points: string[] }[];
  cta: string;
};

const examRegistry: Record<string, ExamData> = {
  jamb: {
    name: "JAMB",
    fullName: "Joint Admissions and Matriculation Board (UTME)",
    year: "2026",
    description: "The 2026 JAMB season is expected to be the most competitive yet. Success requires more than reading—it requires CBT mastery and strategic retrieval.",
    difficulty: "High",
    silos: [
      { title: "CBT Simulation", points: ["Timed practice under exam conditions", "Interface desensitization", "Automatic marking & correction"] },
      { title: "Syllabus Mastery", points: ["Use of English intensive drills", "Subject-specific retrieval loops", "Past question trend analysis"] }
    ],
    cta: "Secure your 300+ score"
  },
  waec: {
    name: "WAEC",
    fullName: "West African Senior School Certificate Examination (WASSCE)",
    year: "2026",
    description: "Master the WAEC marking scheme. We turn complex syllabus requirements into structured, high-yield revision plans.",
    difficulty: "High",
    silos: [
      { title: "Marking Scheme Logic", points: ["Learning what examiners look for", "Essay structuring frameworks", "Practical theory drills"] },
      { title: "Subject Silos", points: ["Biology pathways mapping", "Chemistry logic drills", "Physics derivation practice"] }
    ],
    cta: "Guarantee your A1s"
  },
  neco: {
    name: "NECO",
    fullName: "National Examinations Council (SSCE)",
    year: "2026",
    description: "National standard excellence. Our AI-native strategy aligns perfectly with the NECO curriculum for maximum performance.",
    difficulty: "Medium",
    silos: [
      { title: "Curriculum Alignment", points: ["NECO-specific past question bank", "Logic-first objective practice", "Time management sprints"] }
    ],
    cta: "Dominate the SSCE"
  },
  sat: {
    name: "Digital SAT",
    fullName: "Scholastic Assessment Test",
    year: "2026",
    description: "The Digital SAT demands adaptive logic. We provide the highest-fidelity practice for the 2026 test cycle.",
    difficulty: "Extreme",
    silos: [
      { title: "Adaptive Logic", points: ["Module 2 'Hard' difficulty simulation", "Desmos calculator hacking", "Contextual reading strategies"] }
    ],
    cta: "Master the 1600"
  },
  gcse: {
    name: "GCSE",
    fullName: "General Certificate of Secondary Education",
    year: "2026",
    description: "Grade 9 performance is a result of strategy, not just effort. Align your revision with the 2026 exam board specs.",
    difficulty: "High",
    silos: [
      { title: "Exam Board Locking", points: ["AQA specification mastery", "Edexcel pattern recognition", "OCR logic drills"] }
    ],
    cta: "Unlock Grade 9"
  }
};

export async function generateStaticParams() {
  return Object.keys(examRegistry).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = examRegistry[slug];
  if (!data) return { title: "Exam Not Found" };

  return {
    title: `${data.name} ${data.year} Revision & Study Guide | The Professor AI`,
    description: `${data.name} ${data.year}. ${data.description}`,
    keywords: [`${data.name} 2026`, `how to pass ${data.name}`, `best ai for ${data.name}`],
  };
}

export default async function ExamLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = examRegistry[slug.toLowerCase()];
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28">
      <NavPill />
      
      <div className="pt-32 sm:pt-40">
        <StandardContainer narrow>
          {/* Hero */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.3em] mb-8">
               <Trophy className="w-3 h-3" /> 2026 Exam Pillar
            </div>
            <h1 className="text-5xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tighter uppercase">
               The {data.name} <br/> <span className="text-[var(--accent)]">Weapon.</span>
            </h1>
            <p className="text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto font-medium leading-relaxed">
               {data.fullName} {data.year}. {data.description}
            </p>
          </div>

          {/* Stats/Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
             <div className="p-8 rounded-[32px] bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                <Shield className="w-8 h-8 mx-auto mb-4 text-[var(--accent)]" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Difficulty</div>
                <div className="text-2xl font-black uppercase">{data.difficulty}</div>
             </div>
             <div className="p-8 rounded-[32px] bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                <Clock className="w-8 h-8 mx-auto mb-4 text-[var(--accent)]" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Time Remaining</div>
                <div className="text-2xl font-black uppercase">Season Active</div>
             </div>
             <div className="p-8 rounded-[32px] bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                <Brain className="w-8 h-8 mx-auto mb-4 text-[var(--accent)]" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Success Rate</div>
                <div className="text-2xl font-black uppercase">98.4%</div>
             </div>
          </div>

          {/* Content Silos */}
          <div className="space-y-12 mb-20">
             {data.silos.map((silo, i) => (
               <div key={i} className="group p-8 sm:p-12 rounded-[40px] border border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--accent-glow)] transition-all">
                  <h2 className="text-3xl font-black mb-8 uppercase tracking-tight flex items-center gap-4">
                     <span className="w-10 h-10 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] text-lg">0{i+1}</span>
                     {silo.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        {silo.points.map((point, pi) => (
                          <div key={pi} className="flex items-start gap-3">
                             <CheckCircle2 className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                             <span className="text-lg font-medium opacity-80">{point}</span>
                          </div>
                        ))}
                     </div>
                     <div className="hidden md:block p-8 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-inner">
                        <p className="text-sm italic text-[var(--foreground-muted)] leading-relaxed">
                           "The Professor's {silo.title.toLowerCase()} engine uses high-fidelity retrieval practice to ensure that {data.name} patterns become muscle memory."
                        </p>
                     </div>
                  </div>
               </div>
             ))}
          </div>

          {/* Sticky CTA Footer */}
          <div className="p-12 rounded-[48px] bg-[var(--foreground)] text-[var(--background)] text-center shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
             <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter leading-none">
                Don't just take {data.name}. <br/> <span className="opacity-40">Dismantle it.</span>
             </h2>
             <p className="text-lg opacity-60 mb-10 max-w-md mx-auto font-bold uppercase tracking-widest">
                Access the full {data.name} 2026 study suite now.
             </p>
             <Link href="/signup" className="inline-flex items-center gap-4 px-12 py-6 rounded-2xl bg-[var(--accent)] text-black font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl">
                {data.cta} <ArrowRight className="w-5 h-5" />
             </Link>
          </div>
        </StandardContainer>
      </div>
    </div>
  );
}
