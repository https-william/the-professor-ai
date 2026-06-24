"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    Zap, 
    CheckCircle2, 
    Share2, 
    ArrowRight, 
    Download, 
    Lock, 
    HelpCircle 
} from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface KnowledgeCheckProps {
    data: any;
    onCorrect: () => void;
}

const KnowledgeCheck = ({ data, onCorrect }: KnowledgeCheckProps) => {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isPassed, setIsPassed] = useState(false);
    const { addToast } = useToasts();

    const handleSelect = (idx: number) => {
        if (isPassed || selectedIndices.includes(idx)) return;
        
        setSelectedIndices(prev => [...prev, idx]);
        const correct = idx === data.correctIndex;
        
        if (correct) {
            setIsPassed(true);
            addToast("Spot Check Mastered!", "success");
            onCorrect();
        }
    };

    return (
        <div className="p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner relative overflow-hidden group/card flex flex-col w-full max-w-3xl mx-auto my-6 md:my-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={40} className="text-[var(--accent)]" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Professor's Spot Check</span>
                </div>
                
                <h5 className="text-[13px] font-bold text-[var(--foreground)] mb-4 leading-relaxed">
                    {data.question}
                </h5>

                <div className="grid grid-cols-1 gap-3">
                    {data.options.map((opt: string, i: number) => {
                        const isSelected = selectedIndices.includes(i);
                        const isCorrect = i === data.correctIndex;
                        const showFeedback = isSelected || (isPassed && isCorrect);

                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(i)}
                                disabled={isPassed || isSelected}
                                className={cn(
                                    "w-full p-4 md:p-5 text-left text-[10px] md:text-[11px] font-bold rounded-xl md:rounded-2xl transition-all border flex items-center gap-4 group/opt relative overflow-hidden",
                                    showFeedback 
                                        ? isCorrect 
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.1)]" 
                                            : "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.1)]"
                                        : "bg-[var(--background-secondary)] border-white/5 text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)] hover:shadow-xl shadow-md"
                                )}
                            >
                                <div className={cn(
                                    "w-7 h-7 rounded-xl flex items-center justify-center border text-[10px] shrink-0 font-black transition-all",
                                    showFeedback && isCorrect ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                    isSelected && !isCorrect ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
                                    "bg-white/5 border-white/10 group-hover/opt:border-[var(--accent)]/30"
                                )}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span className="relative z-10">{opt}</span>
                                
                                {/* Inner Glow Hover */}
                                {!isSelected && !isPassed && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover/opt:opacity-100 transition-opacity pointer-events-none" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {selectedIndices.length > 0 && !isPassed && (
                    <p className="mt-4 text-[10px] text-red-400/80 italic animate-pulse">
                        Ah, not quite! Pick another option to sync your understanding.
                    </p>
                )}
            </div>
        </div>
    );
};

interface ContentBlock {
    type: "markdown" | "checkpoint";
    content: string;
    checkpointData?: any;
    id: string;
}

export const InteractiveSummary = ({ 
    rawText = "",
    refinedText = "",
    tags = [],
    autoReveal = false,
    isStreaming = false,
    onFinish,
    onDownloadPDF
}: { rawText?: string; refinedText?: string; tags?: string[]; autoReveal?: boolean; isStreaming?: boolean; onFinish?: () => void; onDownloadPDF?: () => void }) => {
    const [isRefining, setIsRefining] = useState(autoReveal || isStreaming);
    const [progress, setProgress] = useState((autoReveal || isStreaming) ? 100 : 0);
    const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([]);
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

    // Segment refined text into alternating markdown and knowledge check blocks
    const parsedBlocks = useMemo(() => {
        if (!refinedText) return [];
        const blocks: ContentBlock[] = [];
        const checkRegex = /\[KNOWLEDGE_CHECK\]\s*(\{[\s\S]*?\})/g;
        
        let lastIndex = 0;
        let match;
        let blockIndex = 0;
        
        while ((match = checkRegex.exec(refinedText)) !== null) {
            const markdownBefore = refinedText.slice(lastIndex, match.index);
            if (markdownBefore.trim()) {
                blocks.push({
                    type: "markdown",
                    content: markdownBefore,
                    id: `md-${blockIndex++}`
                });
            }
            
            try {
                const checkpointData = JSON.parse(match[1]);
                blocks.push({
                    type: "checkpoint",
                    content: match[0],
                    checkpointData,
                    id: `check-${blockIndex++}`
                });
            } catch (e) {
                console.error("Failed to parse inline knowledge check JSON:", e);
            }
            
            lastIndex = checkRegex.lastIndex;
        }
        
        const remainingMarkdown = refinedText.slice(lastIndex);
        if (remainingMarkdown.trim()) {
            blocks.push({
                type: "markdown",
                content: remainingMarkdown,
                id: `md-${blockIndex++}`
            });
        }
        
        return blocks;
    }, [refinedText]);

    // Determine blocks to display (all blocks immediately accessible)
    const visibleBlocks = useMemo(() => {
        return parsedBlocks;
    }, [parsedBlocks]);

    const allCheckpoints = useMemo(() => {
        return parsedBlocks.filter(b => b.type === "checkpoint");
    }, [parsedBlocks]);

    const isLocked = false;

    return (
        <div className="relative w-full min-h-full p-3 sm:p-6 flex flex-col">
            <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Professor's Summary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onDownloadPDF && (
                            <button 
                                onClick={onDownloadPDF}
                                className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all flex items-center gap-1.5 text-[10px] shadow-sm font-bold uppercase tracking-wider"
                                title="Download PDF Summary"
                            >
                                <Download size={14} />
                                <span className="hidden sm:inline">Download PDF</span>
                            </button>
                        )}
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
                               {tags && tags.length > 0 && (
                                   <div className="flex flex-wrap gap-2">
                                      {tags.map(tag => (
                                         <span key={tag} className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)]/10">{tag}</span>
                                      ))}
                                   </div>
                               )}
                                <div className="space-y-3 md:space-y-4">
                                    {visibleBlocks.map((block) => {
                                        if (block.type === "markdown") {
                                            return (
                                                <MarkdownRenderer 
                                                    key={block.id}
                                                    content={block.content}
                                                    isStreaming={isStreaming} 
                                                />
                                            );
                                        } else {
                                            return (
                                                <KnowledgeCheck
                                                    key={block.id}
                                                    data={block.checkpointData}
                                                    onCorrect={() => {
                                                        setCompletedCheckpoints(prev => [...prev, block.id]);
                                                    }}
                                                />
                                            );
                                        }
                                    })}
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

                {isLocked && (
                    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-center gap-3 mt-8 animate-pulse text-[11px] font-black uppercase tracking-wider text-[var(--foreground-muted)] select-none">
                        <Lock size={12} className="text-[#F59E0B]" />
                        <span>Resolve the Spot Check above to unlock more concepts</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-4 border-t border-[var(--border)] mt-6 pb-2">
                    {onFinish && (
                        <button
                            onClick={() => {
                                if (isLocked) {
                                    addToast("Complete all Professor's Spot Checks to continue!", "error");
                                    return;
                                }
                                onFinish();
                            }}
                            disabled={isLocked}
                            className={cn(
                                "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 group",
                                isLocked 
                                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed shadow-none"
                                    : "bg-[var(--foreground)] text-[var(--background)] hover-scale-lg active:scale-95"
                            )}
                        >
                            <span>{isLocked ? "Locked" : "Finish & Continue"}</span>
                            {isLocked ? <Lock size={14} /> : <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
