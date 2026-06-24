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

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    velocityX: number;
    velocityY: number;
    opacity: number;
    decay: number;
    rotation: number;
    rotationSpeed: number;
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

    // Canvas particle effects & audio trigger on load
    useEffect(() => {
        if (isDraw) {
            playResultsSound("draw");
        } else if (isWinner) {
            playResultsSound("victory");
        } else {
            playResultsSound("defeat");
        }

        if (!isWinner && !isDraw) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        const particles: Particle[] = [];
        const colors = ["#E5A93C", "#9673F5", "#2BB288", "#4A7CF5", "#FCA3B0"];

        const resizeCanvas = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const spawnCount = isWinner ? 120 : 50;
        for (let i = 0; i < spawnCount; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 80,
                y: canvas.height * 0.35 + (Math.random() - 0.5) * 40,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                velocityX: (Math.random() - 0.5) * 16,
                velocityY: (Math.random() - 0.7) * 22 - 6,
                opacity: 1,
                decay: Math.random() * 0.012 + 0.006,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.25
            });
        }

        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let allDead = true;

            particles.forEach((p) => {
                if (p.opacity > 0) {
                    allDead = false;
                    p.x += p.velocityX;
                    p.y += p.velocityY;
                    p.velocityY += 0.38; // gravity
                    p.velocityX *= 0.97; // resistance
                    p.opacity -= p.decay;
                    p.rotation += p.rotationSpeed;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
                    ctx.restore();
                }
            });

            if (!allDead) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
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
        if (percentage === 100) return { label: "S", color: "#E5A93C", glow: "rgba(229,169,60,0.3)" };
        if (percentage >= 90) return { label: "A+", color: "#2BB288", glow: "rgba(43,178,136,0.3)" };
        if (percentage >= 80) return { label: "A", color: "#2BB288", glow: "rgba(43,178,136,0.2)" };
        if (percentage >= 70) return { label: "B+", color: "#9673F5", glow: "rgba(150,115,245,0.3)" };
        if (percentage >= 60) return { label: "B", color: "#9673F5", glow: "rgba(150,115,245,0.2)" };
        if (percentage >= 50) return { label: "C", color: "#E5A93C", glow: "rgba(229,169,60,0.2)" };
        return { label: "F", color: "#E85D75", glow: "rgba(232,93,117,0.3)" };
    };

    const userGrade = getGrade(userPercentage);
    const opponentGrade = getGrade(opponentPercentage);
    const reviewQuestion = (questions && questions.length > 0) ? questions[currentReviewIndex] : null;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 relative overflow-x-hidden flex flex-col">
            {/* Confetti Canvas */}
            {(isWinner || isDraw) && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 pointer-events-none z-10 w-full h-full"
                    style={{ mixBlendMode: "screen" }}
                />
            )}

            {/* Header */}
            <header className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-4 flex items-center justify-between relative z-20">
                <button 
                    onClick={() => {
                        playResultsSound("click");
                        router.push("/arena");
                    }} 
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <X size={20} strokeWidth={1.5} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500">Duel Complete</span>
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
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[#9673F5]/10 border border-[#9673F5]/25 flex items-center justify-center shadow-[0_0_40px_rgba(150,115,245,0.2)]">
                                        <Handshake size={44} className="text-[#9673F5]" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider text-[#9673F5]">IT&apos;S A DRAW! 🤝</h1>
                                        <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
                                            A worthy match of equal minds. You both read the same notes, clearly.
                                        </p>
                                    </div>
                                </div>
                            ) : isWinner ? (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-[#E5A93C]/10 border border-[#E5A93C]/25 flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(229,169,60,0.25)]">
                                        <Trophy size={44} className="text-[#E5A93C]" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider text-[#E5A93C]">YOU ACED IT! 🏆</h1>
                                        <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
                                            The Professor is impressed. Your study stash just grew richer.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                                        <Coffee size={44} className="text-zinc-500" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black uppercase tracking-wider text-zinc-300">NICE HUSTLE! ☕</h1>
                                        <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
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
                                glowColor={isWinner ? "rgba(229, 169, 60, 0.05)" : isDraw ? "rgba(150, 115, 245, 0.05)" : undefined}
                                className="w-full overflow-hidden"
                            >
                                <div className="grid grid-cols-3 gap-2 p-6 text-center items-center">
                                    {/* Host profile column */}
                                    <div className={cn("flex flex-col items-center", isHost ? 'order-1' : 'order-3')}>
                                        <div className={cn(
                                            "w-14 h-14 mb-3 rounded-2xl flex items-center justify-center text-xl font-black transition-all",
                                            isHost 
                                                ? 'bg-[#E5A93C]/15 text-[#E5A93C] border border-[#E5A93C]/25 shadow-[0_0_15px_rgba(229,169,60,0.15)]' 
                                                : 'bg-white/5 border border-white/5 text-zinc-400'
                                        )}>
                                            {host.avatar ? (
                                                <img src={host.avatar} alt={host.name} className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                host.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <p className={cn("font-bold text-xs truncate max-w-[90px]", isHost ? 'text-white' : 'text-zinc-400')}>{host.name}</p>
                                        {isHost && <p className="text-[9px] font-black text-[#E5A93C] uppercase tracking-widest mt-0.5">You</p>}
                                        <p className="text-2xl font-black mt-2" style={{ color: userGrade.color }}>{host.score}/{questions ? questions.length : 0}</p>
                                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: userGrade.color }}>{userGrade.label}</p>
                                    </div>

                                    {/* VS separator column */}
                                    <div className="order-2 flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-1">
                                            <span className="text-xs font-black text-zinc-500">VS</span>
                                        </div>
                                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Final</div>
                                    </div>

                                    {/* Challenger profile column */}
                                    <div className={cn("flex flex-col items-center", !isHost ? 'order-1' : 'order-3')}>
                                        {challenger ? (
                                            <>
                                                <div className={cn(
                                                    "w-14 h-14 mb-3 rounded-2xl flex items-center justify-center text-xl font-black transition-all",
                                                    !isHost 
                                                        ? 'bg-[#E5A93C]/15 text-[#E5A93C] border border-[#E5A93C]/25 shadow-[0_0_15px_rgba(229,169,60,0.15)]' 
                                                        : 'bg-white/5 border border-white/5 text-zinc-400'
                                                )}>
                                                    {challenger.avatar ? (
                                                        <img src={challenger.avatar} alt={challenger.name} className="w-full h-full rounded-2xl object-cover" />
                                                    ) : (
                                                        challenger.name[0]?.toUpperCase()
                                                    )}
                                                </div>
                                                <p className={cn("font-bold text-xs truncate max-w-[90px]", !isHost ? 'text-white' : 'text-zinc-400')}>{challenger.name}</p>
                                                {!isHost && <p className="text-[9px] font-black text-[#E5A93C] uppercase tracking-widest mt-0.5">You</p>}
                                                <p className="text-2xl font-black mt-2" style={{ color: opponentGrade.color }}>{challenger.score}/{questions ? questions.length : 0}</p>
                                                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: opponentGrade.color }}>{opponentGrade.label}</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 mb-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 font-bold">
                                                    ?
                                                </div>
                                                <p className="text-zinc-500 text-xs font-bold">Opponent</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Reward Securing Banner */}
                                <div className="p-4 border-t border-white/5 bg-[#E5A93C]/5 flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Star size={13} className="text-[#E5A93C] fill-[#E5A93C]/20" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E5A93C] opacity-80">Reward Secured</p>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-[#E5A93C]">
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
                                    className="w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-[#E5A93C] text-zinc-950 hover:bg-[#E5A93C]/90 shadow-[0_4px_24px_rgba(229,169,60,0.15)]"
                                >
                                    Review Answers
                                </button>
                            )}

                            {opponentRematchId && (
                                <p className="text-xs text-[#E5A93C] font-black text-center animate-bounce mb-1">
                                    {isHost ? challenger?.name || "Opponent" : host.name} wants a rematch! 🤝
                                </p>
                            )}

                            {opponentRematchId ? (
                                <button
                                    onClick={() => {
                                        playResultsSound("click");
                                        router.push(`/arena?id=${opponentRematchId}`);
                                    }}
                                    className="w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-white text-zinc-950 hover:bg-white/95 shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
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
                                    className="w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50"
                                >
                                    {isInitiatingRematch ? "Drafting Rematch..." : "Run It Back 🔄"}
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    playResultsSound("click");
                                    router.push("/arena");
                                }}
                                className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
                            >
                                Back to Arena
                            </button>
                        </motion.div>

                        {/* Recent Competition Context (Leaderboards) */}
                        <div className="w-full mt-12 pt-8 border-t border-white/5 overflow-hidden">
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
                                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <ChevronLeft size={20} strokeWidth={1.5} />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                Question {currentReviewIndex + 1} of {questions ? questions.length : 0}
                            </span>
                            <div className="w-8" />
                        </div>

                        <GlassmorphicCard intensity="heavy" radius="28px" className="mb-6 overflow-hidden">
                            <div className="px-6 py-6">
                                <p className="text-lg font-serif text-zinc-100 mb-6 leading-relaxed">
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
                                                        ? 'bg-[#2BB288]/10 border-[#2BB288]/30 text-white'
                                                        : 'bg-white/5 border-transparent text-zinc-400 opacity-60'
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all",
                                                    isCorrect ? 'bg-[#2BB288]/20 text-[#2BB288]' : 'bg-white/5 text-zinc-500'
                                                )}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className={cn(
                                                    "font-serif text-[14px]",
                                                    isCorrect ? 'text-white' : 'text-zinc-400'
                                                )}>
                                                    {option}
                                                </span>
                                                {isCorrect && (
                                                    <span className="ml-auto">
                                                        <CheckCircle2 size={16} className="text-[#2BB288]" />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                 <div className="mt-6 p-4 rounded-xl bg-[#9673F5]/5 border-l-2 border-[#9673F5]">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9673F5] mb-1.5 flex items-center gap-1.5">
                                        <Lightbulb size={13} />
                                        Explanation
                                    </h4>
                                    <p className="text-[13px] font-serif text-zinc-300 leading-relaxed">
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
                                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white disabled:opacity-30 transition-all bg-white/5 flex items-center gap-2"
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
                                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-[#2BB288] text-zinc-950 hover:bg-[#2BB288]/90"
                                >
                                    Done
                                </button>
                            ) : (
                                 <button
                                    onClick={() => {
                                        playResultsSound("page-turn");
                                        setCurrentReviewIndex(prev => Math.min(questions ? questions.length - 1 : 0, prev + 1));
                                    }}
                                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-zinc-950 hover:bg-white/95 flex items-center gap-2"
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
