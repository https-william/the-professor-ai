"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import SiteHeader from "@/components/ui/SiteHeader";
import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { 
    Trophy, 
    ChevronLeft, 
    Shuffle, 
    Hand, 
    Baby, 
    CheckCircle2, 
    Lightbulb, 
    Layers 
} from "lucide-react";

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

export default function ReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshUser } = useUser();
    
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

            // Flatten all cards across decks
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
        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
        setAllCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsShuffled(true);
    };

    const handleRate = async (rating: 1 | 2 | 3 | 4) => {
        if (ratingSubmitting || !allCards[currentIndex]) return;
        setRatingSubmitting(true);

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

        // Check if done
        if (currentIndex >= allCards.length - 1) {
            // All cards reviewed — record activity + celebrate
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
            } catch {}
            setSessionComplete(true);
        } else {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        }
    };

    const handleEli5 = async (e: React.MouseEvent, text: string, idx: number) => {
        e.stopPropagation();
        if (isGeneratingEli5) return;
        if (eli5Text[idx]) return; 

        setIsGeneratingEli5(true);
        try {
            const res = await fetch("/api/generate/eli5", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
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
    const progressPercent = allCards.length > 0 ? ((reviewedCount) / allCards.length) * 100 : 0;

    // ── Loading State ──
    if (loading) {
        return (
            <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative">
                <SiteHeader showLogo />
                <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[#F59E0B]/20 border-t-[#F59E0B] rounded-full animate-spin" />
                        </div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Loading review queue...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Empty State — nothing due ──
    if (allCards.length === 0) {
        return (
            <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative">
                <SiteHeader showLogo />
                <div className="h-full flex items-center justify-center px-6">
                    <motion.div
                        className="text-center max-w-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                            <Trophy size={40} strokeWidth={1.5} className="text-[#10B981]" />
                        </div>
                        <h2 className="text-2xl font-black text-white/90 mb-3">All caught up!</h2>
                        <p className="text-sm text-white/40 leading-relaxed mb-8">
                            No cards due for review right now. Keep studying to build your review queue — cards you rate will appear here when they&apos;re due.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push("/create")}
                                className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                                style={{
                                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                                    color: "#06060B",
                                    boxShadow: "0 8px 24px rgba(245,158,11,0.25)",
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
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex flex-col">
            <SiteHeader showLogo />

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/5 relative z-20">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-[#10B981] rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* Header Info */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ChevronLeft size={16} strokeWidth={1.5} className="text-white/50" />
                    </button>
                    <div>
                        <h1 className="text-[13px] font-bold text-white/90">Daily Review</h1>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">
                            {reviewedCount} of {allCards.length} cards • ~{estimatedMinutes} min
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleShuffle}
                        className={`p-2 rounded-xl border transition-all ${isShuffled ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                        title="Shuffle Cards"
                    >
                        <Shuffle size={18} strokeWidth={1.5} />
                    </button>
                    <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[11px] font-bold text-white/50">
                            {allCards.length - reviewedCount} left
                        </span>
                    </div>
                </div>
            </div>

            {/* Deck Label */}
            {currentCard && (
                <div className="px-5 pb-4">
                    <span className="text-[10px] font-bold text-[#F59E0B]/50 uppercase tracking-wider truncate block">
                        {currentCard.deckTitle}
                    </span>
                </div>
            )}

            {/* Card Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    {currentCard && !sessionComplete && (
                        <motion.div
                            key={currentIndex}
                            className="w-full max-w-lg aspect-[4/3] perspective-1000 cursor-pointer touch-pan-y"
                            onClick={() => setIsFlipped(!isFlipped)}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.12}
                            style={{ x: dragX, rotate: cardRotate, opacity: cardOpacity }}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                {/* Front */}
                                <div className={`absolute inset-0 rounded-[36px] p-8 flex flex-col items-center justify-center backface-hidden ${currentCard.intervalDays >= 14 ? 'holographic-foil shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-[#10B981]/30' : ''}`}
                                    style={{
                                        background: "rgba(255,255,255,0.025)",
                                        border: currentCard.intervalDays >= 14 ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.4)",
                                    }}
                                >
                                    <p className="text-2xl md:text-3xl font-bold text-center text-white/90 leading-tight tracking-tight relative z-20">
                                        {currentCard.front}
                                    </p>
                                    <div className="absolute bottom-8 flex flex-col items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/15 flex items-center gap-2">
                                            <Hand size={12} strokeWidth={1.5} />
                                            Tap to reveal
                                        </span>
                                    </div>
                                </div>
                                {/* Back */}
                                <div className={`absolute inset-0 rounded-[36px] p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 ${currentCard.intervalDays >= 14 ? 'holographic-foil shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-[#10B981]/30' : ''}`}
                                    style={{
                                        background: "rgba(245,158,11,0.03)",
                                        border: currentCard.intervalDays >= 14 ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.1)",
                                        boxShadow: "inset 0 1px 1px rgba(245,158,11,0.05), 0 8px 32px rgba(0,0,0,0.4)",
                                    }}
                                >
                                    <div className="relative z-20 flex flex-col items-center justify-center w-full h-full pb-8">
                                        <p className="text-xl md:text-2xl font-serif text-center text-[#F59E0B]/90 leading-relaxed italic px-4 mb-6 transition-all duration-300">
                                            {eli5Text[currentIndex] || currentCard.back}
                                        </p>
                                        
                                        {!eli5Text[currentIndex] && (
                                            <button 
                                                onClick={(e) => handleEli5(e, currentCard.back, currentIndex)}
                                                disabled={isGeneratingEli5}
                                                className="btn-jelly-ghost scale-75 shadow-none hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                            >
                                                <Baby size={16} strokeWidth={1.5} className="animate-bounce" />
                                                {isGeneratingEli5 ? "Simplifying..." : "ELI5"}
                                            </button>
                                        )}
                                        {eli5Text[currentIndex] && (
                                            <span className="text-[10px] font-bold tracking-widest text-[#10B981] uppercase flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-full">
                                                <CheckCircle2 size={12} strokeWidth={1.5} />
                                                Simplified
                                            </span>
                                        )}
                                    </div>
                                    <span className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.4em] text-[#F59E0B]/30 flex items-center gap-2">
                                        <Lightbulb size={14} strokeWidth={1.5} />
                                        Answer
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rating Buttons */}
                <AnimatePresence>
                    {isFlipped && currentCard && !sessionComplete && (
                        <motion.div
                            className="w-full max-w-lg mt-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ delay: 0.25, duration: 0.3 }}
                        >
                            <p className="text-[10px] text-center text-white/20 uppercase tracking-widest font-bold mb-3">
                                How well did you know this?
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { rating: 1 as const, label: "Again", color: "#EF4444", sub: "1d" },
                                    { rating: 2 as const, label: "Hard", color: "#F97316", sub: "3d" },
                                    { rating: 3 as const, label: "Good", color: "#3B82F6", sub: "7d" },
                                    { rating: 4 as const, label: "Easy", color: "#10B981", sub: "14d" },
                                ].map(({ rating, label, color, sub }) => (
                                    <button
                                        key={rating}
                                        onClick={(e) => { e.stopPropagation(); handleRate(rating); }}
                                        disabled={ratingSubmitting}
                                        className="py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all active:scale-[0.93] disabled:opacity-50"
                                        style={{
                                            background: `${color}12`,
                                            border: `1px solid ${color}25`,
                                        }}
                                    >
                                        <span className="text-[13px] font-bold" style={{ color }}>{label}</span>
                                        <span className="text-[9px] font-bold text-white/20">{sub}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tap to flip hint when not flipped */}
                {!isFlipped && currentCard && !sessionComplete && (
                    <div className="mt-8 text-[10px] font-bold text-white/15 uppercase tracking-widest">
                        Tap the card to reveal the answer
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
                extraStat={{ label: "Cards Reviewed", value: String(reviewedCount), icon: Layers }}
                continueHref="/dashboard"
            />
        </div>
    );
}
