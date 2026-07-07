"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    Share2, 
    ArrowRight, 
    Download, 
    Lock, 
    Volume2,
    VolumeX
} from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { CitationAwareRenderer } from "@/components/features/CitationAwareRenderer";

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
        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner relative overflow-hidden group/card flex flex-col w-full max-w-3xl mx-auto my-6 md:my-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Volume2 size={40} className="text-[var(--blue)]" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--blue)]">Professor's Spot Check</span>
                </div>
                
                <h4 className="text-sm sm:text-base font-black text-[var(--foreground)] mb-5 leading-snug tracking-tight">
                    {data.question}
                </h4>

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
                                    "w-full p-4.5 md:p-5 text-left text-xs sm:text-sm font-bold rounded-xl md:rounded-2xl transition-all border flex items-center gap-4 group/opt relative overflow-hidden",
                                    showFeedback 
                                        ? isCorrect 
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.1)]" 
                                            : "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.1)]"
                                        : "bg-[var(--background-secondary)] border-white/5 text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:border-[var(--accent)]/30 hover:text-[var(--foreground)] hover:shadow-xl shadow-md"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center border text-xs shrink-0 font-black transition-all",
                                    showFeedback && isCorrect ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                    isSelected && !isCorrect ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
                                    "bg-white/5 border-white/10 group-hover/opt:border-[var(--blue)]/30"
                                )}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span className="relative z-10 leading-snug">{opt}</span>
                                
                                {/* Inner Glow Hover */}
                                {!isSelected && !isPassed && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--blue)]/5 to-transparent opacity-0 group-hover/opt:opacity-100 transition-opacity pointer-events-none" />
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
    onDownloadPDF,
    onCitationClick
}: { rawText?: string; refinedText?: string; tags?: string[]; autoReveal?: boolean; isStreaming?: boolean; onFinish?: () => void; onDownloadPDF?: () => void; onCitationClick?: (paragraphIndex: number) => void }) => {
    const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { addToast } = useToasts();

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
                        <div className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse" />
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
                            onClick={(e) => {
                                e.stopPropagation();
                                if (typeof window !== 'undefined' && window.speechSynthesis) {
                                    if (window.speechSynthesis.speaking) {
                                        window.speechSynthesis.cancel();
                                        setIsSpeaking(false);
                                        return;
                                    }
                                    // Strip markdown syntax for clean TTS
                                    const plainText = rawText
                                        .replace(/#+\s*/g, '')
                                        .replace(/[*_`>]/g, '')
                                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                                        .replace(/\n{2,}/g, '. ')
                                        .replace(/\n/g, ' ')
                                        .trim();
                                    const utter = new SpeechSynthesisUtterance(plainText);
                                    utter.rate = 0.92;
                                    utter.pitch = 1.0;
                                    utter.onend = () => setIsSpeaking(false);
                                    utter.onerror = () => setIsSpeaking(false);
                                    setIsSpeaking(true);
                                    window.speechSynthesis.speak(utter);
                                }
                            }}
                            className={cn(
                                "p-2 rounded-xl border transition-all",
                                isSpeaking
                                    ? "bg-[var(--amber)]/10 border-[var(--amber)]/30 text-[var(--amber)]"
                                    : "bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                            )}
                            title={isSpeaking ? "Stop reading" : "Read summary aloud"}
                        >
                            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[200px]">
                    <div className="space-y-6">
                               {tags && tags.length > 0 && (
                                   <div className="flex flex-wrap gap-2">
                                      {tags.map(tag => (
                                         <span key={tag} className="px-2 py-0.5 rounded-md bg-[var(--blue)]/10 text-[9px] font-bold text-[var(--blue)] border border-[var(--blue)]/10">{tag}</span>
                                      ))}
                                   </div>
                               )}
                                <div className="space-y-3 md:space-y-4">
                                    {visibleBlocks.map((block) => {
                                        if (block.type === "markdown") {
                                            // Pre-process [§N] citation markers before handing to MarkdownRenderer.
                                            // We strip them out and inject CitationAwareRenderer spans so the
                                            // markdown renderer sees clean text while badges remain clickable.
                                            const hasCitations = /\[§\d+\]/.test(block.content);
                                            if (hasCitations && onCitationClick) {
                                                // Split the block on [§N] markers, interleave citation badges
                                                const parts = block.content.split(/(\[§\d+\])/g);
                                                return (
                                                    <div key={block.id} className="space-y-1">
                                                        {parts.map((part, pi) => {
                                                            const match = part.match(/^\[§(\d+)\]$/);
                                                            if (match) {
                                                                const paraIdx = parseInt(match[1], 10) - 1;
                                                                const displayNum = paraIdx + 1;
                                                                return (
                                                                    <sup
                                                                        key={pi}
                                                                        className="citation-badge"
                                                                        title={`View source paragraph ${displayNum}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onCitationClick(paraIdx);
                                                                        }}
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter" || e.key === " ") {
                                                                                e.preventDefault();
                                                                                onCitationClick(paraIdx);
                                                                            }
                                                                        }}
                                                                        aria-label={`Jump to source paragraph ${displayNum}`}
                                                                    >
                                                                        §{displayNum}
                                                                    </sup>
                                                                );
                                                            }
                                                            // Plain text part — pass through MarkdownRenderer
                                                            return part.trim() ? (
                                                                <MarkdownRenderer
                                                                    key={pi}
                                                                    content={part}
                                                                    isStreaming={isStreaming}
                                                                />
                                                            ) : null;
                                                        })}
                                                    </div>
                                                );
                                            }
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
                    </div>
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
