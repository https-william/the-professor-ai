
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

const emptyFlashcards: Flashcard[] = [
    { id: "0", front: "No flashcards found", back: "Go to the Create page to generate some study materials!" }
];

function FlashcardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [flashcards, setFlashcards] = useState<Flashcard[]>(emptyFlashcards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [title, setTitle] = useState("Flashcards");
    const [dragActive, setDragActive] = useState(false); // For future drag interactions

    // Load generated content from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("generatedContent");
            if (stored) {
                const content = JSON.parse(stored);
                if ((content.type === "flashcards" || content.flashcards) && content.data) {
                    setFlashcards(content.data);
                    setTitle(content.title || "Flashcards");
                    // Data persistence handled by creating page now
                } else if (content.flashcards) {
                    // Handle direct flashcard array if legacy format
                    setFlashcards(content.flashcards);
                    setTitle(content.title || "Flashcards");
                }
            }
        } catch (e) {
            console.error("Error loading flashcards:", e);
        }
    }, []);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 300);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 300);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleknow = () => {
        // Todo: track progress
        handleNext();
    };

    const handleLearning = () => {
        // Todo: track progress
        handleNext();
    };

    const currentCard = flashcards[currentIndex];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <Link href="/create" className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-base font-medium text-[var(--foreground)]">{title}</h1>
                        <p className="text-xs text-[var(--foreground-secondary)]">{currentIndex + 1} / {flashcards.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-xl">{resolvedTheme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-[var(--background-tertiary)] rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                    />
                </div>

                {/* Card Container */}
                <div className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group" onClick={handleFlip}>
                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                        {/* Front */}
                        <div className="absolute inset-0 rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8 flex items-center justify-center backface-hidden shadow-xl shadow-[var(--accent)]/5 group-hover:shadow-[var(--accent)]/10 transition-all">
                            <p className="text-2xl font-medium text-center text-[var(--foreground)] leading-relaxed">{currentCard.front}</p>
                            <span className="absolute bottom-6 text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Question</span>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 rounded-3xl bg-[var(--card)] border border-[var(--accent)]/30 p-8 flex items-center justify-center backface-hidden rotate-y-180 shadow-xl shadow-[var(--accent)]/10">
                            <p className="text-xl text-center text-[var(--foreground)] leading-relaxed">{currentCard.back}</p>
                            <span className="absolute bottom-6 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">Answer</span>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-sm text-[var(--foreground-muted)] animate-pulse">Tap card to flip</p>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-12 w-full max-w-sm">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleLearning(); }}
                        className="flex-1 py-4 rounded-2xl bg-[var(--warning)]/10 text-[var(--warning)] font-bold hover:bg-[var(--warning)]/20 transition-all flex flex-col items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-2xl">school</span>
                        <span className="text-xs">Learning</span>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleknow(); }}
                        className="flex-1 py-4 rounded-2xl bg-[var(--success)]/10 text-[var(--success)] font-bold hover:bg-[var(--success)]/20 transition-all flex flex-col items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                        <span className="text-xs">I Know It</span>
                    </button>
                </div>

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
