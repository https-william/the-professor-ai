"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Swords, 
    CheckCircle, 
    Flag, 
    Clock, 
    Check, 
    AlertCircle,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { useDuelRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

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

const playClickSound = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    } catch (e) {}
};

export default function DuelPlay({ duelId, isHost, questions, timeLimit, opponent }: DuelPlayProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showAbandonModal, setShowAbandonModal] = useState(false);
    const [showForfeitVictoryModal, setShowForfeitVictoryModal] = useState(false);
    
    const [opponentProgress, setOpponentProgress] = useState(0);
    const [opponentFinished, setOpponentFinished] = useState(false);
    const [opponentActive, setOpponentActive] = useState(true);
    const [syncError, setSyncError] = useState(false);
    
    const lastSyncRef = useRef<number>(0);

    const currentQuestion = (questions && questions.length > 0) ? questions[currentIndex] : null;
    const progress = (questions && questions.length > 0) ? ((currentIndex + 1) / questions.length) * 100 : 0;
    const opponentProgressPercent = (questions && questions.length > 0) ? (opponentProgress / questions.length) * 100 : 0;

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
            if (newData.user_id === opponent.id) {
                if (newData.current_question_index !== undefined) {
                    setOpponentProgress(newData.current_question_index);
                }
                if (newData.finished_at) {
                    setOpponentFinished(true);
                }
                setOpponentActive(true);
            }
        }, [opponent.id]),

        onDuelUpdate: useCallback((payload: any) => {
            const newData = payload.new;
            if (!newData) return;

            // Check if duel completed
            if (newData.status === 'COMPLETED') {
                router.push(`/arena/results?id=${duelId}`);
            }

            // Check if opponent forfeited
            if (newData.status === 'CANCELLED') {
                setShowForfeitVictoryModal(true);
            }
        }, [duelId, router])
    });

    // Check opponent active state periodically
    const checkOpponentActive = useCallback(async () => {
        if (opponentFinished) return;
        try {
            const res = await fetch(`/api/arena/${duelId}`);
            const data = await res.json();
            if (data.success && data.duel) {
                const opp = isHost ? data.duel.challenger : data.duel.host;
                if (opp && opp.session) {
                    const lastPingTime = opp.session.lastPing ? new Date(opp.session.lastPing).getTime() : 0;
                    const isActive = (Date.now() - lastPingTime) < 15000;
                    setOpponentActive(isActive);
                }
            }
        } catch (e) {
            console.error("Presence check error:", e);
        }
    }, [duelId, isHost, opponentFinished]);

    useEffect(() => {
        const interval = setInterval(checkOpponentActive, 5000);
        return () => clearInterval(interval);
    }, [checkOpponentActive]);

    // Heartbeat ping
    useEffect(() => {
        const pingInterval = setInterval(async () => {
            if (isSubmitting) return;
            try {
                await fetch('/api/arena/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        duel_id: duelId,
                        current_question_index: currentIndex,
                        answers,
                        is_finished: false
                    })
                });
            } catch (err) {
                console.error("Heartbeat error:", err);
            }
        }, 5000);

        return () => clearInterval(pingInterval);
    }, [duelId, currentIndex, answers, isSubmitting]);

    // Sync progress
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

    useEffect(() => {
        const timeout = setTimeout(syncProgress, 500);
        return () => clearTimeout(timeout);
    }, [currentIndex, answers, syncProgress]);

    const handleAnswer = (optionIndex: number) => {
        playClickSound();
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
        
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
        }, 300);
    };

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/arena/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duel_id: duelId,
                    current_question_index: currentIndex,
                    answers,
                    is_finished: true
                })
            });

            if (res.ok) {
                router.push(`/arena/results?id=${duelId}`);
            } else {
                setIsSubmitting(false);
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to submit answers.");
            }
        } catch (error) {
            console.error("Submit error:", error);
            setIsSubmitting(false);
            alert("Network error, please try again.");
        }
    }, [duelId, currentIndex, answers, router, isSubmitting]);

    const handleAbandon = async () => {
        try {
            const res = await fetch(`/api/arena/${duelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel" })
            });
            if (res.ok) {
                router.push("/arena");
            }
        } catch (e) {
            console.error(e);
            router.push("/arena");
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col justify-between overflow-x-hidden pt-[8px]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#06060B]/90 backdrop-blur-xl shrink-0">
                {/* Opponent Progress Bar */}
                <div className="h-[3px] bg-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#9673F5] to-[#2BB288]"
                        initial={{ width: 0 }}
                        animate={{ width: `${opponentProgressPercent}%` }}
                        transition={{ type: "spring", damping: 20 }}
                    />
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]">
                            <Swords size={12} className="text-red-400 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Live Duel</span>
                        </div>
                        <button
                            onClick={() => setShowAbandonModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-zinc-400 transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
                        >
                            Forfeit Match
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Opponent Status */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                opponentFinished 
                                    ? "bg-[#2BB288]" 
                                    : opponentActive 
                                        ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                                        : "bg-red-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                            )} />
                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-black">
                                {opponent.name}: {opponentActive ? (opponentFinished ? "Finished" : "Dueling") : "Gone"}
                            </span>
                        </div>

                        {/* Timer */}
                        <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black tracking-wider ${timeLeft < 60 ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-zinc-300 bg-white/5 border border-white/5'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                {/* Question Progress dots */}
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
                                    className={cn(
                                        "w-7.5 h-7.5 rounded-lg text-[10px] font-black flex-shrink-0 transition-all flex items-center justify-center cursor-pointer",
                                        isActive ? "bg-white text-zinc-950 scale-105 border border-white" :
                                        isAnswered ? "bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/30" :
                                        isOpponentAnswered ? "bg-[#9673F5]/20 text-[#9673F5] border border-[#9673F5]/30" :
                                        "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Question Card */}
                        <GlassmorphicCard intensity="light" radius="28px" className="p-6 border border-white/5 shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                                    Question {currentIndex + 1}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{(questions ? questions.length : 0) - currentIndex - 1} remaining</span>
                            </div>
                            <p className="text-base sm:text-lg font-semibold text-white leading-relaxed font-serif">
                                {currentQuestion?.question}
                            </p>
                        </GlassmorphicCard>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion?.options?.map((option, idx) => {
                                const isSelected = answers[currentIndex] === idx;

                                return (
                                    <motion.button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={answers[currentIndex] !== undefined}
                                        className="w-full text-left group"
                                    >
                                        <GlassmorphicCard
                                            intensity={isSelected ? "medium" : "light"}
                                            radius="18px"
                                            className={cn(
                                                "px-5 py-4 border transition-all duration-300 flex items-center gap-4 cursor-pointer select-none",
                                                isSelected 
                                                    ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg scale-[1.01]" 
                                                    : "border-white/5 bg-zinc-950/20 hover:bg-zinc-950/40 hover:border-white/10 active:scale-[0.99]"
                                            )}
                                        >
                                            <span className={cn(
                                                "w-7.5 h-7.5 rounded-lg flex items-center justify-center text-xs font-black border transition-all",
                                                isSelected 
                                                    ? "bg-[var(--accent)] text-zinc-950 border-[var(--accent)]" 
                                                    : "bg-white/5 text-zinc-400 border-white/5 group-hover:text-white"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className={cn(
                                                "flex-1 text-sm font-serif",
                                                isSelected ? "text-white font-medium" : "text-zinc-300"
                                            )}>
                                                {option}
                                            </span>
                                            {isSelected && (
                                                <CheckCircle size={16} className="text-[var(--accent)] shrink-0 animate-bounce" />
                                            )}
                                        </GlassmorphicCard>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="sticky bottom-0 border-t border-white/5 bg-[#06060B]/90 backdrop-blur-xl p-4 shrink-0">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={14} />
                        Prev
                    </button>

                    <div className="flex items-center gap-2">
                        {syncError && (
                            <span className="text-[9px] font-bold text-red-400 animate-pulse uppercase tracking-wider">Sync issue...</span>
                        )}
                        {opponentFinished && (
                            <span className="text-[9px] font-bold text-emerald-400 animate-bounce uppercase tracking-wider">Opponent finished!</span>
                        )}
                    </div>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white text-zinc-950 hover:bg-white/95 active:scale-97 cursor-pointer shadow-lg"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-white/5 text-white hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            Next
                            <ArrowRight size={14} />
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
                        <GlassmorphicCard
                            intensity="heavy"
                            radius="32px"
                            className="w-full max-w-sm border border-white/10 p-6 text-center shadow-2xl"
                        >
                            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 shadow-xl text-[var(--accent)]">
                                <Flag size={28} className="animate-pulse" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1.5">Submit Duel?</h3>
                            <p className="text-xs text-zinc-400 mb-5 leading-relaxed font-serif">
                                You&apos;ve answered {Object.keys(answers).length}/{questions.length} questions.
                                {opponentFinished ? " Your opponent has finished." : " Your opponent is still working."}
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-white/5 cursor-pointer"
                                >
                                    Review
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[var(--accent)] text-zinc-950 hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    Submit
                                </button>
                            </div>
                        </GlassmorphicCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Forfeit Modal */}
            <AnimatePresence>
                {showAbandonModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <GlassmorphicCard
                            intensity="heavy"
                            radius="32px"
                            className="w-full max-w-sm border border-white/10 p-6 text-center shadow-2xl"
                        >
                            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-xl text-red-400">
                                <Flag size={28} />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1.5">Forfeit Duel?</h3>
                            <p className="text-xs text-zinc-400 mb-5 leading-relaxed font-serif">
                                Are you sure you want to run? Leaving the pit counts as an automatic defeat and your wager will be lost.
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => setShowAbandonModal(false)}
                                    className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-white/5 cursor-pointer"
                                >
                                    Stay & Fight
                                </button>
                                <button
                                    onClick={handleAbandon}
                                    className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-500 text-white hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    Forfeit
                                </button>
                            </div>
                        </GlassmorphicCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Forfeit Victory Modal */}
            <AnimatePresence>
                {showForfeitVictoryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <GlassmorphicCard
                            intensity="heavy"
                            radius="32px"
                            className="w-full max-w-sm border border-white/10 p-6 text-center shadow-2xl"
                        >
                            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#2BB288]/10 flex items-center justify-center border border-[#2BB288]/20 shadow-xl text-[#2BB288]">
                                <Swords size={28} className="animate-bounce" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1.5">Opponent Forfeited!</h3>
                            <p className="text-xs text-zinc-300 mb-5 leading-relaxed font-serif">
                                Your opponent has left the pit. You win the speed battle by default and secure the wager payout!
                            </p>
                            <button
                                onClick={() => router.push(`/arena/results?id=${duelId}`)}
                                className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#2BB288] text-white hover:opacity-95 transition-all cursor-pointer"
                            >
                                View Results
                            </button>
                        </GlassmorphicCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
