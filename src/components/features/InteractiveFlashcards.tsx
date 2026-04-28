"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Brain, Lightbulb } from "lucide-react";

const INITIAL_CARDS = [
  { 
    id: 1, 
    question: "Action Potential", 
    answer: "A rapid electrical pulse that travels along a neuron.", 
    hook: "Think of it like a falling line of dominos—once the first one goes (threshold), the signal is unstoppable."
  },
  { 
    id: 2, 
    question: "Neural Plasticity", 
    answer: "The brain's ability to reorganize itself by forming new connections.", 
    hook: "Imagine a forest path; the more you walk it, the clearer it gets. Your brain literally paves the roads you use most."
  },
  { 
    id: 3, 
    question: "Active Recall", 
    answer: "Testing yourself instead of just re-reading notes.", 
    hook: "It's like weightlifting for your neurons. Looking at a barbell doesn't build muscle—you have to lift it (recall) to see results."
  },
];

export const InteractiveFlashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % INITIAL_CARDS.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + INITIAL_CARDS.length) % INITIAL_CARDS.length);
  };

  const currentCard = INITIAL_CARDS[currentIndex];

  return (
    <div className="relative w-full h-[520px] flex flex-col items-center justify-center p-4 md:p-6 cursor-default overflow-visible">
      <div className="relative w-full max-w-[360px] h-[450px] perspective-1200">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 50, opacity: 0, rotateY: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full transform-style-3d relative"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Card Content */}
            <motion.div 
               animate={{ rotateY: isFlipped ? 180 : 0 }}
               transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
               className="w-full h-full relative transform-style-3d group"
            >
              {/* Front Side */}
              <div className={cn(
                "absolute inset-0 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center backface-hidden",
                "bg-[var(--card)]/40 backdrop-blur-3xl border border-[var(--foreground)]/10 shadow-2xl overflow-hidden",
                "before:absolute before:inset-0 before:rounded-[2.5rem] before:bg-gradient-to-b before:from-[var(--foreground)]/10 before:to-transparent before:pointer-events-none"
              )}>
                {/* Refraction Streak */}
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--foreground)]/10 to-transparent pointer-events-none shimmer-streak" />

                <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 mb-6 shadow-inner relative z-10">
                  <Brain size={32} strokeWidth={1.5} className="text-[var(--accent)]" />
                </div>
                <h4 className="text-xl font-black text-[var(--foreground)] leading-tight tracking-tight mb-4 relative z-10">
                  {currentCard.question}
                </h4>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background)]/50 border border-[var(--border)] relative z-10">
                   <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Click to Reveal</span>
                </div>
              </div>

              {/* Back Side */}
              <div className={cn(
                "absolute inset-0 rounded-[2.5rem] py-6 px-6 md:py-8 md:px-7 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 overflow-hidden",
                "bg-[var(--background-secondary)]/90 backdrop-blur-3xl border border-[var(--accent)]/40 shadow-[0_0_50px_rgba(245,158,11,0.15)]"
              )}>
                {/* Refraction Streak (Back) */}
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent pointer-events-none shimmer-streak" />

                <div className="flex flex-col h-full relative z-10 w-full pt-4">
                   <div className="mb-4 overflow-y-auto max-h-[140px] pr-2 scrollbar-thin scrollbar-thumb-[var(--accent)]/20">
                      <p className="text-[13px] md:text-[14px] font-medium leading-relaxed text-[var(--foreground)]">
                        {currentCard.answer}
                      </p>
                   </div>
                   
                   <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent mb-4" />
                   
                   <div className="flex-1 min-h-0 text-left bg-[var(--foreground)]/5 p-4 md:p-5 rounded-2xl border border-[var(--border)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2 mb-2 shrink-0">
                         <div className="w-5 h-5 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
                            <Lightbulb size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                         </div>
                         <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">Professor&apos;s Hook</span>
                      </div>
                      <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--accent)]/10">
                        <p className="text-[11px] md:text-[12px] italic leading-relaxed text-[var(--foreground-secondary)]">
                          &quot;{currentCard.hook}&quot;
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button onClick={handlePrev} className="btn-skeuo w-12 h-12 flex items-center justify-center group active:scale-95">
          <ChevronLeft size={20} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="px-5 py-2.5 rounded-2xl bg-[var(--background)]/40 border border-[var(--border)] shadow-inner flex flex-col items-center min-w-[130px] backdrop-blur-md">
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-0.5 opacity-60">Memory Slate</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Active Review</span>
        </div>
        <button onClick={handleNext} className="btn-skeuo w-12 h-12 flex items-center justify-center group active:scale-95">
          <ChevronRight size={20} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
