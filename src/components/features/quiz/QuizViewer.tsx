"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ShareCard from "@/components/ShareCard";
import { useToasts } from "@/components/ui/GlobalToasts";
import SessionComplete from "@/components/features/SessionComplete";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Flag, Share2, GraduationCap, ClipboardList, 
    RotateCcw, Lightbulb, CheckCircle2, XCircle, FileText, Download
} from "lucide-react";
import { downloadQuizOffline } from "@/lib/offline-download";

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface QuizViewerProps {
    questions: Question[];
    title: string;
    generationId?: string | null;
    initialTimer?: number; // in seconds
}

export default function QuizViewer({ questions, title, generationId, initialTimer = 600 }: QuizViewerProps) {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();

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

    // Timer logic
    useEffect(() => {
        if (status !== 'taking' || questions.length === 0 || initialTimer === 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    confirmSubmit();
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

    const handleAnswer = (optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
        addToast("Answer registered!", "success", undefined, undefined, false, undefined, true);
    };

    const toggleFlag = () => {
        setFlags(prev => {
            const next = new Set(prev);
            let msg = "";
            if (next.has(currentIndex)) {
                next.delete(currentIndex);
                msg = "Bookmark removed";
            } else {
                next.add(currentIndex);
                msg = "Question bookmarked!";
            }
            addToast(msg, "info", undefined, undefined, false, undefined, true);
            return next;
        });
    };

    const confirmSubmit = async () => {
        setShowSubmitModal(false);
        setIsSubmitting(true);

        const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
        const percentage = Math.round((score / questions.length) * 100);

        try {
            const res = await fetch('/api/generate/remark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score, total: questions.length, topic: title })
            });
            const data = await res.json();
            setProfessorRemark(data.remark);
        } catch (e) {}

        setStatus('verdict');
        setCurrentIndex(0);
        setIsSubmitting(false);

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
        } catch (err) {}
    };

    if (questions.length === 0) return null;
    const currentQuestion = questions[currentIndex];

    // Verdict View
    if (status === 'verdict') {
        const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
                 <header className="w-full max-w-4xl p-6 flex items-center justify-between z-20">
                    <div className="flex gap-2">
                        <button onClick={() => downloadQuizOffline(title, questions, initialTimer)} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all" title="Download Offline Version">
                            <Download size={18} />
                        </button>
                        <button onClick={() => setIsShareOpen(true)} className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                            <Share2 size={18} />
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Results</p>
                        <h1 className="text-sm font-bold">{title}</h1>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="max-w-xl w-full px-6 py-12 flex flex-col items-center gap-12">
                    <div className="w-full rounded-[40px] bg-white/[0.02] border border-white/5 p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] opacity-[0.03] select-none text-8xl font-black border-8 border-[var(--blue)] p-8 text-[var(--blue)] rounded-3xl">VERIFIED</div>
                        
                        <div className="w-16 h-16 rounded-2xl bg-[var(--blue-dim)] flex items-center justify-center mb-8">
                            <GraduationCap size={32} className="text-[var(--blue)]" />
                        </div>
                        
                        <div className="flex flex-col items-center mb-8">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--blue-text)] mb-2">Academic Rank</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-8xl font-black tracking-tighter text-[var(--blue)]">{percentage}</span>
                                <span className="text-2xl font-bold opacity-30">%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 w-full border-y border-white/5 py-8 mb-8">
                            <div>
                                <p className="text-2xl font-black">{score}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-40">Correct</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black">{questions.length - score}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-40">Incorrect</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-blue-400">{percentage}%</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-40">Accuracy</p>
                            </div>
                        </div>

                        <p className="text-sm italic font-serif leading-relaxed opacity-60 px-6">
                            &ldquo;{professorRemark || "A solid demonstration of cognitive retention."}&rdquo;
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-4">
                        <button onClick={() => { setStatus('review'); setCurrentIndex(0); }} className="w-full py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all">
                            Review Answers
                        </button>
                        <button onClick={() => router.push('/library')} className="w-full py-4 rounded-2xl bg-[var(--bg-3)] border border-[var(--border)] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[var(--bg-4)] transition-all">
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
                    data={{ title, count: questions.length, type: "Quiz", user: user.name || "Scholar", items: questions }}
                />
            </div>
        );
    }

    // Question Taking View
    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-transparent">
            <header className="w-full h-16 border-b border-white/5 flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/library')} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <X size={20} />
                    </button>
                    <h2 className="text-sm font-bold truncate max-w-[200px]">{title}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => downloadQuizOffline(title, questions, initialTimer)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-white" title="Download Offline Version">
                        <Download size={18} />
                    </button>
                    {initialTimer > 0 && (
                        <div className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold border ${timeLeft < 60 ? 'text-red-500 border-red-500/20 bg-red-500/5 animate-pulse' : 'text-white/50 border-white/10 bg-white/5'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full max-w-3xl px-6 py-12">
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    {questions.map((_, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-8 min-w-[2rem] px-3 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold transition-all ${
                                currentIndex === idx ? 'bg-[var(--foreground)] text-[var(--background)] shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 
                                answers[idx] !== undefined ? 'bg-transparent border border-white/20 text-white' :
                                flags.has(idx) ? 'bg-transparent border border-[var(--blue-border)] text-[var(--blue)]' :
                                'text-white/30 hover:bg-white/5'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] border border-[var(--blue-border)] text-[10px] font-black uppercase tracking-widest">
                            Question {currentIndex + 1} / {questions.length}
                        </span>
                        <button onClick={toggleFlag} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${flags.has(currentIndex) ? 'text-[var(--blue)]' : 'opacity-40'}`}>
                            <Flag size={14} />
                            {flags.has(currentIndex) ? 'Flagged' : 'Flag'}
                        </button>
                    </div>

                    <h3 className="text-xl font-medium leading-relaxed">{currentQuestion.question}</h3>

                    <div className="grid grid-cols-1 gap-4">
                        {currentQuestion.options.map((opt, idx) => {
                            const isSelected = answers[currentIndex] === idx;
                            const isReview = status === 'review';
                            const isCorrect = currentQuestion.correctIndex === idx;

                            let styles = "w-full p-5 rounded-2xl text-left transition-all flex items-center gap-4 group ";
                            
                            if (isReview) {
                                if (isCorrect) styles += "ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500/10 text-emerald-400 scale-[1.02] ";
                                else if (isSelected) styles += "ring-1 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-red-500/10 text-red-400 scale-[1.02] ";
                                else styles += "bg-transparent border border-white/5 opacity-40 ";
                            } else {
                                if (isSelected) styles += "ring-1 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-white/10 text-white scale-[1.02] ";
                                else styles += "bg-transparent border border-white/5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 ";
                            }

                            return (
                                <button key={idx} onClick={() => !isReview && handleAnswer(idx)} className={styles}>
                                    <span className="text-[14px] leading-relaxed flex-1">{opt}</span>
                                    {isReview && isCorrect && <CheckCircle2 size={18} className="text-emerald-400" />}
                                    {isReview && isSelected && !isCorrect && <XCircle size={18} className="text-red-400" />}
                                </button>
                            );
                        })}
                    </div>

                    {status === 'review' && (
                        <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-2">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                <Lightbulb size={14} />
                                Explanation
                            </h4>
                            <p className="text-sm opacity-70 leading-relaxed">{currentQuestion.explanation}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                    <button 
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="px-6 py-3 rounded-xl bg-white/5 text-[11px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 disabled:opacity-20 transition-all"
                    >
                        Prev
                    </button>
                    {currentIndex === questions.length - 1 ? (
                        <button onClick={() => setShowSubmitModal(true)} className="px-8 py-3 rounded-xl bg-[var(--blue)] text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--blue-glow)] transition-all">
                            Finish Exam
                        </button>
                    ) : (
                        <button onClick={() => setCurrentIndex(prev => prev + 1)} className="px-8 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest text-[11px] transition-all">
                            Next
                        </button>
                    )}
                </div>
            </main>

            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="max-w-sm w-full bg-[var(--bg-2)] border border-white/10 rounded-[40px] p-10 flex flex-col items-center text-center gap-6 shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--blue-dim)] flex items-center justify-center">
                            <FileText size={32} className="text-[var(--blue)]" />
                        </div>
                        <h3 className="text-xl font-bold">Submit Assessment?</h3>
                        <p className="text-sm opacity-60">Your progress will be graded and recorded by the Professor.</p>
                        <div className="w-full flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 font-black uppercase tracking-[0.2em] text-[10px]">Cancel</button>
                            <button onClick={confirmSubmit} className="flex-1 py-4 rounded-2xl bg-[var(--blue)] text-white font-black uppercase tracking-[0.2em] text-[10px]">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
