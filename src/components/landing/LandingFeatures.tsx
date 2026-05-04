"use client";

import dynamic from "next/dynamic";
import { Layers, HelpCircle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Dynamically import heavy interactive components for bundle optimization
const InteractiveFlashcards = dynamic(() => import("@/components/features/InteractiveFlashcards").then(m => m.InteractiveFlashcards), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-[var(--background-secondary)]/20 animate-pulse rounded-[2.5rem]" />
});
const InteractiveQuiz = dynamic(() => import("@/components/features/InteractiveQuiz").then(m => m.InteractiveQuiz), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-[var(--background-secondary)]/20 animate-pulse rounded-[2.5rem]" />
});
const InteractiveSummary = dynamic(() => import("@/components/features/InteractiveSummary").then(m => m.InteractiveSummary), {
  ssr: false,
  loading: () => <div className="w-full h-[200px] bg-[var(--background-secondary)]/20 animate-pulse rounded-[2.5rem]" />
});

export default function LandingFeatures() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--space-md)] auto-rows-auto"
    >
      {/* ─── FLASHCARDS — wide hero card ─── */}
      <motion.div variants={cardVariants} className="md:col-span-1 xl:col-span-2 py-8 group cursor-default relative overflow-visible flex flex-col gap-6">
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-[#F59E0B]" strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F59E0B]">Most Popular</span>
          </div>
          <h3 className="font-heading text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight mb-2">
            Flashcards
          </h3>
          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed mb-4">
            Spaced-repetition cards with hooks. Not just Q&A—built for retention.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] group-hover:gap-3 transition-all">
            Try it <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>

        <div className="relative w-full h-full flex flex-col z-20 overflow-visible">
          <InteractiveFlashcards />
        </div>
      </motion.div>

      {/* ─── QUIZ ENGINE — tall narrow card ─── */}
      <motion.div variants={cardVariants} className="md:col-span-1 xl:col-span-1 py-8 group cursor-default relative overflow-visible flex flex-col">
        <div className="relative z-10 mb-5 md:mb-1">
          <HelpCircle className="w-6 h-6 text-[#818CF8] mb-3 block" strokeWidth={1.5} />
          <h3 className="font-heading text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight mb-2">
            Quiz Engine
          </h3>
          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed mb-4">
            Adaptive MCQs with distractors designed to probe real understanding.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--secondary)] group-hover:gap-3 transition-all">
            Try it <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>

        {/* Interactive Visual */}
        <div className="mt-auto md:h-full w-full pointer-events-auto z-20 relative">
          <InteractiveQuiz />
        </div>
      </motion.div>

      {/* ─── SMART SUMMARY — wide bottom-left ─── */}
      <motion.div variants={cardVariants} className="md:col-span-2 xl:col-span-3 py-10 md:py-16 group cursor-default relative overflow-hidden flex flex-col md:flex-row md:items-center gap-8 border-t border-[var(--border)]">
        <div className="relative z-10 mb-5 md:mb-0 md:w-[45%]">
          <FileText className="w-6 h-6 text-[#6366F1] mb-3 block" strokeWidth={1.5} />
          <h3 className="font-heading text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight mb-2">
            Smart Summary
          </h3>
          <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed mb-4">
            Organized by concept, not page order. Includes common mistakes section.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--secondary)] group-hover:gap-3 transition-all">
            Try it <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>

        {/* Interactive Visual components */}
        <div className="mt-auto md:w-1/2 md:ml-auto md:h-full pointer-events-auto z-20 relative overflow-visible">
          <InteractiveSummary />
        </div>
      </motion.div>
    </motion.div>
  );
}
