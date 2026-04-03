"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ShareCard from "@/components/ShareCard";

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
    const { user } = useUser();

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingIdx, setLoadingIdx] = useState(0);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const hasStartedGeneration = useRef(false);

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
                        const errData = await response.json().catch(() => ({ error: "Generation failed" }));
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
            setProfessorRemark(data.remark || "Well, that happened. 📝");
        } catch (error) {
            console.error('Failed to get professor remark:', error);
            setProfessorRemark(percentage >= 70 ? "Not bad! 👍" : "Room for improvement. 📚");
        }
        setLoadingRemark(false);

        setStatus('verdict');
        setCurrentIndex(0);
        setIsSubmitting(false);
    };

    const calculateScore = () => {
        return questions.reduce((acc, q, i) => {
            return acc + (answers[i] === q.correctIndex ? 1 : 0);
        }, 0);
    };

    const score = calculateScore();
    const currentQuestion = questions[currentIndex];

    // ═══ GENERATION LOADING SCREEN ═══
    if (isGenerating && questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Phantom Skeleton Layout */}
                <div className="absolute inset-0 flex flex-col p-6 opacity-[0.15] pointer-events-none z-0">
                    <div className="h-14 w-full border-b border-white/5 flex items-center justify-between mb-8 pb-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-lg bg-white/20 animate-pulse" />
                            <div className="w-32 h-4 rounded bg-white/20 animate-pulse" />
                        </div>
                        <div className="w-16 h-6 rounded bg-white/20 animate-pulse" />
                    </div>
                    <div className="max-w-3xl w-full mx-auto space-y-4">
                        <div className="w-full h-32 rounded-2xl bg-white/20 animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="w-full h-16 rounded-xl bg-white/20 animate-pulse" style={{ animationDelay: '0.1s' }} />
                            <div className="w-full h-16 rounded-xl bg-white/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-full h-16 rounded-xl bg-white/20 animate-pulse" style={{ animationDelay: '0.3s' }} />
                            <div className="w-full h-16 rounded-xl bg-white/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <div className="w-3/4 h-16 rounded-xl bg-white/20 animate-pulse mx-auto mt-8" style={{ animationDelay: '0.5s' }} />
                    </div>
                </div>

                <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse opacity-20 z-0" 
                     style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 60%)", filter: "blur(80px)" }} />
                
                {/* Central Console */}
                <div className="relative z-10 w-full max-w-md mx-auto animate-in zoom-in-95 duration-700">
                    <div className="p-1 rounded-3xl" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(0,0,0,0) 50%, rgba(16,185,129,0.05))" }}>
                        <div className="p-8 rounded-[28px] bg-[#08080E]/90 backdrop-blur-2xl border border-white/5 shadow-2xl flex flex-col items-center">
                            
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border-2 border-[#10B981]/20 border-t-[#10B981] animate-spin" style={{ animationDuration: '1.5s' }} />
                                <span className="material-symbols-outlined text-xl text-[#10B981] animate-pulse">tips_and_updates</span>
                            </div>
                            
                            {/* Simulated Terminal */}
                            <div className="w-full bg-[#040406] rounded-xl p-5 border border-white/5 mb-5 h-28 relative overflow-hidden flex flex-col justify-end">
                                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#040406] to-transparent z-10" />
                                <div className="font-mono text-[11px] flex flex-col gap-2 relative z-0">
                                    <span className="text-white/30 truncate">&gt; Initializing Quiz Engine v3.0...</span>
                                    <span className="text-white/40 truncate">&gt; Ingesting active memory context...</span>
                                    <span className="text-[#10B981] truncate animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <b key={loadingIdx}>&gt; {LOADING_PHRASES[loadingIdx]}</b>
                                        <span className="animate-pulse">_</span>
                                    </span>
                                </div>
                            </div>

                            {/* Progress Line */}
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#10B981] rounded-full w-full animate-pulse opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══ ERROR STATE ═══
    if (generationError) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                }}>
                    <span className="material-symbols-outlined text-3xl text-[#EF4444]">error</span>
                </div>
                <h2 className="text-xl font-bold text-white/80 mb-2">Generation Failed</h2>
                <p className="text-sm text-white/30 mb-8 text-center max-w-xs">{generationError}</p>
                <Link href="/create" className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]" style={{
                    background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                }}>
                    Try Again
                </Link>
            </div>
        );
    }

    // ═══ EMPTY STATE — Redirect if no quiz loaded ═══
    if (questions.length === 0 && !isGenerating) {
        return (
            <div className="min-h-screen bg-[#06060B] text-white flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                }}>
                    <span className="material-symbols-outlined text-3xl text-[#F59E0B]">quiz</span>
                </div>
                <h2 className="text-xl font-bold text-white/80 mb-2">No Quiz Loaded</h2>
                <p className="text-sm text-white/30 mb-8 text-center max-w-xs">Head to the Create page to generate a quiz from your study materials.</p>
                <Link href="/create" className="px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]" style={{
                    background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.3), inset 0 2px 3px rgba(255,255,255,0.2)",
                }}>
                    Create a Quiz
                </Link>
            </div>
        );
    }

    // ═══ VERDICT SCREEN ═══
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

        // Sharing links
        const resUrl = generationId ? `${window.location.origin}/quiz?id=${generationId}` : window.location.href;
        const scoreText = `I just scored ${score}/${questions.length} (${percentage}%) on my ${title} assessment with The Professor. 🎓 Progressing toward mastery!`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(scoreText)}%20${encodeURIComponent(resUrl)}`;
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(scoreText)}&url=${encodeURIComponent(resUrl)}&hashtags=TheProfessorAI`;

        return (
            <div className="min-h-screen bg-[#06060B] text-white relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute w-[800px] h-[800px] top-[-10%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />
                <div className="absolute w-[600px] h-[600px] bottom-[-10%] left-[-10%] rounded-full bg-[var(--secondary)]/5 blur-[100px] pointer-events-none" />

                <header className="h-16 border-b border-white/5 bg-[#06060B]/80 backdrop-blur-xl px-4 flex items-center justify-between relative z-50">
                    <button 
                        onClick={() => setIsShareOpen(true)}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-[#F59E0B]"
                        title="Share Achievement"
                    >
                        <span className="material-symbols-outlined text-[20px]">ios_share</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Academic Transcript</span>
                        <span className="text-[12px] font-bold text-white/80">{title}</span>
                    </div>
                    <div className="w-8" /> {/* Spacer */}
                </header>

                <main className="relative z-10 flex flex-col items-center px-5 pt-8 pb-12 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* THE TRANSCRIPT BOX */}
                    <div className="w-full relative rounded-[40px] p-[1px] mb-10 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))" }}>
                        <div className="w-full bg-[#0A0A0F]/95 backdrop-blur-3xl rounded-[39px] p-8 md:p-12 relative">
                            
                            {/* Letterhead */}
                            <div className="flex flex-col items-center mb-10 text-center">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-2xl text-[var(--accent)]">school</span>
                                </div>
                                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">The Professor AI</h2>
                                <h3 className="text-[13px] font-bold text-white/80">Office of Academic Excellence</h3>
                            </div>

                            {/* VERIFIED STAMP - Diagonal overlay */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none opacity-[0.08] select-none">
                                <div className="border-[8px] border-[#EF4444] rounded-2xl px-12 py-4 flex flex-col items-center">
                                    <span className="text-7xl font-black text-[#EF4444] tracking-[0.2em]">VERIFIED</span>
                                    <span className="text-sm font-black text-[#EF4444] tracking-[1em] mt-2">ACADEMIC RECORD</span>
                                </div>
                            </div>

                            {/* Score Display */}
                            <div className="flex flex-col items-center mb-10 relative z-10">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mb-4">Final Assessment Score</p>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-8xl font-black tracking-tighter" style={{ color: grade.color, filter: `drop-shadow(0 0 20px ${grade.color}40)` }}>{percentage}</span>
                                    <span className="text-3xl font-bold text-white/20">%</span>
                                </div>
                                <div className="px-5 py-2 rounded-full" style={{ background: `${grade.color}10`, border: `1px solid ${grade.color}20` }}>
                                    <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: grade.color }}>Grade {grade.label}</span>
                                </div>
                            </div>

                            {/* Stats breakdown */}
                            <div className="grid grid-cols-3 gap-4 w-full mb-10 py-6 border-y border-white/5">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white mb-1">{correct}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-white/30">Correct</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white mb-1">{incorrect}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-white/30">Incorrect</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-white/40 mb-1">{unattempted}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-white/20">Skipped</div>
                                </div>
                            </div>

                            {/* Professor's Note */}
                            <div className="mb-10 text-center">
                                <p className="text-sm italic font-serif leading-relaxed text-white/60 px-4">
                                    &ldquo;{professorRemark || "An excellent demonstration of material mastery. Continue with this same academic rigor."}&rdquo;
                                </p>
                            </div>

                            {/* Signature Line */}
                            <div className="flex flex-col items-end pr-4">
                                <div className="text-2xl font-serif text-[var(--accent)]/60 select-none mb-1 rotate-[-2deg]" style={{ fontFamily: "'Dancing Script', 'Cursive', serif" }}>
                                    The Professor
                                </div>
                                <div className="w-32 h-px bg-white/10 mb-2" />
                                <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Authorized Electronic Signature</div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full space-y-4">
                        <button onClick={() => { setStatus('review'); setCurrentIndex(0); }}
                            className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-3 transition-all active:scale-[0.98] bg-white text-[#06060B] hover:bg-white/90 shadow-[0_4px_24px_rgba(255,255,255,0.1)]">
                            <span className="material-symbols-outlined text-lg">rate_review</span>
                            Review Answers
                        </button>

                        <button onClick={() => router.push('/create')}
                            className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
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

    // Derived
    const isAnswered = answers[currentIndex] !== undefined;
    const isFlagged = flags.has(currentIndex);

    // ═══ MAIN QUIZ UI — Contained Card Layout ═══
    return (
        <div className="min-h-screen bg-[#06060B] text-white">
            {/* ─── Top Bar ─── */}
            <header className="h-14 flex items-center justify-between px-4 md:px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/create')} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-white/80">{title}</span>
                        {isGenerating && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status === 'taking' && (
                        <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${timeLeft < 60 ? 'text-[#EF4444] animate-pulse' : 'text-white/40'}`}
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
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

            {/* ─── Main Container ─── */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Exam Card */}
                <div className="rounded-2xl overflow-hidden" style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04)",
                }}>
                    {/* Card Header — Status + Palette */}
                    <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                                <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/40">
                                    {status === 'taking' ? 'Live Exam' : 'Review Mode'}
                                </span>
                            </div>
                            {status === 'taking' && (
                                <button onClick={toggleFlag}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${isFlagged ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-white/20 hover:text-white/40'}`}>
                                    <span className="material-symbols-outlined text-[14px]">flag</span>
                                    Flag
                                </button>
                            )}
                        </div>

                        {/* Question Palette — Horizontal */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {questions.map((_, idx) => {
                                const active = currentIndex === idx;
                                const done = answers[idx] !== undefined;
                                const flagged = flags.has(idx);

                                let bg = "rgba(255,255,255,0.04)";
                                let text = "text-white/25";
                                let ring = "";

                                if (status === 'review') {
                                    const correct = answers[idx] === questions[idx]?.correctIndex;
                                    if (answers[idx] !== undefined) {
                                        bg = correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";
                                        text = correct ? "text-[#10B981]" : "text-[#EF4444]";
                                    }
                                } else {
                                    if (active) { bg = "#3B82F6"; text = "text-white"; }
                                    else if (flagged) { bg = "rgba(245,158,11,0.15)"; text = "text-[#F59E0B]"; ring = "ring-1 ring-[#F59E0B]/30"; }
                                    else if (done) { bg = "rgba(59,130,246,0.15)"; text = "text-[#3B82F6]"; }
                                }

                                return (
                                    <button key={idx} onClick={() => setCurrentIndex(idx)}
                                        className={`w-8 h-8 rounded-lg text-[11px] font-bold flex-shrink-0 transition-all ${text} ${ring} ${active ? 'scale-110' : 'hover:scale-105'}`}
                                        style={{ background: bg }}>
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Question Body */}
                    <div className="px-5 md:px-8 py-6 md:py-8">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[11px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-md text-[#3B82F6]"
                                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                                Question {currentIndex + 1} / {questions.length}
                            </span>
                        </div>

                        <p className="text-[17px] md:text-lg font-medium text-white/85 leading-relaxed mb-8">
                            {currentQuestion.question}
                        </p>

                        {/* Options */}
                        <div className="space-y-2.5">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = answers[currentIndex] === idx;
                                const isCorrect = currentQuestion.correctIndex === idx;

                                let optStyle: React.CSSProperties = {
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                };

                                if (status === 'review') {
                                    if (isCorrect) {
                                        optStyle = { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" };
                                    } else if (isSelected && !isCorrect) {
                                        optStyle = { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" };
                                    } else {
                                        optStyle = { ...optStyle, opacity: 0.4 };
                                    }
                                } else {
                                    if (isSelected) {
                                        optStyle = { background: "#3B82F6", border: "1px solid #3B82F6" };
                                    }
                                }

                                return (
                                    <button key={idx}
                                        onClick={() => status === 'taking' && handleAnswer(idx)}
                                        disabled={status === 'review'}
                                        className={`w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 flex items-center gap-3 group ${
                                            status === 'taking' && !isSelected ? 'hover:bg-white/[0.06]' : ''
                                        }`}
                                        style={optStyle}>
                                        <span className={`text-[14px] ${
                                            isSelected && status === 'taking' ? 'text-white font-medium' :
                                            status === 'review' && isCorrect ? 'text-[#10B981] font-medium' :
                                            status === 'review' && isSelected && !isCorrect ? 'text-[#EF4444]' :
                                            'text-white/60'
                                        }`}>
                                            {option}
                                        </span>
                                        {status === 'review' && isCorrect && (
                                            <span className="ml-auto material-symbols-outlined text-[#10B981] text-lg">check_circle</span>
                                        )}
                                        {status === 'review' && isSelected && !isCorrect && (
                                            <span className="ml-auto material-symbols-outlined text-[#EF4444] text-lg">cancel</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation (Review Only) */}
                        {status === 'review' && (
                            <div className="mt-6 p-4 rounded-xl animate-in fade-in slide-in-from-bottom-2"
                                style={{ background: "rgba(59,130,246,0.05)", borderLeft: "3px solid #3B82F6" }}>
                                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#3B82F6]/70 mb-1.5 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                                    Explanation
                                </h4>
                                <p className="text-[13px] text-white/50 leading-relaxed">
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Card Footer — Navigation */}
                    <div className="px-5 md:px-8 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider text-white/30 hover:text-white/60 disabled:opacity-30 disabled:hover:text-white/30 transition-all"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                                    className="px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[#F59E0B]"
                                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                                    View Results
                                </button>
                            )
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all"
                                style={{ background: "#3B82F6", color: "white" }}>
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="rounded-2xl p-6 max-w-sm mx-4 animate-in zoom-in-95" style={{
                        background: "rgba(15,15,25,0.98)", border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    }}>
                        <h3 className="text-lg font-bold text-white/90 mb-4">Submit Exam?</h3>
                        <div className="space-y-2.5 mb-5 text-[13px]">
                            <p className="flex items-center gap-2 text-white/50">
                                <span className="material-symbols-outlined text-[#10B981] text-lg">check_circle</span>
                                <strong className="text-white/70">{Object.keys(answers).length}</strong> answered
                            </p>
                            <p className="flex items-center gap-2 text-white/50">
                                <span className="material-symbols-outlined text-[#F59E0B] text-lg">flag</span>
                                <strong className="text-white/70">{flags.size}</strong> flagged
                            </p>
                            {Object.keys(answers).length < questions.length && (
                                <p className="flex items-center gap-2 text-[#EF4444]/80">
                                    <span className="material-symbols-outlined text-lg">error</span>
                                    <strong>{questions.length - Object.keys(answers).length}</strong> unattempted
                                </p>
                            )}
                        </div>
                        <p className="text-[11px] text-white/20 mb-5">You can review answers after submission but cannot change them.</p>
                        <div className="flex gap-2.5">
                            <button onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-3 rounded-xl text-[12px] font-bold text-white/40 hover:text-white/60 transition-all"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                Cancel
                            </button>
                            <button onClick={confirmSubmit}
                                className="flex-1 py-3 rounded-xl text-[12px] font-bold transition-all active:scale-[0.97]"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#08080E" }}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ShareCard isOpen={isShareOpen} onClose={() => setIsShareOpen(false)}
                data={{ title, count: `${score}/${questions.length}`, type: "Quiz Score", user: user.name }} />
        </div>
    );
}

export default function QuizPage() {
    return (
        <Suspense fallback={<div className="flex h-screen bg-[#06060B] items-center justify-center text-white/30">Loading...</div>}>
            <QuizContent />
        </Suspense>
    );
}
