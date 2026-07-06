"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import EndowmentModal from "@/components/modals/EndowmentModal";
import DataDustLoader from "@/components/ui/DataDustLoader";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
import { motion, AnimatePresence } from "framer-motion";
import SessionComplete from "@/components/features/SessionComplete";
import { X, Clock, RotateCcw, Zap, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

/* ════════════════════════════════════════════════════════════════════
   MATCH GAME — Midnight Scholar Redesign
   Vision: Prestigious 2.5D visual cards floating over volcanic ambient orbs.
   Color coding: selected (amber sweep) -> matched (emerald) -> wrong (crimson).
   ════════════════════════════════════════════════════════════════════ */

interface MatchPair {
    id: string;
    term: string;
    definition: string;
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
}

function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Prestigious Midnight Scholar tones
const CARD_TINTS = [
    { bg: "rgba(229,169,60,0.04)", border: "rgba(229,169,60,0.15)", text: "#E5A93C" }, // Amber
    { bg: "rgba(150,115,245,0.04)", border: "rgba(150,115,245,0.15)", text: "#9673F5" }, // Violet
    { bg: "rgba(43,178,136,0.04)", border: "rgba(43,178,136,0.15)", text: "#2BB288" }, // Emerald
    { bg: "rgba(74,124,245,0.04)", border: "rgba(74,124,245,0.15)", text: "#4A7CF5" }, // Blue
];

// Offline Sound Synthesizer via Web Audio API
const playMatchSound = (isCorrect: boolean) => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        if (isCorrect) {
            // High-yield success chime (arpeggio sweep)
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.04, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.35);
            });
        } else {
            // Low-pitch wrong buzz (dissonant detuned wave)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = "sawtooth";
            osc1.frequency.setValueAtTime(140, now);
            osc2.type = "sawtooth";
            osc2.frequency.setValueAtTime(143, now); // slightly detuned

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
        }
    } catch (e) {
        console.warn("Audio synthesis failed", e);
    }
};

function MatchGameContent() {
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

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    // Confetti particles logic
    const triggerMatchConfetti = (centerX: number, centerY: number) => {
        const colors = ["#E5A93C", "#2BB288", "#9673F5", "#4A7CF5", "#E85D75"];
        const newParticles: Particle[] = [];
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            newParticles.push({
                x: centerX,
                y: centerY,
                size: 4 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed - 1, // slight upward bias
                opacity: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
        particlesRef.current = [...particlesRef.current, ...newParticles];
    };

    // Canvas particle render tick
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;

        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const activeParticles = particlesRef.current.filter(p => p.opacity > 0);
            
            activeParticles.forEach(p => {
                p.x += p.velocityX;
                p.y += p.velocityY;
                p.velocityY += 0.1; // gravity
                p.opacity -= p.decay;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            particlesRef.current = activeParticles;
            animId = requestAnimationFrame(tick);
        };

        tick();

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, [loading]);

    // ── INIT ──────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const mode = searchParams.get("mode");
            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) { router.push("/dashboard"); return; }
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
                    if (!stored) { router.push("/dashboard"); return; }
                    const data = JSON.parse(stored);
                    const cards = data.cards || [];
                    if (cards.length < 3) { router.push("/dashboard"); return; }
                    const matchPairs = shuffleArray(cards).slice(0, Math.min(8, cards.length)).map((card: any, i: number) => ({
                        id: `pair_${i}`,
                        term: card.front || card.term,
                        definition: card.back || card.definition,
                    }));
                    initGame(matchPairs, data.title || "Match Game");
                } catch { router.push("/dashboard"); }
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
            
            // Audio check
            playMatchSound(true);

            // Confetti burst
            if (typeof window !== "undefined") {
                triggerMatchConfetti(window.innerWidth / 2, window.innerHeight * 0.4);
            }

            const newCombo = combo + 1;
            setCombo(newCombo);
            if (newCombo > bestCombo) setBestCombo(newCombo);
            setSelectedTerm(null); setSelectedDef(null);
            if (newMatched.size === pairs.length) handleGameComplete();
        } else {
            setWrongPair({ term: selectedTerm, def: selectedDef });
            
            // Audio check
            playMatchSound(false);

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
                <DataDustLoader label="Building Match Board" phrases={["Setting up concept pairs...", "Finding tricky matches...", "Generating connections...", "Almost ready..."]} />
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
                        <button onClick={() => router.push("/dashboard")} className="btn-skeuo w-full py-3 text-[11px] font-black uppercase tracking-widest">
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
                <GlassmorphicCard
                    intensity={isMatched ? "light" : isSelected ? "medium" : "light"}
                    glowColor={isSelected ? `${tint.text}20` : undefined}
                    radius="16px"
                    hoverLift={!isMatched}
                    className={cn(
                        "relative px-4 py-3.5 border-2 transition-all duration-300 min-h-[64px] flex items-center gap-3 select-none",
                        isMatched
                            ? "opacity-30 scale-[0.98] border-emerald-500/30 bg-emerald-500/5"
                            : isWrong
                            ? "border-red-500/50 bg-red-500/10"
                            : isSelected
                            ? "border-[var(--accent)] scale-[1.03]"
                            : "border-white/5 bg-zinc-950/20 hover:bg-zinc-950/40 hover:border-white/10 active:scale-[0.98]"
                    )}
                    style={{
                        borderColor: isMatched
                            ? "rgba(43, 178, 136, 0.25)"
                            : isSelected
                            ? "var(--accent)"
                            : isWrong
                            ? "rgba(232, 93, 117, 0.4)"
                            : "rgba(255,255,255,0.05)"
                    }}
                >
                    {/* Number badge */}
                    {isMatched ? (
                        <div
                            className="w-5.5 h-5.5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                            style={{ background: `${tint.text}10`, border: `1px solid ${tint.text}30`, color: tint.text }}
                        >
                            {pairNum}
                        </div>
                    ) : isSelected ? (
                        <div
                            className="w-5.5 h-5.5 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${tint.text}10`, border: `1.5px solid ${tint.text}` }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: tint.text }} />
                        </div>
                    ) : (
                        <div className="w-5.5 h-5.5 rounded-lg bg-white/5 border border-white/5 shrink-0" />
                    )}

                    <span
                        className={cn(
                            "text-[12px] sm:text-[13px] font-medium leading-relaxed flex-1 font-serif select-text",
                            isMatched ? "line-through text-zinc-500" : "text-zinc-200",
                            isWrong ? "text-red-400" : ""
                        )}
                        style={isSelected ? { color: tint.text } : {}}
                    >
                        {text}
                    </span>

                    {isMatched && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                            <CheckCircle2 size={14} className="text-[var(--emerald)] shrink-0" />
                        </motion.div>
                    )}
                </GlassmorphicCard>
            </motion.button>
        );
    };

    return (
        <div className="h-[100dvh] bg-[var(--background)] flex flex-col overflow-hidden relative">
            {/* Particle Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-50"
            />

            {/* ── Top Bar ── */}
            <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-[var(--border)]/40 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors"
                    >
                        <X size={14} className="text-[var(--foreground-muted)]" />
                    </button>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-[var(--foreground)] leading-tight italic">Match Arena</p>
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
            <div className="w-full h-[2px] bg-[var(--foreground)]/5 shrink-0 z-10">
                <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-[var(--accent)] rounded-r-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
            </div>

            {/* ── Column headers ── */}
            <div className="shrink-0 px-3 sm:px-6 pt-3 pb-1 z-10">
                <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3 sm:gap-4">
                    <p className="text-[8px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-[0.4em] px-1">Terms</p>
                    <p className="text-[8px] font-black text-[var(--foreground-muted)]/40 uppercase tracking-[0.4em] px-1">Definitions</p>
                </div>
            </div>

            {/* ── Game Grid ── */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-3 z-10">
                <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Terms column */}
                    <div className="flex flex-col gap-2">
                        {shuffledTerms.map(({ id, text }) => (
                            <MatchCard key={`term-${id}`} id={id} text={text} side="term" pairIndex={pairs.findIndex(p => p.id === id)} />
                        ))}
                    </div>
                    {/* Definitions column */}
                    <div className="flex flex-col gap-2">
                        {shuffledDefs.map(({ id, text }) => (
                            <MatchCard key={`def-${id}`} id={id} text={text} side="def" pairIndex={pairs.findIndex(p => p.id === id)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom Stats Bar ── */}
            <div className="shrink-0 px-4 py-2.5 border-t border-[var(--border)]/30 bg-[var(--background)] z-10">
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

export default function MatchGamePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><DataDustLoader /></div>}>
            <MatchGameContent />
        </Suspense>
    );
}
