"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    X, 
    Star, 
    ChevronLeft, 
    CheckCircle2, 
    Lightbulb, 
    Trophy,
    ListOrdered,
    ArrowLeft,
    ArrowRight,
    Search,
    Swords,
    Coffee,
    Handshake
} from "lucide-react";
import GlobalLeaderboard from "./GlobalLeaderboard";
import { createClient } from "@/lib/supabase/client";

interface DuelResultsProps {
    duelId: string;
    isHost: boolean;
    winnerId: string | null;
    host: {
        id: string;
        name: string;
        avatar?: string;
        xp: number;
        score: number;
    };
    challenger: {
        id: string;
        name: string;
        avatar?: string;
        xp: number;
        score: number;
    } | null;
    questions: {
        id?: string;
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }[];
}

export default function DuelResults({
    duelId,
    isHost,
    winnerId,
    host,
    challenger,
    questions
}: DuelResultsProps) {
    const router = useRouter();
    const [showAnswers, setShowAnswers] = useState(false);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [opponentRematchId, setOpponentRematchId] = useState<string | null>(null);
    const [isInitiatingRematch, setIsInitiatingRematch] = useState(false);

    const opponentId = isHost ? challenger?.id : host.id;

    useEffect(() => {
        const supabase = createClient();

        const checkOpponentRematch = async () => {
            if (!opponentId) return;
            const { data } = await supabase
                .from("duel_sessions")
                .select("answers")
                .eq("duel_id", duelId)
                .eq("user_id", opponentId)
                .single();
            
            if (data?.answers?.rematch_duel_id) {
                setOpponentRematchId(data.answers.rematch_duel_id);
            }
        };

        checkOpponentRematch();

        // Realtime subscription to notice when opponent sets a rematch ID in their session
        const channel = supabase
            .channel(`duel-rematch-${duelId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "duel_sessions",
                    filter: `duel_id=eq.${duelId}`
                },
                (payload: any) => {
                    const session = payload.new;
                    if (session.user_id === opponentId && session.answers?.rematch_duel_id) {
                        setOpponentRematchId(session.answers.rematch_duel_id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [duelId, opponentId]);

    const handleInitiateRematch = async () => {
        if (!opponentId) return;
        setIsInitiatingRematch(true);
        try {
            const res = await fetch(`/api/arena/${duelId}/rematch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.success && data.rematchDuelId) {
                router.push(`/arena?id=${data.rematchDuelId}`);
            } else {
                console.error("Failed to create rematch", data.error);
            }
        } catch (err) {
            console.error("Rematch error:", err);
        } finally {
            setIsInitiatingRematch(false);
        }
    };

    const userId = isHost ? host.id : challenger?.id;
    const userScore = isHost ? host.score : challenger?.score || 0;
    const opponentScore = isHost ? challenger?.score || 0 : host.score;
    const isWinner = winnerId === userId;
    const isDraw = winnerId === null && host.score === challenger?.score;
    const userPercentage = Math.round((userScore / questions.length) * 100);
    const opponentPercentage = challenger ? Math.round((opponentScore / questions.length) * 100) : 0;

    const getGrade = (percentage: number) => {
        if (percentage === 100) return { label: "S", color: "var(--accent)", glow: "var(--accent-glow)" };
        if (percentage >= 90) return { label: "A+", color: "var(--success)", glow: "var(--success-glow)" };
        if (percentage >= 80) return { label: "A", color: "var(--success)", glow: "var(--success-glow)" };
        if (percentage >= 70) return { label: "B+", color: "var(--secondary)", glow: "var(--secondary-glow)" };
        if (percentage >= 60) return { label: "B", color: "var(--secondary)", glow: "var(--secondary-glow)" };
        if (percentage >= 50) return { label: "C", color: "var(--warning)", glow: "var(--accent-glow)" };
        return { label: "F", color: "var(--error)", glow: "var(--error-glow)" };
    };

    const userGrade = getGrade(userPercentage);
    const opponentGrade = getGrade(opponentPercentage);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {/* Header */}
            <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl px-4 flex items-center justify-between">
                <button onClick={() => router.push("/arena")} className="p-2 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all">
                    <X size={20} strokeWidth={1.5} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[var(--foreground-muted)]">Duel Complete</span>
                </div>
                <div className="w-8" />
            </header>

            {!showAnswers ? (
                <>
                    {/* Results Screen */}
                    <main className="flex flex-col items-center px-5 pt-8 pb-12 max-w-lg mx-auto">
                        {/* Winner Banner */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full text-center mb-8"
                        >
                            {isDraw ? (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--secondary)]/5 border-2 border-[var(--secondary)]/20 flex items-center justify-center shadow-[0_0_40px_var(--secondary-glow)]">
                                        <Handshake size={48} className="text-[var(--secondary)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-[var(--secondary)]">IT&apos;S A DRAW! 🤝</h1>
                                        <p className="text-[var(--foreground-muted)] mt-2">A worthy match of equal minds. You both read the same notes, clearly.</p>
                                    </div>
                                </div>
                            ) : isWinner ? (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--accent)]/5 border-2 border-[var(--accent)]/20 flex items-center justify-center animate-pulse shadow-[0_0_40px_var(--accent-glow)]">
                                        <Trophy size={48} className="text-[var(--accent)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-[var(--accent)]">YOU ACED IT! 🏆</h1>
                                        <p className="text-[var(--foreground-muted)] mt-2">The Professor is impressed. Your study stash just grew richer.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--foreground)]/5 border-2 border-[var(--foreground)]/10 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.02)]">
                                        <Coffee size={48} className="text-[var(--foreground-muted)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-[var(--foreground)]">NICE HUSTLE! ☕</h1>
                                        <p className="text-[var(--foreground-muted)] mt-2">Close battle! A few concepts slipped away this time. Round two?</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Score Comparison */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full rounded-[32px] overflow-hidden bg-white/[0.02] border border-white/5 mb-8"
                        >
                            <div className="grid grid-cols-3 gap-4 p-6 text-center">
                                {/* Host */}
                                <div className={`${isHost ? 'order-1' : 'order-3'}`}>
                                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl font-black ${isHost ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)]'}`}>
                                        {host.avatar ? (
                                            <img src={host.avatar} alt={host.name} className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            host.name[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <p className={`font-bold ${isHost ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>{host.name}</p>
                                    {isHost && <p className="text-[10px] text-[var(--secondary)] uppercase tracking-wider">You</p>}
                                    <p className="text-3xl font-black mt-2" style={{ color: userGrade.color }}>{host.score}/{questions.length}</p>
                                    <p className="text-lg font-bold" style={{ color: userGrade.color }}>{userGrade.label}</p>
                                </div>

                                {/* VS */}
                                <div className="order-2 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center mb-2">
                                        <span className="text-xl font-black text-[var(--foreground-muted)]">VS</span>
                                    </div>
                                    <div className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest">Final Score</div>
                                </div>

                                {/* Challenger */}
                                <div className={`${isHost ? 'order-3' : 'order-1'}`}>
                                    {challenger ? (
                                        <>
                                            <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl font-black ${!isHost ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)]'}`}>
                                                {challenger.avatar ? (
                                                    <img src={challenger.avatar} alt={challenger.name} className="w-full h-full rounded-2xl object-cover" />
                                                ) : (
                                                    challenger.name[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <p className={`font-bold ${!isHost ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}>{challenger.name}</p>
                                            {!isHost && <p className="text-[10px] text-[var(--secondary)] uppercase tracking-wider">You</p>}
                                            <p className="text-3xl font-black mt-2" style={{ color: opponentGrade.color }}>{challenger.score}/{questions.length}</p>
                                            <p className="text-lg font-bold" style={{ color: opponentGrade.color }}>{opponentGrade.label}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[var(--foreground)]/5 flex items-center justify-center">
                                                <span className="text-2xl text-[var(--foreground-muted)]">?</span>
                                            </div>
                                            <p className="text-[var(--foreground-muted)]">Opponent</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* XP Rewards */}
                            <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] opacity-60">Reward Secured</p>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-[var(--accent)]">
                                    <span className="text-sm font-bold">
                                        {isWinner ? "+25" : isDraw ? "+15" : "+10"} Duel XP Earned
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="w-full space-y-4"
                        >
                            <button
                                onClick={() => setShowAnswers(true)}
                                className="w-full py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-white text-[#06060B] hover:bg-white/90 shadow-[0_4px_24px_rgba(255,255,255,0.1)]"
                            >
                                Review Answers
                            </button>

                            {opponentRematchId && (
                                <p className="text-xs text-[var(--accent)] font-bold text-center animate-bounce mb-1">
                                    {isHost ? challenger?.name || "Opponent" : host.name} wants a rematch! 🤝
                                </p>
                            )}

                            {opponentRematchId ? (
                                <button
                                    onClick={() => router.push(`/arena?id=${opponentRematchId}`)}
                                    className="w-full py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-white text-black hover:bg-white/95 shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
                                >
                                    Accept Rematch 🤝
                                </button>
                            ) : (
                                <button
                                    onClick={handleInitiateRematch}
                                    disabled={isInitiatingRematch || !opponentId}
                                    className="w-full py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-[var(--border)] bg-transparent hover:bg-[var(--foreground)]/5 text-[var(--foreground)] disabled:opacity-50"
                                >
                                    {isInitiatingRematch ? "Drafting Rematch..." : "Run It Back 🔄"}
                                </button>
                            )}

                             <button
                                onClick={() => router.push("/arena")}
                                className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                Back to Arena
                            </button>
                        </motion.div>

                        {/* Recent Competition Context */}
                        <div className="w-full mt-12 pt-12 border-t border-[var(--border)] overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <GlobalLeaderboard />
                            </motion.div>
                        </div>
                    </main>
                </>
            ) : (
                <>
                    {/* Answer Review */}
                    <main className="max-w-3xl mx-auto px-4 py-6">
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={() => setShowAnswers(false)} className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5">
                                <ChevronLeft size={20} strokeWidth={1.5} />
                            </button>
                            <span className="text-sm font-bold text-[var(--foreground-muted)]">Question {currentReviewIndex + 1} of {questions.length}</span>
                            <div className="w-8" />
                        </div>

                        <div className="rounded-[32px] overflow-hidden bg-[var(--card)] border border-[var(--border)]">
                            <div className="px-6 py-6">
                                <p className="text-lg font-medium text-[var(--foreground)] mb-6">
                                    {questions[currentReviewIndex].question}
                                </p>

                                <div className="space-y-3">
                                    {questions[currentReviewIndex].options.map((option, idx) => {
                                        const isCorrect = idx === questions[currentReviewIndex].correctIndex;
                                        
                                        return (
                                            <div
                                                key={idx}
                                                className={`px-6 py-4 rounded-2xl flex items-center gap-4 ${
                                                    isCorrect
                                                        ? 'bg-[var(--success)]/10 border border-[var(--success)]/20'
                                                        : 'bg-[var(--foreground)]/5 opacity-40'
                                                }`}
                                            >
                                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                                                    isCorrect ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)]'
                                                }`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className={isCorrect ? 'text-[var(--success)]' : 'text-[var(--foreground-muted)]'}>
                                                    {option}
                                                </span>
                                                {isCorrect && (
                                                    <span className="ml-auto">
                                                        <CheckCircle2 size={18} strokeWidth={1.5} className="text-[var(--success)]" />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                 <div className="mt-6 p-4 rounded-xl bg-[var(--secondary)]/5 border-l-4 border-[var(--secondary)]">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--secondary)] mb-2 flex items-center gap-2">
                                        <Lightbulb size={14} />
                                        Explanation
                                    </h4>
                                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                                        {questions[currentReviewIndex].explanation}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                             <button
                                onClick={() => setCurrentReviewIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentReviewIndex === 0}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-all bg-[var(--foreground)]/5 flex items-center gap-2"
                            >
                                <ArrowLeft size={14} />
                                Prev
                            </button>

                            {currentReviewIndex === questions.length - 1 ? (
                                 <button
                                    onClick={() => setShowAnswers(false)}
                                    className="px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider bg-[var(--success)] text-[var(--background)]"
                                >
                                    Done
                                </button>
                            ) : (
                                 <button
                                    onClick={() => setCurrentReviewIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--foreground)] text-[var(--background)] flex items-center gap-2"
                                >
                                    Next
                                    <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}
