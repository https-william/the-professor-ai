"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ShareCard from "@/components/ShareCard";
import SiteHeader from "@/components/ui/SiteHeader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import SessionComplete from "@/components/features/SessionComplete";
import DataDustLoader from "@/components/ui/DataDustLoader";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

interface Flashcard {
    id?: string;
    front: string;
    back: string;
}

const emptyFlashcards: Flashcard[] = [
    { id: "0", front: "No flashcards found", back: "Go to the Create page to generate some study materials!" }
];

function FlashcardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [flashcards, setFlashcards] = useState<Flashcard[]>(emptyFlashcards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [title, setTitle] = useState("Academic Deck");
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const hasStartedGeneration = useRef(false);
    const [hasRecordedActivity, setHasRecordedActivity] = useState(false);
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [showSwipeHint, setShowSwipeHint] = useState(true);

    // Self-rating state
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [showRatingHint, setShowRatingHint] = useState(true);

    // ELI5 state
    const [eli5Text, setEli5Text] = useState<Record<number, string>>({});
    const [isGeneratingEli5, setIsGeneratingEli5] = useState(false);

    // Session complete state
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Swipe gesture motion values
    const dragX = useMotionValue(0);
    const cardRotate = useTransform(dragX, [-200, 0, 200], [-8, 0, 8]);
    const cardOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

    // Hide swipe hint after first swipe
    useEffect(() => {
        if (showSwipeHint) {
            const timer = setTimeout(() => setShowSwipeHint(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showSwipeHint]);

    const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
        const swipeThreshold = 80;
        const velocityThreshold = 300;

        if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
            // Swiped left → next card
            setSwipeDirection('left');
            setShowSwipeHint(false);
            handleNext();
            setTimeout(() => setSwipeDirection(null), 400);
        } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
            // Swiped right → previous card
            setSwipeDirection('right');
            setShowSwipeHint(false);
            handlePrev();
            setTimeout(() => setSwipeDirection(null), 400);
        }
    };

    // Load content or Initiate Stream
    useEffect(() => {
        const init = async () => {
            const id = searchParams.get("id");
            const mode = searchParams.get("mode");

            if (id) {
                try {
                    setIsGenerating(false);
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .single();
                    if (error || !data) throw new Error("Deck not found");

                    const cards = data.content?.flashcards || [];
                    setFlashcards(cards);
                    setTitle(data.title || "Academic Deck");
                    setGenerationId(data.id);
                    sessionStorage.setItem("generatedContent", JSON.stringify({
                        type: "flashcards",
                        data: cards,
                        title: data.title,
                        id: data.id
                    }));
                    return;
                } catch (e) {
                    console.error("ID load error:", e);
                    router.push("/create"); return;
                }
            }

            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) {
                    router.push("/create"); return;
                }
                hasStartedGeneration.current = true;
                const params = JSON.parse(paramsStr);
                sessionStorage.removeItem("generateParams");
                
                setIsGenerating(true);
                setFlashcards([]);
                setGenerationError(null);
                
                try {
                    const response = await fetch("/api/generate/flashcards", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(params),
                    });

                    const decoder = new TextDecoder();
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
                            setIsEndowmentOpen(true);
                            setIsGenerating(false);
                            return;
                        }
                        throw new Error(errorData.error || "Generation failed");
                    }

                    const reader = response.body?.getReader();
                    if (!reader) throw new Error("No stream content");
                    let buffer = "";
                    let finalCards: Flashcard[] = [];

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (!line.startsWith("data: ")) continue;
                            const json = JSON.parse(line.slice(6));
                            
                            if (json.type === "flashcard") {
                                finalCards = [...finalCards, json.card];
                                setFlashcards(finalCards);
                            } else if (json.status === "complete") {
                                setGenerationId(json.id);
                                setTitle(json.title);
                                if (json.xpEarned) {
                                    addToast(`Active Recall Session! +${json.xpEarned} XP`, 'xp');
                                }
                                sessionStorage.setItem("generatedContent", JSON.stringify({
                                    type: "flashcards",
                                    data: json.flashcards || finalCards,
                                    title: json.title,
                                    id: json.id
                                }));
                            } else if (json.status === "error") {
                                throw new Error(json.message);
                            }
                        }
                    }
                } catch (err: any) {
                    setGenerationError(err.message);
                } finally {
                    setIsGenerating(false);
                }
            } else {
                try {
                    const stored = sessionStorage.getItem("generatedContent");
                    if (stored) {
                        const content = JSON.parse(stored);
                        if ((content.type === "flashcards" || content.flashcards) && (content.data || content.flashcards)) {
                            setFlashcards(content.data || content.flashcards);
                            setTitle(content.title || "Academic Deck");
                        }
                    }
                } catch (e) {}
            }
        };
        init();
    }, [searchParams, router]);

    const handleFlip = () => setIsFlipped(!isFlipped);
    const handleNext = async () => {
        setIsFlipped(false);
        const nextIndex = (currentIndex + 1) % flashcards.length;
        
        // Show session complete when hitting the last card
        if (currentIndex === flashcards.length - 1) {
            if (!hasRecordedActivity) {
                setHasRecordedActivity(true);
                try {
                    const actRes = await fetch("/api/user/activity", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "flashcards" })
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
                } catch (err) {
                    console.error("Failed to record flashcard activity:", err);
                }
            }
            setSessionComplete(true);
            setTimeout(() => setCurrentIndex(0), 400); // Reset for replay behind overlay
            return;
        }
        
        setTimeout(() => setCurrentIndex(nextIndex), 300);
    };

    const handleSelfRate = async (rating: 1 | 2 | 3 | 4) => {
        if (ratingSubmitting) return;
        setRatingSubmitting(true);
        setShowRatingHint(false);

        try {
            await fetch("/api/user/card-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generationId: generationId,
                    cardId: currentCard?.id,
                    rating,
                    front: currentCard?.front,
                    back: currentCard?.back,
                }),
            });
        } catch (err) {
            console.error("Rating failed:", err);
        }

        setRatingSubmitting(false);
        // Auto-advance after rating
        handleNext();
    };
    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 300);
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
            addToast("ELI5 Generation failed: " + err.message, "error");
        } finally {
            setIsGeneratingEli5(false);
        }
    };

    if (isGenerating && flashcards.length === 0) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6 overflow-hidden">
                <DataDustLoader />
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];
    if (!currentCard) return null;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 relative overflow-hidden flex flex-col items-center">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/5 blur-3xl pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--secondary)]/5 blur-3xl pointer-events-none rounded-full -translate-x-1/3 translate-y-1/3" />

            {/* Header */}
            <header className="w-full max-w-4xl p-5 flex items-center justify-between relative z-10 animate-in slide-in-from-top-4 duration-500">
                <button
                    onClick={() => router.push('/create')}
                    className="group flex flex-col items-start gap-1"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center group-hover:bg-[var(--foreground)]/10 transition-colors">
                            <span className="material-symbols-outlined text-sm text-[var(--foreground-muted)]">arrow_back</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-0.5">Exit Study Session</p>
                            <h1 className="text-[13px] font-bold text-[var(--foreground)] truncate max-w-[150px] sm:max-w-xs">{title}</h1>
                        </div>
                    </div>
                </button>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsShareOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-secondary)] hover:bg-[var(--foreground)]/5 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[15px]">share</span>
                        <span className="text-[11px] font-bold hidden sm:inline">Share</span>
                    </button>
                </div>
            </header>

            <main className="max-w-2xl w-full px-6 py-12 flex flex-col items-center relative z-10 transition-all">
                {generationError && (
                    generationError.toLowerCase().includes("unauthorized") ? (
                        <div className="w-full flex justify-center mt-8">
                            <AuthInterceptor />
                        </div>
                    ) : (
                        <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center w-full">
                            {generationError}
                        </div>
                    )
                )}

                <div className="flex flex-col items-center mb-12">
                    {showSwipeHint && flashcards.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-bold tracking-[0.3em] text-[var(--foreground-muted)] opacity-50 uppercase mb-3 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[12px]">swipe</span>
                            Swipe to navigate
                        </motion.div>
                    )}
                   <div className="px-4 py-1.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[11px] font-bold text-[var(--foreground-muted)]">
                        Card {currentIndex + 1} of {flashcards.length}
                   </div>
                </div>

                <motion.div
                     className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group touch-pan-y"
                     onClick={handleFlip}
                     drag="x"
                     dragConstraints={{ left: 0, right: 0 }}
                     dragElastic={0.15}
                     onDragEnd={handleDragEnd}
                     style={{ x: dragX, rotate: cardRotate, opacity: cardOpacity }}
                     whileTap={{ scale: 0.98 }}
                 >
                    <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front Side */}
                        <div className="absolute inset-0 rounded-[40px] nm-flat p-10 flex flex-col items-center justify-center backface-hidden transition-all group-hover:scale-[1.01]">
                            <p className="text-3xl font-bold text-center text-[var(--foreground)] leading-tight tracking-tight mb-8">{currentCard.front}</p>
                            <div className="absolute bottom-10 flex flex-col items-center gap-3">
                                <div className="w-12 h-1 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                                     <div className="h-full bg-[var(--accent)]/40 transition-all duration-500" style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} />
                                </div>
                                <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] opacity-60">
                                    <span className="material-symbols-outlined text-xs">touch_app</span>
                                    Tap to flip
                                </span>
                            </div>
                        </div>
                        {/* Back Side */}
                        <div className="absolute inset-0 rounded-[40px] nm-flat p-10 flex flex-col items-center justify-center backface-hidden rotate-y-180">
                            <div className="absolute inset-4 rounded-[32px] nm-inset opacity-50 pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-8">
                                <p className="text-2xl font-serif text-center text-[var(--accent)]/90 leading-relaxed italic px-6 mb-6 transition-all duration-300">
                                    {eli5Text[currentIndex] || currentCard.back}
                                </p>
                                
                                {!eli5Text[currentIndex] && (
                                    <button 
                                        onClick={(e) => handleEli5(e, currentCard.back, currentIndex)}
                                        disabled={isGeneratingEli5}
                                        className="btn-jelly-ghost scale-75 shadow-none hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                    >
                                        <span className="material-symbols-outlined animate-bounce">child_care</span>
                                        {isGeneratingEli5 ? "Simplifying..." : "ELI5"}
                                    </button>
                                )}
                                {eli5Text[currentIndex] && (
                                    <span className="text-[10px] font-bold tracking-widest text-[#10B981] uppercase flex items-center gap-1 bg-[#10B981]/10 px-2 py-1 rounded-full">
                                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                        Simplified
                                    </span>
                                )}
                            </div>

                            <span className="absolute bottom-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)]/40">
                                <span className="material-symbols-outlined text-sm">lightbulb</span>
                                Answer
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Self-Rating Buttons (appear when flipped) */}
                <AnimatePresence>
                    {isFlipped && (
                        <motion.div
                            className="w-full max-w-sm mt-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            {showRatingHint && (
                                <p className="text-[10px] text-center text-[var(--foreground-muted)] opacity-50 uppercase tracking-widest font-bold mb-3">How well did you know this?</p>
                            )}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { rating: 1 as const, label: "Again", color: "#EF4444", sub: "1d" },
                                    { rating: 2 as const, label: "Hard", color: "#F97316", sub: "3d" },
                                    { rating: 3 as const, label: "Good", color: "#3B82F6", sub: "7d" },
                                    { rating: 4 as const, label: "Easy", color: "#10B981", sub: "14d" },
                                ].map(({ rating, label, color, sub }) => (
                                    <button
                                        key={rating}
                                        onClick={(e) => { e.stopPropagation(); handleSelfRate(rating); }}
                                        disabled={ratingSubmitting}
                                        className="py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.93] disabled:opacity-50"
                                        style={{
                                            background: `${color}12`,
                                            border: `1px solid ${color}25`,
                                        }}
                                    >
                                        <span className="text-[12px] font-bold" style={{ color }}>{label}</span>
                                        <span className="text-[9px] font-bold text-[var(--foreground-muted)] opacity-40">{sub}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation buttons (only when NOT flipped) */}
                {!isFlipped && (
                    <div className="flex items-center gap-8 mt-16 w-full max-w-sm">
                        <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 nm-button">
                            <span className="material-symbols-outlined text-[var(--foreground-muted)]">chevron_left</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleNext(); }} 
                            className="flex-1 py-5 rounded-2xl bg-[var(--accent)] text-[var(--background)] font-black tracking-[0.2em] text-[11px] uppercase transition-all active:scale-[0.95] shadow-[0_10px_30px_rgba(245,158,11,0.2)]">
                            {currentIndex === flashcards.length - 1 ? "Finish Deck" : "Next Card"}
                        </button>
                    </div>
                )}
            </main>

            {/* Study Modes */}
            <div className="w-full px-6 py-6 mt-auto">
                <p className="text-[9px] font-black text-[var(--foreground-muted)] opacity-50 uppercase tracking-[0.3em] text-center mb-4">More ways to study</p>
                <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                    {/* Match Game */}
                    <button
                        onClick={() => {
                            sessionStorage.setItem("matchGameCards", JSON.stringify({
                                cards: flashcards,
                                title: title,
                            }));
                            router.push("/flashcards/match");
                        }}
                        disabled={flashcards.length < 3}
                        className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.95] disabled:opacity-25"
                        style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.12)" }}
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#818CF8]">extension</span>
                        <span className="text-[9px] font-bold text-[#818CF8]/70 uppercase tracking-wider">Match</span>
                    </button>

                    {/* Learn Mode */}
                    <button
                        onClick={() => {
                            sessionStorage.setItem("learnModeCards", JSON.stringify({
                                cards: flashcards,
                                title: title,
                            }));
                            router.push("/flashcards/learn");
                        }}
                        className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.95]"
                        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#10B981]">keyboard</span>
                        <span className="text-[9px] font-bold text-[#10B981]/70 uppercase tracking-wider">Learn</span>
                    </button>

                    {/* Auto-Quiz */}
                    <button
                        onClick={async () => {
                            if (flashcards.length < 4) return;
                            try {
                                const res = await fetch("/api/generate/auto-quiz", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ cards: flashcards, title }),
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    sessionStorage.setItem("quiz_data", JSON.stringify({ questions: data.questions, title: data.title }));
                                    router.push("/quiz");
                                }
                            } catch {}
                        }}
                        disabled={flashcards.length < 4}
                        className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.95] disabled:opacity-25"
                        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">quiz</span>
                        <span className="text-[9px] font-bold text-[#F59E0B]/70 uppercase tracking-wider">Quiz</span>
                    </button>
                </div>
            </div>

            <ShareCard 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                data={{
                    title: title,
                    count: flashcards.length,
                    type: "Flashcards",
                    user: user?.name || "Scholar",
                    items: flashcards
                }}
            />

            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user.credits}
                requiredCredits={1}
            />

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
                title={title}
                extraStat={{ label: "Cards Reviewed", value: String(flashcards.length), icon: "style" }}
                continueHref="/dashboard"
            />
        </div>
    );
}

export default function FlashcardsPage() {
    return (
        <div className="h-[100dvh] bg-[var(--background)] overflow-hidden relative">
            <div className="h-full overflow-y-auto">
                <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[10px] font-black tracking-[0.4em] text-[var(--foreground-muted)] opacity-60 uppercase">Loading deck...</div>}>
                    <FlashcardContent />
                </Suspense>
            </div>
        </div>
    );
}
