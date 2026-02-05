"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

interface Question {
    id?: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

// Demo questions - fallback when no generated content  
const demoQuestions: Question[] = [
    {
        id: "1",
        question: "What is the primary function of the mitochondria?",
        options: ["Protein synthesis", "Energy production (ATP)", "Cell division", "Waste removal"],
        correctIndex: 1,
        explanation: "Mitochondria are the 'powerhouse' of the cell, producing ATP through cellular respiration."
    },
    {
        id: "2",
        question: "Which process converts light energy to chemical energy?",
        options: ["Respiration", "Fermentation", "Photosynthesis", "Glycolysis"],
        correctIndex: 2,
        explanation: "Photosynthesis occurs in chloroplasts and converts sunlight into glucose."
    },
    {
        id: "3",
        question: "DNA replication occurs during which phase?",
        options: ["G1 phase", "S phase", "G2 phase", "M phase"],
        correctIndex: 1,
        explanation: "The S (Synthesis) phase is when DNA replication occurs in the cell cycle."
    },
];

function QuizContent() {
    const router = useRouter();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [questions, setQuestions] = useState<Question[]>(demoQuestions);
    const [title, setTitle] = useState<string>("Quiz");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<boolean[]>([]);

    // Load generated content from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("generatedContent");
            if (stored) {
                const content = JSON.parse(stored);
                if (content.type === "quiz" && content.data) {
                    setQuestions(content.data);
                    setTitle(content.title || "Quiz");
                    sessionStorage.removeItem("generatedContent"); // Clear after loading
                }
            }
        } catch (e) {
            console.error("Error loading quiz:", e);
        }
    }, []);

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isComplete = currentIndex === questions.length - 1 && hasSubmitted;

    const handleSelectAnswer = (index: number) => {
        if (!hasSubmitted) {
            setSelectedAnswer(index);
        }
    };

    const handleSubmit = () => {
        if (selectedAnswer === null) return;

        const isCorrect = selectedAnswer === currentQuestion.correctIndex;
        if (isCorrect) setScore(prev => prev + 1);
        setAnswers(prev => [...prev, isCorrect]);
        setHasSubmitted(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setHasSubmitted(false);
        }
    };

    const getOptionClass = (index: number) => {
        if (!hasSubmitted) {
            return selectedAnswer === index
                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] hover:border-[var(--foreground-muted)]";
        }
        if (index === currentQuestion.correctIndex) {
            return "border-[var(--success)] bg-[var(--success)]/10";
        }
        if (index === selectedAnswer && selectedAnswer !== currentQuestion.correctIndex) {
            return "border-[var(--error)] bg-[var(--error)]/10";
        }
        return "border-[var(--border)] opacity-50";
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)]">Quiz Mode</h1>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">{questions.length} questions</p>
                    </div>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                >
                    <span className="material-symbols-outlined text-xl">
                        {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                    </span>
                </button>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-[var(--border)]">
                <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Main Content */}
            <main className="max-w-xl mx-auto px-6 py-8">
                {isComplete ? (
                    /* Complete State */
                    <div className="text-center py-12">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${score >= questions.length * 0.7 ? 'bg-[var(--success)]/20' : 'bg-[var(--warning)]/20'}`}>
                            <span className={`material-symbols-outlined text-4xl ${score >= questions.length * 0.7 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                                {score >= questions.length * 0.7 ? 'emoji_events' : 'school'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Quiz Complete!</h2>
                        <p className="text-[var(--foreground-secondary)] mb-8">
                            You scored {score} out of {questions.length}
                        </p>

                        <div className="text-5xl font-bold text-[var(--accent)] mb-8">
                            {Math.round((score / questions.length) * 100)}%
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => { setCurrentIndex(0); setSelectedAnswer(null); setHasSubmitted(false); setScore(0); setAnswers([]); }}
                                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all"
                            >
                                Try Again
                            </button>
                            <Link href="/history" className="px-6 py-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-all">
                                Back to Library
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Question Counter */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm text-[var(--foreground-muted)]">Question {currentIndex + 1} of {questions.length}</span>
                            <span className="text-sm font-medium text-[var(--accent)]">{score} correct</span>
                        </div>

                        {/* Question */}
                        <div className="p-6 rounded-2xl card mb-6">
                            <p className="text-lg font-medium text-[var(--foreground)]">{currentQuestion.question}</p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectAnswer(index)}
                                    disabled={hasSubmitted}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getOptionClass(index)}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${hasSubmitted && index === currentQuestion.correctIndex ? 'border-[var(--success)] text-[var(--success)]' :
                                            hasSubmitted && index === selectedAnswer ? 'border-[var(--error)] text-[var(--error)]' :
                                                selectedAnswer === index ? 'border-[var(--accent)] text-[var(--accent)]' :
                                                    'border-[var(--border)] text-[var(--foreground-muted)]'
                                            }`}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className="text-[var(--foreground)]">{option}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Explanation */}
                        {hasSubmitted && (
                            <div className={`p-4 rounded-xl mb-6 ${selectedAnswer === currentQuestion.correctIndex ? 'bg-[var(--success)]/10' : 'bg-[var(--error)]/10'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`material-symbols-outlined ${selectedAnswer === currentQuestion.correctIndex ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                                        {selectedAnswer === currentQuestion.correctIndex ? 'check_circle' : 'cancel'}
                                    </span>
                                    <span className={`font-medium ${selectedAnswer === currentQuestion.correctIndex ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                                        {selectedAnswer === currentQuestion.correctIndex ? 'Correct!' : 'Incorrect'}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--foreground-secondary)]">{currentQuestion.explanation}</p>
                            </div>
                        )}

                        {/* Action Button */}
                        {!hasSubmitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={selectedAnswer === null}
                                className={`w-full py-4 rounded-xl font-medium transition-all ${selectedAnswer !== null
                                    ? 'bg-[var(--accent)] text-white hover:opacity-90'
                                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                                    }`}
                            >
                                Check Answer
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all"
                            >
                                {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
                            </button>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default function QuizPage() {
    return (
        <Suspense fallback={<div className="flex h-screen bg-[var(--background)] items-center justify-center">Loading...</div>}>
            <QuizContent />
        </Suspense>
    );
}
