"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import EndowmentModal from "@/components/modals/EndowmentModal";
import DataDustLoader from "@/components/ui/DataDustLoader";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
import { motion, AnimatePresence } from "framer-motion";
import SessionComplete from "@/components/features/SessionComplete";
import { X, Clock, RotateCcw, Zap, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   MATCH GAME — Flat 2.0 Redesign
   Vision: Numbered index cards on a corkboard. Tap term → tap definition.
   Color coding: neutral → selected (accent ring) → matched (struck) → wrong (shake+red).
   ════════════════════════════════════════════════════════════════════ */

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

// Flat 2.0 card colors — subtle tinted surfaces, not garish
const CARD_TINTS = [
    { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.18)", text: "#3b82f6" },
    { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.18)", text: "#10b981" },
    { bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.18)", text: "#a855f7" },
    { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", text: "#f59e0b" },
    { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.18)", text: "#ef4444" },
    { bg: "rgba(20,184,166,0.06)", border: "rgba(20,184,166,0.18)", text: "#14b8a6" },
    { bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.18)", text: "#f97316" },
    { bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.18)", text: "#6366f1" },
];

export default function MatchGamePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshUser } = useUser();

    const [pairs, setPairs] = useState<MatchPair[]>([]);
    const [shuffledTerms, setShuffledTerms] = useState<{ id: string; text: string }[]>([]);
    const [shuffledDefs, setShuffledDefs] = useState<{ id: string; text: string }[]>([]);
    const [title, setTitle] = useState("Match Game");
    const [loading, setLoading] = useState(true);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const hasStartedGeneration = useRef(false);

    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [selectedDef, setSelectedDef] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [wrongPair, setWrongPair] = useState<{ term: string; def: string } | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);

    const [startTime, setStartTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    const progress = pairs.length > 0 ? (matchedIds.size / pairs.length) * 100 : 0;

    // ── INIT ──────────────────────────────────────────────────────────
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
                            setIsEndowmentOpen(true); setIsGenerating(false); return;
                        }
                        throw new Error(errorData.error || "Generation failed. Your notes may be too large — try splitting them into smaller sections.");
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
        setMistakes(0); setCombo(0); setBestCombo(0);
        setGameOver(false);
        setStartTime(Date.now());
        setLoading(false);
    }

    // ── TIMER ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (loading || gameOver) return;
        const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 250);
        return () => clearInterval(interval);
    }, [loading, gameOver, startTime]);

    // ── MATCH LOGIC ────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedTerm || !selectedDef) return;
        if (selectedTerm === selectedDef) {
            const newMatched = new Set([...matchedIds, selectedTerm]);
            setMatchedIds(newMatched);
            const newCombo = combo + 1;
            setCombo(newCombo);
            if (newCombo > bestCombo) setBestCombo(newCombo);
            setSelectedTerm(null); setSelectedDef(null);
            if (newMatched.size === pairs.length) handleGameComplete();
        } else {
            setWrongPair({ term: selectedTerm, def: selectedDef });
            setMistakes(prev => prev + 1);
            setCombo(0);
            setTimeout(() => { setWrongPair(null); setSelectedTerm(null); setSelectedDef(null); }, 500);
        }
    }, [selectedTerm, selectedDef]);

    // ── GAME COMPLETE ──────────────────────────────────────────────────
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
                setSessionStats({ xp: stats?.xpGained || totalXp, streak: stats?.newStreak || user.streak || 0, incremented: stats?.streakIncremented || false });
                refreshUser();
            }
        } catch {}
        setShowCelebration(true);
    }, [startTime, mistakes, user, refreshUser]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // ── LOADING / ERROR STATES ─────────────────────────────────────────
    if (isGenerating) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <DataDustLoader label="Building Match Board" phrases={["Synthesizing concept pairs...", "Calibrating difficulty...", "Generating connections...", "Almost ready..."]} />
            </div>
        );
    }

    if (loading && !isGenerating) {
        return generationError ? (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 gap-4">
                {generationError.toLowerCase().includes("unauthorized") ? (
                    <AuthInterceptor />
                ) : (
                    <div className="p-6 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] max-w-sm w-full text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                            <XCircle size={22} className="text-red-400" />
                        </div>
                        <p className="font-bold text-[var(--foreground)]">Generation Failed</p>
                        <p className="text-[12px] text-[var(--foreground-muted)] leading-relaxed">{generationError}</p>
                        <button onClick={() => router.push("/create")} className="btn-skeuo w-full py-3 text-[11px] font-black uppercase tracking-widest">
                            Back to Create
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <DataDustLoader label="Loading Match Board" phrases={["Preparing your board...", "Shuffling pairs...", "Almost ready..."]} />
            </div>
        );
    }

    // ── RATING ────────────────────────────────────────────────────────
    const getRating = () => {
        if (mistakes === 0) return { bars: 3, label: "Perfect" };
        if (mistakes <= 2) return { bars: 2, label: "Great" };
        return { bars: 1, label: "Good" };
    };
    const rating = getRating();

    // ── RENDER: Card component ─────────────────────────────────────────
    const MatchCard = ({
        id, text, side, pairIndex
    }: {
        id: string; text: string; side: "term" | "def"; pairIndex: number;
    }) => {
        const isMatched = matchedIds.has(id);
        const isSelected = side === "term" ? selectedTerm === id : selectedDef === id;
        const isWrong = side === "term" ? wrongPair?.term === id : wrongPair?.def === id;
        const tint = CARD_TINTS[pairIndex % CARD_TINTS.length];

        // Find the pair number for the matched indicator
        const pairNum = pairs.findIndex(p => p.id === id) + 1;

        return (
            <motion.button
                onClick={() => {
                    if (isMatched || gameOver || wrongPair) return;
                    if (side === "term") setSelectedTerm(id === selectedTerm ? null : id);
                    else setSelectedDef(id === selectedDef ? null : id);
                }}
                disabled={isMatched || !!gameOver}
                layout
                animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.35 }}
                className="w-full text-left group"
            >
                <div
                    className={cn(
                        "relative px-3.5 py-3 rounded-xl border-2 transition-all duration-200 min-h-[56px] flex items-center gap-2.5",
                        isMatched
                            ? "opacity-35 scale-[0.97]"
                            : isWrong
                            ? "border-red-500/50 bg-red-500/8 scale-[0.98]"
                            : isSelected
                            ? "scale-[1.02] shadow-lg"
                            : "border-[var(--border)] bg-[var(--foreground)]/[0.02] hover:bg-[var(--foreground)]/[0.04] hover:border-[var(--foreground)]/15 active:scale-[0.98]"
                    )}
                    style={
                        isMatched ? {
                            background: tint.bg,
                            borderColor: tint.border,
                        } : isSelected ? {
                            background: tint.bg,
                            borderColor: tint.border,
                            boxShadow: `0 0 20px ${tint.text}20`,
                        } : {}
                    }
                >
                    {/* Number badge */}
                    {isMatched ? (
                        <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[9px] font-black"
                            style={{ background: tint.bg, border: `1px solid ${tint.border}`, color: tint.text }}
                        >
                            {pairNum}
                        </div>
                    ) : isSelected ? (
                        <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: tint.bg, border: `1.5px solid ${tint.text}` }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: tint.text }} />
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-md bg-[var(--foreground)]/5 border border-[var(--border)] shrink-0" />
                    )}

                    <span
                        className={cn(
                            "text-[11px] sm:text-[12px] font-semibold leading-snug flex-1",
                            isMatched ? "line-through" : "",
                            isWrong ? "text-red-400" : ""
                        )}
                        style={isMatched || isSelected ? { color: tint.text } : {}}
                    >
                        {text}
                    </span>

                    {isMatched && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                            <CheckCircle2 size={13} style={{ color: tint.text }} className="shrink-0" />
                        </motion.div>
                    )}
                </div>
            </motion.button>
        );
    };

    return (
        <div className="h-[100dvh] bg-[var(--background)] flex flex-col overflow-hidden relative">

            {/* ── Top Bar ── */}
            <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-[var(--border)]/40">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors"
                    >
                        <X size={14} className="text-[var(--foreground-muted)]" />
                    </button>
                    <div>
                        <p className="text-xs font-bold text-[var(--foreground)] leading-tight">Match</p>
                        <p className="text-[9px] text-[var(--foreground-muted)] truncate max-w-[140px]">{title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Combo badge */}
                    <AnimatePresence>
                        {combo >= 2 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30"
                            >
                                <Zap size={10} className="text-[var(--accent)]" />
                                <span className="text-[10px] font-black text-[var(--accent)] tabular-nums">{combo}×</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timer */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                        <Clock size={10} className="text-[var(--foreground-muted)]" />
                        <span className="font-mono text-[11px] font-bold text-[var(--foreground)] tabular-nums">{formatTime(elapsed)}</span>
                    </div>

                    {/* Score pill */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="font-mono text-[11px] font-bold text-emerald-400 tabular-nums">{matchedIds.size}/{pairs.length}</span>
                    </div>

                    <button onClick={() => initGame(pairs, title)} className="w-8 h-8 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors">
                        <RotateCcw size={12} className="text-[var(--foreground-muted)]" />
                    </button>
                </div>
            </div>

            {/* ── Progress Bar ── */}
            <div className="w-full h-[2px] bg-[var(--foreground)]/5 shrink-0">
                <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-[var(--accent)] rounded-r-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
            </div>

            {/* ── Column headers ── */}
            <div className="shrink-0 px-3 sm:px-6 pt-3 pb-1">
                <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3 sm:gap-4">
                    <p className="text-[8px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-[0.4em] px-1">Terms</p>
                    <p className="text-[8px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-[0.4em] px-1">Definitions</p>
                </div>
            </div>

            {/* ── Game Grid ── */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-3">
                <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Terms column */}
                    <div className="flex flex-col gap-2">
                        {shuffledTerms.map(({ id, text }, idx) => (
                            <MatchCard key={`term-${id}`} id={id} text={text} side="term" pairIndex={pairs.findIndex(p => p.id === id)} />
                        ))}
                    </div>
                    {/* Definitions column */}
                    <div className="flex flex-col gap-2">
                        {shuffledDefs.map(({ id, text }, idx) => (
                            <MatchCard key={`def-${id}`} id={id} text={text} side="def" pairIndex={pairs.findIndex(p => p.id === id)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom Stats Bar ── */}
            <div className="shrink-0 px-4 py-2.5 border-t border-[var(--border)]/30 bg-[var(--background)]">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Mistakes</span>
                            <span className={cn("font-mono text-[11px] font-bold tabular-nums", mistakes === 0 ? "text-emerald-400" : "text-red-400")}>
                                {mistakes}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Best Combo</span>
                            <span className="font-mono text-[11px] font-bold text-[var(--accent)] tabular-nums">{bestCombo}×</span>
                        </div>
                    </div>
                    {/* Rating bars */}
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map(bar => (
                            <div key={bar} className={cn("w-3 h-3 rounded-sm transition-colors", bar <= rating.bars ? "bg-[var(--accent)]" : "bg-[var(--foreground)]/10")} />
                        ))}
                        <span className="text-[9px] font-black text-[var(--foreground-muted)] ml-1.5">{rating.label}</span>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <EndowmentModal
                isOpen={isEndowmentOpen}
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user.credits}
                requiredCredits={1}
            />

            <SessionComplete
                isVisible={showCelebration}
                onDismiss={() => { setShowCelebration(false); router.back(); }}
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
