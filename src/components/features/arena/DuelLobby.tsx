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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-xl">
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--error)]/10 rounded-full blur-[120px]" />
                    <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[var(--secondary)]/10 rounded-full blur-[80px]" />
                </div>

                <AnimatePresence>
                    {countdown !== null && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/90 z-50"
                        >
                            <div className="text-center">
                                <motion.div
                                    key={countdown}
                                    initial={{ scale: 0.5, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="text-[150px] font-black text-[var(--error)] animate-pulse"
                                    style={{
                                        textShadow: "0 0 60px var(--error-glow)"
                                    }}
                                >
                                    {countdown === 0 ? "GO!" : countdown}
                                </motion.div>
                                <p className="text-[var(--foreground-muted)] text-xl mt-4">Prepare yourself!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg mx-4 z-10"
                >
                    <div className="bg-[var(--background)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/50">
                        {/* Header */}
                        <div className="relative p-8 text-center border-b border-[var(--border)]">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--error)] via-[var(--secondary)] to-[var(--error)]" />
                            
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--foreground)]/5 border-2 border-[var(--border)] flex items-center justify-center">
                                <Swords size={40} className="text-[var(--foreground)]" />
                            </div>
                            
                            <h2 className="text-2xl font-black text-[var(--foreground)] italic tracking-tight">THE PIT</h2>
                            <p className="text-[var(--error)] text-[10px] font-mono uppercase tracking-[0.3em] mt-2">
                                {status === 'WAITING' ? 'Awaiting Challenger' : status === 'READY' ? 'Ready to Start!' : 'In Progress'}
                            </p>
                        </div>

                        {/* Code Display */}
                        <div className="p-6 border-b border-[var(--border)]">
                            <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest text-center mb-3">Share This Code</p>
                            <button
                                onClick={handleCopyCode}
                                className="w-full group"
                            >
                                <div className="px-8 py-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--error)]/20 hover:border-[var(--error)]/40 transition-all">
                                    <div className="flex items-center justify-between">
                                        <p className="text-4xl font-mono font-black text-[var(--foreground)] tracking-[0.3em]">
                                            {code.split('').map((char, i) => (
                                                <span key={i} className="inline-block animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                                                    {char}
                                                </span>
                                            ))}
                                        </p>
                                        <div className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`}>
                                            {copied ? <Check size={20} /> : <Copy size={20} />}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Participants */}
                        <div className="p-6 space-y-4">
                            <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest text-center mb-4">Gladiators</p>
                            
                            {/* Host */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                                <div className="w-12 h-12 rounded-xl bg-[var(--secondary)]/20 flex items-center justify-center text-lg font-black text-[var(--secondary)]">
                                    {hostState.avatar ? (
                                        <img src={hostState.avatar} alt={hostState.name} className="w-full h-full rounded-xl object-cover" />
                                    ) : (
                                        hostState.name[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-[var(--foreground)]">{hostState.name} {isHost && <span className="text-[var(--accent)]">👑</span>}</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)]">Level {hostState.streak || 1} Scholar</p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <p className="text-sm font-bold text-[var(--foreground)]">{hostState.xp || 0} XP</p>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                        hostState.session?.isReady 
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                            : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                                    )}>
                                        {hostState.session?.isReady ? "Locked In" : "Deciding"}
                                    </span>
                                </div>
                            </div>

                            {/* Challenger */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                                {challenger ? (
                                    <>
                                        <div className="w-12 h-12 rounded-xl bg-[var(--success)]/20 flex items-center justify-center text-lg font-black text-[var(--success)]">
                                            {challenger.avatar ? (
                                                <img src={challenger.avatar} alt={challenger.name} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                challenger.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-[var(--foreground)]">{challenger.name}</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Level {challenger.streak || 1} Scholar</p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="text-sm font-bold text-[var(--foreground)]">{challenger.xp || 0} XP</p>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                                                challenger.session?.isReady 
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" 
                                                    : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                                            )}>
                                                {challenger.session?.isReady ? "Locked In" : "Deciding"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center">
                                            <Hourglass size={20} className="text-[var(--foreground-muted)] animate-pulse" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[var(--foreground-muted)] italic font-medium tracking-tight">Awaiting Challenger...</p>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-zinc-800/50 text-zinc-500 border-zinc-700/50">
                                            Waiting
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Quiz Info */}
                        <div className="px-6 pb-4">
                            <div className="p-4 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                                <div className="flex items-center gap-3">
                                    <QuizIcon size={20} className="text-[var(--foreground-muted)]" />
                                    <div>
                                        <p className="text-sm font-black text-[var(--foreground)] tracking-tight">{generation.title}</p>
                                        <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">{generation.questionCount} Questions • {Math.floor(timeLimit / 60)} min limit</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-[var(--border)]">
                            {isHost ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all border border-[var(--border)]"
                                        >
                                            Abandon Room
                                        </button>
                                        <button
                                            onClick={handleReady}
                                            disabled={!challenger}
                                            className={cn(
                                                "flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] border",
                                                isReady 
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                                    : "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            )}
                                        >
                                            {isReady ? "Locked In ✓" : "Lock In 🔒"}
                                        </button>
                                    </div>
                                    {challenger && (
                                        <button
                                            onClick={handleStart}
                                            disabled={!challenger?.session?.isReady}
                                            className={cn(
                                                "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                                                challenger?.session?.isReady
                                                    ? "bg-white text-black hover:bg-white/90 shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
                                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                                            )}
                                        >
                                            {challenger?.session?.isReady ? "Start Quiz ⚔️" : "Waiting for Gladiator to Lock In..."}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all border border-[var(--border)]"
                                    >
                                        Leave Room
                                    </button>
                                    <button
                                        onClick={handleReady}
                                        disabled={!challenger}
                                        className={cn(
                                            "flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                                            isReady 
                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                                : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                                        )}
                                    >
                                        {isReady ? "Locked In ✓" : "Lock In 🔒"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
