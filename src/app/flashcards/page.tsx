"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Flashcard {
    id?: string;
    front: string;
    back: string;
}

// Demo flashcards - fallback when no generated content
const demoFlashcards: Flashcard[] = [
    { id: "1", front: "What is the mitochondria?", back: "The powerhouse of the cell - it generates most of the cell's ATP energy." },
    { id: "2", front: "Define photosynthesis", back: "The process by which plants convert light energy into chemical energy (glucose)." },
    { id: "3", front: "What is the Krebs cycle?", back: "A series of chemical reactions that releases stored energy in cells." },
];

function FlashcardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [flashcards, setFlashcards] = useState<Flashcard[]>(demoFlashcards);
    const [title, setTitle] = useState<string>("Flashcards");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCount, setKnownCount] = useState(0);
    const [learningCount, setLearningCount] = useState(0);

    // Load generated content from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("generatedContent");
            if (stored) {
                const content = JSON.parse(stored);
                if (content.type === "flashcards" && content.data) {
                    setFlashcards(content.data);
                    setTitle(content.title || "Flashcards");
                    sessionStorage.removeItem("generatedContent"); // Clear after loading
                }
            }
        } catch (e) {
            console.error("Error loading flashcards:", e);
        }
    }, []);

    const currentCard = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleKnow = () => {
        setKnownCount(prev => prev + 1);
        nextCard();
    };

    const handleLearning = () => {
        setLearningCount(prev => prev + 1);
        nextCard();
    };

    const nextCard = () => {
        setIsFlipped(false);
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const isComplete = currentIndex === flashcards.length - 1 && (knownCount + learningCount === flashcards.length);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)]">Flashcards</h1>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">{flashcards.length} cards</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                        </span>
                    </button>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-[var(--border)]">
                <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-6 py-12">
                {isComplete ? (
                    /* Complete State */
                    <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-[var(--success)] text-4xl">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Session Complete!</h2>
                        <p className="text-[var(--foreground-secondary)] mb-8">Great work reviewing these cards.</p>

                        <div className="flex justify-center gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[var(--success)]">{knownCount}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Known</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[var(--warning)]">{learningCount}</div>
                                <div className="text-xs text-[var(--foreground-muted)]">Learning</div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => { setCurrentIndex(0); setIsFlipped(false); setKnownCount(0); setLearningCount(0); }}
                                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all"
                            >
                                Study Again
                            </button>
                            <Link href="/history" className="px-6 py-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-all">
                                Back to Library
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Card Counter */}
                        <div className="text-center mb-6">
                            <span className="text-sm text-[var(--foreground-muted)]">{currentIndex + 1} of {flashcards.length}</span>
                        </div>

                        {/* Flashcard */}
                        <div
                            onClick={handleFlip}
                            className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
                        >
                            <div className={`absolute inset-0 rounded-3xl card p-8 flex items-center justify-center text-center transition-all duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                {/* Front */}
                                <div className={`absolute inset-0 rounded-3xl p-8 flex items-center justify-center backface-hidden ${isFlipped ? 'invisible' : ''}`}>
                                    <p className="text-xl font-medium text-[var(--foreground)]">{currentCard.front}</p>
                                </div>
                                {/* Back */}
                                <div className={`absolute inset-0 rounded-3xl bg-[var(--accent)]/10 p-8 flex items-center justify-center backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
                                    <p className="text-lg text-[var(--foreground-secondary)]">{currentCard.back}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tap to flip hint */}
                        {!isFlipped && (
                            <p className="text-center text-sm text-[var(--foreground-muted)] mt-4">Tap to flip</p>
                        )}

                        {/* Action Buttons */}
                        {isFlipped && (
                            <div className="flex gap-4 justify-center mt-8">
                                <button
                                    onClick={handleLearning}
                                    className="flex-1 py-4 rounded-2xl bg-[var(--warning)]/10 text-[var(--warning)] font-medium hover:bg-[var(--warning)]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">school</span>
                                    Still Learning
                                </button>
                                <button
                                    onClick={handleKnow}
                                    className="flex-1 py-4 rounded-2xl bg-[var(--success)]/10 text-[var(--success)] font-medium hover:bg-[var(--success)]/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">check</span>
                                    Know It
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default function FlashcardsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen bg-[var(--background)] items-center justify-center">Loading...</div>}>
            <FlashcardContent />
        </Suspense>
    );
}
