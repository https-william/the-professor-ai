"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
    Zap, Share2, CheckCircle2, XCircle, Clock, ChevronRight, AlertCircle, Download,
    Flag, RotateCcw, Lightbulb, Star, Sparkles, Loader2, ArrowLeft, ArrowRight, Menu, X, GraduationCap
} from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";
import { downloadQuizOffline } from "@/lib/offline-download";
import { useUser } from "@/context/UserContext";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";
import { getVerdict } from "@/lib/design-tokens";

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    analogy?: string;
}

export const InteractiveQuiz = ({ 
    questions: originalQuestions = [
        {
            question: "Why does a figure skater spin faster when they pull their arms in?",
            options: ["A: Linear Velocity", "B: Angular Momentum", "C: Centripetal Acceleration", "D: Inertial Framing"],
            correctIndex: 1,
            analogy: "Think of it like a garden hose. If you narrow the opening, the water must rush out faster.",
            explanation: "Conservation of angular momentum means spinning radius and speed are inversely linked."
        }
    ],
    title = "Quiz",
    onFinish
}: { 
    questions?: Question[];
    title?: string;
    onFinish?: (stats: { score: number; correct: number; time: string; total: number }) => void;
}) => {
    const router = useRouter();
    const { user } = useUser();
    const { addToast } = useToasts();

    // Active questions array (allows filtering by missed questions)
    const [questions, setQuestions] = useState<Question[]>(originalQuestions);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [flags, setFlags] = useState<Set<number>>(new Set());
    const [showResults, setShowResults] = useState(false);
    const [startTime] = useState(Date.now());
    const [endTime, setEndTime] = useState<number | null>(null);

    // UI States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [tutorAnalogy, setTutorAnalogy] = useState<Record<number, string>>({});
    const [isLoadingTutor, setIsLoadingTutor] = useState<Record<number, boolean>>({});
    const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());
    const [isSubmittingFlashcard, setIsSubmittingFlashcard] = useState<Record<number, boolean>>({});
    const [comboStreak, setComboStreak] = useState(0);

    const isGuest = !user?.id || !user?.isAuthenticated;
    const [originalQuestionsCache, setOriginalQuestionsCache] = useState<string>("");

    // Sync questions and reset states when originalQuestions changes
    useEffect(() => {
        const questionsString = JSON.stringify(originalQuestions);
        if (originalQuestions && originalQuestions.length > 0 && questionsString !== originalQuestionsCache) {
            setOriginalQuestionsCache(questionsString);
            setQuestions(originalQuestions);
            setAnswers({});
            setFlags(new Set());
            setCurrentIdx(0);
            setShowResults(false);
            setEndTime(null);
        }
    }, [originalQuestions, originalQuestionsCache]);

    // ── 1. LocalStorage Autosave State Recovery ──────────────────
    useEffect(() => {
        if (!title) return;
        const storageKey = `quiz_state_interactive_${title.replace(/\s+/g, "_")}`;
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.answers) setAnswers(parsed.answers);
                if (parsed.flags) setFlags(new Set(parsed.flags));
                if (parsed.currentIdx !== undefined) setCurrentIdx(parsed.currentIdx);
                if (parsed.showResults) setShowResults(parsed.showResults);
                if (parsed.questions) setQuestions(parsed.questions);
            } catch (e) {
                console.error("Failed to parse saved quiz state:", e);
            }
        }
    }, [title]);

    // Save state on updates
    useEffect(() => {
        if (!title || showResults) return;
        const storageKey = `quiz_state_interactive_${title.replace(/\s+/g, "_")}`;
        const stateToSave = {
            answers,
            flags: Array.from(flags),
            currentIdx,
            showResults,
            questions
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }, [answers, flags, currentIdx, showResults, questions, title]);

    const clearSavedState = () => {
        if (title) {
            const storageKey = `quiz_state_interactive_${title.replace(/\s+/g, "_")}`;
            localStorage.removeItem(storageKey);
        }
    };

    // ── 2. Keyboard Shortcuts Legend & Listener ───────────────
    useEffect(() => {
        if (showResults) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            
            // Choose Answer Options (A/B/C/D or 1/2/3/4)
            if (['A', '1'].includes(key)) handleSelect(0);
            else if (['B', '2'].includes(key)) handleSelect(1);
            else if (['C', '3'].includes(key)) handleSelect(2);
            else if (['D', '4'].includes(key)) handleSelect(3);
            
            // Arrow Navigation
            else if (e.key === 'ArrowRight') {
                if (currentIdx < questions.length - 1) {
                    setCurrentIdx(prev => prev + 1);
                }
            } else if (e.key === 'ArrowLeft') {
                if (currentIdx > 0) {
                    setCurrentIdx(prev => Math.max(0, prev - 1));
                }
            }
            
            // Submission Shortcut
            else if (e.key === 'Enter') {
                if (currentIdx === questions.length - 1) {
                    setEndTime(Date.now());
                    setShowResults(true);
                    clearSavedState();
                } else {
                    setCurrentIdx(prev => prev + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showResults, currentIdx, questions.length]);

    const currentQuestion = (questions && questions.length > 0) ? (questions[currentIdx] || questions[0]) : null;

    const handleSelect = (idx: number) => {
        if (answers[currentIdx] !== undefined) return;
        const isCorrect = idx === currentQuestion?.correctIndex;
        if (isCorrect) {
            setComboStreak(prev => {
                const next = prev + 1;
                if (next >= 2) {
                    addToast(`${next}x Combo Streak! 🔥 +${10 * (next - 1)} XP`, "success", undefined, undefined, false, undefined, true);
                }
                return next;
            });
        } else {
            setComboStreak(0);
        }
        setAnswers(prev => ({
            ...prev,
            [currentIdx]: idx
        }));
        addToast("Answer registered!", "success", undefined, undefined, false, undefined, true);
    };

    const handleNext = () => {
        if (currentIdx === questions.length - 1) {
            setEndTime(Date.now());
            setShowResults(true);
            clearSavedState();
        } else {
            setCurrentIdx(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(prev => prev - 1);
        }
    };

    const toggleFlag = () => {
        const isFlagged = flags.has(currentIdx);
        setFlags(prev => {
            const next = new Set(prev);
            if (isFlagged) {
                next.delete(currentIdx);
            } else {
                next.add(currentIdx);
            }
            return next;
        });
        addToast(
            isFlagged ? "Bookmark removed" : "Question bookmarked!",
            "info",
            undefined,
            undefined,
            false,
            undefined,
            true
        );
    };

    const timeString = useMemo(() => {
        const end = endTime || Date.now();
        const diff = Math.floor((end - startTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    }, [endTime, startTime]);

    const handleShareSection = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = typeof window !== 'undefined' ? window.location.href : '';
        navigator.clipboard.writeText(url);
        addToast("Quiz link copied to clipboard!", "success");
    };

    // ── 3. Ask the Professor Analogy API call ─────────────────────
    const askProfessorTutor = async (qIdx: number) => {
        if (isLoadingTutor[qIdx]) return;
        setIsLoadingTutor(prev => ({ ...prev, [qIdx]: true }));

        const targetQ = questions[qIdx];
        try {
            const res = await fetch('/api/quiz/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: targetQ.question,
                    options: targetQ.options,
                    correctIndex: targetQ.correctIndex,
                    explanation: targetQ.explanation,
                    userAnswerIndex: answers[qIdx]
                })
            });

            if (res.ok) {
                const data = await res.json();
                setTutorAnalogy(prev => ({ ...prev, [qIdx]: data.explanation }));
                addToast("The Professor explained it!", "success");
            } else if (res.status === 402) {
                addToast("Insufficient credits to use AI Tutor.", "error");
            } else if (res.status === 403) {
                addToast("Guest tutor limit reached. Sign up for full access!", "warn");
            } else {
                const err = await res.json();
                addToast(err.error || "Tutor call failed.", "error");
            }
        } catch (e) {
            console.error(e);
            addToast("Tutor sync error.", "error");
        } finally {
            setIsLoadingTutor(prev => ({ ...prev, [qIdx]: false }));
        }
    };

    // ── 4. Save to Flashcards API call ──────────────────────
    const saveToDecks = async (qIdx: number) => {
        if (isSubmittingFlashcard[qIdx]) return;
        setIsSubmittingFlashcard(prev => ({ ...prev, [qIdx]: true }));

        const targetQ = questions[qIdx];
        const correctText = targetQ.options[targetQ.correctIndex] || "";

        try {
            const res = await fetch('/api/quiz/save-flashcard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: targetQ.question,
                    answer: correctText,
                    explanation: targetQ.explanation
                })
            });

            if (res.ok) {
                setSavedQuestions(prev => {
                    const next = new Set(prev);
                    next.add(qIdx);
                    return next;
                });
                addToast("Saved to Quiz Missed Questions deck!", "success");
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to save card.", "error");
            }
        } catch (e) {
            addToast("Connection error.", "error");
        } finally {
            setIsSubmittingFlashcard(prev => ({ ...prev, [qIdx]: false }));
        }
    };

    // ── 5. Review Missed Questions Only Sprint ────────────────
    const handleRetryMissedOnly = () => {
        const missed = questions.filter((_, idx) => answers[idx] !== questions[idx].correctIndex);
        if (missed.length === 0) return;

        setQuestions(missed);
        setAnswers({});
        setFlags(new Set());
        setCurrentIdx(0);
        setShowResults(false);
        setEndTime(null);
        addToast(`Restarted with ${missed.length} missed questions!`, "info");
    };

    // Reset entire quiz
    const handleResetAll = () => {
        setQuestions(originalQuestions);
        setAnswers({});
        setFlags(new Set());
        setCurrentIdx(0);
        setShowResults(false);
        setEndTime(null);
        clearSavedState();
    };

    // ── 6. Render Results Verdict View ────────────────────────
    const renderResults = () => {
        const results = questions.map((q, idx) => ({
            question: q,
            selectedIdx: answers[idx],
            isCorrect: answers[idx] === q.correctIndex,
            wasAnswered: answers[idx] !== undefined,
        }));

        const totalCorrect = results.filter(r => r.isCorrect).length;
        const scorePercent = questions && questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-6 overflow-visible"
            >
                {/* Score stats header grid */}
                <div className="grid grid-cols-3 gap-3 shrink-0">
                    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center shadow-xs">
                        <div className="text-2xl font-black text-[#E5A93C]">{scorePercent}%</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-1">Accuracy</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl font-black text-[#2BB288]">{totalCorrect}</span>
                            <span className="text-xs text-[var(--foreground-muted)] font-bold">/ {questions.length}</span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-1">Correct</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-center shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                            <Clock size={14} className="text-[var(--foreground-muted)]" />
                            <span className="text-sm font-black text-[var(--foreground)]">{timeString}</span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-1">Time Spent</div>
                    </div>
                </div>

                {/* Professor verdict */}
                <div className="px-5 py-3 rounded-2xl bg-[#9673F5]/10 border border-[#9673F5]/20 shrink-0 flex items-center gap-3">
                    <Zap size={14} className="text-[#9673F5] shrink-0" />
                    <p className="text-xs font-serif italic text-[var(--foreground-secondary)] leading-relaxed">
                        &ldquo;{getVerdict(user?.firstName || "Scholar", scorePercent)}&rdquo;
                    </p>
                </div>

                {/* Guest Sign-up CTA Banner */}
                {isGuest && (
                    <div className="w-full p-5 rounded-2xl bg-gradient-to-r from-[#E5A93C]/10 to-[#9673F5]/10 border border-[var(--border)] relative overflow-hidden backdrop-blur-md shrink-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="font-black text-[10px] uppercase tracking-widest text-[#E5A93C] flex items-center gap-1.5">
                                    <Sparkles size={12} className="animate-pulse" />
                                    Lock in your progress
                                </h4>
                                <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                                    Sign up to log your study packs, earn rank points, and unlock full explanations.
                                </p>
                            </div>
                            <button 
                                onClick={() => router.push('/signup')}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-black uppercase text-[9px] tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                            >
                                Register Free <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Per-question breakdown sheet */}
                <div className="space-y-3 overflow-visible">
                    <div className="flex items-center justify-between px-1 shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Review Sheet</span>
                        {totalCorrect < questions.length && (
                            <button 
                                onClick={handleRetryMissedOnly}
                                className="text-[10px] font-black uppercase tracking-wider text-[#E5A93C] hover:underline"
                            >
                                Practice Incorrect ({questions.length - totalCorrect})
                            </button>
                        )}
                    </div>

                    <div className="w-full space-y-3 overflow-visible">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all backdrop-blur-md",
                                    r.isCorrect
                                        ? "bg-[#2BB288]/5 border-[#2BB288]/20"
                                        : r.wasAnswered
                                        ? "bg-[#E85D75]/5 border-[#E85D75]/20"
                                        : "bg-[#E5A93C]/5 border-[#E5A93C]/20"
                                )}
                            >
                                {/* Question heading row */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                            r.isCorrect ? "bg-[#2BB288]/20" : r.wasAnswered ? "bg-[#E85D75]/20" : "bg-[#E5A93C]/20"
                                        )}>
                                            {r.isCorrect ? (
                                                <CheckCircle2 size={14} className="text-[#2BB288]" />
                                            ) : r.wasAnswered ? (
                                                <XCircle size={14} className="text-[#E85D75]" />
                                            ) : (
                                                <AlertCircle size={14} className="text-[#E5A93C]" />
                                            )}
                                        </div>
                                        <p className="text-sm font-extrabold text-[var(--foreground)] leading-relaxed flex-1">
                                            {i + 1}. {r.question.question}
                                        </p>
                                    </div>

                                    {/* Star flashcard button for incorrect questions */}
                                    {!isGuest && !r.isCorrect && (
                                        <button
                                            onClick={() => saveToDecks(i)}
                                            disabled={savedQuestions.has(i) || isSubmittingFlashcard[i]}
                                            className={`p-2 rounded-xl border transition-all ${
                                                savedQuestions.has(i)
                                                    ? 'bg-[#E5A93C]/10 border-[#E5A93C]/20 text-[#E5A93C]'
                                                    : 'bg-[var(--background-secondary)] border-[var(--border-2)] text-[var(--foreground-muted)]/75 hover:bg-[var(--background-secondary)]/80'
                                            }`}
                                            title="Save to Flashcards"
                                        >
                                            {isSubmittingFlashcard[i] ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Star size={12} className={savedQuestions.has(i) ? "fill-[#E5A93C]" : ""} />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Options grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                                    {r.question.options.map((opt, optIdx) => {
                                        const isCorrectOpt = optIdx === r.question.correctIndex;
                                        const isSelectedOpt = optIdx === r.selectedIdx;
                                        const isWrongSelected = isSelectedOpt && !isCorrectOpt;

                                        return (
                                            <div
                                                key={optIdx}
                                                className={cn(
                                                    "px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 border",
                                                    isCorrectOpt
                                                        ? "bg-[#2BB288]/10 border-[#2BB288]/30 text-[#2BB288]"
                                                        : isWrongSelected
                                                        ? "bg-[#E85D75]/10 border-[#E85D75]/30 text-[#E85D75]"
                                                        : "bg-transparent border-transparent text-[var(--foreground-muted)]"
                                                )}
                                            >
                                                <span className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border shrink-0",
                                                    isCorrectOpt ? "bg-[#2BB288]/20 border-[#2BB288]/30 text-[#2BB288]" :
                                                    isWrongSelected ? "bg-[#E85D75]/20 border-[#E85D75]/30 text-[#E85D75]" :
                                                    "bg-[var(--background-secondary)] border-[var(--border-2)] text-[var(--foreground-muted)]"
                                                )}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span className="truncate">{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Analogy / Explanation popup drawer */}
                                {(!r.isCorrect) && (
                                    <div className="mt-4 ml-9 space-y-3">
                                        <div className="p-4 rounded-xl bg-[#9673F5]/5 border border-[#9673F5]/10">
                                            <h5 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9673F5] mb-1">
                                                <Lightbulb size={12} /> Base Explanation
                                            </h5>
                                            <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{r.question.explanation}</p>
                                        </div>

                                        {/* Ask the Professor Analogy Integration */}
                                        {!tutorAnalogy[i] ? (
                                            <button
                                                onClick={() => askProfessorTutor(i)}
                                                disabled={isLoadingTutor[i]}
                                                className="py-2 px-4 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 text-[#E5A93C] text-[10px] font-bold uppercase tracking-wider hover:bg-[#E5A93C]/15 transition-all flex items-center gap-1.5"
                                            >
                                                {isLoadingTutor[i] ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Sparkles size={12} />
                                                )}
                                                Analogy explanation
                                            </button>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-[#E5A93C]/5 border border-[#E5A93C]/20 flex flex-col gap-1 relative shadow-inner">
                                                <h5 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E5A93C]">
                                                    <Sparkles size={10} /> Professor's Analogy
                                                </h5>
                                                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed font-serif italic">
                                                    &ldquo;{tutorAnalogy[i]}&rdquo;
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full shrink-0 mt-4">
                    <button
                        onClick={handleResetAll}
                        className="flex-1 py-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-xs font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--surface)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={16} /> Retake Quiz
                    </button>
                    <button 
                        onClick={() => onFinish?.({ 
                            score: scorePercent, 
                            correct: totalCorrect, 
                            time: timeString,
                            total: questions ? questions.length : 0
                        })}
                        className="flex-[2] py-4 rounded-2xl bg-white text-zinc-950 text-xs font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={16} /> Finalize Session
                    </button>
                </div>
            </motion.div>
        );
    };

    if (!originalQuestions || originalQuestions.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12 px-6 text-center select-none">
                <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} className="text-[var(--foreground-muted)] animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">No Questions Found</h3>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-8">
                        The Professor's desk is clean. It looks like this pack doesn't have any quiz questions ready yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-full p-2 flex flex-col items-center cursor-default overflow-visible bg-transparent">
            {showResults ? renderResults() : (
                <>
                    {/* Header bar */}
                    <div className="w-full flex items-center justify-between gap-4 mb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsDrawerOpen(prev => !prev)}
                                className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--foreground)] transition-colors"
                                title="Question Sheet"
                            >
                                <Menu size={16} />
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#9673F5]">
                                Interactive Quiz
                            </span>
                            {comboStreak >= 2 && (
                                <motion.span
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    key={comboStreak}
                                    className="px-2.5 py-1 rounded-full bg-[var(--amber)]/15 border border-[var(--amber)]/30 text-[var(--amber)] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(229,169,60,0.3)]"
                                >
                                    <span>🔥 {comboStreak}x Combo Streak!</span>
                                    <span className="text-[8px] bg-[var(--amber)] text-black px-1.5 py-0.2 rounded-full font-bold">+{10 * (comboStreak - 1)} XP</span>
                                </motion.span>
                            )}
                        </div>

                        {/* Top progress track */}
                        <div className="flex-1 max-w-sm hidden sm:block mx-4">
                            <ProgressNodeTrack
                                total={questions.length}
                                current={currentIdx}
                                completed={Object.keys(answers).map(Number)}
                                nodeSize={22}
                                completedColor="var(--emerald)"
                                activeColor="var(--amber)"
                                onNodeClick={(idx) => setCurrentIdx(idx)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleShareSection}
                                className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all active:scale-95"
                                title="Share Quiz"
                            >
                                <Share2 size={12} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadQuizOffline(title, questions);
                                }}
                                className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all active:scale-95"
                                title="Download Offline HTML"
                            >
                                <Download size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Progress track on mobile */}
                    <div className="block sm:hidden w-full mb-4 px-1">
                        <ProgressNodeTrack
                            total={questions.length}
                            current={currentIdx}
                            completed={Object.keys(answers).map(Number)}
                            nodeSize={20}
                            completedColor="var(--emerald)"
                            activeColor="var(--amber)"
                            onNodeClick={(idx) => setCurrentIdx(idx)}
                        />
                    </div>

                    {/* Expandable Sidebar Drawer (Absolute layout) */}
                    <AnimatePresence>
                        {isDrawerOpen && (
                            <motion.div 
                                initial={{ x: -280, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -280, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="absolute left-0 top-0 bottom-0 z-30 w-72 bg-[var(--card)] border-r border-[var(--border)] flex flex-col p-6 shadow-2xl overflow-y-auto rounded-3xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#9673F5]">Question Grid</h3>
                                    <button onClick={() => setIsDrawerOpen(false)} className="p-1 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {questions.map((_, idx) => {
                                        const isAnswered = answers[idx] !== undefined;
                                        const isFlagged = flags.has(idx);
                                        const isActive = currentIdx === idx;

                                        let cardStyles = "aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-black transition-all ";
                                        if (isActive) cardStyles += "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]";
                                        else if (isFlagged) cardStyles += "border-[#9673F5]/40 bg-[#9673F5]/10 text-[#9673F5]";
                                        else if (isAnswered) cardStyles += "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]";
                                        else cardStyles += "border-[var(--border)] bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--surface)]";

                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => { setCurrentIdx(idx); setIsDrawerOpen(false); }}
                                                className={cardStyles}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Split Layout viewport */}
                    <div className="w-full flex-1 flex flex-col md:grid md:grid-cols-12 gap-6 items-stretch overflow-visible">
                        
                        {/* Question Content (Left) */}
                        <div className="md:col-span-6 flex flex-col justify-between p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-md">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#9673F5]/10 text-[#9673F5] text-[8px] font-black uppercase tracking-widest border border-[#9673F5]/20">
                                        Question {currentIdx + 1} of {questions.length}
                                    </span>
                                    <button 
                                        onClick={toggleFlag}
                                        className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${flags.has(currentIdx) ? 'text-[#9673F5]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}
                                    >
                                        <Flag size={12} className={flags.has(currentIdx) ? "fill-[#9673F5]" : ""} />
                                        {flags.has(currentIdx) ? 'Flagged' : 'Flag'}
                                    </button>
                                </div>
                                <h4 className="text-base md:text-lg font-black leading-relaxed text-[var(--foreground)]">
                                    {currentQuestion?.question}
                                </h4>
                            </div>

                            {/* Keyboard tips */}
                            <div className="hidden md:flex flex-wrap gap-1.5 items-center text-[9px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider mt-6 pt-4 border-t border-[var(--border)]">
                                <span>Press:</span>
                                <span className="bg-[var(--surface)] px-1 py-0.5 rounded text-[var(--foreground-muted)]">A-D</span>
                                <span>or</span>
                                <span className="bg-[var(--surface)] px-1 py-0.5 rounded text-[var(--foreground-muted)]">1-4</span>
                                <span>to answer.</span>
                            </div>
                        </div>

                        {/* Options Choices (Right) */}
                        <div className="md:col-span-6 flex flex-col gap-3 justify-center">
                            {currentQuestion?.options?.map((opt, i) => {
                                const hasAnswered = answers[currentIdx] !== undefined;
                                const isCorrectOpt = i === currentQuestion?.correctIndex;
                                const isSelected = answers[currentIdx] === i;
                                
                                let btnStyle = "w-full py-2.5 px-4 text-left text-sm font-medium transition-all duration-150 rounded-xl relative overflow-hidden flex items-center justify-between border ";
                                let circleStyle = "w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] font-bold transition-colors shrink-0 ";

                                if (hasAnswered) {
                                    if (isCorrectOpt) {
                                        btnStyle += "bg-[#2BB288]/15 border-[#2BB288] text-[var(--foreground)] shadow-[0_0_20px_rgba(43,178,136,0.25)] translate-y-[1px]";
                                        circleStyle += "bg-[#2BB288] text-black border-[#2BB288] font-black";
                                    } else if (isSelected && !isCorrectOpt) {
                                        btnStyle += "bg-[#E85D75]/15 border-[#E85D75] text-[var(--foreground)] shadow-[0_0_15px_rgba(232,93,117,0.2)] translate-y-[1px]";
                                        circleStyle += "bg-[#E85D75] text-white border-[#E85D75] font-black";
                                    } else {
                                        btnStyle += "bg-[var(--card)] border-[var(--border)] text-[var(--foreground-muted)] opacity-60";
                                        circleStyle += "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)]";
                                    }
                                } else if (isSelected) {
                                    btnStyle += "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--foreground)] shadow-[0_4px_0_rgba(74,124,245,0.15)] translate-y-[1px]";
                                    circleStyle += "bg-[var(--accent)] text-white border-[var(--accent)] font-black";
                                } else {
                                    btnStyle += "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-secondary)] shadow-sm hover:translate-y-[1px] active:translate-y-[3px] active:shadow-none";
                                    circleStyle += "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)]";
                                }

                                return (
                                    <button 
                                        key={i}
                                        onClick={() => handleSelect(i)}
                                        className={btnStyle}
                                        disabled={hasAnswered}
                                    >
                                        <div className="flex items-center gap-3.5 flex-1">
                                            <div className={circleStyle}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className="font-extrabold text-[var(--foreground)]">{opt}</span>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Inline Metacognitive Explanation & Analogy */}
                            {answers[currentIdx] !== undefined && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={cn(
                                        "mt-2 p-4 rounded-2xl border backdrop-blur-md flex flex-col gap-3",
                                        answers[currentIdx] === currentQuestion?.correctIndex
                                            ? "bg-[#2BB288]/10 border-[#2BB288]/30 text-[var(--foreground)]"
                                            : "bg-[#E85D75]/10 border-[#E85D75]/30 text-[var(--foreground)]"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {answers[currentIdx] === currentQuestion?.correctIndex ? (
                                                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#2BB288]">
                                                    <CheckCircle2 size={15} /> Spot on!
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#E85D75]">
                                                    <XCircle size={15} /> Not quite — Correct answer is {String.fromCharCode(65 + (currentQuestion?.correctIndex || 0))}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {currentQuestion?.explanation && (
                                        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed font-sans">
                                            {currentQuestion.explanation}
                                        </p>
                                    )}

                                    {currentQuestion?.analogy && (
                                        <div className="p-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-start gap-2">
                                            <Lightbulb size={14} className="text-[#E5A93C] shrink-0 mt-0.5" />
                                            <p className="text-xs font-serif italic text-[var(--foreground-secondary)] leading-relaxed">
                                                &ldquo;{currentQuestion.analogy}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {tutorAnalogy[currentIdx] && (
                                        <div className="p-3 rounded-xl bg-[#9673F5]/15 border border-[#9673F5]/30 flex flex-col gap-1.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#9673F5] flex items-center gap-1">
                                                <GraduationCap size={12} /> The Professor&apos;s Breakdown
                                            </span>
                                            <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed font-sans">
                                                {tutorAnalogy[currentIdx]}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Navigation bar */}
                    <div className="w-full flex items-center justify-between gap-3 mt-6 pt-4 border-t border-[var(--border)] shrink-0">
                        <button 
                            onClick={handlePrev} 
                            disabled={currentIdx === 0}
                            className="px-5 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center gap-1.5 disabled:opacity-20 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
                        >
                            <ArrowLeft size={14} /> Prev
                        </button>

                        <button 
                            onClick={handleNext} 
                            className={cn(
                                "px-6 py-3 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                currentIdx === questions.length - 1 
                                    ? "bg-[#9673F5] text-white shadow-lg shadow-[#9673F5]/20 hover:bg-[#8663E5]" 
                                    : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                            )}
                        >
                            {currentIdx === questions.length - 1 ? "Finish" : "Next"}
                            {currentIdx === questions.length - 1 ? (
                                <CheckCircle2 size={14} />
                            ) : (
                                <ArrowRight size={14} />
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
