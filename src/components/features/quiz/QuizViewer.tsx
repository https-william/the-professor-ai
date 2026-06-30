"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ShareCard from "@/components/ShareCard";
import { useToasts } from "@/components/ui/GlobalToasts";
import SessionComplete from "@/components/features/SessionComplete";
import ProgressNodeTrack from "@/components/ui/ProgressNodeTrack";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Flag, Share2, GraduationCap, ClipboardList, 
    RotateCcw, Lightbulb, CheckCircle2, XCircle, FileText, Download, AlertCircle,
    Star, Sparkles, Clock, Loader2, ArrowRight, ArrowLeft, Menu, ChevronRight, HelpCircle
} from "lucide-react";
import { downloadQuizOffline } from "@/lib/offline-download";
import { getVerdict } from "@/lib/design-tokens";

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    analogy?: string;
}

interface QuizViewerProps {
    questions: Question[];
    title: string;
    generationId?: string | null;
    initialTimer?: number; // in seconds
}

export default function QuizViewer({ questions: originalQuestions, title, generationId, initialTimer = 600 }: QuizViewerProps) {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();

    // Active questions array (allows filtering by missed questions)
    const [questions, setQuestions] = useState<Question[]>(originalQuestions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [flags, setFlags] = useState<Set<number>>(new Set());
    const [status, setStatus] = useState<'taking' | 'verdict' | 'review'>('taking');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [professorRemark, setProfessorRemark] = useState<string>('');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialTimer);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });
    
    // UI states
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [tutorAnalogy, setTutorAnalogy] = useState<Record<number, string>>({});
    const [isLoadingTutor, setIsLoadingTutor] = useState<Record<number, boolean>>({});
    const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());
    const [isSubmittingFlashcard, setIsSubmittingFlashcard] = useState<Record<number, boolean>>({});

    const isGuest = !user?.id || !user?.isAuthenticated;

    // ── 1. LocalStorage Autosave State Recovery ──────────────────
    useEffect(() => {
        if (!generationId || generationId === "placeholder") return;
        const savedState = localStorage.getItem(`quiz_state_${generationId}`);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.answers) setAnswers(parsed.answers);
                if (parsed.flags) setFlags(new Set(parsed.flags));
                if (parsed.currentIndex !== undefined) setCurrentIndex(parsed.currentIndex);
                if (parsed.timeLeft !== undefined && parsed.timeLeft > 0) setTimeLeft(parsed.timeLeft);
                if (parsed.status) setStatus(parsed.status);
                if (parsed.questions) setQuestions(parsed.questions);
            } catch (e) {
                console.error("Failed to parse saved quiz state:", e);
            }
        }
    }, [generationId]);

    // Save state on updates
    useEffect(() => {
        if (!generationId || generationId === "placeholder" || status !== "taking") return;
        const stateToSave = {
            answers,
            flags: Array.from(flags),
            currentIndex,
            timeLeft,
            status,
            questions
        };
        localStorage.setItem(`quiz_state_${generationId}`, JSON.stringify(stateToSave));
    }, [answers, flags, currentIndex, timeLeft, status, questions, generationId]);

    const clearSavedState = () => {
        if (generationId) {
            localStorage.removeItem(`quiz_state_${generationId}`);
        }
    };

    // ── 2. Timer Logic with Alert pulsing ──────────────────
    useEffect(() => {
        if (status !== 'taking' || !questions || questions.length === 0 || initialTimer === 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setTimeout(() => confirmSubmit(), 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status, questions.length, initialTimer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Timer warning states
    const isTimeUrgent = timeLeft < 60 && initialTimer > 0;
    const timePercentage = initialTimer > 0 ? (timeLeft / initialTimer) * 100 : 100;

    // ── 3. Keyboard Shortcuts Legend & Listener ───────────────
    useEffect(() => {
        if (status !== 'taking' || showSubmitModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            
            // Choose Answer Options (A/B/C/D or 1/2/3/4)
            if (['A', '1'].includes(key)) handleAnswer(0);
            else if (['B', '2'].includes(key)) handleAnswer(1);
            else if (['C', '3'].includes(key)) handleAnswer(2);
            else if (['D', '4'].includes(key)) handleAnswer(3);
            
            // Arrow Navigation
            else if (e.key === 'ArrowRight') {
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                }
            } else if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) {
                    setCurrentIndex(prev => Math.max(0, prev - 1));
                }
            }
            
            // Submission Shortcut
            else if (e.key === 'Enter') {
                if (currentIndex === questions.length - 1) {
                    setShowSubmitModal(true);
                } else {
                    setCurrentIndex(prev => prev + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, currentIndex, questions.length, showSubmitModal]);

    const handleAnswer = (optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
        addToast("Answer registered!", "success", undefined, undefined, false, undefined, true);
    };

    const toggleFlag = () => {
        const isBookmarked = flags.has(currentIndex);
        setFlags(prev => {
            const next = new Set(prev);
            if (isBookmarked) {
                next.delete(currentIndex);
            } else {
                next.add(currentIndex);
            }
            return next;
        });
        addToast(
            isBookmarked ? "Bookmark removed" : "Question bookmarked!",
            "info",
            undefined,
            undefined,
            false,
            undefined,
            true
        );
    };

    // ── 4. Submit & Grading Logic with Guest fallback ───────────
    const confirmSubmit = async () => {
        setShowSubmitModal(false);
        setIsSubmitting(true);

        const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
        
        // Remove locally saved quiz state upon submission
        clearSavedState();

        try {
            // Get Professor Remark
            const res = await fetch('/api/generate/remark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score, total: questions.length, topic: title })
            });
            if (res.ok) {
                const data = await res.json();
                setProfessorRemark(data.remark);
            }
        } catch (e) {
            console.error("Failed to fetch professor remark:", e);
        }

        setStatus('verdict');
        setCurrentIndex(0);
        setIsSubmitting(false);

        // Record User Activity (Registered Users Only)
        if (!isGuest) {
            try {
                const actRes = await fetch("/api/user/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "quiz" })
                });
                if (actRes.ok) {
                    const { stats } = await actRes.json();
                    setSessionStats({
                        xp: stats?.xpGained || 10,
                        streak: stats?.newStreak || user.streak || 0,
                        incremented: stats?.streakIncremented || false,
                    });
                    refreshUser();
                    setSessionComplete(true);
                }
            } catch (err) {
                console.error("Failed to save activity history:", err);
            }
        } else {
            // Guest session: Cache to localStorage
            const guestHistory = JSON.parse(localStorage.getItem("guest_quiz_history") || "[]");
            guestHistory.push({
                title,
                score,
                total: questions.length,
                percentage: Math.round((score / questions.length) * 100),
                date: new Date().toISOString()
            });
            localStorage.setItem("guest_quiz_history", JSON.stringify(guestHistory));
        }
    };

    // ── 5. Ask the Professor Analogy API call ─────────────────────
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

    // ── 6. Save to Flashcards API call ──────────────────────
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

    // ── 7. Review Missed Questions Only Sprint ────────────────
    const handleRetryMissedOnly = () => {
        const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
        if (score === questions.length) return;

        const missed = questions.filter((_, idx) => answers[idx] !== questions[idx].correctIndex);
        
        setQuestions(missed);
        setAnswers({});
        setFlags(new Set());
        setCurrentIndex(0);
        setTimeLeft(Math.max(60, Math.round((missed.length / originalQuestions.length) * initialTimer)));
        setStatus('taking');
        addToast(`Restarted with ${missed.length} missed questions!`, "info");
    };

    // Reset entire quiz
    const handleResetAll = () => {
        setQuestions(originalQuestions);
        setAnswers({});
        setFlags(new Set());
        setCurrentIndex(0);
        setTimeLeft(initialTimer);
        setStatus('taking');
        clearSavedState();
    };

    if (!originalQuestions || originalQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-[#09090b] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center select-none w-full">
                <div className="max-w-md w-full bg-white/[0.02] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] opacity-[0.02] text-7xl font-black border-4 border-white p-6 text-white rounded-2xl select-none pointer-events-none">
                        EMPTY
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} className="text-white/40 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">No Questions Found</h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                        The exam paper is completely blank. Let's head back to the library and review your study materials.
                    </p>
                    <button
                        onClick={() => router.push('/library')}
                        className="w-full py-4 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-[0.2em] text-[11px] hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(255,255,255,0.05)]"
                    >
                        Back to Library
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    // ── 8. Verdict / Results screen ───────────────────────────────────
    if (status === 'verdict') {
        const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <div className="min-h-screen w-full flex flex-col items-center bg-[#09090b] relative overflow-hidden">
                {/* Background lighting glows */}
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[50%] bg-[#9673F5]/10 rounded-full blur-[160px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[40%] bg-[#E5A93C]/5 rounded-full blur-[140px] pointer-events-none" />

                <header className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
                    <div className="flex gap-2">
                        <button onClick={() => downloadQuizOffline(title, questions, initialTimer)} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-white/80" title="Download Offline Version">
                            <Download size={18} />
                        </button>
                        <button onClick={() => setIsShareOpen(true)} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-white/80">
                            <Share2 size={18} />
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E5A93C] mb-1">Results</p>
                        <h1 className="text-sm font-bold text-white max-w-[200px] truncate">{title}</h1>
                    </div>
                    <button onClick={handleResetAll} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-white/80" title="Retry Quiz">
                        <RotateCcw size={18} />
                    </button>
                </header>

                <main className="max-w-2xl w-full px-6 py-6 flex flex-col items-center gap-8 z-10">
                    <div className="w-full rounded-[40px] bg-white/[0.02] border border-white/5 p-10 md:p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] opacity-[0.02] select-none text-8xl font-black border-[6px] border-[#9673F5] p-6 text-[#9673F5] rounded-3xl pointer-events-none">
                            VERIFIED
                        </div>
                        
                        <div className="w-16 h-16 rounded-2xl bg-[#9673F5]/10 border border-[#9673F5]/20 flex items-center justify-center mb-6">
                            <GraduationCap size={32} className="text-[#9673F5]" />
                        </div>
                        
                        <div className="flex flex-col items-center mb-6">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Quiz Accuracy</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">{percentage}</span>
                                <span className="text-2xl font-bold text-[#E5A93C]">%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 w-full border-y border-white/5 py-6 mb-6">
                            <div>
                                <p className="text-2xl font-black text-[#2BB288]">{score}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Correct</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-[#E85D75]">{questions.length - score}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Incorrect</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-[#9673F5]">{questions.length}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total Qs</p>
                            </div>
                        </div>

                        <p className="text-sm italic font-serif leading-relaxed text-white/70 px-4">
                            &ldquo;{professorRemark || getVerdict(user?.firstName || "Scholar", percentage)}&rdquo;
                        </p>
                    </div>

                    {/* Guest Sign-up CTA Banner */}
                    {isGuest && (
                        <div className="w-full p-6 rounded-3xl bg-gradient-to-r from-[#E5A93C]/10 to-[#9673F5]/10 border border-white/5 relative overflow-hidden backdrop-blur-md">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-[#E5A93C] flex items-center gap-1.5">
                                        <Sparkles size={14} className="animate-pulse" />
                                        Save Your Academic Streak
                                    </h4>
                                    <p className="text-xs text-white/60 leading-relaxed">
                                        Create a free account to track this score in your study history, build streak rewards, and deconstruct your own notes.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => router.push('/signup')}
                                    className="w-full md:w-auto px-5 py-3 rounded-2xl bg-white text-zinc-950 font-black uppercase text-[10px] tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    Sign Up Free <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="w-full flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => { setStatus('review'); setCurrentIndex(0); }} 
                            className="flex-1 py-4 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-[0.2em] text-[11px] hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            Review Answers
                        </button>
                        {score < questions.length && (
                            <button 
                                onClick={handleRetryMissedOnly} 
                                className="flex-1 py-4 rounded-2xl bg-zinc-900 border border-white/10 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-800 active:scale-[0.98] transition-all text-[#E5A93C]"
                            >
                                Retry Incorrect
                            </button>
                        )}
                        <button 
                            onClick={() => router.push('/library')} 
                            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/10 active:scale-[0.98] transition-all text-white"
                        >
                            Back to Library
                        </button>
                    </div>
                </main>

                <SessionComplete
                    isVisible={sessionComplete}
                    onDismiss={() => setSessionComplete(false)}
                    xpEarned={sessionStats.xp}
                    streak={sessionStats.streak}
                    streakIncremented={sessionStats.incremented}
                    type="quiz"
                    title={title}
                    extraStat={{ label: "Correct Answers", value: String(score), icon: "check_circle" }}
                    continueHref="/library"
                />

                <ShareCard 
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    data={{ title, count: originalQuestions.length, type: "Quiz", user: user?.name || "Scholar", items: originalQuestions }}
                />
            </div>
        );
    }

    // ── 9. Standalone Question Taking / Review View ────────────────
    const isReview = status === 'review';

    return (
        <div className="min-h-screen w-full flex flex-col bg-[var(--background)] relative overflow-hidden">
            {/* Ambient lighting glows */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#9673F5]/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#E5A93C]/3 rounded-full blur-[120px] pointer-events-none" />

            <header className="w-full h-20 border-b border-[var(--border)] flex items-center justify-between px-6 z-20 backdrop-blur-md bg-[var(--background)]/85 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2.5 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] transition-colors">
                        <X size={18} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#9673F5]">
                            {isReview ? "Review Mode" : "Interactive Quiz"}
                        </span>
                        <h2 className="text-sm font-bold text-[var(--foreground)] truncate max-w-[180px] md:max-w-[300px]">{title}</h2>
                    </div>
                </div>

                {/* Progress bar and nodes wrapper (Desktop only) */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <ProgressNodeTrack
                        total={questions.length}
                        current={currentIndex}
                        completed={Object.keys(answers).map(Number)}
                        nodeSize={28}
                        completedColor="var(--emerald)"
                        activeColor="var(--amber)"
                        onNodeClick={(idx) => setCurrentIndex(idx)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setIsDrawerOpen(prev => !prev)} className="p-2.5 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-secondary)] transition-colors" title="Toggle Question Sheet">
                        <Menu size={18} />
                    </button>
                    <button onClick={() => downloadQuizOffline(title, questions, initialTimer)} className="p-2.5 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground-secondary)] transition-colors" title="Download Offline Version">
                        <Download size={18} />
                    </button>
                    
                    {!isReview && initialTimer > 0 && (
                        <div className="relative flex items-center justify-center">
                            {/* SVG Timer circle countdown */}
                            <svg className="w-10 h-10 -rotate-90">
                                <circle 
                                    cx="20" 
                                    cy="20" 
                                    r="16" 
                                    className="stroke-white/5 fill-transparent" 
                                    strokeWidth="3"
                                />
                                <circle 
                                    cx="20" 
                                    cy="20" 
                                    r="16" 
                                    className={`fill-transparent transition-all duration-1000 ${isTimeUrgent ? 'stroke-red-500 animate-pulse' : 'stroke-[#E5A93C]'}`} 
                                    strokeWidth="3"
                                    strokeDasharray={100}
                                    strokeDashoffset={100 - timePercentage}
                                />
                            </svg>
                            <span className={`absolute font-mono text-[9px] font-black ${isTimeUrgent ? 'text-red-500 animate-pulse' : 'text-white/60'}`}>
                                {formatTime(timeLeft).split(":")[0]}m
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* Top progress track on mobile */}
            <div className="block md:hidden w-full px-6 py-3 border-b border-white/5 bg-[#09090b]/40 backdrop-blur-md">
                <ProgressNodeTrack
                    total={questions.length}
                    current={currentIndex}
                    completed={Object.keys(answers).map(Number)}
                    nodeSize={24}
                    completedColor="var(--emerald)"
                    activeColor="var(--amber)"
                    onNodeClick={(idx) => setCurrentIndex(idx)}
                />
            </div>

            {/* Main Interactive Grid */}
            <div className="flex-1 w-full flex relative">
                
                {/* ── Side Question drawer grid panel ── */}
                <AnimatePresence>
                    {isDrawerOpen && (
                        <motion.aside 
                            initial={{ x: -280, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -280, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="absolute md:relative left-0 top-0 bottom-0 z-30 w-72 bg-[#0c0c13] border-r border-white/5 flex flex-col p-6 shadow-2xl overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#9673F5]">Question Sheet</h3>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-1 rounded hover:bg-white/5 text-white/50 hover:text-white">
                                    <X size={14} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3">
                                {questions.map((_, idx) => {
                                    const isAnswered = answers[idx] !== undefined;
                                    const isFlagged = flags.has(idx);
                                    const isActive = currentIndex === idx;

                                    let cardStyles = "aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-black transition-all ";
                                    if (isActive) cardStyles += "border-[#E5A93C] bg-[#E5A93C]/10 text-[#E5A93C] shadow-[0_0_12px_rgba(229,169,60,0.15)]";
                                    else if (isReview) {
                                        const isCorrect = answers[idx] === questions[idx].correctIndex;
                                        cardStyles += isCorrect ? "border-[#2BB288]/40 bg-[#2BB288]/5 text-[#2BB288]" : "border-[#E85D75]/40 bg-[#E85D75]/5 text-[#E85D75]";
                                    }
                                    else if (isFlagged) cardStyles += "border-[#9673F5]/40 bg-[#9673F5]/15 text-[#9673F5]";
                                    else if (isAnswered) cardStyles += "border-white/20 bg-white/5 text-white/90";
                                    else cardStyles += "border-white/5 bg-transparent text-white/30 hover:bg-white/5";

                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => { setCurrentIndex(idx); setIsDrawerOpen(false); }}
                                            className={cardStyles}
                                        >
                                            {idx + 1}
                                            {isFlagged && <span className="w-1.5 h-1.5 rounded-full bg-[#9673F5] mt-0.5" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ── Primary split viewport workspace ── */}
                <main className="flex-1 px-6 py-8 md:py-12 flex flex-col md:grid md:grid-cols-12 gap-8 max-w-6xl mx-auto overflow-y-auto">
                    
                    {/* Left Panel: Question content, tags, flags */}
                    <div className="md:col-span-6 flex flex-col justify-between gap-6">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 rounded-full bg-[#9673F5]/10 text-[#9673F5] border border-[#9673F5]/20 text-[10px] font-bold uppercase tracking-wider">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={toggleFlag} 
                                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${flags.has(currentIndex) ? 'text-[#9673F5]' : 'text-[var(--foreground-muted)]/70 hover:text-[var(--foreground)]'}`}
                                    >
                                        <Flag size={13} className={flags.has(currentIndex) ? "fill-[#9673F5]" : ""} />
                                        {flags.has(currentIndex) ? 'Bookmarked' : 'Bookmark'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-zinc-900 font-semibold text-lg dark:text-zinc-100 leading-relaxed">
                                    {currentQuestion?.question}
                                </h3>
                            </div>
                        </div>

                        {/* Interactive scratchpad drawing notice or keyboard legend */}
                        {!isReview && (
                            <div className="hidden md:flex flex-wrap gap-2 items-center text-[10px] text-white/30 font-bold uppercase tracking-wider bg-white/[0.01] border border-white/5 p-4 rounded-2xl max-w-sm">
                                <span className="text-white/40">Keyboard navigation:</span>
                                <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-white/60">A-D</span>
                                <span className="text-[8px]">or</span>
                                <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-white/60">1-4</span>
                                <span className="text-white/30">Answer</span>
                                <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-white/60">&larr; &rarr;</span>
                                <span className="text-white/30">Jump</span>
                                <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-white/60">Enter</span>
                                <span className="text-white/30">Submit</span>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Multiple choice options, analogy blocks, API interactions */}
                    <div className="md:col-span-6 flex flex-col justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3">
                                {currentQuestion?.options?.map((opt, idx) => {
                                    const isSelected = answers[currentIndex] === idx;
                                    const isCorrect = currentQuestion?.correctIndex === idx;
                                    
                                    // 2.5D Button styling constants
                                    let btnBase = "w-full p-5 rounded-2xl text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden ";
                                    let textStyle = "text-sm font-medium leading-relaxed ";
                                    let circleColor = "bg-zinc-200 dark:bg-white/10 border-zinc-300 dark:border-white/10 text-zinc-600 dark:text-white/50 group-hover:bg-zinc-300 dark:group-hover:bg-white/20 ";

                                    if (isReview) {
                                        if (isCorrect) {
                                            btnBase += "border border-[#2BB288]/30 bg-[#2BB288]/10 text-[#2BB288] shadow-[0_4px_0_rgba(43,178,136,0.15)] translate-y-[1px] ";
                                            textStyle += "text-[#2BB288] font-semibold";
                                            circleColor = "bg-[#2BB288]/20 border-[#2BB288]/20 text-[#2BB288]";
                                        } else if (isSelected) {
                                            btnBase += "border border-[#E85D75]/30 bg-[#E85D75]/10 text-[#E85D75] shadow-[0_4px_0_rgba(232,93,117,0.15)] translate-y-[1px] ";
                                            textStyle += "text-[#E85D75] font-semibold";
                                            circleColor = "bg-[#E85D75]/20 border-[#E85D75]/20 text-[#E85D75]";
                                        } else {
                                            btnBase += "bg-transparent border border-[var(--border)] opacity-30 cursor-not-allowed ";
                                            textStyle += "text-[var(--foreground-muted)]/40";
                                        }
                                    } else {
                                        if (isSelected) {
                                            btnBase += "border border-[#E5A93C]/40 bg-[#E5A93C]/10 text-zinc-900 dark:text-zinc-100 shadow-[0_4px_0_rgba(229,169,60,0.2)] translate-y-[1px] ";
                                            textStyle += "text-zinc-900 dark:text-zinc-100 font-semibold";
                                            circleColor = "bg-[#E5A93C] border-[#E5A93C] text-black font-black";
                                        } else {
                                            btnBase += "bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 shadow-[0_4px_0_rgba(0,0,0,0.02)] active:translate-y-[3px] active:shadow-none hover:translate-y-[1px] hover:shadow-[0_3px_0_rgba(0,0,0,0.02)] ";
                                        }
                                    }

                                    const optLetters = ["A", "B", "C", "D"];

                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => !isReview && handleAnswer(idx)} 
                                            className={btnBase}
                                            disabled={isReview}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Left option badge (A, B, C, D) */}
                                                <span className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs transition-colors shrink-0 ${circleColor}`}>
                                                    {optLetters[idx]}
                                                </span>
                                                <span className={textStyle}>{opt}</span>
                                            </div>
                                            {isReview && isCorrect && <CheckCircle2 size={18} className="text-[#2BB288] shrink-0" />}
                                            {isReview && isSelected && !isCorrect && <XCircle size={18} className="text-[#E85D75] shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Review Explanations & AI Tutor Analogy ── */}
                            {isReview && (
                                <div className="space-y-4">
                                    {/* Standard Explanation Accordion */}
                                    <div className="p-6 rounded-3xl bg-[#9673F5]/5 border border-[#9673F5]/10 flex flex-col gap-2 backdrop-blur-2xl">
                                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#9673F5]">
                                            <Lightbulb size={13} />
                                            Analyst Feedback
                                        </h4>
                                        <p className="text-sm text-white/85 leading-relaxed font-serif">{currentQuestion?.explanation}</p>
                                        
                                        {/* Save to Flashcard stars inside incorrect options */}
                                        {answers[currentIndex] !== currentQuestion.correctIndex && (
                                            <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                                                <button
                                                    onClick={() => saveToDecks(currentIndex)}
                                                    disabled={savedQuestions.has(currentIndex) || isSubmittingFlashcard[currentIndex]}
                                                    className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                                        savedQuestions.has(currentIndex)
                                                            ? 'bg-[#E5A93C]/10 border-[#E5A93C]/20 text-[#E5A93C]'
                                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    {isSubmittingFlashcard[currentIndex] ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Star size={12} className={savedQuestions.has(currentIndex) ? "fill-[#E5A93C]" : ""} />
                                                    )}
                                                    {savedQuestions.has(currentIndex) ? "Saved to Flashcards" : "Save as Flashcard"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Tutor "Ask the Professor" Analogy */}
                                    <div className="relative">
                                        {!tutorAnalogy[currentIndex] ? (
                                            <button
                                                onClick={() => askProfessorTutor(currentIndex)}
                                                disabled={isLoadingTutor[currentIndex]}
                                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E5A93C]/15 to-[#E5A93C]/5 border border-[#E5A93C]/25 text-[#E5A93C] text-[11px] font-bold uppercase tracking-wider hover:from-[#E5A93C]/20 hover:to-[#E5A93C]/10 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,169,60,0.05)]"
                                            >
                                                {isLoadingTutor[currentIndex] ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        The Professor is drafting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} />
                                                        Ask the Professor for an Analogy
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-6 rounded-3xl bg-[#E5A93C]/5 border border-[#E5A93C]/20 flex flex-col gap-2 relative shadow-lg"
                                            >
                                                {/* Witty speech bubble tail */}
                                                <div className="absolute top-[-8px] right-8 w-4 h-4 bg-[#E5A93C]/5 border-t border-l border-[#E5A93C]/20 rotate-45 transform" />
                                                
                                                <h5 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E5A93C]">
                                                    <Sparkles size={12} />
                                                    Professor's Analogy
                                                </h5>
                                                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-serif italic">
                                                    &ldquo;{tutorAnalogy[currentIndex]}&rdquo;
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                            <button 
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentIndex === 0}
                                className="px-5 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white disabled:opacity-20 transition-all flex items-center gap-1"
                            >
                                <ArrowLeft size={13} /> Prev
                            </button>
                            
                            {isReview ? (
                                <button 
                                    onClick={() => {
                                        if (currentIndex === questions.length - 1) {
                                            setStatus('verdict');
                                        } else {
                                            setCurrentIndex(prev => prev + 1);
                                        }
                                    }}
                                    className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center gap-1"
                                >
                                    {currentIndex === questions.length - 1 ? "Finish Review" : "Next"} <ArrowRight size={13} />
                                </button>
                            ) : currentIndex === questions.length - 1 ? (
                                <button 
                                    onClick={() => setShowSubmitModal(true)} 
                                    className="px-6 py-3 rounded-xl bg-[#9673F5] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#9673F5]/20 hover:bg-[#8663E5] transition-all"
                                >
                                    Finish Quiz
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setCurrentIndex(prev => prev + 1)} 
                                    className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center gap-1"
                                >
                                    Next <ArrowRight size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="max-w-sm w-full bg-[#0c0c13] border border-white/10 rounded-[40px] p-10 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-[#9673F5]/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="w-16 h-16 rounded-2xl bg-[#9673F5]/10 border border-[#9673F5]/20 flex items-center justify-center">
                            <FileText size={32} className="text-[#9673F5]" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Submit Assessment?</h3>
                            <p className="text-xs text-white/50 leading-relaxed">Your answers will be graded and logged to your personal profile summary.</p>
                        </div>
                        <div className="w-full flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 font-black uppercase tracking-[0.2em] text-[10px] text-white hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={confirmSubmit} className="flex-1 py-4 rounded-2xl bg-[#9673F5] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#8663E5] transition-all">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
