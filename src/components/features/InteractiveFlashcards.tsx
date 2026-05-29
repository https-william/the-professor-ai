"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Brain, Lightbulb, Share2, CheckCircle2 } from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";

export const InteractiveFlashcards = ({
  cards = [
    {
      front: "Action Potential",
      back: "A rapid electrical pulse that travels along a neuron. 💡 Tip: Think of it like a falling line of dominos—once the first one goes (threshold), the signal is unstoppable.",
      topic: "Topic"
    }
  ],
  onFinish,
  onRetry
}: {
  cards?: Array<{
    front: string;
    back: string;
    topic?: string;
  }>;
  onFinish?: (stats: { totalCards: number }) => void;
  onRetry?: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const { addToast } = useToasts();

  const handleNext = () => {
    if (currentIndex === cards.length - 1) {
      if (onFinish) onFinish({ totalCards: cards.length });
      addToast("Activity Complete! You've mastered all cards.", "success");
      return;
    }
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShareSection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    addToast("Flashcards link copied to clipboard!", "success");
  };

  if (!cards || !cards.length || !cards[currentIndex]) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center cursor-default gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] mb-2">No flashcards available</p>
          <p className="text-[10px] text-[var(--foreground-muted)] font-bold">Please try generating this phase again.</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-2xl bg-[var(--blue)] text-white font-black text-[11px] uppercase tracking-widest shadow-lg hover-scale-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Regenerate Flashcards
          </button>
        )}
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const backText = currentCard.back || "No definition available. 💡 Tip: Try generating this card again.";
  const backParts = backText.split("💡");
  const answer = backParts[0].trim();
  const hook = backParts[1] ? backParts[1].replace(/Professor's Protocol:|Protocol:/i, "").trim() : "Focus on the core relationship here.";

  return (
    <div className="relative w-full min-h-[440px] md:min-h-[520px] flex flex-col items-center justify-center p-2 sm:p-4 cursor-default overflow-visible">
      <div className="relative w-full max-w-[400px] md:max-w-[620px] h-[420px] md:h-[500px] perspective-1000">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full relative"
            style={{ transformStyle: "preserve-3d" }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front Side */}
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
              className={cn(
                "absolute inset-0 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center",
                "bg-[var(--card)] border border-[var(--foreground)]/10 shadow-xl overflow-hidden",
                "before:absolute before:inset-0 before:rounded-[2.5rem] before:bg-gradient-to-b before:from-[var(--foreground)]/5 before:to-transparent before:pointer-events-none"
              )}
            >
              {/* Refraction Streak */}
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--foreground)]/10 to-transparent pointer-events-none shimmer-streak" />

              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 mb-6 shadow-inner relative z-10">
                <Brain size={32} strokeWidth={1.5} className="text-[var(--accent)]" />
              </div>
              <div className="mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-md">
                  {currentCard.topic || "Active Recall"}
                </span>
              </div>
              <h4 className="text-xl md:text-3xl font-black text-[var(--foreground)] leading-tight tracking-tight mb-4 relative z-10">
                {currentCard.front}
              </h4>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--background)]/80 border border-[var(--border-2)] relative z-10 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)] sm:hidden">Tap to flip</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground)] hidden sm:block">Click to flip</span>
              </div>
            </motion.div>

            {/* Back Side */}
            <motion.div
              initial={{ rotateY: -180 }}
              animate={{ rotateY: isFlipped ? 0 : -180 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
              className={cn(
                "absolute inset-0 rounded-[2.5rem] py-6 px-6 md:py-8 md:px-7 flex flex-col items-center justify-center text-center overflow-hidden",
                "bg-[var(--background-secondary)] border border-[var(--accent)]/30 shadow-2xl"
              )}
            >
              {/* Refraction Streak (Back) */}
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-[var(--accent)]/10 to-transparent pointer-events-none shimmer-streak" />

              <div className="flex flex-col h-full relative z-10 w-full pt-4">
                <div className="mb-4 overflow-y-auto max-h-[160px] md:max-h-[200px] pr-2 scrollbar-none">
                  <p className="text-[13px] md:text-[18px] font-medium leading-relaxed text-[var(--foreground)]">
                    {answer}
                  </p>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent mb-4" />

                <div className="flex-1 min-h-0 text-left bg-[var(--foreground)]/5 p-4 md:p-5 rounded-2xl border border-[var(--border)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-2 shrink-0">
                    <div className="w-5 h-5 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
                      <Lightbulb size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                    </div>
                    <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">Professor&apos;s Tip</span>
                  </div>
                  <div className="overflow-y-auto pr-1 scrollbar-none">
                    <p className="text-[11px] md:text-[15px] italic leading-relaxed text-[var(--foreground-secondary)]">
                      &quot;{hook}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button onClick={handlePrev} className="btn-skeuo px-5 py-4 flex items-center gap-3 group active:scale-95 shadow-[0_12px_40px_rgba(0,0,0,0.15)] border-[var(--border-3)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] group-hover:-translate-x-1 transition-transform">
            <path d="m15 18-6-6 6-6" />
            <path d="M17 12H9" className="opacity-40" />
          </svg>
          <span className="text-[11px] font-black uppercase tracking-widest text-[var(--foreground)]">Prev</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="px-6 py-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border-2)] shadow-lg flex flex-col items-center min-w-[150px]">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-0.5 opacity-80">Memory Cards</span>
            <span className="text-[12px] font-black uppercase tracking-widest text-[var(--accent)]">Card {currentIndex + 1} / {cards.length}</span>
          </div>
          <button
            onClick={handleShareSection}
            className="w-14 h-14 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border-2)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all active:scale-95 shadow-lg"
            title="Share Flashcards"
          >
            <Share2 size={20} strokeWidth={2} />
          </button>
        </div>
        <button onClick={handleNext} className={cn(
          "btn-skeuo px-5 py-4 flex items-center gap-3 group active:scale-95 shadow-[0_12px_40px_rgba(0,0,0,0.15)] border-[var(--border-3)] transition-all",
          currentIndex === cards.length - 1 && "bg-[var(--blue)] border-[var(--blue-light)]/30 text-white shadow-[0_12px_40px_rgba(37,99,235,0.2)]"
        )}>
          <span className={cn(
            "text-[11px] font-black uppercase tracking-widest",
            currentIndex === cards.length - 1 ? "text-white" : "text-[var(--foreground)]"
          )}>
            {currentIndex === cards.length - 1 ? "Finish Session" : "Next"}
          </span>
          {currentIndex === cards.length - 1 ? (
            <CheckCircle2 size={18} className="text-white" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] group-hover:translate-x-1 transition-transform">
              <path d="m9 18 6-6-6-6" />
              <path d="M7 12h8" className="opacity-40" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
