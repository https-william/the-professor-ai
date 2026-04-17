"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ShareCard from "@/components/ShareCard";
import SiteHeader from "@/components/ui/SiteHeader";
import { useToasts } from "@/components/ui/GlobalToasts";
import EndowmentModal from "@/components/modals/EndowmentModal";
import SessionComplete from "@/components/features/SessionComplete";
import DataDustLoader from "@/components/ui/DataDustLoader";
import AuthInterceptor from "@/components/ui/AuthInterceptor";
import { 
    AlertCircle, 
    HelpCircle, 
    Share2, 
    GraduationCap, 
    Zap, 
    RotateCcw, 
    ClipboardList, 
    X, 
    Flag, 
    CheckCircle2, 
    XCircle, 
    Lightbulb, 
    FileText, 
    Trophy 
} from "lucide-react";

interface Question {
    id?: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

const LOADING_PHRASES = [
    "Sipping digital espresso...",
    "Judging your source material...",
    "Applying the F.A.M.A.S contract...",
    "Extracting high-yield facts...",
    "Consulting the archives...",
    "Synthesizing academic payloads..."
];

// Component encapsulation
function QuizContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [title, setTitle] = useState<string>("Quiz");

    // Exam State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [flags, setFlags] = useState<Set<number>>(new Set());
    const [status, setStatus] = useState<'taking' | 'verdict' | 'review'>('taking');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [professorRemark, setProfessorRemark] = useState<string>('');
    const [loadingRemark, setLoadingRemark] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingIdx, setLoadingIdx] = useState(0);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const hasStartedGeneration = useRef(false);
    const [isEndowmentOpen, setIsEndowmentOpen] = useState(false);

    // Session complete state
    const [showSessionComplete, setShowSessionComplete] = useState(false);
    const [sessionStats, setSessionStats] = useState({ xp: 0, streak: 0, incremented: false });

    // Timer (10 minutes default)
    const [timeLeft, setTimeLeft] = useState(10 * 60);

    // Generation phrase rotation
    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setLoadingIdx(prev => (prev + 1) % LOADING_PHRASES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isGenerating]);

    // Load content or Initiate Stream
    useEffect(() => {
        const init = async () => {
            const id = searchParams.get("id");
            const mode = searchParams.get("mode");

            if (id) {
                try {
                    setIsGenerating(false);
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("generations")
                        .select("*")
                        .eq("id", id)
                        .single();
                    if (error || !data) throw new Error("Quiz not found");

                    const questions = data.content?.questions || [];
                    setQuestions(questions);
                    setTitle(data.title || "Academic Quiz");
                    setGenerationId(data.id);
                    sessionStorage.setItem("quiz_data", JSON.stringify(data.content));
                    return;
                } catch (e) {
                    console.error("ID load error:", e);
                    router.push("/create"); return;
                }
            }

            if (mode === "generate") {
                if (hasStartedGeneration.current) return;
                
                const paramsStr = sessionStorage.getItem("generateParams");
                if (!paramsStr) {
                    router.push("/create");
                    return;
                }
                
                hasStartedGeneration.current = true;
                const params = JSON.parse(paramsStr);
                
                sessionStorage.removeItem("generateParams");
                
                setIsGenerating(true);
                setQuestions([]);
                setGenerationError(null);
                
                try {
                    const response = await fetch("/api/generate/quiz", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(params),
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        if (response.status === 402 || errData.code === "INSUFFICIENT_CREDITS") {
                            setIsEndowmentOpen(true);
                            setIsGenerating(false);
                            return;
                        }
                        throw new Error(errData.error || `HTTP ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();
                    let acc: Question[] = [];
                    
                    if (reader) {
                        let lineBuffer = "";
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            
                            lineBuffer += decoder.decode(value, { stream: true });
                            let lines = lineBuffer.split("\n");
                            lineBuffer = lines.pop() || "";

                            for (const line of lines) {
                                if (!line.startsWith("data: ")) continue;
                                try {
                                    const data = JSON.parse(line.slice(6));
                                    if (data.type === "question") {
                                        acc = [...acc, data.question];
                                        setQuestions(acc);
                                    } else if (data.status === "complete") {
                                        setGenerationId(data.id);
                                        setTitle(data.title);
                                        if (data.xpEarned) {
                                            addToast(`Quiz created! +${data.xpEarned} XP`, 'xp');
                                        }
                                        setIsGenerating(false);
                                        sessionStorage.setItem("quiz_data", JSON.stringify(data.content || { questions: acc }));
                                    } else if (data.status === "error") {
                                        throw new Error(data.message);
                                    }
                                } catch (e) { /* ignore parse errors */ }
                            }
                        }
                    }
                    if (acc.length === 0 && !generationError) {
                        setGenerationError("No questions were generated.");
                    }
                } catch (e: any) {
                    console.error("Stream failed:", e);
                    setGenerationError(e.message || "Generation failed. Please try again.");
                }
                setIsGenerating(false);
            } else {
                // Static load
                try {
                    const stored = sessionStorage.getItem("quiz_data");
                    if (stored) {
                        const content = JSON.parse(stored);
                        if (content.questions) {
                            setQuestions(content.questions);
                            setTitle(content.title || "Academic Quiz");
                        }
                    }
                } catch (e) {
                    console.error("Error loading quiz:", e);
                }
            }
        };
        
        init();
    }, [searchParams, router]);

    // Timer Logic
    useEffect(() => {
        if (status !== 'taking' || questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status, questions.length]);

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
        setShowSubmitModal(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitModal(false);
        setIsSubmitting(true);

        const finalScore = questions.reduce((acc, q, i) => {
            return acc + (answers[i] === q.correctIndex ? 1 : 0);
        }, 0);
        const percentage = Math.round((finalScore / questions.length) * 100);

        setLoadingRemark(true);
        try {
            const res = await fetch('/api/generate/remark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: finalScore,
                    total: questions.length,
                    topic: title
                })
            });
            const data = await res.json();
            setProfessorRemark(data.remark || "Well, that happened. \uD83D\uDCDD");
        } catch (error) {
            console.error('Failed to get professor remark:', error);
            setProfessorRemark(percentage >= 70 ? "Not bad! \uD83D\uDC4D" : "Room for improvement. \uD83D\uDCC3");
        }
        setLoadingRemark(false);

        setStatus('verdict');
        setCurrentIndex(0);
        setIsSubmitting(false);

        // 4. Update XP & Streak
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
                if (stats?.xpGained) {
                    addToast(`Quiz complete! +${stats.xpGained} XP`, 'success', 'history_edu');
                }
                refreshUser();
                setShowSessionComplete(true);
            }
        } catch (err) {
            console.error("Failed to record quiz activity:", err);
        }
    };

    const calculateScore = () => {
        return questions.reduce((acc, q, i) => {
            return acc + (answers[i] === q.correctIndex ? 1 : 0);
        }, 0);
    };

    const score = calculateScore();
    const currentQuestion = questions[currentIndex];

    // \u256C\u256C\u256C GENERATION LOADING SCREEN \u256C\u256C\u256C
    if (isGenerating && questions.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <DataDustLoader phrases={LOADING_PHRASES} currentPhraseIndex={loadingIdx} />
            </div>
        );
    }

    // \u256C\u256C\u256C ERROR STATE \u256C\u256C\u256C
    if (generationError) {
        if (generationError.toLowerCase().includes("unauthorized")) {
            return (
                <div className="min-h-screen bg-[#06060B] flex flex-col items-center justify-center p-6">
                    <AuthInterceptor />
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                }}>
                    <AlertCircle size={30} strokeWidth={1.5} className="text-[#EF4444]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Generation Failed</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-8 text-center max-w-xs">{generationError}</p>
                <Link href="/create" className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]" style={{
                    background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                }}>
                    Try Again
                </Link>
            </div>
        );
    }

    // \u256C\u256C\u256C EMPTY STATE \u2014 Redirect if no quiz loaded \u256C\u256C\u256C
    if (questions.length === 0 && !isGenerating) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                }}>
                    <HelpCircle size={30} strokeWidth={1.5} className="text-[#F59E0B]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No Quiz Loaded</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-8 text-center max-w-xs">Head to the Create page to generate a quiz from your study materials.</p>
                <Link href="/create" className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]" style={{
                    background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.3), inset 0 2px 3px rgba(255,255,255,0.2)",
                }}>
                    Create a Quiz
                </Link>
            </div>
        );
    }

    // \u256C\u256C\u256C VERDICT SCREEN \u256C\u256C\u256C
    if (status === 'verdict') {
        const percentage = Math.round((score / questions.length) * 100);
        const correct = score;
        const incorrect = questions.length - score;
        const unattempted = questions.length - Object.keys(answers).length;

        const getGrade = () => {
            if (percentage === 100) return { label: "S", color: "#F59E0B", glow: "rgba(245,158,11,0.4)" };
            if (percentage >= 90) return { label: "A+", color: "#10B981", glow: "rgba(16,185,129,0.4)" };
            if (percentage >= 80) return { label: "A", color: "#10B981", glow: "rgba(16,185,129,0.3)" };
            if (percentage >= 70) return { label: "B+", color: "#818CF8", glow: "rgba(129,140,248,0.3)" };
            if (percentage >= 60) return { label: "B", color: "#818CF8", glow: "rgba(129,140,248,0.25)" };
            if (percentage >= 50) return { label: "C", color: "#F97316", glow: "rgba(249,115,22,0.3)" };
            return { label: "F", color: "#EF4444", glow: "rgba(239,68,68,0.3)" };
        };
        const grade = getGrade();

        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute w-[800px] h-[800px] top-[-10%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />
                <div className="absolute w-[600px] h-[600px] bottom-[-10%] left-[-10%] rounded-full bg-[var(--secondary)]/5 blur-[100px] pointer-events-none" />

                <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl px-4 flex items-center justify-between relative z-50">
                    <button 
                        onClick={() => setIsShareOpen(true)}
                        className="w-12 h-12 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--border)] flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-all text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                        title="Share Achievement"
                    >
                        <Share2 size={20} strokeWidth={1.5} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[var(--foreground-muted)] opacity-60">Quiz Results</span>
                        <span className="text-[12px] font-bold text-[var(--foreground)]">{title}</span>
                    </div>
                    <div className="w-8" /> {/* Spacer */}
                </header>

                <main className="relative z-10 flex flex-col items-center px-5 pt-8 pb-12 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="w-full relative rounded-[40px] p-[1px] mb-10 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))" }}>
                        <div className="w-full bg-[#0A0A0F]/95 backdrop-blur-3xl rounded-[39px] p-8 md:p-12 relative">
                            
                            <div className="flex flex-col items-center mb-10 text-center">
                                <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--border)] flex items-center justify-center mb-4">
                                    <GraduationCap size={24} strokeWidth={1.5} className="text-[var(--accent)]" />
                                </div>
                                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] opacity-80 mb-1">The Professor AI</h2>
                                <h3 className="text-[13px] font-bold text-[var(--foreground)]">Quiz Results</h3>

                                {questions[0]?.explanation?.includes("The correct answer is:") && (
                                    <div className="mt-4 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center gap-2">
                                        <Zap size={10} strokeWidth={1.5} className="text-[#10B981]" />
                                        <span className="text-[9px] font-black uppercase text-[#10B981] tracking-widest">Flashcard Match Mode</span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none opacity-[0.08] select-none">
                                <div className="border-[8px] border-[#EF4444] rounded-2xl px-12 py-4 flex flex-col items-center">
                                    <span className="text-7xl font-black text-[#EF4444] tracking-[0.2em]">VERIFIED</span>
                                    <span className="text-sm font-black text-[#EF4444] tracking-[1em] mt-2">ACADEMIC RECORD</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center mb-10 relative z-10">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--foreground-muted)] font-bold mb-4">Final Assessment Score</p>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-8xl font-black tracking-tighter" style={{ color: grade.color }}>{percentage}</span>
                                    <span className="text-3xl font-bold text-[var(--foreground-muted)] opacity-60">%</span>
                                </div>
                                <div className="px-5 py-2 rounded-full" style={{ background: `${grade.color}10`, border: `1px solid ${grade.color}20` }}>
                                    <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: grade.color }}>Grade {grade.label}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 w-full mb-10 py-6 border-y border-[var(--border)]">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-[var(--foreground)] mb-1">{correct}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Correct</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-[var(--foreground)] mb-1">{incorrect}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Incorrect</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-[var(--foreground-muted)] mb-1">{unattempted}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] opacity-60">Skipped</div>
                                </div>
                            </div>

                            <div className="mb-10 text-center">
                                <p className="text-sm italic font-serif leading-relaxed text-[var(--foreground-muted)] px-4">
                                    &ldquo;{professorRemark || "An excellent demonstration of material mastery."}&rdquo;
                                </p>
                            </div>

                            <div className="flex flex-col items-end pr-4">
                                <div className="text-2xl font-serif text-[var(--accent)]/60 select-none mb-1 rotate-[-2deg]" style={{ fontFamily: "'Dancing Script', 'Cursive', serif" }}>
                                    The Professor
                                </div>
                                <div className="w-32 h-px bg-[var(--foreground)]/10 mb-2" />
                                <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-60">AI-Generated Assessment</div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        {percentage < 100 && (
                            <button 
                                onClick={() => {
                                    const missedIndices = questions
                                        .map((q, i) => answers[i] !== q.correctIndex ? i : -1)
                                        .filter(i => i !== -1);
                                    
                                    const missedQuestions = missedIndices.map(i => questions[i]);
                                    
                                    setQuestions(missedQuestions);
                                    setAnswers({});
                                    setFlags(new Set());
                                    setCurrentIndex(0);
                                    setStatus('taking');
                                    setTimeLeft(Math.max(5 * 60, missedQuestions.length * 60)); // 1 min per question, min 5 mins
                                    addToast("Retrying missed questions...", "info", "refresh");
                                }}
                                className="w-full py-4 rounded-[20px] font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                style={{
                                    background: "rgba(245,158,11,0.1)",
                                    border: "1px solid rgba(245,158,11,0.2)",
                                    color: "#F59E0B"
                                }}
                            >
                                <RotateCcw size={18} strokeWidth={1.5} />
                                Retry {questions.length - score} Missed Questions
                            </button>
                        )}

                        <button onClick={() => { setStatus('review'); setCurrentIndex(0); }}
                            className="w-full py-4 rounded-[20px] font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-white text-[#06060B] hover:bg-white/90 shadow-[0_4px_24px_rgba(255,255,255,0.1)]">
                            <ClipboardList size={18} strokeWidth={1.5} />
                            Review Answers
                        </button>

                        <button onClick={() => router.push('/create')}
                            className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                            Next Assessment
                        </button>
                    </div>
                </main>

                <ShareCard 
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    data={{
                        title: title,
                        count: questions.length,
                        type: "Quiz",
                        user: user.name || "Scholar",
                        items: questions
                    }}
                />
            </div>
        );
    }

    if (!currentQuestion) return null;

    const isFlagged = flags.has(currentIndex);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <header className="h-14 flex items-center justify-between px-4 md:px-6" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/create')} className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.03] transition-all">
                        <X size={20} strokeWidth={1.5} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status === 'taking' && (
                        <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${timeLeft < 60 ? 'text-[#EF4444] animate-pulse' : 'text-[var(--foreground-muted)]'}`}
                            style={{ background: "var(--foreground-opacity-5, rgba(255,255,255,0.03))", border: "1px solid var(--border)" }}>
                            {formatTime(timeLeft)}
                        </div>
                    )}
                    {status === 'review' && (
                        <button onClick={() => setStatus('verdict')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors"
                            style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}>
                            Back to Results
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6">
                <div className="rounded-[40px] overflow-hidden nm-flat animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--foreground-muted)]">
                                    {status === 'taking' ? 'Live Exam' : 'Review Mode'}
                                </span>
                            </div>
                            {status === 'taking' && (
                                <button onClick={toggleFlag}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${isFlagged ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[var(--foreground-muted)] opacity-60 hover:opacity-100'}`}>
                                    <Flag size={14} strokeWidth={1.5} />
                                    Flag
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {questions.map((_, idx) => {
                                const active = currentIndex === idx;
                                const done = answers[idx] !== undefined;
                                const flagged = flags.has(idx);

                                let bg = "transparent";
                                let text = "text-[var(--foreground-muted)]";
                                let shadow = "none";

                                if (status === 'review') {
                                    const correct = answers[idx] === questions[idx]?.correctIndex;
                                    if (answers[idx] !== undefined) {
                                        bg = correct ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)";
                                        text = correct ? "text-[#10B981]" : "text-[#EF4444]";
                                    }
                                } else {
                                    if (active) { 
                                        bg = "var(--background)"; 
                                        text = "text-[var(--foreground)]"; 
                                        shadow = "inset 4px 4px 8px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.01)";
                                    }
                                    else if (flagged) { 
                                        bg = "rgba(245,158,11,0.05)"; 
                                        text = "text-[#F59E0B]"; 
                                    }
                                    else if (done) { 
                                        bg = "rgba(59,130,246,0.05)"; 
                                        text = "text-[#3B82F6]"; 
                                    }
                                }

                                return (
                                    <button key={idx} onClick={() => setCurrentIndex(idx)}
                                        className={`w-9 h-9 rounded-xl text-[11px] font-bold flex-shrink-0 transition-all ${text} ${active ? 'scale-110' : 'hover:scale-105'}`}
                                        style={{ background: bg, boxShadow: shadow }}>
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="px-5 md:px-8 py-6 md:py-8">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-md text-[#3B82F6]"
                                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                                Question {currentIndex + 1} / {questions.length}
                            </span>
                        </div>

                        <p className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-90 leading-relaxed mb-8">
                            {currentQuestion.question}
                        </p>

                        <div className="space-y-4">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = answers[currentIndex] === idx;
                                const isCorrect = currentQuestion.correctIndex === idx;

                                let className = "w-full px-6 py-4.5 rounded-[24px] text-left transition-all duration-300 flex items-center gap-4 group ";
                                let shadow = "8px 8px 16px rgba(0,0,0,0.4), -4px -4px 12px rgba(255,255,255,0.01)";

                                if (status === 'review') {
                                    if (isCorrect) {
                                        className += "bg-emerald-500/10 border border-emerald-500/20";
                                        shadow = "none";
                                    } else if (isSelected && !isCorrect) {
                                        className += "bg-red-500/10 border border-red-500/20";
                                        shadow = "none";
                                    } else {
                                        className += "opacity-40";
                                        shadow = "none";
                                    }
                                } else {
                                    if (isSelected) {
                                        className += "nm-inset-bezel text-[var(--foreground)] font-bold";
                                        shadow = "none";
                                    } else {
                                        className += "hover:translate-x-1 hover:bg-[var(--foreground)]/5 active:scale-[0.99]";
                                    }
                                }

                                return (
                                    <button key={idx}
                                        onClick={() => status === 'taking' && handleAnswer(idx)}
                                        disabled={status === 'review'}
                                        className={className}
                                        style={{ boxShadow: shadow }}>
                                        <span className={`text-[14px] ${
                                            isSelected && status === 'taking' ? 'text-[var(--foreground)] font-medium' :
                                            status === 'review' && isCorrect ? 'text-[#10B981] font-medium' :
                                            status === 'review' && isSelected && !isCorrect ? 'text-[#EF4444]' :
                                            'text-[var(--foreground-muted)]'
                                        }`}>
                                            {option}
                                        </span>
                                        {status === 'review' && isCorrect && (
                                            <CheckCircle2 size={18} strokeWidth={1.5} className="ml-auto text-[#10B981]" />
                                        )}
                                        {status === 'review' && isSelected && !isCorrect && (
                                            <XCircle size={18} strokeWidth={1.5} className="ml-auto text-[#EF4444]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {status === 'review' && (
                            <div className="mt-6 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-2"
                                style={{ background: "rgba(59,130,246,0.05)", borderLeft: "3px solid #3B82F6" }}>
                                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#3B82F6]/70 mb-1.5 flex items-center gap-1.5">
                                    <Lightbulb size={14} strokeWidth={1.5} />
                                    Explanation
                                </h4>
                                <p className="text-[13px] text-[var(--foreground-muted)] leading-relaxed">
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-5 md:px-8 py-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                        <button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:text-[var(--foreground-muted)] transition-all nm-button"
                        >
                            Prev
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            status === 'taking' ? (
                                <button onClick={handleSubmit} disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                                    style={{
                                        background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E",
                                        boxShadow: "0 4px 12px rgba(245,158,11,0.25)",
                                    }}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                                </button>
                            ) : (
                                <button onClick={() => setStatus('verdict')}
                                    className="px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[#F59E0B] nm-button"
                                >
                                    View Results
                                </button>
                            )
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all bg-white text-black active:scale-[0.95]"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="rounded-[32px] p-8 max-w-sm mx-4 animate-in zoom-in-95 nm-flat text-center">
                        <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-6">
                            <FileText size={30} strokeWidth={1.5} className="text-[#F59E0B]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Submit Quiz?</h3>
                        <p className="text-sm text-[var(--foreground-muted)] mb-8 leading-relaxed">Your answers will be submitted and graded.</p>
                        
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all nm-button">
                                Back
                            </button>
                            <button onClick={confirmSubmit}
                                className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.95]"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E" }}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ShareCard isOpen={isShareOpen} onClose={() => setIsShareOpen(false)}
                data={{ title, count: `${score}/${questions.length}`, type: "Quiz Score", user: user.name }} />
            
            <EndowmentModal 
                isOpen={isEndowmentOpen} 
                onClose={() => setIsEndowmentOpen(false)}
                currentCredits={user.credits}
                requiredCredits={1}
            />

            <SessionComplete
                isVisible={showSessionComplete}
                onDismiss={() => setShowSessionComplete(false)}
                xpEarned={sessionStats.xp}
                streak={sessionStats.streak}
                streakIncremented={sessionStats.incremented}
                type="quiz"
                title={title}
                extraStat={{ label: "Score", value: `${Math.round((score / questions.length) * 100)}%`, icon: Trophy }}
            />
        </div>
    );
}

export default function QuizPage() {
    return (
        <div className="h-[100dvh] bg-[var(--background)] overflow-hidden relative">
            <SiteHeader showLogo />
            <div className="h-full overflow-y-auto pt-24">
                <Suspense fallback={<div className="flex h-full bg-[var(--background)] items-center justify-center text-[var(--foreground-muted)]">Loading...</div>}>
                    <QuizContent />
                </Suspense>
            </div>
        </div>
    );
}
