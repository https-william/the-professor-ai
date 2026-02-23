"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import ShareCard from "@/components/ShareCard";

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

// Component encapsulation
function QuizContent() {
    const router = useRouter();

    // State
    const [questions, setQuestions] = useState<Question[]>(demoQuestions);
    const [title, setTitle] = useState<string>("Quiz");

    // Exam State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [flags, setFlags] = useState<Set<number>>(new Set());
    const [status, setStatus] = useState<'taking' | 'review'>('taking');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [professorRemark, setProfessorRemark] = useState<string>('');
    const [loadingRemark, setLoadingRemark] = useState(false);
    const [showMobilePalette, setShowMobilePalette] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { user } = useUser();

    // Timer (10 minutes default)
    const [timeLeft, setTimeLeft] = useState(10 * 60);

    // Load content
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("generatedContent");
            if (stored) {
                const content = JSON.parse(stored);
                if (content.type === "quiz" && content.data) {
                    setQuestions(content.data);
                    setTitle(content.title || "Quiz");
                    sessionStorage.removeItem("generatedContent");
                }
            }
        } catch (e) {
            console.error("Error loading quiz:", e);
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        if (status !== 'taking') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Actions
    const handleAnswer = (optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    };

    const toggleFlag = () => {
        setFlags(prev => {
            const newFlags = new Set(prev);
            if (newFlags.has(currentIndex)) newFlags.delete(currentIndex);
            else newFlags.add(currentIndex);
            return newFlags;
        });
    };

    const handleSubmit = () => {
        // Show confirmation modal
        setShowSubmitModal(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitModal(false);
        setIsSubmitting(true);

        // Calculate score first
        const finalScore = questions.reduce((acc, q, i) => {
            return acc + (answers[i] === q.correctIndex ? 1 : 0);
        }, 0);
        const percentage = Math.round((finalScore / questions.length) * 100);

        // Get AI Professor Remark
        setLoadingRemark(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Give a single witty, humorous 1-sentence remark for a student who scored ${percentage}% (${finalScore}/${questions.length}) on an exam. Be encouraging if they did well, gently teasing if mediocre, and constructively critical if poor. Keep it under 20 words.`,
                    context: '' // No context needed for this one-off remark
                })
            });
            const data = await res.json();
            setProfessorRemark(data.response || "Well, that happened. 📝");
        } catch (error) {
            console.error('Failed to get professor remark:', error);
            setProfessorRemark(percentage >= 70 ? "Not bad! 👍" : "Room for improvement. 📚");
        }
        setLoadingRemark(false);

        setStatus('review');
        setCurrentIndex(0);
        setIsSubmitting(false);
    };

    const calculateScore = () => {
        return questions.reduce((acc, q, i) => {
            return acc + (answers[i] === q.correctIndex ? 1 : 0);
        }, 0);
    };

    const currentQuestion = questions[currentIndex];
    const score = calculateScore();
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Derived State for UI
    const isAnswered = answers[currentIndex] !== undefined;
    const isFlagged = flags.has(currentIndex);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)]">{title}</h1>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">
                            {status === 'taking' ? 'Exam in progress' : 'Review Mode'}
                        </p>
                    </div>
                </div>

                {status === 'taking' && (
                    <div className={`px-4 py-2 rounded-lg font-mono text-sm font-medium ${timeLeft < 60 ? 'bg-[var(--error)]/10 text-[var(--error)] animate-pulse' : 'bg-[var(--background-tertiary)] text-[var(--foreground)]'}`}>
                        {formatTime(timeLeft)}
                    </div>
                )}

                {status === 'review' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsShareOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all text-xs font-bold"
                        >
                            <span className="material-symbols-outlined text-sm">share</span>
                            Share
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)] font-bold">
                            <span>{Math.round((score / questions.length) * 100)}%</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Grid */}
            <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* Left: Question Area */}
                <div className="space-y-6">
                    {/* Status Card (Review Mode Only) */}
                    {status === 'review' && currentIndex === 0 && (
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 border border-[var(--accent)]/20 mb-6">
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                {score === questions.length ? "Professor's Pet! 🎓" :
                                    score > questions.length * 0.7 ? "Solid B+ Energy. 👏" :
                                        "See me after class. 🍎"}
                            </h2>
                            <p className="text-[var(--foreground-secondary)] mb-3">
                                You scored {score}/{questions.length}. {score > questions.length * 0.7 ? "Review your answers below to hit 100% next time." : "Review the corrections carefully below."}
                            </p>
                            {/* AI Professor Remark */}
                            {loadingRemark ? (
                                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] italic">
                                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                    The Professor is thinking...
                                </div>
                            ) : professorRemark && (
                                <div className="mt-3 p-3 rounded-xl bg-[var(--background)]/50 border-l-4 border-[var(--accent)]">
                                    <p className="text-sm italic text-[var(--foreground-secondary)]">
                                        <span className="font-semibold text-[var(--accent)]">Professor's Remark:</span> {professorRemark}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Question Card */}
                    <div className="p-6 md:p-8 rounded-3xl card relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-sm font-medium text-[var(--foreground-muted)]">
                                Question {currentIndex + 1}
                            </span>
                            {status === 'taking' && (
                                <button
                                    onClick={toggleFlag}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isFlagged ? 'bg-[var(--warning)]/20 text-[var(--warning)]' : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                                >
                                    <span className={`material-symbols-outlined text-sm ${isFlagged ? 'fill-current' : ''}`}>flag</span>
                                    {isFlagged ? 'Flagged' : 'Flag'}
                                </button>
                            )}
                        </div>

                        <p className="text-lg md:text-xl font-medium text-[var(--foreground)] leading-relaxed mb-8">
                            {currentQuestion.question}
                        </p>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = answers[currentIndex] === idx;
                                const isCorrect = currentQuestion.correctIndex === idx;

                                let optionClass = "border-[var(--border)] hover:bg-[var(--background-tertiary)]";
                                if (status === 'review') {
                                    if (isCorrect) optionClass = "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
                                    else if (isSelected && !isCorrect) optionClass = "border-[var(--error)] bg-[var(--error)]/10 text-[var(--error)]";
                                    else if (!isSelected && !isCorrect) optionClass = "opacity-50";
                                } else {
                                    if (isSelected) optionClass = "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-[var(--accent)]";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => status === 'taking' && handleAnswer(idx)}
                                        disabled={status === 'review'}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 group ${optionClass}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                            ${status === 'review' && isCorrect ? 'border-[var(--success)] bg-[var(--success)] text-white' :
                                                status === 'review' && isSelected && !isCorrect ? 'border-[var(--error)] bg-[var(--error)] text-white' :
                                                    isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-white' :
                                                        'border-[var(--foreground-muted)] text-[var(--foreground-muted)] group-hover:border-[var(--foreground)] group-hover:text-[var(--foreground)]'
                                            }
                                        `}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`text-sm md:text-base ${status === 'review' && isCorrect ? 'font-medium' : ''}`}>
                                            {option}
                                        </span>
                                        {status === 'review' && isCorrect && (
                                            <span className="ml-auto material-symbols-outlined text-[var(--success)]">check_circle</span>
                                        )}
                                        {status === 'review' && isSelected && !isCorrect && (
                                            <span className="ml-auto material-symbols-outlined text-[var(--error)]">cancel</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation (Review Only) */}
                        {status === 'review' && (
                            <div className="mt-8 p-4 rounded-xl bg-[var(--background-tertiary)] border-l-4 border-[var(--accent)] animate-in fade-in slide-in-from-bottom-2">
                                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[var(--accent)] text-lg">lightbulb</span>
                                    Explanation
                                </h4>
                                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4">
                        <button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-6 py-3 rounded-xl font-medium text-[var(--foreground)] hover:bg-[var(--background-tertiary)] disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Previous
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            status === 'taking' ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-bold hover:shadow-lg hover:shadow-[var(--accent)]/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                                    <span className="material-symbols-outlined">check_circle</span>
                                </button>
                            ) : (
                                <Link
                                    href="/create"
                                    className="px-8 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold hover:opacity-90 transition-all"
                                >
                                    Done Reviewing
                                </Link>
                            )
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="px-6 py-3 rounded-xl font-medium text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors flex items-center gap-2"
                            >
                                Next
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Question Palette (Sidebar) */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 space-y-6">
                        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
                            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">grid_view</span>
                                Question Palette
                            </h3>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((_, idx) => {
                                    const isActive = currentIndex === idx;
                                    const isDone = answers[idx] !== undefined;
                                    const isFlag = flags.has(idx);

                                    let btnClass = "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]";
                                    if (status === 'review') {
                                        const isCorrect = answers[idx] === questions[idx].correctIndex;
                                        btnClass = isCorrect ? "bg-[var(--success)]/20 text-[var(--success)] ring-1 ring-[var(--success)]" : "bg-[var(--error)]/20 text-[var(--error)] ring-1 ring-[var(--error)]";
                                    } else {
                                        if (isActive) btnClass = "bg-[var(--accent)] text-white shadow-md scale-105";
                                        else if (isFlag) btnClass = "bg-[var(--warning)]/20 text-[var(--warning)] ring-1 ring-[var(--warning)]";
                                        else if (isDone) btnClass = "bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-[var(--accent)]/30";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`aspect-square rounded-lg text-xs font-bold transition-all ${btnClass}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {status === 'taking' && (
                                <div className="mt-6 space-y-2 text-xs text-[var(--foreground-muted)]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30"></span>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-[var(--warning)]/20 ring-1 ring-[var(--warning)]"></span>
                                        <span>Flagged</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-[var(--background-tertiary)]"></span>
                                        <span>Unanswered</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Palette FAB + Bottom Sheet */}
                <div className="lg:hidden">
                    {/* Floating Action Button */}
                    {status === 'taking' && (
                        <button
                            onClick={() => setShowMobilePalette(!showMobilePalette)}
                            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-2xl">{showMobilePalette ? 'close' : 'grid_view'}</span>
                        </button>
                    )}

                    {/* Bottom Sheet */}
                    {showMobilePalette && (
                        <div className="fixed inset-0 z-30" onClick={() => setShowMobilePalette(false)}>
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] rounded-t-3xl p-6 pb-8 max-h-[60vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />
                                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">grid_view</span>
                                    Question Palette
                                </h3>
                                <div className="grid grid-cols-6 gap-2">
                                    {questions.map((_, idx) => {
                                        const isActive = currentIndex === idx;
                                        const isDone = answers[idx] !== undefined;
                                        const isFlag = flags.has(idx);

                                        let btnClass = "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]";
                                        if (isActive) btnClass = "bg-[var(--accent)] text-white shadow-md scale-105";
                                        else if (isFlag) btnClass = "bg-[var(--warning)]/20 text-[var(--warning)] ring-1 ring-[var(--warning)]";
                                        else if (isDone) btnClass = "bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-[var(--accent)]/30";

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentIndex(idx);
                                                    setShowMobilePalette(false);
                                                }}
                                                className={`aspect-square rounded-xl text-xs font-bold transition-all ${btnClass}`}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-[10px] text-[var(--foreground-muted)]">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30"></span>
                                        Answered
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]/20 ring-1 ring-[var(--warning)]"></span>
                                        Flagged
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--background-tertiary)]"></span>
                                        Unanswered
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-4">Submit Exam?</h3>
                        <div className="space-y-3 mb-6 text-[var(--foreground-secondary)]">
                            <p className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[var(--accent)]">check_circle</span>
                                <span><strong>{Object.keys(answers).length}</strong> answered</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[var(--warning)]">flag</span>
                                <span><strong>{flags.size}</strong> flagged for review</span>
                            </p>
                            {Object.keys(answers).length < questions.length && (
                                <p className="flex items-center gap-2 text-[var(--error)]">
                                    <span className="material-symbols-outlined">error</span>
                                    <span><strong>{questions.length - Object.keys(answers).length}</strong> unattempted</span>
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-[var(--foreground-muted)] mb-6">
                            Once submitted, you can review your answers but cannot change them.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-3 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmit}
                                className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-bold hover:opacity-90 transition-all"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ShareCard
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                data={{
                    title: title,
                    count: `${score}/${questions.length}`,
                    type: "Quiz Score",
                    user: user.name
                }}
            />
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
