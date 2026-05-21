"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CheckCircle2, Share2, ArrowRight } from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";

/* eslint-disable @typescript-eslint/no-unused-vars */
const KnowledgeCheck = ({ data }: { data: any }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const { addToast } = useToasts();

    const handleSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        const correct = idx === data.correctIndex;
        setIsCorrect(correct);
        if (correct) {
            addToast("Spot Check Mastered!", "success");
        }
    };

    return (
        <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner relative overflow-hidden group/card flex flex-col w-full max-w-3xl mx-auto">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={40} className="text-[var(--accent)]" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Professor's Spot Check</span>
                </div>
                
                <h5 className="text-[13px] font-bold text-[var(--foreground)] mb-6 leading-relaxed">
                    {data.question}
                </h5>

                <div className="grid grid-cols-1 gap-3">
                    {data.options.map((opt: string, i: number) => (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            disabled={selected !== null}
                            className={cn(
                                "w-full p-5 text-left text-[11px] font-bold rounded-2xl transition-all border flex items-center gap-4 group/opt relative overflow-hidden",
                                selected === i 
                                    ? (i === data.correctIndex 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.1)]" 
                                        : "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.1)]")
                                    : (selected !== null && i === data.correctIndex
                                        ? "bg-emerald-500/5 text-emerald-400/40 border-emerald-500/10"
                                        : "bg-[var(--background-secondary)] border-white/5 text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)] hover:shadow-xl shadow-md")
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 rounded-xl flex items-center justify-center border text-[10px] shrink-0 font-black transition-all",
                                selected === i && i === data.correctIndex ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                selected === i ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
                                "bg-white/5 border-white/10 group-hover/opt:border-[var(--accent)]/30"
                            )}>
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="relative z-10">{opt}</span>
                            
                            {/* Inner Glow Hover */}
                            {!selected && (
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover/opt:opacity-100 transition-opacity pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const InteractiveSummary = ({ 
    rawText = "The reward circuitry in the brain, connecting the ventral tegmental area to the nucleus accumbens, is crucial for reinforcement learning. This pathway reacts to unexpected rewards, triggering dopamine spikes that drive synaptic changes and behavior reinforcement.",
    refinedText = "The brain's reward pathway connects the VTA to the NAc shell. When you get a surprise win, it triggers dopamine bursts. These bursts literally rewire your brain to help you repeat that success later.",
    tags = ["Reward Pathway", "Synaptic Growth", "Reinforcement"],
    autoReveal = false,
    onFinish
}: { rawText?: string; refinedText?: string; tags?: string[]; autoReveal?: boolean; onFinish?: () => void }) => {
    const [isRefining, setIsRefining] = useState(autoReveal);
    const [progress, setProgress] = useState(autoReveal ? 100 : 0);
    const { addToast } = useToasts();

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

    const handleShareSection = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = typeof window !== 'undefined' ? window.location.href : '';
        navigator.clipboard.writeText(url);
        addToast("Section link copied to clipboard!", "success");
    };

    // Parser for [KNOWLEDGE_CHECK]
    const renderContent = (text: string) => {
        // Completely strip out [KNOWLEDGE_CHECK] and its trailing JSON block from the text before rendering
        const cleanData = text.replace(/\[KNOWLEDGE_CHECK\][\s\S]*?(\n\n|\n#|$)/g, "\n\n");
        const parts = [cleanData];
        
        return parts.map((part, index) => {
            const cleanPart = part
                .replace(/[ \t]+:[ \t]*/g, ': ')
                .replace(/:[ \t]+/g, ': ');

            return (
                <div key={index} className="prose prose-invert prose-sm md:max-w-4xl md:mx-auto text-[16px] md:text-[18px] font-medium leading-relaxed text-[var(--foreground)]">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-3xl md:text-5xl font-black mt-12 mb-6 text-[var(--foreground)] tracking-tight border-b border-[var(--border)] pb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl md:text-4xl font-black mt-10 mb-5 text-[var(--foreground)] tracking-tight" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xl md:text-3xl font-black mt-8 mb-4 text-[var(--foreground)] tracking-tight" {...props} />,
                            p: ({node, ...props}) => <p className="mb-6 opacity-90" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-black text-[var(--accent)]" {...props} />,
                            ul: ({node, ...props}) => <ul className="mb-8 space-y-3" {...props} />,
                            li: ({node, ...props}) => <li className="flex items-start gap-3" {...props} />,
                        }}
                    >
                        {cleanPart}
                    </ReactMarkdown>
                </div>
            );
        });
    };

    return (
        <div className="relative w-full min-h-full p-4 sm:p-6 flex flex-col">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Professor's Summary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleShareSection}
                            className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
                            title="Share Summary"
                        >
                            <Share2 size={14} />
                        </button>
                        <button 
                            onClick={handleRefine}
                            disabled={isRefining}
                            className={cn(
                                "btn-skeuo-primary px-6 py-3 active:scale-95 group relative overflow-hidden",
                                isRefining && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {!isRefining && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--foreground)]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            )}

                            <span className="relative z-10 flex items-center gap-2 text-[10px]">
                                 {isRefining && progress < 100 ? (
                                      <>
                                        <div className="w-3 h-3 rounded-full border-2 border-[var(--background)] border-t-transparent animate-spin" />
                                        Processing...
                                      </>
                                ) : isRefining && progress >= 100 ? (
                                    <>
                                        <CheckCircle2 size={14} />
                                        Refined
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
                </div>

                <div className="relative min-h-[200px]">
                    <AnimatePresence mode="wait">
                        {!isRefining || progress < 50 ? (
                           <motion.div 
                             key="raw"
                             exit={{ opacity: 0, filter: "blur(4px)" }}
                             className="text-sm leading-relaxed text-[var(--foreground-secondary)] italic font-serif"
                           >
                                {rawText}
                           </motion.div>
                        ) : (
                           <motion.div 
                             key="refined"
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="space-y-6"
                           >
                               <div className="flex flex-wrap gap-2">
                                  {tags.map(tag => (
                                     <span key={tag} className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)]/10">{tag}</span>
                                  ))}
                               </div>
                               <div className="space-y-2">
                                   {renderContent(refinedText)}
                               </div>
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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[var(--border)] mt-8 pb-4">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">Reduction</span>
                            <span className="text-sm font-black text-[var(--foreground)]">64% <span className="opacity-70">↓</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">Cognitive Load</span>
                            <span className="text-sm font-black text-[var(--foreground)]">Minimal</span>
                        </div>
                    </div>
                    {onFinish && (
                        <button
                            onClick={onFinish}
                            className="px-8 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest shadow-xl hover-scale-lg active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            Master Deep Summary <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

