"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Search, 
  Brain, 
  Zap, 
  FileText,
  Lightbulb,
  Sparkles,
  Loader2
} from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Scanning document structure...", icon: FileText, delay: 0 },
  { id: 2, label: "Extracting core concepts...", icon: Search, delay: 1200 },
  { id: 3, label: "Identifying exam patterns...", icon: Brain, delay: 2800 },
  { id: 4, label: "Building your retrieval strategy...", icon: Zap, delay: 4500 },
  { id: 5, label: "Finalizing your study pack...", icon: CheckCircle2, delay: 6000 },
];

const STUDY_TIPS = [
  "Tip: Active recall is 3x more effective than re-reading notes.",
  "The Professor says: 'Cramming is for amateurs. Strategy is for scholars.'",
  "Fact: Teaching someone else is the best way to master a topic.",
  "Pro-tip: 25 minutes of focus + 5 minutes of rest = Peak Productivity.",
  "Did you know? Spaced repetition stops your brain from 'deleting' info.",
  "The Professor says: 'Focus on the why, not just the what.'",
];

export default function ProcessingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(33); // Start at 33% like Duolingo
  const [tipIndex, setTipIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFileName(localStorage.getItem("pending_upload_name") || "your notes");
    }

    const stepIntervals = STEPS.map((step, i) => {
      return setTimeout(() => {
        setCurrentStep(i + 1);
        setProgress(33 + ((i + 1) / STEPS.length) * 67);
      }, step.delay);
    });

    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % STUDY_TIPS.length);
    }, 4000);

    const finalRedirect = setTimeout(() => {
      router.push("/onboarding/preview");
    }, 7500);

    return () => {
      stepIntervals.forEach(clearTimeout);
      clearInterval(tipInterval);
      clearTimeout(finalRedirect);
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
      <StandardContainer narrow>
        <div className="max-w-xl mx-auto flex flex-col items-center">
          
          {/* Logo & Status */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 text-center"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-[var(--foreground)]/5 flex items-center justify-center mb-6 mx-auto relative overflow-hidden group">
               <div className="absolute inset-0 bg-[var(--foreground)] opacity-[0.03] animate-pulse" />
               <Sparkles size={32} className="text-[var(--foreground)] animate-float-xyz" />
            </div>
            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-2">
              The Professor is analyzing
            </h1>
            <p className="text-[var(--foreground-muted)] font-medium">
              Reading <span className="text-[var(--foreground)] font-bold">"{fileName}"</span>...
            </p>
          </motion.div>

          {/* Staggered Checklist */}
          <div className="w-full space-y-4 mb-12">
            {STEPS.map((step, i) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                  currentStep > i 
                    ? "bg-[var(--foreground)]/[0.02] border-[var(--foreground)]/10 opacity-100" 
                    : i === currentStep 
                      ? "bg-[var(--foreground)]/[0.05] border-[var(--foreground)]/20 opacity-100 scale-[1.02]" 
                      : "bg-transparent border-transparent opacity-30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500",
                  currentStep > i ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--foreground)]/5 text-[var(--foreground-muted)]"
                )}>
                  {currentStep > i ? <CheckCircle2 size={18} /> : i === currentStep ? <Loader2 size={18} className="animate-spin" /> : <step.icon size={18} />}
                </div>
                <span className={cn(
                  "font-bold text-sm tracking-tight transition-colors duration-500",
                  currentStep > i ? "text-[var(--foreground)]" : i === currentStep ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[var(--foreground)]/5 rounded-full overflow-hidden mb-8">
            <motion.div 
              className="h-full bg-[var(--foreground)]"
              initial={{ width: "33%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Study Tip Ticker */}
          <div className="h-12 flex items-center justify-center text-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 text-[var(--foreground-muted)] text-sm font-medium italic"
              >
                <Lightbulb size={16} className="text-amber-500 shrink-0" />
                <span>{STUDY_TIPS[tipIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </StandardContainer>
    </main>
  );
}
