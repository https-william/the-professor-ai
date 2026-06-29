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
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
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
    <main className="min-h-screen bg-[var(--background)] flex flex-col items-center p-6 relative">
      {/* Cinematic Ambient Blur Background */}
      <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-[100px]" />
      
      {/* Ambient Orbs */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--blue-dim) 0%, var(--blue-glow) 50%, transparent 70%)", filter: "blur(100px)", top: "-10%", left: "-10%" }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <StandardContainer narrow className="my-auto">

        <GlassmorphicCard 
          intensity="heavy" 
          radius="32px" 
          className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center p-8 sm:p-12 shadow-2xl"
        >
          
          {/* Logo & Status */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 mx-auto relative overflow-hidden group">
               <div className="absolute inset-0 bg-white opacity-[0.03] animate-pulse" />
               <Sparkles size={24} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">
              The Professor is analyzing
            </h1>
            <p className="text-sm text-white/50 font-medium">
              Reading <span className="text-white font-bold">"{fileName}"</span>...
            </p>
          </motion.div>

          {/* Staggered Checklist */}
          <div className="w-full space-y-3 mb-8">
            {STEPS.map((step, i) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                  currentStep > i 
                    ? "bg-emerald-500/[0.03] border-emerald-500/20 opacity-100" 
                    : i === currentStep 
                      ? "bg-amber-500/[0.05] border-amber-500/30 opacity-100 scale-[1.01]" 
                      : "bg-transparent border-transparent opacity-25"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-500 border",
                  currentStep > i 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : i === currentStep 
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                      : "bg-white/5 border-white/5 text-white/30"
                )}>
                  {currentStep > i ? <CheckCircle2 size={16} /> : i === currentStep ? <Loader2 size={16} className="animate-spin" /> : <step.icon size={16} />}
                </div>
                <span className={cn(
                  "font-bold text-xs tracking-tight transition-colors duration-500",
                  currentStep > i ? "text-emerald-400" : i === currentStep ? "text-amber-400" : "text-white/40"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: "33%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Study Tip Ticker */}
          <div className="h-10 flex items-center justify-center text-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2.5 text-white/50 text-xs font-semibold italic"
              >
                <Lightbulb size={14} className="text-amber-500 shrink-0" />
                <span>{STUDY_TIPS[tipIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

        </GlassmorphicCard>
      </StandardContainer>
    </main>
  );
}
