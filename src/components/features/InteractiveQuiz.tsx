"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Share2, CheckCircle2, XCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";


export const InteractiveQuiz = ({ 
    questions = [
        {
            question: "Why does a figure skater spin faster when they pull their arms in?",
            options: ["A: Linear Velocity", "B: Angular Momentum", "C: Centripetal Acceleration", "D: Inertial Framing"],
            correctIndex: 1,
            analogy: "Think of it like a garden hose. If you narrow the opening, the water must rush out faster.",
            explanation: "Conservation of angular momentum means spinning radius and speed are inversely linked."
        }
    ],
    onFinish
}: { 
    questions?: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        analogy?: string;
        explanation?: string;
    }>;
    onFinish?: (stats: { score: number; correct: number; time: string; total: number }) => void;
}) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState<number | null>(null);
    const { addToast } = useToasts();



    const currentQuestion = questions[currentIdx] || questions[0];

    const handleSelect = (idx: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentIdx]: idx
        }));
        addToast("Answer registered!", "success", undefined, undefined, false, undefined, true);
    };

    const handleNext = () => {
        if (currentIdx === questions.length - 1) {
            setEndTime(Date.now());
            setShowResults(true);
        } else {
            setCurrentIdx(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(prev => prev - 1);
        }
    };

    const jumpTo = (idx: number) => {
        setCurrentIdx(idx);
    };

    const timeString = useMemo(() => {
        if (!endTime) return "0m 0s";
        const diff = Math.floor((endTime - startTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    }, [endTime, startTime]);

    const handleShareSection = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = typeof window !== 'undefined' ? window.location.href : '';
        navigator.clipboard.writeText(url);
        addToast("Quiz link copied to clipboard!", "success");
    };

    const renderResults = () => {
        const results = questions.map((q, idx) => ({
            question: q,
            selectedIdx: answers[idx],
            isCorrect: answers[idx] === q.correctIndex,
            wasAnswered: answers[idx] !== undefined,
        }));

        const totalCorrect = results.filter(r => r.isCorrect).length;
        const scorePercent = Math.round((totalCorrect / questions.length) * 100);
        const skipped = results.filter(r => !r.wasAnswered).length;

        const scoreLabel =
            scorePercent === 100 ? "Perfect — no cap." :
            scorePercent >= 70 ? "Solid. You dey try." :
            scorePercent >= 50 ? "Almost there sha." :
            "We need to review this one.";

        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-3 overflow-visible"
            >


                {/* Score header */}
                <div className="grid grid-cols-3 gap-2 shrink-0">
                    <div className="p-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                        <div className="text-xl font-black text-[var(--foreground)]">{scorePercent}%</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-0.5">Score</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-lg font-black text-emerald-400">{totalCorrect}</span>
                            <span className="text-xs text-[var(--foreground-muted)] font-bold">/ {questions.length}</span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-0.5">Correct</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Clock size={12} className="text-[var(--foreground-muted)]" />
                            <span className="text-sm font-black text-[var(--foreground)]">{timeString}</span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-0.5">Time</div>
                    </div>
                </div>

                {/* Professor verdict */}
                <div className="px-4 py-2.5 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Zap size={12} className="text-[var(--accent)] shrink-0" />
                        <p className="text-[11px] font-bold italic text-[var(--foreground-muted)]">{scoreLabel}</p>
                    </div>
                </div>

                {/* Per-question breakdown */}
                <div className="flex items-center gap-2 px-1 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Question Breakdown</span>
                    {skipped > 0 && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                            {skipped} skipped
                        </span>
                    )}
                </div>

                <div className="w-full space-y-2 overflow-visible">
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className={cn(
                                "p-4 rounded-2xl border transition-all",
                                r.isCorrect
                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                    : r.wasAnswered
                                    ? "bg-red-500/5 border-red-500/20"
                                    : "bg-amber-500/5 border-amber-500/20"
                            )}
                        >
                            {/* Question header */}
                            <div className="flex items-start gap-3 mb-2">
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                    r.isCorrect ? "bg-emerald-500/20" : r.wasAnswered ? "bg-red-500/20" : "bg-amber-500/20"
                                )}>
                                    {r.isCorrect ? (
                                        <CheckCircle2 size={12} className="text-emerald-400" />
                                    ) : r.wasAnswered ? (
                                        <XCircle size={12} className="text-red-400" />
                                    ) : (
                                        <AlertCircle size={12} className="text-amber-400" />
                                    )}
                                </div>
                                <p className="text-[12px] font-bold text-[var(--foreground)] leading-snug flex-1">
                                    {i + 1}. {r.question.question}
                                </p>
                            </div>

                            {/* Options breakdown */}
                            <div className="space-y-1 ml-8">
                                {r.question.options.map((opt, optIdx) => {
                                    const isCorrectOpt = optIdx === r.question.correctIndex;
                                    const isSelectedOpt = optIdx === r.selectedIdx;
                                    const isWrongSelected = isSelectedOpt && !isCorrectOpt;

                                    return (
                                        <div
                                            key={optIdx}
                                            className={cn(
                                                "px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-2 border",
                                                isCorrectOpt
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                    : isWrongSelected
                                                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                                                    : "bg-transparent border-transparent text-[var(--foreground-muted)]/50"
                                            )}
                                        >
                                            <span className={cn(
                                                "w-4 h-4 rounded flex items-center justify-center text-[8px] font-black border shrink-0",
                                                isCorrectOpt ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                                                isWrongSelected ? "bg-red-500/20 border-red-500/30 text-red-400" :
                                                "bg-white/5 border-white/10"
                                            )}>
                                                {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            {opt}
                                            {isCorrectOpt && <CheckCircle2 size={10} className="ml-auto text-emerald-400 shrink-0" />}
                                            {isWrongSelected && <XCircle size={10} className="ml-auto text-red-400 shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation / analogy if wrong or skipped */}
                            {(!r.isCorrect) && (r.question.explanation || r.question.analogy) && (
                                <div className="mt-3 ml-8 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                                    {r.question.explanation && (
                                        <p className="text-[11px] font-bold text-[var(--foreground-muted)] mb-1">
                                            ✅ {r.question.explanation}
                                        </p>
                                    )}
                                    {r.question.analogy && (
                                        <p className="text-[10px] italic text-[var(--foreground-muted)]/70">
                                            💡 {r.question.analogy}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Identity nudge */}
                    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center">
                        <p className="text-[11px] font-bold italic text-[var(--foreground-muted)]">
                            Your notes. Just the good parts.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => onFinish?.({ 
                        score: scorePercent, 
                        correct: totalCorrect, 
                        time: timeString,
                        total: questions.length
                    })}
                    className="btn-skeuo-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0"
                >
                    <CheckCircle2 size={18} /> Finalize Session
                </button>
            </motion.div>
        );
    };

    return (
        <div className="relative w-full min-h-full p-1 sm:p-2 flex flex-col items-center cursor-default overflow-visible">
            {showResults ? renderResults() : (
                <>
                    {/* Question Area */}
                    <div className="w-full flex flex-col gap-3 relative z-10 overflow-visible">
                        <div className="p-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner shrink-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
                                    Question {currentIdx + 1} of {questions.length}
                                </span>
                                <button 
                                    onClick={handleShareSection}
                                    className="p-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all active:scale-95"
                                    title="Share Quiz"
                                >
                                    <Share2 size={10} />
                                </button>
                            </div>
                            <h4 className="text-[12px] md:text-[16px] font-bold leading-relaxed text-[var(--foreground)]">
                                {currentQuestion.question}
                            </h4>
                        </div>

                        <div className="flex flex-col gap-2 md:gap-3">
                            {currentQuestion.options.map((opt, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleSelect(i)}
                                    className={cn(
                                        "w-full p-3 text-left text-[11px] md:text-[13px] font-bold transition-all rounded-2xl relative overflow-hidden flex items-center gap-3 border",
                                        answers[currentIdx] === i 
                                            ? "bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/50 shadow-[0_0_20px_rgba(37,99,235,0.1)] scale-[1.01]" 
                                            : "bg-transparent border-white/5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-lg flex items-center justify-center border text-[9px] transition-colors",
                                        answers[currentIdx] === i ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "bg-white/5 border-white/10"
                                    )}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="relative z-10">{opt}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quiz Navigation */}
                    <div className="w-full flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border)] shrink-0">
                        <button 
                            onClick={handlePrev} 
                            disabled={currentIdx === 0}
                            className="btn-skeuo px-4 py-3 flex items-center gap-2 group active:scale-95 shadow-lg border-[var(--border-3)] disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] group-hover:-translate-x-1 transition-transform">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]">Prev</span>
                        </button>

                        <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                            {questions.map((_, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => jumpTo(idx)}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        idx === currentIdx ? "bg-[var(--accent)] scale-125 shadow-[0_0_8px_var(--accent-glow)]" : 
                                        answers[idx] !== undefined ? "bg-[var(--accent)]/40" : "bg-[var(--border-3)]"
                                    )}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={handleNext} 
                            className={cn(
                                "btn-skeuo px-4 py-3 flex items-center gap-2 group active:scale-95 shadow-lg border-[var(--border-3)] transition-all",
                                currentIdx === questions.length - 1 && "bg-[var(--blue)] border-[var(--blue-light)]/30 text-white shadow-[0_12px_40px_rgba(37,99,235,0.2)]"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                currentIdx === questions.length - 1 ? "text-white" : "text-[var(--foreground)]"
                            )}>
                                {currentIdx === questions.length - 1 ? "Finish" : "Next"}
                            </span>
                            {currentIdx === questions.length - 1 ? (
                                <CheckCircle2 size={18} className="text-white" />
                            ) : (
                                <ChevronRight size={18} className="text-[var(--accent)] group-hover:translate-x-1 transition-transform" />
                            )}
                        </button>
                    </div>
                </>
            )}

        </div>
    );
};
