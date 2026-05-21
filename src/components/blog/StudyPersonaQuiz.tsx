"use client";

import { useState } from "react";
import { Brain, Zap, Clock, ShieldAlert, GraduationCap, ArrowRight, Share2, Flame, Ghost, Target, Star, Skull, Coffee } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Persona = {
  name: string;
  id: string;
  icon: any;
  color: string;
  description: string;
  advice: string;
  tagline: string;
};

const personas: Record<string, Persona> = {
  zombie: {
    id: "zombie",
    name: "The Library Zombie",
    tagline: "Suffer now, forget later.",
    icon: Ghost,
    color: "#EF4444",
    description: "You measure success by the hours you suffer, not the concepts you master. You're currently trapped in the 'Passive Learning Delusion'—reading the same page 5 times and hoping it sticks by osmosis. You're the main character in a tragic drama titled 'I Studied All Night But Still Failed'.",
    advice: "Stop highlighting the whole book. Highlighting is just coloring for adults. Start picking up the heavy weights of Active Recall. The Professor is disappointed, but helpful."
  },
  weapon: {
    id: "weapon",
    name: "The Academic Weapon",
    tagline: "Pure Efficiency, Zero Fluff.",
    icon: Flame,
    color: "#F59E0B",
    description: "You treat learning like a blood sport. You don't 'study', you dismantle syllabuses. You use AI to extend your cognition and prioritize retrieval over review. Your GPA is a side effect of your obsession with logic. You're basically a cyborg with a student ID.",
    advice: "Maintain your edge. Don't get complacent. Use our Exam Mode to find the 1% of blind spots you still have. Excellence is a moving target."
  },
  delusional: {
    id: "delusional",
    name: "The Aesthetic Scholar",
    tagline: "Pretty notes, empty brain.",
    icon: Star,
    color: "#EC4899",
    description: "Your iPad notes are a work of art. Your highlighters are color-coordinated. Your desk is a Pinterest board. Unfortunately, none of that information actually lives in your brain. You've confused 'organizing information' with 'owning information'.",
    advice: "Drop the Apple Pencil. Close the pretty app. Recreate the logic on a dirty piece of scrap paper from memory. If it's not painful, you're not learning."
  },
  monk: {
    id: "monk",
    name: "The Socratic Monk",
    tagline: "Deep Logic, No Speed.",
    icon: Brain,
    color: "#8B5CF6",
    description: "You're not interested in grades; you're interested in TRUTH. You spend 3 hours deriving a formula that takes 5 seconds to look up. You have the depth of a philosopher but the speed of a tectonic plate. You'll understand everything perfectly... three weeks after the exam.",
    advice: "The exam hall has a clock, not an altar. Stop meditating on the theory and start practicing the execution. Use The Professor's 'Timed Blitz' to speed up your retrieval."
  },
  speedrun: {
    id: "speedrun",
    name: "The 3AM Speed-Runner",
    tagline: "Maximum Result, Minimum Sleep.",
    icon: Zap,
    color: "#10B981",
    description: "You study 15 minutes before the exam and somehow get a B+. You're a genius of pattern recognition and smart guessing. You live on caffeine and sheer audacity. But your foundation is made of sand, and the tide is coming in.",
    advice: "You're lucky, not smart (yet). One day, guessing won't work and the sand will crumble. Use our 'Neural Mapping' to actually build a knowledge foundation that won't collapse under pressure."
  },
  dependent: {
    id: "dependent",
    name: "The GPT Dependant",
    tagline: "Outsourced Intellect.",
    icon: Skull,
    color: "#6366F1",
    description: "You don't think anymore. You just prompt. If ChatGPT went down today, you'd forget how to write your own name. You're using AI as a crutch instead of an exoskeleton. You're not getting smarter; you're just becoming a very efficient copy-paster.",
    advice: "The AI is the mentor, not the master. Use The Professor's Socratic Mode to force yourself to answer the 'Why' before the AI gives you the 'How'."
  }
};

export default function StudyPersonaQuiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<Persona | null>(null);

  const questions = [
    { 
        q: "It's 11 PM. You're staring at 50 pages of complex notes. What's the play?", 
        a: [
            "Read them until my eyes bleed (passive zombie move)", 
            "Make them look pretty in Notion (aesthetic move)", 
            "Close the book and recall the core logic from scratch"
        ] 
    },
    { 
        q: "How do you view AI in your academic workflow?", 
        a: [
            "A way to skip the thinking and just get the answer", 
            "A tool to summarize stuff I don't want to read", 
            "A high-pressure Socratic sparring partner"
        ] 
    },
    { 
        q: "You just finished a 4-hour study session. How do you know you've 'learned' anything?", 
        a: [
            "I recognize most of the bolded terms in the book", 
            "My notes are beautiful and perfectly organized", 
            "I can explain the hardest concept to a 5-year-old with zero notes"
        ] 
    },
    {
        q: "The exam is tomorrow morning. You are 20% through the syllabus. Your reaction?",
        a: [
            "Accept my fate and scroll TikTok (zombie/speedrun energy)",
            "Ask ChatGPT to write me a summary of the remaining 80%",
            "Identify the 'High-Yield' 20% and sprint through active recall"
        ]
    }
  ];

  const handleAnswer = (index: number) => {
    const newScore = score + index;
    if (step < questions.length - 1) {
      setStep(step + 1);
      setScore(newScore);
    } else {
      if (newScore <= 1) setResult(personas.zombie);
      else if (newScore <= 3) setResult(personas.dependent);
      else if (newScore <= 4) setResult(personas.delusional);
      else if (newScore <= 6) setResult(personas.monk);
      else if (newScore <= 7) setResult(personas.speedrun);
      else setResult(personas.weapon);
    }
  };

  const handleShare = () => {
    const text = `I just got '${result?.name}' on The Professor's Study Persona quiz. Are you an Academic Weapon or a Library Zombie? Check it out: https://theprofessor.xyz/blog`;
    if (navigator.share) {
      navigator.share({ title: 'My Study Persona', text, url: 'https://theprofessor.xyz/blog' });
    } else {
      navigator.clipboard.writeText(text);
      alert("Link copied! Share it with your friends.");
    }
  };

  return (
    <div className="relative p-1 bg-[var(--foreground)] rounded-[42px] shadow-[12px_12px_0px_var(--accent)]">
      <div className="bg-[var(--background)] rounded-[40px] p-8 md:p-12 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="flex flex-col items-center text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl rotate-3" 
                style={{ backgroundColor: result.color }}
              >
                <result.icon className="w-12 h-12 text-black" />
              </motion.div>
              
              <h4 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.5em] mb-3">Diagnostic Finalized</h4>
              <h3 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-3 tracking-tighter uppercase leading-none">
                {result.name}
              </h3>
              <p className="text-[var(--accent)] font-black text-sm uppercase tracking-widest italic mb-8">{result.tagline}</p>
              
              <p className="text-lg text-[var(--foreground)] leading-relaxed mb-10 font-medium opacity-90 max-w-lg">
                {result.description}
              </p>

              <div className="p-8 rounded-[32px] bg-[var(--accent-bg)]/10 border-2 border-dashed border-[var(--accent)] mb-10 relative">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                    Professor's Order
                 </div>
                 <p className="text-base text-[var(--foreground)] font-bold italic leading-relaxed">
                   "{result.advice}"
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button 
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest shadow-xl hover-scale-md active:scale-[0.95] transition-all"
                  >
                      Share Your Edge <Share2 className="w-4 h-4" />
                  </button>
                  <Link 
                      href="/signup" 
                      className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl border-4 border-[var(--foreground)] text-[var(--foreground)] font-black uppercase tracking-widest hover:bg-[var(--foreground)] hover:text-[var(--background)] active:scale-[0.95] transition-all"
                  >
                      Upgrade Brain <ArrowRight className="w-4 h-4" />
                  </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={`step-${step}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2 text-[var(--accent)] mb-6">
                 <Zap className="w-4 h-4 fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Study Diagnostic · Step {step + 1}/4</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-[var(--foreground)] mb-12 tracking-tight uppercase leading-[0.9]">
                {questions[step].q}
              </h2>
              
              <div className="grid gap-4">
                {questions[step].a.map((ans, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i * 2)}
                    className="group relative w-full text-left p-6 rounded-3xl border-2 border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all active:scale-[0.95] overflow-hidden"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black">
                            {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight leading-tight">{ans}</span>
                    </div>
                    {/* Hover physics glow */}
                    <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-active:opacity-10 transition-opacity" />
                  </button>
                ))}
              </div>

              <div className="mt-16 flex gap-3">
                 {questions.map((_, i) => (
                   <div key={i} className={cn(
                     "h-2 flex-1 rounded-full transition-all duration-500", 
                     i <= step ? "bg-[var(--foreground)]" : "bg-[var(--border)]"
                   )} />
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

