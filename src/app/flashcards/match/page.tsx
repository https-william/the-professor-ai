"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import SiteHeader from "@/components/ui/SiteHeader";
import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence } from "framer-motion";

interface MatchCard {
    id: string;
    front: string;
    back: string;
}

interface MatchPair {
    id: string;
    term: string;
    definition: string;
    matched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export default function MatchGamePage() {
    const router = useRouter();
    const { user, refreshUser } = useUser();

    // Game data
    const [pairs, setPairs] = useState<MatchPair[]>([]);
    const [shuffledTerms, setShuffledTerms] = useState<{ id: string; text: string }[]>([]);
    const [shuffledDefs, setShuffledDefs] = useState<{ id: string; text: string }[]>([]);
    const [title, setTitle] = useState("Match Game");
    const [loading, setLoading] = useState(true);

    // Game state
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [selectedDef, setSelectedDef] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [wrongPair, setWrongPair] = useState<{ term: string; def: string } | null>(null);
    const [mistakes, setMistakes] = useState(0);

    // Timer
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Celebration
    const [showCelebration, setShowCelebration] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Load cards from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("matchGameCards");
            if (!stored) {
                router.push("/library");
                return;
            }

            const data = JSON.parse(stored);
            const cards: MatchCard[] = data.cards || [];
            const gameTitle = data.title || "Match Game";

            if (cards.length < 3) {
                router.push("/library");
                return;
            }

            // Take 6-8 random cards
            const selected = shuffleArray(cards).slice(0, Math.min(8, cards.length));

            const gamePairs: MatchPair[] = selected.map((card, i) => ({
                id: `pair_${i}`,
                term: card.front,
                definition: card.back,
                matched: false,
            }));

            setPairs(gamePairs);
            setShuffledTerms(shuffleArray(gamePairs.map(p => ({ id: p.id, text: p.term }))));
            setShuffledDefs(shuffleArray(gamePairs.map(p => ({ id: p.id, text: p.definition }))));
            setTitle(gameTitle);
            setStartTime(Date.now());
            setLoading(false);
        } catch {
            router.push("/library");
        }
    }, [router]);

    // Timer tick
    useEffect(() => {
        if (loading || gameOver) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 100);
        return () => clearInterval(interval);
    }, [loading, gameOver, startTime]);

    // Check match when both selected
    useEffect(() => {
        if (!selectedTerm || !selectedDef) return;

        if (selectedTerm === selectedDef) {
            // Correct match!
            setMatchedIds(prev => new Set([...prev, selectedTerm!]));
            setSelectedTerm(null);
            setSelectedDef(null);

            // Check if all matched
            if (matchedIds.size + 1 === pairs.length) {
                handleGameComplete();
            }
        } else {
            // Wrong match
            setWrongPair({ term: selectedTerm, def: selectedDef });
            setMistakes(prev => prev + 1);
            setTimeout(() => {
                setWrongPair(null);
                setSelectedTerm(null);
                setSelectedDef(null);
            }, 600);
        }
    }, [selectedTerm, selectedDef]);

    const handleGameComplete = useCallback(async () => {
        setGameOver(true);
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(finalTime);

        // Calculate XP: base 10 + speed bonus (max 15 extra) - mistake penalty
        const speedBonus = Math.max(0, 15 - Math.floor(finalTime / 10));
        const mistakePenalty = Math.min(mistakes * 2, 10);
        const totalXp = Math.max(5, 10 + speedBonus - mistakePenalty);

        try {
            const actRes = await fetch("/api/user/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "flashcards" }),
            });
            if (actRes.ok) {
                const { stats } = await actRes.json();
                setSessionStats({
                    xp: stats?.xpGained || totalXp,
                    streak: stats?.newStreak || user.streak || 0,
                    incremented: stats?.streakIncremented || false,
                });
                refreshUser();
            }
        } catch {}

        setShowCelebration(true);
    }, [startTime, mistakes, user, refreshUser]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const handleTermClick = (id: string) => {
        if (matchedIds.has(id) || gameOver) return;
        setSelectedTerm(id === selectedTerm ? null : id);
    };

    const handleDefClick = (id: string) => {
        if (matchedIds.has(id) || gameOver) return;
        setSelectedDef(id === selectedDef ? null : id);
    };

    if (loading) {
        return (
            <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative">
                <SiteHeader showLogo />
                <div className="h-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#818CF8]/10 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#818CF8]/20 border-t-[#818CF8] rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex flex-col">
            <SiteHeader showLogo />

            {/* Header */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-sm text-white/50">close</span>
                    </button>
                    <div>
                        <h1 className="text-[13px] font-bold text-white/90">Match Game</h1>
                        <p className="text-[9px] text-[#818CF8]/60 font-bold uppercase tracking-wider truncate max-w-[180px]">{title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Timer */}
                    <div className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold text-white/40"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {formatTime(elapsed)}
                    </div>
                    {/* Progress */}
                    <div className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                        style={{
                            background: "rgba(16,185,129,0.06)",
                            border: "1px solid rgba(16,185,129,0.1)",
                            color: "#10B981",
                        }}>
                        {matchedIds.size}/{pairs.length}
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-white/5 shrink-0">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#818CF8] to-[#10B981] rounded-r-full"
                    animate={{ width: `${(matchedIds.size / pairs.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            {/* Game Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Terms Column */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 px-1">Terms</p>
                        {shuffledTerms.map(({ id, text }) => {
                            const isMatched = matchedIds.has(id);
                            const isSelected = selectedTerm === id;
                            const isWrong = wrongPair?.term === id;

                            return (
                                <motion.button
                                    key={`term-${id}`}
                                    onClick={() => handleTermClick(id)}
                                    disabled={isMatched}
                                    className="w-full text-left px-5 py-4 rounded-2xl transition-all active:scale-[0.97] disabled:cursor-default"
                                    style={{
                                        background: isMatched
                                            ? "rgba(16,185,129,0.08)"
                                            : isWrong
                                            ? "rgba(239,68,68,0.1)"
                                            : isSelected
                                            ? "rgba(129,140,248,0.12)"
                                            : "rgba(255,255,255,0.025)",
                                        border: `1.5px solid ${
                                            isMatched ? "rgba(16,185,129,0.25)"
                                            : isWrong ? "rgba(239,68,68,0.3)"
                                            : isSelected ? "rgba(129,140,248,0.4)"
                                            : "rgba(255,255,255,0.06)"
                                        }`,
                                        boxShadow: isSelected ? "0 0 20px rgba(129,140,248,0.1)" : "none",
                                    }}
                                    animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                >
                                    <span className={`text-[13px] font-medium leading-relaxed ${
                                        isMatched ? "text-[#10B981]/70 line-through" : isSelected ? "text-[#818CF8]" : "text-white/70"
                                    }`}>
                                        {text}
                                    </span>
                                    {isMatched && (
                                        <span className="material-symbols-outlined text-[#10B981] text-sm float-right mt-0.5">check_circle</span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Definitions Column */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 px-1">Definitions</p>
                        {shuffledDefs.map(({ id, text }) => {
                            const isMatched = matchedIds.has(id);
                            const isSelected = selectedDef === id;
                            const isWrong = wrongPair?.def === id;

                            return (
                                <motion.button
                                    key={`def-${id}`}
                                    onClick={() => handleDefClick(id)}
                                    disabled={isMatched}
                                    className="w-full text-left px-5 py-4 rounded-2xl transition-all active:scale-[0.97] disabled:cursor-default"
                                    style={{
                                        background: isMatched
                                            ? "rgba(16,185,129,0.08)"
                                            : isWrong
                                            ? "rgba(239,68,68,0.1)"
                                            : isSelected
                                            ? "rgba(245,158,11,0.1)"
                                            : "rgba(255,255,255,0.025)",
                                        border: `1.5px solid ${
                                            isMatched ? "rgba(16,185,129,0.25)"
                                            : isWrong ? "rgba(239,68,68,0.3)"
                                            : isSelected ? "rgba(245,158,11,0.35)"
                                            : "rgba(255,255,255,0.06)"
                                        }`,
                                        boxShadow: isSelected ? "0 0 20px rgba(245,158,11,0.08)" : "none",
                                    }}
                                    animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                >
                                    <span className={`text-[13px] font-medium leading-relaxed ${
                                        isMatched ? "text-[#10B981]/70 line-through" : isSelected ? "text-[#F59E0B]" : "text-white/70"
                                    }`}>
                                        {text}
                                    </span>
                                    {isMatched && (
                                        <span className="material-symbols-outlined text-[#10B981] text-sm float-right mt-0.5">check_circle</span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Instructions hint */}
                {matchedIds.size === 0 && (
                    <motion.p
                        className="text-center text-[10px] text-white/15 mt-6 uppercase tracking-widest font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Select a term, then its matching definition
                    </motion.p>
                )}
            </div>

            <SessionComplete
                isVisible={showCelebration}
                onDismiss={() => {
                    setShowCelebration(false);
                    router.back();
                }}
                xpEarned={sessionStats.xp}
                streak={sessionStats.streak}
                streakIncremented={sessionStats.incremented}
                type="flashcards"
                title={`Match: ${title}`}
                extraStat={{ label: "Time", value: formatTime(elapsed), icon: "timer" }}
                continueHref="/library"
            />
        </div>
    );
}
