"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDuelRealtime } from "@/hooks/useRealtime";

interface Question {
    id?: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface DuelPlayProps {
    duelId: string;
    isHost: boolean;
    questions: Question[];
    timeLimit: number;
    opponent: {
        id: string;
        name: string;
        avatar?: string;
    };
}

export default function DuelPlay({ duelId, isHost, questions, timeLimit, opponent }: DuelPlayProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [opponentProgress, setOpponentProgress] = useState(0);
    const [opponentFinished, setOpponentFinished] = useState(false);
    const [syncError, setSyncError] = useState(false);
    const lastSyncRef = useRef<number>(0);
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const opponentProgressPercent = (opponentProgress / questions.length) * 100;

    // Timer
    useEffect(() => {
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Realtime subscription for session updates
    useDuelRealtime(duelId, {
        onSessionUpdate: useCallback((payload: any) => {
            const newData = payload.new;
            if (!newData) return;

            // Update opponent progress in real-time
            if (newData.user_id !== (isHost ? undefined : undefined)) {
                // Get opponent's progress
                if (newData.current_question_index !== undefined) {
                    setOpponentProgress(newData.current_question_index);
                }
                
                if (newData.finished_at) {
                    setOpponentFinished(true);
                }
            }
        }, [isHost]),

        onDuelUpdate: useCallback((payload: any) => {
            const newData = payload.new;
            if (!newData) return;

            // Check if duel completed
            if (newData.status === 'COMPLETED') {
                router.push(`/arena/${duelId}/results`);
            }
        }, [duelId, router])
    });

    // Sync with server on answer change
    const syncProgress = useCallback(async () => {
        if (isSubmitting || opponentFinished) return;
        
        try {
            const res = await fetch('/api/arena/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duel_id: duelId,
                    current_question_index: currentIndex,
                    answers,
                    is_finished: false
                })
            });

            if (res.ok) {
                setSyncError(false);
                lastSyncRef.current = Date.now();
            }
        } catch (error) {
            console.error("Sync error:", error);
            setSyncError(true);
        }
    }, [duelId, currentIndex, answers, isSubmitting, opponentFinished]);

    // Sync on answer change
    useEffect(() => {
        const timeout = setTimeout(syncProgress, 500);
        return () => clearTimeout(timeout);
    }, [currentIndex, answers, syncProgress]);

    const handleAnswer = (optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
        
        // Auto-advance after short delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
        }, 300);
    };

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setShowSubmitModal(false);

        try {
            await fetch('/api/arena/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duel_id: duelId,
                    current_question_index: currentIndex,
                    answers,
                    is_finished: true
                })
            });

            // Wait for opponent or redirect with timeout
            submitTimeoutRef.current = setTimeout(() => {
                router.push(`/arena/results?id=${duelId}`);
            }, 120000);
        } catch (error) {
            console.error("Submit error:", error);
            setIsSubmitting(false);
        }
    }, [isSubmitting, duelId, currentIndex, answers, router]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (submitTimeoutRef.current) {
                clearTimeout(submitTimeoutRef.current);
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl">
                {/* Opponent Progress Bar */}
                <div className="h-1 bg-[var(--foreground)]/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--success)] to-[var(--success-light)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${opponentProgressPercent}%` }}
                        transition={{ type: "spring", damping: 20 }}
                    />
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
                            <span className="material-symbols-outlined text-sm text-[var(--error)]">swords</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--error)]">Live Duel</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Opponent Status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${opponentFinished ? 'bg-[var(--success)]' : 'bg-[var(--accent)] animate-pulse'}`} />
                            <span className="text-[10px] text-[var(--foreground-muted)]">{opponent.name}: {opponentProgress}/{questions.length}</span>
                        </div>

                        {/* Timer */}
                        <div className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${timeLeft < 60 ? 'text-[var(--error)] bg-[var(--error)]/10' : 'text-[var(--foreground-muted)] bg-[var(--foreground)]/5'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                {/* Question Progress */}
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {questions.map((_, idx) => {
                            const isAnswered = answers[idx] !== undefined;
                            const isActive = currentIndex === idx;
                            const isOpponentAnswered = idx < opponentProgress;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-8 h-8 rounded-lg text-[11px] font-bold flex-shrink-0 transition-all flex items-center justify-center ${
                                        isActive ? 'bg-[var(--foreground)] text-[var(--background)] scale-110' :
                                        isAnswered ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                                        isOpponentAnswered ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' :
                                        'bg-[var(--foreground)]/5 text-[var(--foreground-muted)] hover:bg-[var(--foreground)]/10'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    {/* Question */}
                    <div className="p-6 rounded-3xl bg-[var(--foreground)]/[0.02] border border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/20">
                                Question {currentIndex + 1}
                            </span>
                            <span className="text-[10px] text-[var(--foreground-muted)]">{questions.length - currentIndex - 1} remaining</span>
                        </div>
                        <p className="text-lg md:text-xl font-medium text-[var(--foreground)] leading-relaxed">
                            {currentQuestion.question}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = answers[currentIndex] === idx;

                            return (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={answers[currentIndex] !== undefined}
                                    className={`w-full px-6 py-5 rounded-2xl text-left transition-all flex items-center gap-4 ${
                                        isSelected
                                            ? 'bg-[var(--success)]/10 border-2 border-[var(--success)]/30 nm-inset-bezel'
                                            : 'bg-[var(--foreground)]/[0.03] border border-[var(--border)] hover:bg-[var(--foreground)]/[0.06] hover:border-[var(--card-border)] active:scale-[0.99]'
                                    }`}
                                >
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                                        isSelected ? 'bg-[var(--success)] text-[var(--background)]' : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)]'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className={`flex-1 ${isSelected ? 'text-[var(--foreground)] font-medium' : 'text-[var(--foreground-muted)]'}`}>
                                        {option}
                                    </span>
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-[var(--success)]">check_circle</span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="sticky bottom-0 border-t border-white/5 bg-[#06060B]/90 backdrop-blur-xl p-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:text-[var(--foreground-muted)] transition-all"
                    >
                        ← Prev
                    </button>

                    <div className="flex items-center gap-2">
                        {syncError && (
                            <span className="text-[10px] text-[var(--error)] animate-pulse">Sync issue...</span>
                        )}
                        {opponentFinished && (
                            <span className="text-[10px] text-[var(--success)]">Opponent finished!</span>
                        )}
                    </div>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                            style={{
                                background: "var(--error)",
                                color: "var(--background)",
                                boxShadow: "0 4px 12px var(--error-glow)"
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-all"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </footer>

            {/* Submit Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm bg-[var(--background)] rounded-3xl border border-[var(--border)] p-8 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-[var(--error)]">flag</span>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Submit Duel?</h3>
                            <p className="text-sm text-[var(--foreground-muted)] mb-6">
                                You&apos;ve answered {Object.keys(answers).length}/{questions.length} questions.
                                {opponentFinished ? " Your opponent has finished." : " Your opponent is still working."}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all"
                                >
                                    Review
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98]"
                                    style={{
                                        background: "var(--error)",
                                        color: "var(--background)"
                                    }}
                                >
                                    Submit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
