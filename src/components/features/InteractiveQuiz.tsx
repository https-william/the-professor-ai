"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Share2, CheckCircle2, Clock, BarChart3, ChevronRight, ChevronLeft } from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";

export const InteractiveQuiz = ({ 
    questions = [
        {
            question: "Why does a figure skater spin faster when they pull their arms in?",
            options: ["A: Linear Velocity", "B: Angular Momentum", "C: Centripetal Acceleration", "D: Inertial Framing"],
            correctIndex: 1,
            analogy: "Think of it like a garden hose. If you narrow the opening, the water must rush out faster to keep the same amount flowing."
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
        const results = Object.entries(answers).map(([idx, selectedIdx]) => {
            const question = questions[parseInt(idx)];
            return {
                isCorrect: selectedIdx === question.correctIndex,
                question
            };
        });

        const totalCorrect = results.filter(r => r.isCorrect).length;
        const scorePercent = Math.round((totalCorrect / questions.length) * 100);
        const wrongAnswers = questions.filter((q, idx) => answers[idx] === undefined || answers[idx] !== q.correctIndex);

        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-3 overflow-hidden"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                    <div className="p-4 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-full border-4 border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-2 shadow-xl">
                                <span className="text-xl font-black text-[var(--foreground)]">{scorePercent}%</span>
                            </div>
                            <h3 className="text-sm font-black text-[var(--foreground)] uppercase italic tracking-tight">Mastery Score</h3>
                        </div>
                    </div>

                    <div className="p-4 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner text-center relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center justify-center h-full">
                            <Clock size={20} className="text-[var(--accent)] mb-1" />
                            <span className="text-lg font-black text-[var(--foreground)]">{timeString}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Time Taken</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-none space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-2">
                        <Zap size={14} className="text-[var(--accent)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Professor's Review</span>
                    </div>
                    
                    {wrongAnswers.length > 0 ? (
                        wrongAnswers.map((q, i) => (
                            <div key={i} className="p-5 rounded-3xl bg-[var(--background)] border border-[var(--border)] shadow-sm">
                                <h5 className="text-[13px] font-bold text-[var(--foreground)] mb-3 leading-tight">{q.question}</h5>
                                <div className="p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10">
                                    <p className="text-[11px] md:text-[13px] italic text-[var(--foreground-secondary)] leading-relaxed">
                                        &quot;{q.analogy || q.explanation || "Focus on the core principle here."}&quot;
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 rounded-[2.5rem] bg-[var(--emerald)]/5 border border-[var(--emerald)]/20 text-center">
                            <p className="text-[15px] font-bold text-[var(--emerald)] italic">Perfect score! The Professor is impressed by your mastery.</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => onFinish?.({ 
                        score: scorePercent, 
                        correct: totalCorrect, 
                        time: timeString,
                        total: questions.length
                    })}
                    className="btn-skeuo-primary w-full py-5 text-xs font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0"
                >
                    <CheckCircle2 size={18} /> Finalize Session
                </button>
            </motion.div>
        );
    };

    return (
        <div className="relative w-full h-full p-1 sm:p-2 flex flex-col items-center cursor-default overflow-hidden">
            {showResults ? renderResults() : (
                <>
                    {/* Question Area */}
                    <div className="flex-1 w-full flex flex-col gap-3 relative z-10 overflow-y-auto pr-1 scrollbar-none">
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
                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border)] shrink-0">
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
                                {currentIdx === questions.length - 1 ? "Finish Exam" : "Next"}
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
