"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ShareCard from "@/components/ShareCard";
import { useToasts } from "@/components/ui/GlobalToasts";
import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, ChevronLeft, Baby, Check, X, HelpCircle } from "lucide-react";

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

type CardState = 'IDLE' | 'FLIPPED' | 'EVALUATED';

const cardVariants = {
    enter: {
        y: 40,
        scale: 0.95,
        opacity: 0,
    },
    center: {
        y: 0,
        scale: 1,
        opacity: 1,
    },
    exit: (direction: 'left' | 'right' | null) => ({
        x: direction === 'left' ? -350 : direction === 'right' ? 350 : 0,
        y: direction === null ? -40 : 0,
        rotate: direction === 'left' ? -12 : direction === 'right' ? 12 : 0,
        opacity: 0,
        scale: 0.9,
    }),
};

export default function FlashcardViewer({ flashcards, title, generationId }: FlashcardViewerProps) {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    
    // Core states
    const [cardQueue, setCardQueue] = useState<number[]>([]);
    const [queuePointer, setQueuePointer] = useState(0);
    const [cardState, setCardState] = useState<CardState>('IDLE');
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
    const [masteredSet, setMasteredSet] = useState<Set<number>>(new Set());

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [hasRecordedActivity, setHasRecordedActivity] = useState(false);
    const [eli5Text, setEli5Text] = useState<Record<number, string>>({});
    const [isGeneratingEli5, setIsGeneratingEli5] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Initialize card queue
    useEffect(() => {
        if (flashcards.length > 0) {
            setCardQueue(Array.from({ length: flashcards.length }, (_, i) => i));
        }
    }, [flashcards]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGeneratingEli5 || sessionComplete || cardQueue.length === 0) return;
            
            // Bypass input fields
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    if (cardState === 'IDLE') {
                        setCardState('FLIPPED');
                        setIsTheaterMode(true);
                    } else if (cardState === 'FLIPPED') {
                        setCardState('IDLE');
                    }
                    break;
                case 'j':
                    e.preventDefault();
                    if (cardState === 'FLIPPED') {
                        handleEvaluate(false); // Flag/Re-queue
                    }
                    break;
                case 'k':
                    e.preventDefault();
                    if (cardState === 'FLIPPED') {
                        handleEvaluate(true); // Mastered
                    }
                    break;
                case 'escape':
                    e.preventDefault();
                    setIsTheaterMode(false);
                    router.push('/library');
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cardState, queuePointer, cardQueue, isGeneratingEli5, sessionComplete]);

    const handleFlip = () => {
        if (cardState === 'IDLE') setCardState('FLIPPED');
        else if (cardState === 'FLIPPED') setCardState('IDLE');
    };

    const handleEvaluate = async (mastered: boolean) => {
        const currentCardIndex = cardQueue[queuePointer];
        
        setExitDirection(mastered ? 'right' : 'left');
        setCardState('EVALUATED');

        if (mastered) {
            setMasteredSet(prev => {
                const next = new Set(prev);
                next.add(currentCardIndex);
                return next;
            });
            addToast("Card marked as mastered! 🎯", "success", undefined, undefined, true);
        } else {
            setCardQueue(prev => [...prev, currentCardIndex]);
            addToast("Re-queued for review. Keep going! 💪", "info", undefined, undefined, true);
        }

        // Wait for exit transition
        setTimeout(async () => {
            if (queuePointer >= cardQueue.length - 1) {
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
            } else {
                setQueuePointer(prev => prev + 1);
                setCardState('IDLE');
                setExitDirection(null);
            }
        }, 220);
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

    if (flashcards.length === 0 || cardQueue.length === 0) return null;

    const currentCardIndex = cardQueue[queuePointer];
    const currentCard = flashcards[currentCardIndex];
    const progressPercent = Math.round((masteredSet.size / flashcards.length) * 100);

    // 3D Card Inline Styles
    const cardInnerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        transformStyle: "preserve-3d",
        transform: cardState === 'IDLE' ? "rotateY(0deg)" : "rotateY(180deg)",
    };

    const cardFaceStyle: React.CSSProperties = {
        position: "absolute",
        width: "100%",
        height: "100%",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderRadius: "32px",
        border: "1px solid var(--border)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
    };

    const cardFrontStyle: React.CSSProperties = {
        ...cardFaceStyle,
        background: "var(--card)",
    };

    const cardBackStyle: React.CSSProperties = {
        ...cardFaceStyle,
        background: "var(--card)",
        transform: "rotateY(180deg)",
    };

    return (
        <div className={`min-h-screen w-full transition-colors duration-700 ${isTheaterMode ? 'bg-[#030305]' : 'bg-transparent'} flex flex-col items-center select-none`}>
            {/* Header */}
            <header className={`w-full max-w-5xl p-6 flex items-center justify-between z-20 transition-opacity duration-500 ${isTheaterMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)] mb-0.5">Study Mode</p>
                        <h1 className="text-sm font-bold text-[var(--foreground)] truncate max-w-[200px]">{title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer">
                        <Share2 size={16} />
                        <span className="text-[11px] font-bold">Share</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl px-6 flex flex-col items-center justify-center relative z-10">
                
                {/* Stats & Progress indicators */}
                <div className="w-full mb-10 space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
                        <span>Sprint Progress</span>
                        <span>{masteredSet.size} / {flashcards.length} Mastered</span>
                    </div>

                    <div className="w-full bg-[var(--bg-3)] rounded-full h-2 overflow-hidden border border-white/5 relative shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-gradient-to-r from-[var(--blue-light)] to-[var(--blue)] rounded-full shadow-[0_0_12px_var(--blue-glow)]"
                        />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)]/60 font-mono">
                        <span>Card {queuePointer + 1} of {cardQueue.length} in round</span>
                        <span>{cardQueue.length - queuePointer} remaining</span>
                    </div>
                </div>

                {/* Animated 3D Cards container */}
                <div className="relative w-full aspect-[4/3]" style={{ perspective: "1000px" }}>
                    <AnimatePresence mode="wait" custom={exitDirection} initial={false}>
                        <motion.div
                            key={queuePointer}
                            custom={exitDirection}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 350, damping: 26 },
                                y: { type: "spring", stiffness: 350, damping: 26 },
                                opacity: { duration: 0.18 },
                            }}
                            className="w-full h-full relative cursor-pointer"
                            onClick={handleFlip}
                        >
                            <div style={cardInnerStyle}>
                                
                                {/* Front Panel */}
                                <div style={cardFrontStyle}>
                                    <p className="text-2xl font-black text-center leading-tight tracking-tight text-[var(--text)] px-4">
                                        {currentCard.front}
                                    </p>
                                    <div className="absolute bottom-8 flex flex-col items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-1.5">
                                            Tap Card or Press [Space] to Flip
                                        </span>
                                    </div>
                                </div>

                                {/* Back Panel */}
                                <div style={cardBackStyle}>
                                    <div className="flex flex-col items-center justify-between w-full h-full py-6">
                                        
                                        {/* Back Text / Eli5 text */}
                                        <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
                                            <p className="text-xl font-sans font-bold text-center italic text-[var(--blue)] leading-relaxed">
                                                {eli5Text[currentCardIndex] || currentCard.back}
                                            </p>
                                        </div>

                                        {/* Actions footer */}
                                        <div className="flex flex-col items-center gap-4 mt-6" onClick={(e) => e.stopPropagation()}>
                                            {!eli5Text[currentCardIndex] && (
                                                <button 
                                                    onClick={(e) => handleEli5(e, currentCard.back, currentCardIndex)} 
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] border border-[var(--blue-border)] text-[10px] font-black uppercase tracking-wider hover:bg-[var(--blue-active)] transition-all cursor-pointer"
                                                >
                                                    <Baby size={14} />
                                                    {isGeneratingEli5 ? "Simplifying..." : "ELI5"}
                                                </button>
                                            )}
                                            
                                            {/* Tap / Space indicator */}
                                            <span className="text-[9px] font-black uppercase tracking-[0.25em] opacity-30">
                                                Press [Space] to see Front
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Grading Action Buttons / Keyboard key indicators */}
                <div className="mt-12 w-full max-w-sm flex flex-col gap-6">
                    {cardState === 'FLIPPED' ? (
                        <div className="flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                            {/* Don't Know button */}
                            <button 
                                onClick={() => handleEvaluate(false)}
                                className="flex-1 h-14 rounded-2xl border border-[var(--crimson-border)] bg-[var(--crimson-dim)]/20 text-[var(--crimson)] hover:bg-[var(--crimson-dim)]/40 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                            >
                                <X size={16} strokeWidth={2.5} />
                                <span>Don't Know (J)</span>
                            </button>
                            
                            {/* Got It button */}
                            <button 
                                onClick={() => handleEvaluate(true)}
                                className="flex-1 h-14 rounded-2xl border border-[var(--emerald-border)] bg-[var(--emerald-dim)]/20 text-[var(--emerald)] hover:bg-[var(--emerald-dim)]/40 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                            >
                                <Check size={16} strokeWidth={2.5} />
                                <span>Got It (K)</span>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleFlip} 
                            className="w-full h-14 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                        >
                            <HelpCircle size={16} />
                            <span>Reveal Answer</span>
                        </button>
                    )}

                    {/* Keyboard Shortcuts Overlay Row */}
                    <div className="flex items-center justify-center gap-5 text-[9px] text-[var(--foreground-muted)]/50 font-mono">
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">Space</kbd> Flip
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">Esc</kbd> Exit
                        </span>
                    </div>
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
                extraStat={{ label: "Cards Mastered", value: String(masteredSet.size), icon: "style" }}
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
