"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import EndowmentModal from "@/components/modals/EndowmentModal";
import DataDustLoader from "@/components/ui/DataDustLoader";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
import { motion, AnimatePresence } from "framer-motion";
import SessionComplete from "@/components/features/SessionComplete";
import { X, Clock, Trophy, RotateCcw, Zap } from "lucide-react";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MATCH GAME â€” "Puzzle Board" Redesign
   Vision: Duolingo-meets-Linear. Clean, tactile, satisfying.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface MatchPair {
    id: string;
    term: string;
    definition: string;
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
    const searchParams = useSearchParams();
    const { user, refreshUser } = useUser();

    // Core state
    const [pairs, setPairs] = useState<MatchPair[]>([]);
    const [shuffledTerms, setShuffledTerms] = useState<{ id: string; text: string }[]>([]);
    const [shuffledDefs, setShuffledDefs] = useState<{ id: string; text: string }[]>([]);
    const [title, setTitle] = useState("Match Game");
    const [loading, setLoading] = useState(true);

    // Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const hasStartedGeneration = useRef(false);

    // Game state
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [selectedDef, setSelectedDef] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [wrongPair, setWrongPair] = useState<{ term: string; def: string } | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);

    // Timer
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Celebration
    const [showCelebration, setShowCelebration] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Derived
    const progress = pairs.length > 0 ? (matchedIds.size / pairs.length) * 100 : 0;

    // â”€â”€â”€ INIT: Load from session or generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const init = async () => {
            const mode = searchParams.get("mode");

            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) { router.push("/create"); return; }
                hasStartedGeneration.current = true;
                const params = JSON.parse(paramsStr);
                sessionStorage.removeItem("generateParams");

                setIsGenerating(true);
                setGenerationError(null);

                try {
                    const response = await fetch("/api/generate/match", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...params, count: params.count || 8 }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
                            setIsEndowmentOpen(true);
                            setIsGenerating(false);
                            return;
                        }
                        throw new Error(errorData.error || "Generation failed");
                    }

                    const data = await response.json();
                    const matchPairs = (data.pairs || []).map((p: any, i: number) => ({
                        id: `pair_${i}`,
                        term: p.term || p.front,
                        definition: p.definition || p.back,
                    }));

                    initGame(matchPairs, data.title || "Match Game");
                } catch (err: any) {
                    setGenerationError(err.message);
                } finally {
                    setIsGenerating(false);
                }
            } else {
                try {
                    const stored = sessionStorage.getItem("matchGameCards");
                    if (!stored) { router.push("/create"); return; }
                    const data = JSON.parse(stored);
                    const cards = data.cards || [];
                    if (cards.length < 3) { router.push("/create"); return; }

                    const matchPairs = shuffleArray(cards).slice(0, Math.min(8, cards.length)).map((card: any, i: number) => ({
                        id: `pair_${i}`,
                        term: card.front || card.term,
                        definition: card.back || card.definition,
                    }));
                    initGame(matchPairs, data.title || "Match Game");
                } catch { router.push("/create"); }
            }
        };
        init();
    }, [searchParams, router]);

    function initGame(gamePairs: MatchPair[], gameTitle: string) {
        setPairs(gamePairs);
        setShuffledTerms(shuffleArray(gamePairs.map(p => ({ id: p.id, text: p.term }))));
        setShuffledDefs(shuffleArray(gamePairs.map(p => ({ id: p.id, text: p.definition }))));
        setTitle(gameTitle);
        setMatchedIds(new Set());
        setMistakes(0);
        setCombo(0);
        setBestCombo(0);
        setGameOver(false);
        setStartTime(Date.now());
        setLoading(false);
    }

    // â”€â”€â”€ TIMER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (loading || gameOver) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 250);
        return () => clearInterval(interval);
    }, [loading, gameOver, startTime]);

    // â”€â”€â”€ MATCH LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (!selectedTerm || !selectedDef) return;

        if (selectedTerm === selectedDef) {
            // Correct!
            const newMatched = new Set([...matchedIds, selectedTerm]);
            setMatchedIds(newMatched);
            const newCombo = combo + 1;
            setCombo(newCombo);
            if (newCombo > bestCombo) setBestCombo(newCombo);
            setSelectedTerm(null);
            setSelectedDef(null);

            if (newMatched.size === pairs.length) {
                handleGameComplete();
            }
        } else {
            // Wrong
            setWrongPair({ term: selectedTerm, def: selectedDef });
            setMistakes(prev => prev + 1);
            setCombo(0);
            setTimeout(() => {
                setWrongPair(null);
                setSelectedTerm(null);
                setSelectedDef(null);
            }, 500);
        }
    }, [selectedTerm, selectedDef]);

    // â”€â”€â”€ GAME COMPLETE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleGameComplete = useCallback(async () => {
        setGameOver(true);
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(finalTime);

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

    // â”€â”€â”€ RESTART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleRestart = () => {
        initGame(pairs, title);
    };

    // â”€â”€â”€ HANDLERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleTermClick = (id: string) => {
        if (matchedIds.has(id) || gameOver || wrongPair) return;
        setSelectedTerm(id === selectedTerm ? null : id);
    };

    const handleDefClick = (id: string) => {
        if (matchedIds.has(id) || gameOver || wrongPair) return;
        setSelectedDef(id === selectedDef ? null : id);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    // â”€â”€â”€ RATING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const getRating = () => {
        if (mistakes === 0) return { stars: 3, label: "Perfect" };
        if (mistakes <= 2) return { stars: 2, label: "Great" };
        return { stars: 1, label: "Good" };
    };

    // â”€â”€â”€ RENDER: Loading & Error States â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (isGenerating) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <DataDustLoader label="Building Match Board" phrases={["Synthesizing concept pairs...", "Calibrating difficulty...", "Generating match connections...", "Finalising your board..."]} />
            </div>
        );
    }

    if (loading && !isGenerating) {
        return generationError ? (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                {generationError.toLowerCase().includes("unauthorized") ? (
                    <AuthInterceptor />
                ) : (
                    <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center max-w-sm">
                        <p className="font-bold mb-1">Generation Failed</p>
                        <p className="text-xs opacity-80">{generationError}</p>
                    </div>
                )}
            </div>
        ) : (
            <DataDustLoader label="Loading Match Board" phrases={["Preparing your board...", "Shuffling pairs...", "Almost ready..."]} />
        );
    }

    const rating = getRating();

    // â”€â”€â”€ RENDER: Game Board â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return (
        <div className="h-[100dvh] bg-[var(--background)] flex flex-col overflow-hidden relative">

            {/* â”€â”€ Top Bar â”€â”€ */}
            <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-[var(--border)]/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors"
                    >
                        <X size={14} className="text-[var(--foreground-muted)]" />
                    </button>
                    <div>
                        <p className="text-xs font-bold text-[var(--foreground)] leading-tight">Match</p>
                        <p className="text-[9px] text-[var(--foreground-muted)] truncate max-w-[160px]">{title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Combo indicator */}
                    <AnimatePresence>
                        {combo >= 2 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30"
                            >
                                <Zap size={10} className="text-[var(--accent)]" />
                                <span className="text-[10px] font-black text-[var(--accent)] tabular-nums">{combo}Ã—</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timer */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                        <Clock size={10} className="text-[var(--foreground-muted)]" />
                        <span className="font-mono text-[11px] font-bold text-[var(--foreground)] tabular-nums">{formatTime(elapsed)}</span>
                    </div>

                    {/* Score */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="font-mono text-[11px] font-bold text-emerald-400 tabular-nums">
                            {matchedIds.size}/{pairs.length}
                        </span>
                    </div>

                    {/* Restart */}
                    <button
                        onClick={handleRestart}
                        className="w-8 h-8 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors"
                    >
                        <RotateCcw size={12} className="text-[var(--foreground-muted)]" />
                    </button>
                </div>
            </div>

            {/* â”€â”€ Progress Bar â”€â”€ */}
            <div className="w-full h-[3px] bg-[var(--foreground)]/5 shrink-0">
                <motion.div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-emerald-400 rounded-r-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            </div>

            {/* â”€â”€ Instruction hint â”€â”€ */}
            <AnimatePresence>
                {matchedIds.size === 0 && !selectedTerm && !selectedDef && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="shrink-0 text-center py-2"
                    >
                        <p className="text-[10px] text-[var(--foreground-muted)]/60 uppercase tracking-[0.3em] font-bold">
                            Tap a term, then its definition
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* â”€â”€ Game Grid â”€â”€ */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3">
                <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3 sm:gap-4">

                    {/* LEFT: Terms */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[8px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-[0.4em] px-1 mb-1">Terms</p>
                        {shuffledTerms.map(({ id, text }) => {
                            const isMatched = matchedIds.has(id);
                            const isSelected = selectedTerm === id;
                            const isWrong = wrongPair?.term === id;

                            return (
                                <motion.button
                                    key={`term-${id}`}
                                    onClick={() => handleTermClick(id)}
                                    disabled={isMatched}
                                    layout
                                    className="w-full text-left relative overflow-hidden"
                                    animate={isWrong ? { x: [0, -4, 4, -3, 3, 0] } : {}}
                                    transition={{ duration: 0.35 }}
                                >
                                    <div
                                        className={`px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl border transition-all duration-200 ${
                                            isMatched
                                                ? "bg-emerald-500/8 border-emerald-500/20 opacity-50"
                                                : isWrong
                                                ? "bg-red-500/10 border-red-500/30"
                                                : isSelected
                                                ? "bg-[var(--accent)]/10 border-[var(--accent)]/40 shadow-[0_0_16px_var(--accent-glow)]"
                                                : "bg-[var(--foreground)]/[0.02] border-[var(--border)] hover:border-[var(--foreground)]/15 hover:bg-[var(--foreground)]/[0.04]"
                                        }`}
                                    >
                                        <span className={`text-[12px] sm:text-[13px] font-semibold leading-snug ${
                                            isMatched ? "text-emerald-400/60 line-through" :
                                            isSelected ? "text-[var(--accent)]" :
                                            isWrong ? "text-red-400" :
                                            "text-[var(--foreground)]/80"
                                        }`}>
                                            {text}
                                        </span>
                                        {isMatched && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                            >
                                                <span className="text-emerald-400 text-[8px]">âœ“</span>
                                            </motion.span>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* RIGHT: Definitions */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[8px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-[0.4em] px-1 mb-1">Definitions</p>
                        {shuffledDefs.map(({ id, text }) => {
                            const isMatched = matchedIds.has(id);
                            const isSelected = selectedDef === id;
                            const isWrong = wrongPair?.def === id;

                            return (
                                <motion.button
                                    key={`def-${id}`}
                                    onClick={() => handleDefClick(id)}
                                    disabled={isMatched}
                                    layout
                                    className="w-full text-left relative overflow-hidden"
                                    animate={isWrong ? { x: [0, -4, 4, -3, 3, 0] } : {}}
                                    transition={{ duration: 0.35 }}
                                >
                                    <div
                                        className={`px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl border transition-all duration-200 ${
                                            isMatched
                                                ? "bg-emerald-500/8 border-emerald-500/20 opacity-50"
                                                : isWrong
                                                ? "bg-red-500/10 border-red-500/30"
                                                : isSelected
                                                ? "bg-amber-500/10 border-amber-500/35 shadow-[0_0_16px_rgba(245,158,11,0.08)]"
                                                : "bg-[var(--foreground)]/[0.02] border-[var(--border)] hover:border-[var(--foreground)]/15 hover:bg-[var(--foreground)]/[0.04]"
                                        }`}
                                    >
                                        <span className={`text-[11px] sm:text-[12px] leading-snug ${
                                            isMatched ? "text-emerald-400/60 line-through" :
                                            isSelected ? "text-amber-400" :
                                            isWrong ? "text-red-400" :
                                            "text-[var(--foreground-muted)]"
                                        }`}>
                                            {text}
                                        </span>
                                        {isMatched && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                            >
                                                <span className="text-emerald-400 text-[8px]">âœ“</span>
                                            </motion.span>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* â”€â”€ Bottom Stats Bar â”€â”€ */}
            <div className="shrink-0 px-4 py-2.5 border-t border-[var(--border)]/30 bg-[var(--background)]">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Mistakes</span>
                            <span className={`font-mono text-[11px] font-bold tabular-nums ${mistakes === 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {mistakes}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Best Combo</span>
                            <span className="font-mono text-[11px] font-bold text-[var(--accent)] tabular-nums">{bestCombo}Ã—</span>
                        </div>
                    </div>

                    {/* Star rating preview */}
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map(star => (
                            <div
                                key={star}
                                className={`w-3 h-3 rounded-sm transition-colors ${
                                    star <= rating.stars
                                        ? "bg-[var(--accent)]"
                                        : "bg-[var(--foreground)]/10"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* â”€â”€ Modals â”€â”€ */}
            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user.credits}
                requiredCredits={1}
            />

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
                continueHref="/dashboard"
            />
        </div>
    );
}

