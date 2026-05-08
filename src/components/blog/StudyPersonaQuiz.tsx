"use client";

import { useState } from "react";
import { Brain, Zap, Clock, ShieldAlert, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";

type Persona = {
  name: string;
  icon: any;
  color: string;
  description: string;
  advice: string;
};

const personas: Record<string, Persona> = {
  zombie: {
    name: "The Library Zombie",
    icon: Clock,
    color: "#EF4444",
    description: "You measure success by the hours you suffer, not the concepts you master. You are trapped in the Passive Learning Delusion.",
    advice: "Stop highlighting. Start picking up the heavy weights of Active Recall."
  },
  officer: {
    name: "The Compliance Officer",
    icon: ShieldAlert,
    color: "#F59E0B",
    description: "You follow every rule and read every page, but you lack the strategy to handle edge cases or high-pressure exams.",
    advice: "Focus on the 20% of content that drives 80% of the results. Automate your leverage."
  },
  master: {
    name: "The Strategic Master",
    icon: Zap,
    color: "#10B981",
    description: "You treat learning like a blood sport. You use AI to extended your cognition and you prioritize retrieval over review.",
    advice: "Maintain your edge. The laboratory is where you refine your dominance."
  }
};

export default function StudyPersonaQuiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<Persona | null>(null);

  const questions = [
    { q: "How do you 'review' your notes?", a: ["Re-read them (Zombie)", "Organize them (Officer)", "Close the book and recreate them (Master)"] },
    { q: "What's your stance on AI?", a: ["It's cheating (Zombie)", "It's for shortcuts (Officer)", "It's a Socratic training partner (Master)"] },
    { q: "You finish a 5-hour study session. How do you feel?", a: ["Proud of the hours (Zombie)", "Anxious about the syllabus (Officer)", "Aware of my specific knowledge gaps (Master)"] }
  ];

  const handleAnswer = (index: number) => {
    const newScore = score + index;
    if (step < questions.length - 1) {
      setStep(step + 1);
      setScore(newScore);
    } else {
      // Calculate result
      const finalScore = newScore;
      if (finalScore <= 1) setResult(personas.zombie);
      else if (finalScore <= 3) setResult(personas.officer);
      else setResult(personas.master);
    }
  };

  if (result) {
    return (
      <div className="p-8 rounded-3xl border border-[var(--accent-glow)] bg-[var(--accent-bg)]/30 backdrop-blur-xl animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: result.color + "20" }}>
             <result.icon className="w-6 h-6" style={{ color: result.color }} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Your Result</h4>
            <h3 className="text-xl font-bold text-white">{result.name}</h3>
          </div>
        </div>
        <p className="text-[14px] text-white/60 leading-relaxed mb-6">
          {result.description}
        </p>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-8">
           <p className="text-[12px] text-[var(--accent)] font-bold italic">
             The Professor's Advice: "{result.advice}"
           </p>
        </div>
        <Link 
          href="/signup" 
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-[1.02] active:scale-95"
        >
          Fix Your Strategy <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl">
      <h3 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.2em] mb-2">
         Diagnostic Tool
      </h3>
      <h2 className="text-xl font-bold text-white mb-8">What is your Study Persona?</h2>
      
      <div className="space-y-4">
        <p className="text-[14px] text-white/50 mb-6">{questions[step].q}</p>
        {questions[step].a.map((ans, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className="w-full text-left p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/10 transition-all text-[13px] text-white/70"
          >
            {ans}
          </button>
        ))}
      </div>

      <div className="mt-8 flex gap-1">
         {questions.map((_, i) => (
           <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-[var(--accent)]" : "bg-white/10"}`} />
         ))}
      </div>
    </div>
  );
}
