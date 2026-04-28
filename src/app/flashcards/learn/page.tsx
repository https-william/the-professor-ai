"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence } from "framer-motion";
import DataDustLoader from "@/components/ui/DataDustLoader";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LEVENSHTEIN DISTANCE (fuzzy matching)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return dp[m][n];
}

function getSimilarity(input: string, answer: string): number {
    const a = input.toLowerCase().trim();
    const b = answer.toLowerCase().trim();
    if (a === b) return 1;
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    return 1 - levenshtein(a, b) / maxLen;
}

type AnswerResult = "correct" | "close" | "wrong" | null;

interface LearnCard {
    front: string;
    back: string;
}

export default function LearnModePage() {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const inputRef = useRef<HTMLInputElement>(null);

    const [cards, setCards] = useState<LearnCard[]>([]);
    const [title, setTitle] = useState("Learn Mode");
    const [loading, setLoading] = useState(true);

    // Progress
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [result, setResult] = useState<AnswerResult>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Stats
    const [correctCount, setCorrectCount] = useState(0);
    const [closeCount, setCloseCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);

    // Celebration
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Load cards
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("learnModeCards");
            if (!stored) { router.push("/library"); return; }

            const data = JSON.parse(stored);
            const loadedCards: LearnCard[] = data.cards || [];
            if (loadedCards.length === 0) { router.push("/library"); return; }

            setCards(loadedCards);
            setTitle(data.title || "Learn Mode");
            setLoading(false);
        } catch {
            router.push("/library");
        }
    }, [router]);

    // Auto-focus input on card change
    useEffect(() => {
        if (!loading && !submitted && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [currentIndex, loading, submitted]);

    const handleSubmit = (overrideSimilarity?: number) => {
        if (!userAnswer.trim() || submitted) return;
        
        const similarity = overrideSimilarity ?? getSimilarity(userAnswer, cards[currentIndex].back);
        setSubmitted(true);

        if (similarity >= 0.85) {
            setResult("correct");
            setCorrectCount(prev => prev + 1);
            // Auto-advance on perfect match (>= 0.95 similarity)
            if (similarity >= 0.95) {
                setTimeout(() => {
                    handleNext();
                }, 600);
            }
        } else if (similarity >= 0.5) {
            setResult("close");
            setCloseCount(prev => prev + 1);
            setShowAnswer(true);
        } else {
            setResult("wrong");
            setWrongCount(prev => prev + 1);
            setShowAnswer(true);
        }
    };

    const handleOverride = () => {
        // "I was right" override
        if (result === "close" || result === "wrong") {
            if (result === "wrong") setWrongCount(prev => prev - 1);
            if (result === "close") setCloseCount(prev => prev - 1);
            setCorrectCount(prev => prev + 1);
            setResult("correct");
        }
    };

    const handleNext = async () => {
        if (currentIndex >= cards.length - 1) {
            // Done!
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
            setCurrentIndex(prev => prev + 1);
            setUserAnswer("");
            setResult(null);
            setShowAnswer(false);
            setSubmitted(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (!submitted) handleSubmit();
            else handleNext();
        }
    };

    const currentCard = cards[currentIndex];
    const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

    if (loading) {
        return <DataDustLoader label="Loading Session" phrases={["Preparing your cards...", "Setting up learn mode...", "Almost ready..."]} />;
    }

    const resultConfig = {
        correct: { color: "#10B981", icon: "check_circle", label: "Correct!", bg: "rgba(16,185,129,0.08)" },
        close: { color: "#F59E0B", icon: "nearby_error", label: "Almost!", bg: "rgba(245,158,11,0.08)" },
        wrong: { color: "#EF4444", icon: "cancel", label: "Not quite", bg: "rgba(239,68,68,0.08)" },
    };

    return (
        <div className="h-[100dvh] bg-[#06060B] overflow-hidden relative flex flex-col">


            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/5 shrink-0">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-r-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-sm text-white/50">close</span>
                    </button>
                    <div>
                        <h1 className="text-[13px] font-bold text-white/90">Learn Mode</h1>
                        <p className="text-[9px] text-[#10B981]/60 font-bold uppercase tracking-wider truncate max-w-[180px]">{title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white/40">{currentIndex + 1} / {cards.length}</span>
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        className="w-full max-w-lg"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Question Card */}
                        <div className="rounded-[32px] p-8 mb-6 text-center"
                            style={{
                                background: "rgba(255,255,255,0.025)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)",
                            }}
                        >
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">What is the answer?</p>
                            <p className="text-2xl md:text-3xl font-bold text-white/90 leading-tight">
                                {currentCard?.front}
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="relative mb-4">
                            <input
                                ref={inputRef}
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={submitted}
                                placeholder="Type your answer..."
                                className="w-full px-6 py-5 rounded-2xl text-[15px] font-medium placeholder:text-white/15 disabled:opacity-60 transition-all outline-none"
                                style={{
                                    background: submitted && result
                                        ? resultConfig[result].bg
                                        : "rgba(255,255,255,0.03)",
                                    border: `1.5px solid ${
                                        submitted && result
                                            ? `${resultConfig[result].color}40`
                                            : "rgba(255,255,255,0.08)"
                                    }`,
                                    color: submitted && result ? resultConfig[result].color : "white",
                                }}
                            />
                            {!submitted && (
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={!userAnswer.trim()}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-20"
                                    style={{
                                        background: userAnswer.trim() ? "rgba(16,185,129,0.15)" : "transparent",
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[#10B981]">send</span>
                                </button>
                            )}
                        </div>

                        {/* Result Feedback */}
                        <AnimatePresence>
                            {submitted && result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    {/* Status */}
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg" style={{ color: resultConfig[result].color }}>
                                            {resultConfig[result].icon}
                                        </span>
                                        <span className="text-sm font-bold" style={{ color: resultConfig[result].color }}>
                                            {resultConfig[result].label}
                                        </span>
                                    </div>

                                    {/* Show correct answer on miss */}
                                    {showAnswer && (
                                        <div className="rounded-2xl px-5 py-4 text-center"
                                            style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
                                            <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-1">Correct Answer</p>
                                            <p className="text-[15px] font-bold text-[#10B981]/90">{currentCard?.back}</p>
                                        </div>
                                    )}

                                    {/* Override + Continue */}
                                    <div className="flex items-center gap-3 pt-2">
                                        {(result === "close" || result === "wrong") && (
                                            <button
                                                onClick={handleOverride}
                                                className="flex-1 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider text-white/30 hover:text-white/50 transition-colors"
                                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                                            >
                                                I was right
                                            </button>
                                        )}
                                        <button
                                            onClick={handleNext}
                                            className="flex-1 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                                            style={{
                                                background: `linear-gradient(135deg, ${resultConfig[result].color}, ${resultConfig[result].color}CC)`,
                                                color: "#06060B",
                                                boxShadow: `0 4px 16px ${resultConfig[result].color}25`,
                                            }}
                                        >
                                            {currentIndex >= cards.length - 1 ? "Finish" : "Continue"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Stats */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-center gap-6 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#10B981]/60">check_circle</span>
                    <span className="text-[11px] font-bold text-[#10B981]/60">{correctCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#F59E0B]/60">nearby_error</span>
                    <span className="text-[11px] font-bold text-[#F59E0B]/60">{closeCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#EF4444]/60">cancel</span>
                    <span className="text-[11px] font-bold text-[#EF4444]/60">{wrongCount}</span>
                </div>
            </div>

            <SessionComplete
                isVisible={sessionComplete}
                onDismiss={() => {
                    setSessionComplete(false);
                    router.back();
                }}
                xpEarned={sessionStats.xp}
                streak={sessionStats.streak}
                streakIncremented={sessionStats.incremented}
                type="flashcards"
                title={`Learn: ${title}`}
                extraStat={{
                    label: "Accuracy",
                    value: `${cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0}%`,
                    icon: "target",
                }}
                continueHref="/library"
            />
        </div>
    );
}

