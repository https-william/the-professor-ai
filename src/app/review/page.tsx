"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";

import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
    Trophy,
    ChevronLeft,
    Shuffle,
    Hand,
    Baby,
    CheckCircle2,
    Lightbulb,
    Layers,
    Zap,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Web Audio Synthesis ──────────────────────────────────────────────────────

function useReviewAudio() {
    const ctxRef = useRef<AudioContext | null>(null);

    const getCtx = useCallback(() => {
        if (typeof window === "undefined") return null;
        if (!ctxRef.current || ctxRef.current.state === "closed") {
            ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (ctxRef.current.state === "suspended") {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    }, []);

    /** Card flip: smooth mid-frequency sine sweep */
    const playFlip = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
    }, [getCtx]);

    /** Rating sound: tuned per quality rating */
    const playRating = useCallback((rating: 1 | 2 | 3 | 4) => {
        const ctx = getCtx();
        if (!ctx) return;
        const configs = {
            1: { freq: 140, type: "sawtooth" as OscillatorType, dur: 0.25, gain: 0.06 },
            2: { freq: 240, type: "triangle" as OscillatorType, dur: 0.2, gain: 0.07 },
            3: { freq: 480, type: "sine" as OscillatorType, dur: 0.18, gain: 0.08 },
            4: { freq: 640, type: "sine" as OscillatorType, dur: 0.3, gain: 0.09 },
        };
        const cfg = configs[rating];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.type = cfg.type;
        osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime);
        filter.type = "lowpass";
        filter.frequency.value = rating === 4 ? 4000 : 1200;
        gain.gain.setValueAtTime(cfg.gain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.dur);
        // Rating 4 (Easy): add a second harmonic chime
        if (rating === 4) {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(960, ctx.currentTime + 0.05);
            gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc2.start(ctx.currentTime + 0.05);
            osc2.stop(ctx.currentTime + 0.38);
        }
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + cfg.dur + 0.05);
    }, [getCtx]);

    /** Shuffle: brief ascending arpeggio blip */
    const playShuffle = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        [260, 330, 400].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.06;
            gain.gain.setValueAtTime(0.07, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.start(t);
            osc.stop(t + 0.14);
        });
    }, [getCtx]);

    return { playFlip, playRating, playShuffle };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewCard {
    id: string;
    cardId: string;
    front: string;
    back: string;
    rating: number;
    intervalDays: number;
    reviewCount: number;
    nextReviewAt: string;
}

interface ReviewDeck {
    generationId: string;
    title: string;
    dueCount: number;
    cards: ReviewCard[];
}

// ─── Segmented Progress Track ─────────────────────────────────────────────────

function SegmentedProgress({ total, done }: { total: number; done: number }) {
    const maxVisible = 40;
    const count = Math.min(total, maxVisible);
    return (
        <div className="w-full flex gap-[2px] items-center px-5 pt-3 pb-1">
            {Array.from({ length: count }).map((_, i) => {
                const isCompleted = i < done;
                const isCurrent = i === done;
                return (
                    <div
                        key={i}
                        className="flex-1 h-[3px] rounded-full transition-all duration-500"
                        style={{
                            background: isCompleted
                                ? "linear-gradient(90deg, #E5A93C, #2BB288)"
                                : isCurrent
                                ? "rgba(229,169,60,0.35)"
                                : "rgba(255,255,255,0.05)",
                            boxShadow: isCompleted
                                ? "0 0 4px rgba(229,169,60,0.4)"
                                : isCurrent
                                ? "0 0 6px rgba(229,169,60,0.2)"
                                : "none",
                        }}
                    />
                );
            })}
            {total > maxVisible && (
                <span className="text-[9px] font-black text-white/20 ml-1 shrink-0">+{total - maxVisible}</span>
            )}
        </div>
    );
}

// ─── Rating Button ────────────────────────────────────────────────────────────

const RATING_CONFIG = [
    { rating: 1 as const, label: "Again", color: "#EF4444", sub: "1d", glow: "rgba(239,68,68,0.25)" },
    { rating: 2 as const, label: "Hard", color: "#F97316", sub: "3d", glow: "rgba(249,115,22,0.25)" },
    { rating: 3 as const, label: "Good", color: "#3B82F6", sub: "7d", glow: "rgba(59,130,246,0.25)" },
    { rating: 4 as const, label: "Easy", color: "#2BB288", sub: "14d", glow: "rgba(43,178,136,0.3)" },
];

// ─── Review Card Face ─────────────────────────────────────────────────────────

function ReviewCardFace({
    card,
    isFlipped,
    eli5Text,
    isGeneratingEli5,
    onFlip,
    onEli5,
    index,
    dragX,
    cardRotate,
    cardOpacity,
}: {
    card: ReviewCard & { deckTitle: string; generationId: string };
    isFlipped: boolean;
    eli5Text: string | undefined;
    isGeneratingEli5: boolean;
    onFlip: () => void;
    onEli5: (e: React.MouseEvent) => void;
    index: number;
    dragX: any;
    cardRotate: any;
    cardOpacity: any;
}) {
    const isHolo = card.intervalDays >= 14;
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const tiltX = useTransform(mouseY, [-150, 150], [6, -6]);
    const tiltY = useTransform(mouseX, [-150, 150], [-6, 6]);
    const tiltXSpring = useSpring(tiltX, { stiffness: 200, damping: 20 });
    const tiltYSpring = useSpring(tiltY, { stiffness: 200, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isFlipped) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <motion.div
            key={index}
            className="w-full max-w-lg cursor-pointer touch-pan-y select-none"
            style={{ x: dragX, rotate: cardRotate, opacity: cardOpacity, perspective: 1000 }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
        >
            <motion.div
                className="relative w-full"
                style={{
                    rotateX: isFlipped ? 0 : tiltXSpring,
                    rotateY: isFlipped ? 0 : tiltYSpring,
                    transformStyle: "preserve-3d",
                    minHeight: "260px",
                }}
                onClick={onFlip}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* ── Inner flip container ── */}
                <div
                    className="relative w-full transition-all duration-700"
                    style={{
                        transformStyle: "preserve-3d",
                        minHeight: "260px",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >
                    {/* FRONT */}
                    <div
                        className={cn(
                            "absolute inset-0 rounded-[36px] p-8 flex flex-col items-center justify-center",
                            isHolo && "ring-1 ring-[#2BB288]/30"
                        )}
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            background: isHolo
                                ? "linear-gradient(135deg, rgba(43,178,136,0.06), rgba(255,255,255,0.025))"
                                : "rgba(255,255,255,0.025)",
                            border: isHolo
                                ? "1px solid rgba(43,178,136,0.3)"
                                : "1px solid rgba(255,255,255,0.06)",
                            boxShadow:
                                "inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.2), 0 12px 40px rgba(0,0,0,0.5)",
                            minHeight: "260px",
                        }}
                    >
                        {isHolo && (
                            <div
                                className="absolute inset-0 rounded-[36px] pointer-events-none opacity-20"
                                style={{
                                    background:
                                        "linear-gradient(135deg, rgba(43,178,136,0.15) 0%, transparent 50%, rgba(150,115,245,0.1) 100%)",
                                }}
                            />
                        )}
                        <p className="text-2xl md:text-3xl font-bold text-center text-white/90 leading-tight tracking-tight relative z-20 px-4">
                            {card.front}
                        </p>
                        <div className="absolute bottom-7 flex flex-col items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/15 flex items-center gap-2">
                                <Hand size={12} strokeWidth={1.5} />
                                Tap or press SPACE to reveal
                            </span>
                        </div>
                        {isHolo && (
                            <div className="absolute top-5 right-5 z-30">
                                <span
                                    className="text-[9px] font-black uppercase tracking-[0.25em] px-2 py-1 rounded-full"
                                    style={{
                                        background: "rgba(43,178,136,0.12)",
                                        border: "1px solid rgba(43,178,136,0.3)",
                                        color: "#2BB288",
                                    }}
                                >
                                    Mastered
                                </span>
                            </div>
                        )}
                    </div>

                    {/* BACK */}
                    <div
                        className={cn(
                            "absolute inset-0 rounded-[36px] p-8 flex flex-col items-center justify-center",
                            isHolo && "ring-1 ring-[#2BB288]/30"
                        )}
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            background: "rgba(229,169,60,0.035)",
                            border: isHolo
                                ? "1px solid rgba(43,178,136,0.3)"
                                : "1px solid rgba(229,169,60,0.12)",
                            boxShadow:
                                "inset 0 1px 1px rgba(229,169,60,0.06), 0 12px 40px rgba(0,0,0,0.5)",
                            minHeight: "260px",
                        }}
                    >
                        <div className="relative z-20 flex flex-col items-center justify-center w-full h-full pb-8 gap-4">
                            <p className="text-xl md:text-2xl font-serif text-center text-[#E5A93C]/90 leading-relaxed italic px-4">
                                {eli5Text || card.back}
                            </p>
                            {!eli5Text && (
                                <button
                                    onClick={onEli5}
                                    disabled={isGeneratingEli5}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-[0.96]"
                                    style={{
                                        background: "rgba(229,169,60,0.08)",
                                        border: "1px solid rgba(229,169,60,0.2)",
                                        color: "#E5A93C",
                                    }}
                                >
                                    <Baby
                                        size={14}
                                        strokeWidth={1.5}
                                        className={isGeneratingEli5 ? "animate-spin" : "animate-bounce"}
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {isGeneratingEli5 ? "Simplifying..." : "ELI5"}
                                    </span>
                                </button>
                            )}
                            {eli5Text && (
                                <span
                                    className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                                    style={{
                                        background: "rgba(43,178,136,0.1)",
                                        border: "1px solid rgba(43,178,136,0.2)",
                                        color: "#2BB288",
                                    }}
                                >
                                    <CheckCircle2 size={12} strokeWidth={1.5} />
                                    Simplified
                                </span>
                            )}
                        </div>
                        <span className="absolute bottom-7 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2" style={{ color: "rgba(229,169,60,0.3)" }}>
                            <Lightbulb size={14} strokeWidth={1.5} />
                            Answer
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Review Content ──────────────────────────────────────────────────────

function ReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshUser } = useUser();
    const { playFlip, playRating, playShuffle } = useReviewAudio();

    const isQuickMode = searchParams.get("mode") === "quick";

    const [loading, setLoading] = useState(true);
    const [totalDue, setTotalDue] = useState(0);
    const [estimatedMinutes, setEstimatedMinutes] = useState(0);
    const [allCards, setAllCards] = useState<(ReviewCard & { deckTitle: string; generationId: string })[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });
    const [isShuffled, setIsShuffled] = useState(false);
    const [ratingBounce, setRatingBounce] = useState<number | null>(null);

    // ELI5 state
    const [eli5Text, setEli5Text] = useState<Record<number, string>>({});
    const [isGeneratingEli5, setIsGeneratingEli5] = useState(false);

    // Swipe
    const dragX = useMotionValue(0);
    const cardRotate = useTransform(dragX, [-200, 0, 200], [-6, 0, 6]);
    const cardOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.6, 0.85, 1, 0.85, 0.6]);

    useEffect(() => {
        fetchDueCards();
    }, []);

    const fetchDueCards = async () => {
        try {
            const res = await fetch("/api/user/due-cards");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            setTotalDue(data.totalDue);
            setEstimatedMinutes(data.estimatedMinutes);

            let flat = data.decks.flatMap((deck: ReviewDeck) =>
                deck.cards.map((card: ReviewCard) => ({
                    ...card,
                    deckTitle: deck.title,
                    generationId: deck.generationId,
                }))
            );

            if (isQuickMode) {
                flat = flat.sort(() => Math.random() - 0.5).slice(0, 10);
                setIsShuffled(true);
            }

            setAllCards(flat);
        } catch (err) {
            console.error("Failed to fetch due cards:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleShuffle = () => {
        playShuffle();
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        setAllCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsShuffled(true);
    };

    const handleFlip = useCallback(() => {
        if (!isFlipped) playFlip();
        setIsFlipped(prev => !prev);
    }, [isFlipped, playFlip]);

    const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
        if (ratingSubmitting || !allCards[currentIndex]) return;
        setRatingSubmitting(true);
        playRating(rating);
        setRatingBounce(rating);
        setTimeout(() => setRatingBounce(null), 400);

        const card = allCards[currentIndex];

        try {
            await fetch("/api/user/card-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generationId: card.generationId,
                    cardId: card.cardId,
                    rating,
                    front: card.front,
                    back: card.back,
                }),
            });
        } catch (err) {
            console.error("Rating failed:", err);
        }

        setRatingSubmitting(false);
        setIsFlipped(false);
        setReviewedCount(prev => prev + 1);

        if (currentIndex >= allCards.length - 1) {
            try {
                const actRes = await fetch("/api/user/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "flashcards" }),
                });
                if (actRes.ok) {
                    const { stats } = await actRes.json();
                    setSessionStats({
                        xp: stats?.xpGained || 5,
                        streak: stats?.newStreak || user.streak || 0,
                        incremented: stats?.streakIncremented || false,
                    });
                    refreshUser();
                }
            } catch { }
            setSessionComplete(true);
        } else {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        }
    }, [ratingSubmitting, allCards, currentIndex, playRating, user.streak, refreshUser]);

    // ── Keyboard Hotkeys (Zen Mode) ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (sessionComplete || !allCards[currentIndex]) return;

            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                handleFlip();
            } else if (isFlipped && !ratingSubmitting) {
                if (e.key === "1") handleRate(1);
                else if (e.key === "2") handleRate(2);
                else if (e.key === "3") handleRate(3);
                else if (e.key === "4") handleRate(4);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFlipped, ratingSubmitting, currentIndex, allCards, sessionComplete, handleFlip, handleRate]);

    const handleEli5 = async (e: React.MouseEvent, text: string, idx: number) => {
        e.stopPropagation();
        if (isGeneratingEli5) return;
        if (eli5Text[idx]) return;

        setIsGeneratingEli5(true);
        try {
            const res = await fetch("/api/generate/eli5", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error("Failed to generate ELI5");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No stream content");

            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                setEli5Text(prev => ({ ...prev, [idx]: buffer }));
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsGeneratingEli5(false);
        }
    };

    const currentCard = allCards[currentIndex];
    const progressPercent = allCards.length > 0 ? (reviewedCount / allCards.length) * 100 : 0;

    // ── Loading State ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative w-16 h-16">
                        <div
                            className="absolute inset-0 rounded-2xl animate-pulse"
                            style={{ background: "rgba(229,169,60,0.08)", border: "1px solid rgba(229,169,60,0.15)" }}
                        />
                        <div
                            className="absolute inset-0 rounded-2xl animate-spin"
                            style={{
                                border: "2px solid transparent",
                                borderTopColor: "#E5A93C",
                                borderRightColor: "rgba(229,169,60,0.3)",
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Layers size={22} strokeWidth={1.5} style={{ color: "rgba(229,169,60,0.6)" }} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        Loading review queue...
                    </p>
                </div>
            </div>
        );
    }

    // ── Empty State ────────────────────────────────────────────────────────────
    if (allCards.length === 0) {
        return (
            <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex items-center justify-center px-6">
                {/* Ambient glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(43,178,136,0.06) 0%, transparent 70%)",
                    }}
                />
                <motion.div
                    className="text-center max-w-sm relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Trophy icon with emerald glow orb */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div
                            className="absolute inset-0 rounded-3xl blur-xl"
                            style={{ background: "rgba(43,178,136,0.2)" }}
                        />
                        <div
                            className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
                            style={{
                                background: "rgba(43,178,136,0.08)",
                                border: "1px solid rgba(43,178,136,0.2)",
                                boxShadow: "0 0 40px rgba(43,178,136,0.15)",
                            }}
                        >
                            <Trophy size={40} strokeWidth={1.5} className="text-[#2BB288]" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-serif text-white/90 mb-3 italic">All caught up!</h2>
                    <p className="text-sm text-white/40 leading-relaxed mb-8">
                        No cards due right now. Your bed misses you — or at least take a break. Cards you rate will resurface when they&apos;re due.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                            style={{
                                background: "linear-gradient(135deg, #E5A93C, #D97706)",
                                color: "#06060B",
                                boxShadow: "0 8px 24px rgba(229,169,60,0.3)",
                            }}
                        >
                            Create New Materials
                        </button>
                        <button
                            onClick={() => router.push("/library")}
                            className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-white/25 hover:text-white/40 transition-colors"
                        >
                            Browse Library
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Main Review UI ─────────────────────────────────────────────────────────
    return (
        <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex flex-col">
            {/* Ambient background orb */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    background: "radial-gradient(ellipse 800px 500px at 50% 20%, rgba(229,169,60,0.03) 0%, transparent 70%)",
                }}
            />

            {/* Segmented Progress Track */}
            <SegmentedProgress total={allCards.length} done={reviewedCount} />

            {/* Header Bar */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:-translate-x-0.5"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <ChevronLeft size={16} strokeWidth={1.5} className="text-white/50" />
                    </button>
                    <div>
                        <h1 className="text-[13px] font-black text-white/90 uppercase tracking-[0.15em]">
                            Daily Review
                        </h1>
                        <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider">
                            {reviewedCount} of {allCards.length} cards · ~{estimatedMinutes} min
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShuffle}
                        className="p-2 rounded-xl transition-all active:scale-[0.94]"
                        style={
                            isShuffled
                                ? {
                                    background: "rgba(229,169,60,0.1)",
                                    border: "1px solid rgba(229,169,60,0.3)",
                                    color: "#E5A93C",
                                }
                                : {
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    color: "rgba(255,255,255,0.4)",
                                }
                        }
                        title="Shuffle Cards"
                    >
                        <Shuffle size={16} strokeWidth={1.5} />
                    </button>
                    <div
                        className="px-3 py-1.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <span className="text-[11px] font-bold text-white/40">
                            {allCards.length - reviewedCount} left
                        </span>
                    </div>
                </div>
            </div>

            {/* Deck Label */}
            {currentCard && (
                <div className="px-5 pb-3 relative z-10">
                    <span
                        className="text-[10px] font-black uppercase tracking-[0.2em] truncate block"
                        style={{ color: "rgba(229,169,60,0.45)" }}
                    >
                        {currentCard.deckTitle}
                    </span>
                </div>
            )}

            {/* Card Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 overflow-hidden relative z-10">
                <AnimatePresence mode="wait">
                    {currentCard && !sessionComplete && (
                        <ReviewCardFace
                            card={currentCard}
                            isFlipped={isFlipped}
                            eli5Text={eli5Text[currentIndex]}
                            isGeneratingEli5={isGeneratingEli5}
                            onFlip={handleFlip}
                            onEli5={(e) => handleEli5(e, currentCard.back, currentIndex)}
                            index={currentIndex}
                            dragX={dragX}
                            cardRotate={cardRotate}
                            cardOpacity={cardOpacity}
                        />
                    )}
                </AnimatePresence>

                {/* Rating Buttons */}
                <AnimatePresence>
                    {isFlipped && currentCard && !sessionComplete && (
                        <motion.div
                            className="w-full max-w-lg mt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.3em] font-bold mb-3">
                                How well did you know this?
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {RATING_CONFIG.map(({ rating, label, color, sub, glow }) => (
                                    <motion.button
                                        key={rating}
                                        onClick={(e) => { e.stopPropagation(); handleRate(rating); }}
                                        disabled={ratingSubmitting}
                                        animate={
                                            ratingBounce === rating
                                                ? { scale: [1, 1.08, 0.97, 1] }
                                                : { scale: 1 }
                                        }
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                        className="py-5 rounded-2xl flex flex-col items-center gap-1.5 transition-all active:scale-[0.93] disabled:opacity-50"
                                        style={{
                                            background: `${color}12`,
                                            border: `1px solid ${color}25`,
                                        }}
                                        whileHover={{
                                            boxShadow: `0 0 16px ${glow}`,
                                            background: `${color}18`,
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[13px] font-bold" style={{ color }}>{label}</span>
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/10">[{rating}]</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-white/20">{sub}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Flip hint when not flipped */}
                {!isFlipped && currentCard && !sessionComplete && (
                    <div className="mt-6 text-[9px] font-bold text-white/12 uppercase tracking-[0.3em] flex items-center gap-2">
                        <span>Tap the card or press</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/30 font-mono">SPACE</span>
                        <span>to reveal answer</span>
                    </div>
                )}
            </div>

            <SessionComplete
                isVisible={sessionComplete}
                onDismiss={() => {
                    setSessionComplete(false);
                    router.push("/dashboard");
                }}
                xpEarned={sessionStats.xp}
                streak={sessionStats.streak}
                streakIncremented={sessionStats.incremented}
                type="flashcards"
                title="Daily Review"
                extraStat={{ label: "Cards Reviewed", value: String(reviewedCount), icon: "style" }}
                continueHref="/dashboard"
            />
        </div>
    );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function ReviewPage() {
    return (
        <Suspense
            fallback={
                <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex items-center justify-center">
                    <div className="relative w-16 h-16">
                        <div
                            className="absolute inset-0 rounded-2xl"
                            style={{ background: "rgba(229,169,60,0.08)", border: "1px solid rgba(229,169,60,0.15)" }}
                        />
                        <div
                            className="absolute inset-0 rounded-2xl animate-spin"
                            style={{ border: "2px solid transparent", borderTopColor: "#E5A93C" }}
                        />
                    </div>
                </div>
            }
        >
            <ReviewContent />
        </Suspense>
    );
}
