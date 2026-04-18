"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDuelRealtime } from "@/hooks/useRealtime";
import GlobalLeaderboard from "./GlobalLeaderboard";

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
    const [challenger, setChallenger] = useState(initialChallenger);
    const [copied, setCopied] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

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

            // Check if challenger joined
            if (newData.challenger_id && !challenger) {
                // Fetch challenger details
                fetch(`/api/arena/${duelId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.duel?.challenger) {
                            setChallenger(data.duel.challenger);
                            onOpponentJoin?.();
                        }
                    });
            }

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
                router.push("/hub?s=arena");
            }
        }, [duelId, challenger, router, onOpponentJoin, onDuelStart, onDuelEnd]),

        onSessionUpdate: useCallback((payload: any) => {
            const newData = payload.new;
            if (!newData) return;

            // Update session states if needed
            if (newData.is_ready && newData.user_id !== host.id) {
                // Challenger became ready - refresh challenger state
                fetch(`/api/arena/${duelId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            if (data.duel?.challenger) {
                                setChallenger({
                                    ...data.duel.challenger,
                                    session: { isReady: true }
                                });
                            }
                            // Check if both ready - start countdown
                            if (data.duel?.status === 'READY' && isReady) {
                                startCountdown();
                            }
                        }
                    });
            }
        }, [duelId, host.id, isReady, startCountdown]),

        onChallengerJoin: useCallback(() => {
            onOpponentJoin?.();
        }, [onOpponentJoin])
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
                setIsReady(true);
                const data = await res.json();
                if (data.allReady) {
                    startCountdown();
                }
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
            router.push("/hub?s=arena");
        } catch (error) {
            console.error("Cancel error:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
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
                className="relative w-full max-w-lg mx-4"
            >
                <div className="bg-[var(--background)] rounded-[32px] border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/50">
                    {/* Header */}
                    <div className="relative p-8 text-center border-b border-[var(--border)]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--error)] via-[var(--secondary)] to-[var(--error)]" />
                        
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--error)]/10 border-2 border-[var(--error)]/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-[var(--error)]">swords</span>
                        </div>
                        
                        <h2 className="text-2xl font-black text-[var(--foreground)] italic tracking-tight">THE PIT</h2>
                        <p className="text-[var(--error)] text-[10px] font-mono uppercase tracking-[0.3em] mt-2">
                            {status === 'WAITING' ? 'Awaiting Challenger' : status === 'READY' ? 'Both Ready - Starting Soon!' : 'In Progress'}
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
                                    <div className={`p-3 rounded-xl transition-all ${copied ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--foreground)]/5 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'}`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {copied ? 'check' : 'content_copy'}
                                        </span>
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
                                {host.avatar ? (
                                    <img src={host.avatar} alt={host.name} className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    host.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-[var(--foreground)]">{host.name} {isHost && <span className="text-[var(--accent)]">👑</span>}</p>
                                <p className="text-[10px] text-[var(--foreground-muted)]">Level {host.streak || 1} Scholar</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[var(--foreground)]">{host.xp || 0} XP</p>
                                <div className={`w-3 h-3 rounded-full ${host.session?.isReady ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--foreground)]/20'}`} />
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
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[var(--foreground)]">{challenger.xp || 0} XP</p>
                                        <div className={`w-3 h-3 rounded-full ${challenger.session?.isReady ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--foreground)]/20'}`} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-xl text-[var(--foreground-muted)]">hourglass_empty</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[var(--foreground-muted)] italic">Waiting for challenger...</p>
                                    </div>
                                    <div className="w-3 h-3 rounded-full bg-[var(--accent)]/50 animate-pulse" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quiz Info */}
                    <div className="px-6 pb-4">
                        <div className="p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[var(--accent)]">quiz</span>
                                <div>
                                    <p className="text-sm font-bold text-[var(--foreground)]">{generation.title}</p>
                                    <p className="text-[10px] text-[var(--foreground-muted)]">{generation.questionCount} Questions • {Math.floor(timeLimit / 60)} min time limit</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 border-t border-[var(--border)]">
                        {isHost ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all"
                                >
                                    Cancel
                                </button>
                                {challenger && (
                                    <button
                                        onClick={handleStart}
                                        disabled={status !== 'READY'}
                                        className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                                        style={{
                                            background: "var(--error)",
                                            color: "var(--background)",
                                            boxShadow: "0 4px 20px var(--error-glow)"
                                        }}
                                    >
                                        Start Duel
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all"
                                >
                                    Leave
                                </button>
                                <button
                                    onClick={handleReady}
                                    disabled={isReady || !challenger}
                                    className="flex-1 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                                    style={{
                                        background: isReady ? "var(--success-bg)" : "var(--success)",
                                        color: isReady ? "var(--success)" : "var(--background)",
                                        boxShadow: isReady ? "none" : "0 4px 20px var(--success-glow)"
                                    }}
                                >
                                    {isReady ? "✓ Ready!" : "Ready"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Shared Global Leaderboard integration */}
                <div className="mt-12 w-full max-w-4xl mx-auto opacity-80 hover:opacity-100 transition-opacity">
                    <div className="p-1 rounded-[40px] bg-gradient-to-b from-[var(--border)] to-transparent">
                        <div className="bg-[var(--background)] rounded-[39px] overflow-hidden">
                            <GlobalLeaderboard />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
