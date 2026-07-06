"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    X, 
    Star, 
    ChevronLeft, 
    CheckCircle2, 
    Lightbulb, 
    Trophy,
    ArrowLeft,
    ArrowRight,
    Coffee,
    Handshake
} from "lucide-react";
import GlobalLeaderboard from "./GlobalLeaderboard";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

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

// Programmatic Web Audio Synthesizer
const playResultsSound = (type: "victory" | "draw" | "defeat" | "click" | "page-turn") => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        if (type === "victory") {
            // Triumphant C-major arpeggio sweep
            const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 -> E5 -> G5 -> C6 -> E6
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.04, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.4);
            });
        } else if (type === "draw") {
            // Friendly warm major triad chord
            const freqs = [329.63, 392.00, 523.25]; // E4, G4, C5
            freqs.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.55);
            });
        } else if (type === "defeat") {
            // Melancholy detuning descent
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(293.66, now); // D4
            osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.55); // D3
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.65);
        } else if (type === "click") {
            // Tactile monospaced button tap
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === "page-turn") {
            // Elegant navigation pop
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (e) {
        console.warn("Audio synthesis failed", e);
    }
};

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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const opponentId = isHost ? challenger?.id : host.id;

    const userId = isHost ? host.id : challenger?.id;
    const userScore = isHost ? host.score : challenger?.score || 0;
    const opponentScore = isHost ? challenger?.score || 0 : host.score;
    const isWinner = winnerId === userId;
    const isDraw = winnerId === null && host.score === challenger?.score;
    const userPercentage = (questions && questions.length > 0) ? Math.round((userScore / questions.length) * 100) : 0;
    const opponentPercentage = (challenger && questions && questions.length > 0) ? Math.round((opponentScore / questions.length) * 100) : 0;

    // Realtime opponent rematch channel
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
                    if (payload.new?.answers?.rematch_duel_id && payload.new?.user_id === opponentId) {
                        setOpponentRematchId(payload.new.answers.rematch_duel_id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [duelId, opponentId]);

    useEffect(() => {
        if (isWinner) {
            playResultsSound("victory");
        } else if (isDraw) {
            playResultsSound("draw");
        } else {
            playResultsSound("defeat");
        }
    }, [isWinner, isDraw]);

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

    const getGrade = (percentage: number) => {
        if (percentage === 100) return { label: "S", color: "var(--amber)" };
        if (percentage >= 90) return { label: "A+", color: "emerald-500" };
        if (percentage >= 80) return { label: "A", color: "emerald-500" };
        if (percentage >= 70) return { label: "B+", color: "var(--purple)" };
        if (percentage >= 60) return { label: "B", color: "var(--purple)" };
        if (percentage >= 50) return { label: "C", color: "var(--amber)" };
        return { label: "F", color: "red-500" };
    };

    const userGrade = getGrade(userPercentage);
    const opponentGrade = getGrade(opponentPercentage);
    const reviewQuestion = (questions && questions.length > 0) ? questions[currentReviewIndex] : null;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-x-hidden flex flex-col">
            {/* Confetti Canvas */}
            {(isWinner || isDraw) && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 pointer-events-none z-10 w-full h-full"
                    style={{ mixBlendMode: "screen" }}
                />
            )}

            {/* Header */}
            <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl px-4 flex items-center justify-between relative z-20">
                <button 
                    onClick={() => {
                        playResultsSound("click");
                        router.push("/arena");
                    }} 
                    className="p-2 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all cursor-pointer"
                >
                    <X size={20} strokeWidth={1.5} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[var(--foreground-muted)]">Duel Complete</span>
                </div>
                <div className="w-8" />
            </header>

            {!showAnswers ? (
                <>
                    {/* Results Main Screen */}
                    <main className="flex-1 flex flex-col items-center px-5 pt-8 pb-12 max-w-lg mx-auto w-full relative z-20">
                        {/* Winner/Draw/Hustle Banner */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full text-center mb-8"
                        >
                            {isDraw ? (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--purple)]/10 border border-[var(--purple)]/25 flex items-center justify-center shadow-lg">
                                        <Handshake size={44} className="text-[var(--purple)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider text-[var(--purple)]">IT&apos;S A DRAW! 🤝</h1>
                                        <p className="text-[var(--foreground-muted)] text-sm mt-2 max-w-md mx-auto font-medium">
                                            A worthy match of equal minds. You both read the same notes, clearly.
                                        </p>
                                    </div>
                                </div>
                            ) : isWinner ? (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/25 flex items-center justify-center animate-pulse shadow-lg">
                                        <Trophy size={44} className="text-[var(--amber)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider text-[var(--amber)]">YOU ACED IT! 🏆</h1>
                                        <p className="text-[var(--foreground-muted)] text-sm mt-2 max-w-md mx-auto font-medium">
                                            The Professor is impressed. Your study stash just grew richer.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center shadow-md">
                                        <Coffee size={44} className="text-[var(--foreground-muted)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider text-[var(--foreground)]">NICE HUSTLE! ☕</h1>
                                        <p className="text-[var(--foreground-muted)] text-sm mt-2 max-w-md mx-auto font-medium">
                                            Close battle! A few concepts slipped away this time. Round two?
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Score Comparison Display */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="w-full mb-8"
                        >
                            <GlassmorphicCard 
                                intensity="medium" 
                                radius="28px" 
                                className="w-full overflow-hidden border border-[var(--border-2)] shadow-xl bg-[var(--surface)]"
                            >
                                <div className="grid grid-cols-3 gap-2 p-6 text-center items-center">
                                    {/* Host profile column */}
                                    <div className={cn("flex flex-col items-center", isHost ? 'order-1' : 'order-3')}>
                                        <div className={cn(
                                            "w-14 h-14 mb-3 rounded-2xl flex items-center justify-center text-xl font-black transition-all",
                                            isHost 
                                                ? 'bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25 shadow-sm' 
                                                : 'bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)]'
                                        )}>
                                            {host.avatar ? (
                                                <img src={host.avatar} alt={host.name} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                host.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <p className={cn("font-bold text-xs truncate max-w-[90px]", isHost ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]')}>{host.name}</p>
                                        {isHost && <p className="text-[9px] font-black text-[var(--amber)] uppercase tracking-widest mt-0.5">You</p>}
                                        <p className="text-2xl font-black mt-2 text-[var(--foreground)]">{host.score}/{questions ? questions.length : 0}</p>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">{userGrade.label}</p>
                                    </div>

                                    {/* VS separator column */}
                                    <div className="order-2 flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-1">
                                            <span className="text-xs font-black text-[var(--foreground-muted)]">VS</span>
                                        </div>
                                        <div className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-widest font-black">Final</div>
                                    </div>

                                    {/* Challenger profile column */}
                                    <div className={cn("flex flex-col items-center", !isHost ? 'order-1' : 'order-3')}>
                                        {challenger ? (
                                            <>
                                                <div className={cn(
                                                    "w-14 h-14 mb-3 rounded-2xl flex items-center justify-center text-xl font-black transition-all",
                                                    !isHost 
                                                        ? 'bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25 shadow-sm' 
                                                        : 'bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)]'
                                                )}>
                                                    {challenger.avatar ? (
                                                        <img src={challenger.avatar} alt={challenger.name} className="w-full h-full rounded-2xl object-cover" />
                                                    ) : (
                                                        challenger.name[0]?.toUpperCase()
                                                    )}
                                                </div>
                                                <p className={cn("font-bold text-xs truncate max-w-[90px]", !isHost ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]')}>{challenger.name}</p>
                                                {!isHost && <p className="text-[9px] font-black text-[var(--amber)] uppercase tracking-widest mt-0.5">You</p>}
                                                <p className="text-2xl font-black mt-2 text-[var(--foreground)]">{challenger.score}/{questions ? questions.length : 0}</p>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">{opponentGrade.label}</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 mb-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] font-bold">
                                                    ?
                                                </div>
                                                <p className="text-[var(--foreground-muted)] text-xs font-bold">Opponent</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Reward Securing Banner */}
                                <div className="p-4 border-t border-[var(--border)] bg-[var(--amber)]/5 flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Star size={13} className="text-[var(--amber)] fill-[var(--amber)]/20" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--amber)] opacity-80">Reward Secured</p>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-[var(--amber)]">
                                        {isWinner ? "+25" : isDraw ? "+15" : "+10"} Duel XP Earned
                                    </span>
                                </div>
                            </GlassmorphicCard>
                        </motion.div>

                        {/* Interactive Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full space-y-4"
                        >
                            {questions && questions.length > 0 && (
                                <button
                                    onClick={() => {
                                        playResultsSound("click");
                                        setShowAnswers(true);
                                    }}
                                    className="btn-skeuo-blue w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                                >
                                    Review Answers
                                </button>
                            )}

                            {opponentRematchId && (
                                <p className="text-xs text-[var(--amber)] font-black text-center animate-bounce mb-1">
                                    {isHost ? challenger?.name || "Opponent" : host.name} wants a rematch! 🤝
                                </p>
                            )}

                            {opponentRematchId ? (
                                <button
                                    onClick={() => {
                                        playResultsSound("click");
                                        router.push(`/arena?id=${opponentRematchId}`);
                                    }}
                                    className="btn-skeuo-primary text-black w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                                >
                                    Accept Rematch 🤝
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        playResultsSound("click");
                                        handleInitiateRematch();
                                    }}
                                    disabled={isInitiatingRematch || !opponentId}
                                    className="w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border border-[var(--border)] bg-[var(--background-secondary)] hover:bg-[var(--surface)] hover:border-[var(--border-2)] text-[var(--foreground)] disabled:opacity-50 cursor-pointer shadow-sm"
                                >
                                    {isInitiatingRematch ? "Drafting Rematch..." : "Run It Back 🔄"}
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    playResultsSound("click");
                                    router.push("/arena");
                                }}
                                className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            >
                                Back to Arena
                            </button>
                        </motion.div>

                        {/* Recent Competition Context (Leaderboards) */}
                        <div className="w-full mt-12 pt-8 border-t border-[var(--border)] overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.45 }}
                            >
                                <GlobalLeaderboard />
                            </motion.div>
                        </div>
                    </main>
                </>
            ) : (
                <>
                    {/* Answer Review Session */}
                    <main className="max-w-2xl mx-auto px-4 py-6 w-full relative z-20 flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-6">
                            <button 
                                onClick={() => { 
                                    playResultsSound("click"); 
                                    setShowAnswers(false); 
                                }} 
                                className="p-2 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all cursor-pointer"
                            >
                                <ChevronLeft size={20} strokeWidth={1.5} />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                                Question {currentReviewIndex + 1} of {questions ? questions.length : 0}
                            </span>
                            <div className="w-8" />
                        </div>

                        <GlassmorphicCard intensity="heavy" radius="28px" className="mb-6 overflow-hidden border border-[var(--border-2)] bg-[var(--surface)] shadow-xl">
                            <div className="px-6 py-6">
                                <p className="text-lg font-serif text-[var(--foreground)] mb-6 leading-relaxed">
                                    {reviewQuestion?.question}
                                </p>

                                <div className="space-y-3">
                                    {reviewQuestion?.options?.map((option, idx) => {
                                        const isCorrect = idx === reviewQuestion?.correctIndex;
                                        
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "px-5 py-4 rounded-xl flex items-center gap-4 transition-all border",
                                                    isCorrect
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-[var(--foreground)] shadow-sm"
                                                        : "bg-[var(--background-secondary)] border-transparent text-[var(--foreground-muted)] opacity-70"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all border",
                                                    isCorrect ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-[var(--background)] text-[var(--foreground-muted)] border-[var(--border)]"
                                                )}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className={cn(
                                                    "font-serif text-[14px]",
                                                    isCorrect ? "text-[var(--foreground)] font-medium" : "text-[var(--foreground-muted)]"
                                                )}>
                                                    {option}
                                                </span>
                                                {isCorrect && (
                                                    <span className="ml-auto">
                                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                 <div className="mt-6 p-4 rounded-xl bg-[var(--purple)]/5 border-l-2 border-[var(--purple)]">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--purple)] mb-1.5 flex items-center gap-1.5">
                                        <Lightbulb size={13} />
                                        Explanation
                                    </h4>
                                    <p className="text-[13px] font-serif text-[var(--foreground-secondary)] leading-relaxed">
                                        {reviewQuestion?.explanation}
                                    </p>
                                </div>
                            </div>
                        </GlassmorphicCard>

                        <div className="flex items-center justify-between mt-2">
                             <button
                                onClick={() => {
                                    playResultsSound("page-turn");
                                    setCurrentReviewIndex(prev => Math.max(0, prev - 1));
                                }}
                                disabled={currentReviewIndex === 0}
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-all bg-[var(--background-secondary)] border border-[var(--border)] flex items-center gap-2 cursor-pointer"
                            >
                                <ArrowLeft size={14} />
                                Prev
                            </button>

                            {currentReviewIndex === (questions ? questions.length - 1 : 0) ? (
                                 <button
                                    onClick={() => {
                                        playResultsSound("click");
                                        setShowAnswers(false);
                                    }}
                                    className="btn-skeuo-blue px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] cursor-pointer shadow-md"
                                >
                                    Done
                                </button>
                            ) : (
                                 <button
                                    onClick={() => {
                                        playResultsSound("page-turn");
                                        setCurrentReviewIndex(prev => Math.min(questions ? questions.length - 1 : 0, prev + 1));
                                    }}
                                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-2)] flex items-center gap-2 cursor-pointer shadow-sm"
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
