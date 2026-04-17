"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export const InteractiveSummary = () => {
    const [isRefining, setIsRefining] = useState(false);
    const [progress, setProgress] = useState(0);

    const rawText = "The dopaminergic projections from the ventral tegmental area (VTA) to the nucleus accumbens (NAc) shell constitute a core component of the reward circuitry involved in reinforcement learning. This pathway is sensitive to reward prediction errors, where deviations from expected outcomes trigger phasic firing rates that drive synaptic plasticity in medium spiny neurons.";
    const refinedText = "The brain's reward pathway connects the VTA to the NAc shell. When you get a surprise win, it triggers dopamine bursts. These bursts literally rewire your brain to help you repeat that success later.";

    const handleRefine = () => {
        setIsRefining(true);
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
            }
        }, 30);
    };

    return (
        <div className="relative w-full h-full p-8 flex flex-col justify-center overflow-hidden">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Neural Engine Activity</span>
                    </div>
                    <button 
                        onClick={handleRefine}
                        disabled={isRefining}
                        className={cn(
                            "btn-skeuo-primary scale-90 active:scale-95 group relative overflow-hidden",
                            isRefining && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {!isRefining && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        )}

                        <span className="relative z-10 flex items-center gap-2">
                             {isRefining ? (
                                 <>
                                    <div className="w-3 h-3 rounded-full border-2 border-[var(--background)] border-t-transparent animate-spin" />
                                    Processing...
                                 </>
                            ) : (
                                <>
                                    <Zap size={14} strokeWidth={1.5} fill="currentColor" />
                                    Refine Concept
                                </>
                            )}
                        </span>
                    </button>
                </div>

                <div className="relative min-h-[160px]">
                    <AnimatePresence mode="wait">
                        {!isRefining || progress < 50 ? (
                           <motion.div 
                             key="raw"
                             exit={{ opacity: 0, filter: "blur(4px)" }}
                             className="text-sm leading-relaxed text-[var(--foreground-muted)] italic font-serif"
                           >
                               {rawText}
                           </motion.div>
                        ) : (
                           <motion.div 
                             key="refined"
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="space-y-4"
                           >
                               <div className="flex flex-wrap gap-2">
                                  {["Reward Pathway", "Synaptic Growth", "Reinforcement"].map(tag => (
                                     <span key={tag} className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)]/10">{tag}</span>
                                  ))}
                               </div>
                               <p className="text-[15px] font-medium leading-relaxed text-[var(--foreground)]">
                                  {refinedText}
                               </p>
                           </motion.div>
                        )}
                    </AnimatePresence>

                    {isRefining && progress < 100 && (
                        <motion.div 
                            initial={{ top: "0%" }}
                            animate={{ top: "100%" }}
                            transition={{ duration: 1.5, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent blur-[2px] z-20"
                        />
                    )}
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-[var(--border)] mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Reduction</span>
                        <span className="text-sm font-black text-[var(--foreground)]">64% <span className="text-[var(--success)]">↓</span></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Cognitive Load</span>
                        <span className="text-sm font-black text-[var(--foreground)]">Minimal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
