"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
    Swords, 
    Copy, 
    Check, 
    Hourglass, 
    BookOpen, 
    Users, 
    Clock, 
    X,
    BookOpen as QuizIcon 
} from "lucide-react";
import { useDuelRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

interface DuelLobbyProps {
    duelId: string;
    code: string;
    status: string;
    isHost: boolean;
    host: {
        id: string;
        name: string;
        avatar?: string;
        xp?: number;
        streak?: number;
        score?: number;
        session?: {
            currentQuestionIndex: number;
            isReady: boolean;
            answers: Record<string, number>;
        };
    };
    challenger: {
        id: string;
        name: string;
        avatar?: string;
        xp?: number;
        streak?: number;
        score?: number;
        session?: {
            currentQuestionIndex: number;
            isReady: boolean;
            answers: Record<string, number>;
        };
    } | null;
    generation: {
        id: string;
        title: string;
        questionCount: number;
    };
    timeLimit: number;
    onOpponentJoin?: () => void;
    onDuelStart?: () => void;
    onDuelEnd?: () => void;
}

export default function DuelLobby({
    duelId,
    code,
    status: initialStatus,
    isHost,
    host,
    challenger: initialChallenger,
    generation,
    timeLimit,
    onOpponentJoin,
    onDuelStart,
    onDuelEnd
}: DuelLobbyProps) {
    const router = useRouter();
    const [status, setStatus] = useState(initialStatus);
    const [hostState, setHostState] = useState(host);
    const [challenger, setChallenger] = useState(initialChallenger);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    const currentUserSession = isHost ? hostState.session : challenger?.session;
    const [isReady, setIsReady] = useState(currentUserSession?.isReady || false);

    const startCountdown = useCallback(() => {
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    router.push(`/arena/play?id=${duelId}`);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    }, [duelId, router]);

    // Realtime subscription for duel updates
    useDuelRealtime(duelId, {
        onDuelUpdate: useCallback((payload: any) => {
            const newData = payload.new;
            if (!newData) return;

            setStatus(newData.status);

            // Fetch updated duel state
            fetch(`/api/arena/${duelId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.duel) {
                        setHostState(data.duel.host);
                        setChallenger(data.duel.challenger);
                        setStatus(data.duel.status);
                    }
                });

            // Check if duel started
            if (newData.status === 'IN_PROGRESS') {
                onDuelStart?.();
                router.push(`/arena/play?id=${duelId}`);
            }

            // Check if duel completed
            if (newData.status === 'COMPLETED') {
                onDuelEnd?.();
                router.push(`/arena/results?id=${duelId}`);
            }

            // Check if duel cancelled
            if (newData.status === 'CANCELLED' || newData.status === 'EXPIRED') {
                router.push("/arena");
            }
        }, [duelId, router, onDuelStart, onDuelEnd]),

        onSessionUpdate: useCallback((payload: any) => {
            fetch(`/api/arena/${duelId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.duel) {
                        setStatus(data.duel.status);
                        setHostState(data.duel.host);
                        setChallenger(data.duel.challenger);
                        
                        const currentSession = isHost ? data.duel.host.session : data.duel.challenger?.session;
                        if (currentSession) {
                            setIsReady(currentSession.isReady);
                        }
                    }
                });
        }, [duelId, isHost]),

        onChallengerJoin: useCallback(() => {
            fetch(`/api/arena/${duelId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.duel) {
                        setChallenger(data.duel.challenger);
                        setHostState(data.duel.host);
                        onOpponentJoin?.();
                    }
                });
        }, [duelId, onOpponentJoin])
    });

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    const handleReady = async () => {
        try {
            const res = await fetch(`/api/arena/${duelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ready" })
            });
            
            if (res.ok) {
                const data = await res.json();
                setIsReady(data.isReady);
            }
        } catch (error) {
            console.error("Ready error:", error);
        }
    };

    const handleStart = async () => {
        try {
            const res = await fetch(`/api/arena/${duelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start" })
            });
            
            if (res.ok) {
                startCountdown();
            }
        } catch (error) {
            console.error("Start error:", error);
        }
    };

    const handleCancel = async () => {
        try {
            await fetch(`/api/arena/${duelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel" })
            });
            router.push("/arena");
        } catch (error) {
            console.error("Cancel error:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[var(--background)]/90 backdrop-blur-2xl">
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--purple)]/10 rounded-full blur-[120px]" />
                    <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[var(--amber)]/10 rounded-full blur-[80px]" />
                </div>

                <AnimatePresence>
                    {countdown !== null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/95 z-50 pointer-events-none"
                        >
                            <div className="text-center">
                                <motion.div
                                    key={countdown}
                                    initial={{ scale: 0.3, rotate: -15 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 1.6, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="text-[120px] sm:text-[180px] font-black text-[var(--blue)] tracking-tighter"
                                    style={{
                                        textShadow: "0 0 50px rgba(59,130,246,0.3)"
                                    }}
                                >
                                    {countdown === 0 ? "GO!" : countdown}
                                </motion.div>
                                <p className="text-[var(--foreground-muted)] text-base tracking-widest uppercase font-mono animate-pulse">Prepare yourself!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-md mx-4 z-10"
                >
                    <GlassmorphicCard intensity="heavy" radius="32px" className="border border-[var(--border-2)] shadow-2xl overflow-hidden bg-[var(--surface)]">
                        {/* Header */}
                        <div className="relative p-6 text-center border-b border-[var(--border)] flex flex-col items-center">
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--purple)] via-[var(--amber)] to-[var(--blue)]" />
                            
                            <div className="w-14 h-14 mb-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--blue)] shadow-inner">
                                <Swords size={28} className="animate-pulse" />
                            </div>
                            
                            <h2 className="text-xl font-black text-[var(--foreground)] italic tracking-tight uppercase">STUDY DUEL</h2>
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--foreground-muted)] mt-1">
                                {status === 'WAITING' ? 'Awaiting Classmate' : status === 'READY' ? 'Ready to Start!' : 'In Progress'}
                            </p>
                        </div>

                        {/* Code Display */}
                        <div className="p-5 border-b border-[var(--border)] text-center">
                            <p className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.2em] mb-2.5">LOBBY ACCESS CODE</p>
                            <button
                                onClick={handleCopyCode}
                                className="w-full group focus:outline-none cursor-pointer"
                            >
                                <div className="px-6 py-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] group-hover:border-[var(--blue)]/50 transition-all flex items-center justify-between shadow-inner">
                                    <p className="text-3xl font-mono font-black text-[var(--foreground)] tracking-[0.3em] flex-1 text-center pl-4">
                                        {code}
                                    </p>
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-all shrink-0",
                                        copied 
                                            ? "bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20" 
                                            : "bg-[var(--background)] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] group-hover:bg-[var(--background-secondary)] border border-[var(--border)]"
                                    )}>
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Participants */}
                        <div className="p-5 space-y-3">
                            <p className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.2em] text-center mb-1">SCHOLARS</p>
                            
                            {/* Host */}
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center text-sm font-black text-[var(--purple)]">
                                    {hostState.avatar ? (
                                        <img src={hostState.avatar} alt={hostState.name} className="w-full h-full rounded-xl object-cover" />
                                    ) : (
                                        hostState.name[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-[var(--foreground)] text-xs">{hostState.name}</span>
                                        {isHost && <span className="text-[var(--amber)] text-xs">👑</span>}
                                    </div>
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">Level {hostState.streak || 1} Scholar</p>
                                </div>
                                <div className="text-right flex items-center gap-2.5">
                                    <p className="text-xs font-bold text-[var(--foreground)]">{hostState.xp || 0} XP</p>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                        hostState.session?.isReady 
                                            ? "bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/20" 
                                            : "bg-[var(--background)] text-[var(--foreground-muted)] border-[var(--border)]"
                                    )}>
                                        {hostState.session?.isReady ? "Locked In" : "Deciding"}
                                    </span>
                                </div>
                            </div>

                            {/* Challenger */}
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                {challenger ? (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-center text-sm font-black text-[var(--blue)]">
                                            {challenger.avatar ? (
                                                <img src={challenger.avatar} alt={challenger.name} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                challenger.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-[var(--foreground)] text-xs">{challenger.name}</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">Level {challenger.streak || 1} Scholar</p>
                                        </div>
                                        <div className="text-right flex items-center gap-2.5">
                                            <p className="text-xs font-bold text-[var(--foreground)]">{challenger.xp || 0} XP</p>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                challenger.session?.isReady 
                                                    ? "bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/20 animate-pulse" 
                                                    : "bg-[var(--background)] text-[var(--foreground-muted)] border-[var(--border)]"
                                            )}>
                                                {challenger.session?.isReady ? "Locked In" : "Deciding"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
                                            <Hourglass size={16} className="text-[var(--foreground-muted)] animate-pulse" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[var(--foreground-muted)] italic text-xs font-medium tracking-tight animate-pulse">Waiting for classmate...</p>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--background)] text-[var(--foreground-muted)] border-[var(--border)]">
                                            Waiting
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Quiz Info */}
                        <div className="px-5 pb-3">
                            <div className="p-3.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center gap-3 shadow-inner">
                                <QuizIcon size={16} className="text-[var(--blue)]" />
                                <div>
                                    <p className="text-xs font-black text-[var(--foreground)] tracking-tight leading-tight">{generation.title}</p>
                                    <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mt-0.5">{generation.questionCount} Questions • {Math.floor(timeLimit / 60)} min limit</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-5 border-t border-[var(--border)] bg-[var(--background-secondary)]">
                            {isHost ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all border border-[var(--border)] cursor-pointer"
                                        >
                                            Abandon
                                        </button>
                                        <button
                                            onClick={handleReady}
                                            disabled={!challenger}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer shadow-sm",
                                                isReady 
                                                    ? "bg-[var(--blue)]/10 border-[var(--blue)]/30 text-[var(--blue)] animate-pulse" 
                                                    : "btn-skeuo-primary text-black disabled:opacity-40 disabled:cursor-not-allowed"
                                            )}
                                        >
                                            {isReady ? "Ready ✓" : "Lock In 🔒"}
                                        </button>
                                    </div>
                                    {challenger && (
                                        <button
                                            onClick={handleStart}
                                            disabled={!challenger?.session?.isReady}
                                            className={cn(
                                                "w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2",
                                                challenger?.session?.isReady
                                                    ? "btn-skeuo-blue"
                                                    : "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)] cursor-not-allowed"
                                            )}
                                        >
                                            {challenger?.session?.isReady ? "Start Duel 🚀" : "Waiting for Classmate to Lock In..."}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all border border-[var(--border)] cursor-pointer"
                                    >
                                        Leave
                                    </button>
                                    <button
                                        onClick={handleReady}
                                        disabled={!challenger}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer shadow-sm",
                                            isReady 
                                                ? "bg-[var(--blue)]/10 border-[var(--blue)]/30 text-[var(--blue)]" 
                                                : "btn-skeuo-primary text-black disabled:opacity-40 disabled:cursor-not-allowed"
                                        )}
                                    >
                                        {isReady ? "Ready ✓" : "Lock In 🔒"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </GlassmorphicCard>
                </motion.div>
            </div>
        </div>
    );
}
