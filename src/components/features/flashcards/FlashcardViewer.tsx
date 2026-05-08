"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ShareCard from "@/components/ShareCard";
import { useToasts } from "@/components/ui/GlobalToasts";
import SessionComplete from "@/components/features/SessionComplete";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Share2, ChevronLeft, Lightbulb, Baby, CheckCircle2 } from "lucide-react";

interface Flashcard {
    id?: string;
    front: string;
    back: string;
}

interface FlashcardViewerProps {
    flashcards: Flashcard[];
    title: string;
    generationId?: string | null;
}

export default function FlashcardViewer({ flashcards, title, generationId }: FlashcardViewerProps) {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [hasRecordedActivity, setHasRecordedActivity] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const [eli5Text, setEli5Text] = useState<Record<number, string>>({});
    const [isGeneratingEli5, setIsGeneratingEli5] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Swipe motion
    const dragX = useMotionValue(0);
    const cardRotate = useTransform(dragX, [-200, 0, 200], [-8, 0, 8]);
    const cardOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

    useEffect(() => {
        const timer = setTimeout(() => setShowSwipeHint(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGeneratingEli5 || sessionComplete) return;
            switch (e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    setIsFlipped(prev => !prev);
                    setIsTheaterMode(true);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    setIsTheaterMode(true);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrev();
                    setIsTheaterMode(true);
                    break;
                case 'Escape':
                    setIsTheaterMode(false);
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, flashcards.length, isGeneratingEli5, sessionComplete]);

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleNext = async () => {
        setIsFlipped(false);
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
                    console.error(err);
                }
            }
            setSessionComplete(true);
            return;
        }
        setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 300);
    };

    const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
        const threshold = 80;
        if (info.offset.x < -threshold) handleNext();
        else if (info.offset.x > threshold) handlePrev();
    };

    const handleEli5 = async (e: React.MouseEvent, text: string, idx: number) => {
        e.stopPropagation();
        if (isGeneratingEli5 || eli5Text[idx]) return;
        setIsGeneratingEli5(true);
        try {
            const res = await fetch("/api/generate/eli5", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            const reader = res.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                setEli5Text(prev => ({ ...prev, [idx]: buffer }));
            }
        } catch (err) {
            addToast("Failed to simplify", "error");
        } finally {
            setIsGeneratingEli5(false);
        }
    };

    if (flashcards.length === 0) return null;
    const currentCard = flashcards[currentIndex];

    return (
        <div className={`min-h-screen w-full transition-colors duration-700 ${isTheaterMode ? 'bg-[#030305]' : 'bg-transparent'} flex flex-col items-center`}>
            {/* Header */}
            <header className={`w-full max-w-5xl p-6 flex items-center justify-between z-20 transition-opacity duration-500 ${isTheaterMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)] mb-0.5">Study Mode</p>
                        <h1 className="text-sm font-bold text-[var(--foreground)] truncate max-w-[200px]">{title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                        <Share2 size={16} />
                        <span className="text-[11px] font-bold">Share</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl px-6 flex flex-col items-center justify-center relative z-10">
                <div className="mb-12 flex flex-col items-center">
                    {showSwipeHint && (
                        <p className="text-[10px] font-bold tracking-[0.3em] text-[var(--foreground-muted)] opacity-50 uppercase mb-4">Swipe to navigate</p>
                    )}
                    <div className="px-5 py-2 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-[var(--foreground-muted)]">
                        {currentIndex + 1} / {flashcards.length}
                    </div>
                </div>

                <motion.div
                    className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer touch-pan-y"
                    onClick={handleFlip}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    style={{ x: dragX, rotate: cardRotate, opacity: cardOpacity }}
                    onDragEnd={handleDragEnd}
                >
                    <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front */}
                        <div className="absolute inset-0 rounded-[40px] bg-[var(--card-bg)] border border-white/10 p-12 flex flex-col items-center justify-center backface-hidden shadow-2xl">
                            <p className="text-2xl font-black text-center leading-tight tracking-tight text-[var(--text)]">{currentCard.front}</p>
                            <div className="absolute bottom-10 flex flex-col items-center gap-2">
                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--blue)] transition-all shadow-[0_0_10px_var(--blue-glow)]" style={{ width: `${((currentIndex + 1)/flashcards.length)*100}%` }} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Tap to Flip</span>
                            </div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 rounded-[40px] bg-[var(--card-bg)] border border-white/10 p-12 flex flex-col items-center justify-center backface-hidden rotate-y-180 shadow-2xl">
                            <div className="flex flex-col items-center gap-6 w-full">
                                <p className="text-xl font-sans font-bold text-center italic text-[var(--blue)] leading-relaxed">
                                    {eli5Text[currentIndex] || currentCard.back}
                                </p>
                                {!eli5Text[currentIndex] && (
                                    <button onClick={(e) => handleEli5(e, currentCard.back, currentIndex)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] border border-[var(--blue-border)] text-[10px] font-black uppercase tracking-wider hover:bg-[var(--blue-active)] transition-all">
                                        <Baby size={14} />
                                        {isGeneratingEli5 ? "Simplifying..." : "ELI5"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="flex items-center gap-6 mt-16 w-full max-w-sm">
                    <button onClick={handlePrev} className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                        <ChevronLeft />
                    </button>
                    <button onClick={handleNext} className="flex-1 h-16 rounded-2xl bg-[var(--blue)] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-[var(--blue-glow)] active:scale-95 transition-all">
                        {currentIndex === flashcards.length - 1 ? "Complete Session" : "Next Card"}
                    </button>
                </div>
            </main>

            <SessionComplete
                isVisible={sessionComplete}
                onDismiss={() => router.push("/library")}
                xpEarned={sessionStats.xp}
                streak={sessionStats.streak}
                streakIncremented={sessionStats.incremented}
                type="flashcards"
                title={title}
                extraStat={{ label: "Cards Mastered", value: String(flashcards.length), icon: "style" }}
                continueHref="/library"
            />

            <ShareCard 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                data={{ title, count: flashcards.length, type: "Flashcards", user: user?.name || "Scholar", items: flashcards }}
            />
        </div>
    );
}
