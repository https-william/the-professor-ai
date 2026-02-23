"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────
interface ProfessorQuestion {
    question: string;
    modelAnswer: string;
    difficulty: "foundational" | "conceptual" | "analytical";
    keyTerms: string[];
}

interface AnswerResult {
    questionIndex: number;
    question: string;
    studentAnswer: string;
    grade: "correct" | "partial" | "incorrect";
    score: number;
    feedback: string;
    correction: string;
}

interface FinalReport {
    closingStatement: string;
    reviewTopics: string[];
    performanceLevel: "excellent" | "good" | "needs-work" | "poor";
}

type Phase = "setup" | "examining" | "evaluating" | "results";

const MAX_CHARS = 50_000;

const difficultyColors: Record<string, string> = {
    foundational: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    conceptual: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    analytical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const gradeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    correct: { icon: "check_circle", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Correct" },
    partial: { icon: "change_circle", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Partial" },
    incorrect: { icon: "cancel", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Incorrect" },
};

// ─── Main Component ─────────────────────────────────────────────
function ProfessorExamContent() {
    const searchParams = useSearchParams();
    const { resolvedTheme, toggleTheme } = useTheme();

    // State
    const [phase, setPhase] = useState<Phase>("setup");
    const [content, setContent] = useState("");
    const [questions, setQuestions] = useState<ProfessorQuestion[]>([]);
    const [topic, setTopic] = useState("");
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [results, setResults] = useState<AnswerResult[]>([]);
    const [report, setReport] = useState<FinalReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState(7);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const answerRef = useRef<HTMLTextAreaElement>(null);

    // Load content from sessionStorage if coming from Create page
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("professorContent");
            if (stored) {
                setContent(stored);
                sessionStorage.removeItem("professorContent");
            }
        } catch { /* ignore */ }
    }, []);

    // Auto-focus answer input when examining
    useEffect(() => {
        if (phase === "examining" && answerRef.current) {
            answerRef.current.focus();
        }
    }, [phase, currentQIndex]);

    // ─── File Upload ────────────────────────────────────────────
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            const text = await file.text();
            setContent(prev => prev + (prev ? "\n\n" : "") + text.substring(0, MAX_CHARS));
        } else {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await fetch("/api/parse", { method: "POST", body: formData });
                if (res.ok) {
                    const data = await res.json();
                    setContent(prev => prev + (prev ? "\n\n" : "") + (data.text || "").substring(0, MAX_CHARS));
                } else {
                    setError("Failed to parse file.");
                }
            } catch {
                setError("Failed to parse file.");
            }
        }
        e.target.value = "";
    }, []);

    // ─── Generate Questions ─────────────────────────────────────
    const startExam = async () => {
        if (content.trim().length < 50) return;
        setIsLoading(true);
        setLoadingMessage("The Professor is preparing your exam...");
        setError(null);

        try {
            const res = await fetch("/api/professor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate", content, count: questionCount }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate questions");
            }

            const data = await res.json();
            setQuestions(data.questions || []);
            setTopic(data.topic || "Exam");
            setCurrentQIndex(0);
            setResults([]);
            setPhase("examining");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    // ─── Submit Answer ──────────────────────────────────────────
    const submitAnswer = async () => {
        if (!answer.trim() || isLoading) return;

        const q = questions[currentQIndex];
        setIsLoading(true);
        setLoadingMessage("The Professor is evaluating...");
        setPhase("evaluating");

        try {
            const res = await fetch("/api/professor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "evaluate",
                    question: q.question,
                    modelAnswer: q.modelAnswer,
                    studentAnswer: answer,
                    keyTerms: q.keyTerms,
                }),
            });

            if (!res.ok) throw new Error("Evaluation failed");

            const evaluation = await res.json();
            const newResult: AnswerResult = {
                questionIndex: currentQIndex,
                question: q.question,
                studentAnswer: answer,
                grade: evaluation.grade,
                score: evaluation.score,
                feedback: evaluation.feedback,
                correction: evaluation.correction,
            };

            setResults(prev => [...prev, newResult]);
            setAnswer("");

            // Check if exam is complete
            if (currentQIndex >= questions.length - 1) {
                await generateReport([...results, newResult]);
            } else {
                setCurrentQIndex(prev => prev + 1);
                setPhase("examining");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Evaluation failed");
            setPhase("examining");
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    // ─── Generate Report ────────────────────────────────────────
    const generateReport = async (allResults: AnswerResult[]) => {
        setLoadingMessage("The Professor is preparing your score...");

        try {
            const res = await fetch("/api/professor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "report",
                    topic,
                    results: allResults.map(r => ({
                        question: r.question,
                        grade: r.grade,
                        score: r.score,
                    })),
                }),
            });

            if (!res.ok) throw new Error("Report generation failed");

            const reportData = await res.json();
            setReport(reportData);
            setPhase("results");
        } catch {
            // Fallback: show results without AI report
            setReport({
                closingStatement: "Exam complete. Review your answers below.",
                reviewTopics: [],
                performanceLevel: "good",
            });
            setPhase("results");
        }
    };

    // ─── Computed ───────────────────────────────────────────────
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = questions.length;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const performanceEmoji: Record<string, string> = {
        excellent: "🏆",
        good: "✅",
        "needs-work": "📚",
        poor: "💪",
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const resetExam = () => {
        setPhase("setup");
        setContent("");
        setQuestions([]);
        setResults([]);
        setReport(null);
        setCurrentQIndex(0);
        setAnswer("");
        setError(null);
    };

    // ─── RENDER ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-[500px] h-[500px] top-[-10%] left-[20%] rounded-full bg-[#6366F1]/5 blur-3xl" />
                <div className="absolute w-[400px] h-[400px] bottom-[20%] right-[-5%] rounded-full bg-[#8B5CF6]/5 blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    {phase !== "setup" && (
                        <button
                            onClick={resetExam}
                            className="p-1.5 -ml-1 rounded-lg hover:bg-[var(--background-tertiary)] transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                            <span className="material-symbols-outlined text-white text-base">school</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-[var(--foreground)]">The Professor</h1>
                            <p className="text-[10px] text-[var(--foreground-muted)]">
                                {phase === "setup" ? "Oral Examination" :
                                    phase === "examining" ? `Question ${currentQIndex + 1} of ${questions.length}` :
                                        phase === "evaluating" ? "Evaluating..." :
                                            "Exam Results"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-lg">{resolvedTheme === "light" ? "dark_mode" : "light_mode"}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 py-6 relative z-10">

                {/* ═══════════════ PHASE: SETUP ═══════════════ */}
                {phase === "setup" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                        {/* Welcome */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 mb-4">
                                <span className="material-symbols-outlined text-[#6366F1] text-sm">psychology</span>
                                <span className="text-xs font-medium text-[#6366F1]">AI Oral Exam</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
                                The Professor Asks You
                            </h2>
                            <p className="text-sm text-[var(--foreground-secondary)] max-w-md mx-auto">
                                Paste your study notes below. The Professor will generate targeted questions and evaluate your understanding in real-time.
                            </p>
                        </div>

                        {/* Content Input */}
                        <div
                            className={`rounded-2xl border-2 transition-all duration-200 ${dragActive ? "border-[#6366F1] bg-[#6366F1]/5" : "border-[var(--border)] bg-[var(--card)]"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                        >
                            <div className="px-4 pt-3 flex items-center justify-between">
                                <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Your Study Material</label>
                                <span className={`text-[10px] ${content.length > MAX_CHARS * 0.8 ? "text-amber-400" : "text-[var(--foreground-muted)]"}`}>
                                    {content.length > 0 ? `${content.length.toLocaleString()} chars` : ""}
                                </span>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setContent(e.target.value); }}
                                placeholder="Paste your lecture notes, textbook chapter, or any study material here..."
                                className="w-full h-48 px-4 py-3 resize-none bg-transparent text-[var(--foreground)] placeholder-[var(--foreground-muted)]/40 text-sm leading-relaxed focus:outline-none"
                                autoFocus
                            />
                            <div className="px-4 pb-3 flex items-center justify-between border-t border-[var(--border)]">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[#6366F1] transition-colors py-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">upload_file</span>
                                    Upload PDF or TXT
                                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                                </button>
                                {content.length > 0 && content.length < 50 && (
                                    <span className="text-[10px] text-amber-400">Need at least 50 characters</span>
                                )}
                            </div>
                        </div>

                        {/* Question Count */}
                        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                            <label className="text-xs font-semibold text-[var(--foreground)] mb-2.5 block">Number of questions</label>
                            <div className="flex flex-wrap gap-1.5">
                                {[5, 7, 10].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setQuestionCount(c)}
                                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${questionCount === c
                                                ? "bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30"
                                                : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]"
                                            }`}
                                    >
                                        {c} questions
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={startExam}
                            disabled={isLoading || content.trim().length < 50}
                            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2.5 ${isLoading
                                    ? "bg-[#6366F1]/50 cursor-wait"
                                    : content.trim().length >= 50
                                        ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-xl hover:shadow-[#6366F1]/20 hover:scale-[1.01] active:scale-[0.99]"
                                        : "bg-[var(--foreground-muted)]/30 cursor-not-allowed"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    <span className="text-sm">{loadingMessage}</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">school</span>
                                    <span className="text-sm">Begin Oral Exam</span>
                                </>
                            )}
                        </button>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}

                        {/* How it works */}
                        <div className="p-4 rounded-xl bg-[#6366F1]/5 border border-[#6366F1]/10">
                            <p className="text-xs font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[#6366F1] text-sm">info</span>
                                How it works
                            </p>
                            <ol className="text-[11px] text-[var(--foreground-secondary)] space-y-1 list-decimal list-inside leading-relaxed">
                                <li>Paste your study material above</li>
                                <li>The Professor generates targeted questions from YOUR content</li>
                                <li>Answer each question in your own words</li>
                                <li>Get instant feedback: correct, partial, or needs review</li>
                                <li>Receive a final score with personalized study recommendations</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* ═══════════════ PHASE: EXAMINING ═══════════════ */}
                {(phase === "examining" || phase === "evaluating") && questions.length > 0 && (
                    <div className="animate-in fade-in duration-300 space-y-5">
                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                                <span className="font-medium">{topic}</span>
                                <span>{currentQIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Score so far */}
                        {results.length > 0 && (
                            <div className="flex items-center gap-3">
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${gradeConfig[r.grade]?.bg || ""}`}
                                    >
                                        <span className={`material-symbols-outlined text-sm ${gradeConfig[r.grade]?.color || ""}`}>
                                            {gradeConfig[r.grade]?.icon || "circle"}
                                        </span>
                                    </div>
                                ))}
                                {Array.from({ length: questions.length - results.length }).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)]" />
                                ))}
                            </div>
                        )}

                        {/* Last feedback */}
                        <AnimatePresence>
                            {results.length > 0 && phase === "examining" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`p-4 rounded-xl border ${gradeConfig[results[results.length - 1].grade]?.bg || ""}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`material-symbols-outlined text-base ${gradeConfig[results[results.length - 1].grade]?.color || ""}`}>
                                                {gradeConfig[results[results.length - 1].grade]?.icon}
                                            </span>
                                            <span className={`text-xs font-bold uppercase ${gradeConfig[results[results.length - 1].grade]?.color || ""}`}>
                                                {gradeConfig[results[results.length - 1].grade]?.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                                            {results[results.length - 1].feedback}
                                        </p>
                                        {results[results.length - 1].correction && (
                                            <p className="mt-2 text-xs text-[var(--foreground-muted)] italic">
                                                {results[results.length - 1].correction}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Question Card */}
                        <motion.div
                            key={currentQIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl shadow-[#6366F1]/5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${difficultyColors[questions[currentQIndex].difficulty] || difficultyColors.foundational}`}>
                                    {questions[currentQIndex].difficulty}
                                </span>
                                <span className="text-[10px] text-[var(--foreground-muted)]">Q{currentQIndex + 1}</span>
                            </div>

                            <div className="flex gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-white text-base">school</span>
                                </div>
                                <p className="text-base font-medium text-[var(--foreground)] leading-relaxed pt-1">
                                    {questions[currentQIndex].question}
                                </p>
                            </div>

                            {/* Answer Input */}
                            <textarea
                                ref={answerRef}
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Type your answer here... Explain in your own words."
                                className="w-full h-32 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)]/40 resize-none transition-all focus:outline-none"
                                disabled={phase === "evaluating"}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.ctrlKey) {
                                        e.preventDefault();
                                        submitAnswer();
                                    }
                                }}
                            />

                            <div className="flex items-center justify-between mt-3">
                                <span className="text-[10px] text-[var(--foreground-muted)]">Ctrl + Enter to submit</span>
                                <button
                                    onClick={submitAnswer}
                                    disabled={!answer.trim() || phase === "evaluating"}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 ${phase === "evaluating"
                                            ? "bg-[#6366F1]/50 cursor-wait"
                                            : answer.trim()
                                                ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-lg hover:shadow-[#6366F1]/20 active:scale-[0.98]"
                                                : "bg-[var(--foreground-muted)]/30 cursor-not-allowed"
                                        }`}
                                >
                                    {phase === "evaluating" ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            Evaluating...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">send</span>
                                            Submit Answer
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {/* Skip */}
                        {phase === "examining" && (
                            <button
                                onClick={() => {
                                    const skipResult: AnswerResult = {
                                        questionIndex: currentQIndex,
                                        question: questions[currentQIndex].question,
                                        studentAnswer: "(skipped)",
                                        grade: "incorrect",
                                        score: 0,
                                        feedback: "Question skipped.",
                                        correction: questions[currentQIndex].modelAnswer,
                                    };
                                    const newResults = [...results, skipResult];
                                    setResults(newResults);
                                    setAnswer("");
                                    if (currentQIndex >= questions.length - 1) {
                                        generateReport(newResults);
                                    } else {
                                        setCurrentQIndex(prev => prev + 1);
                                    }
                                }}
                                className="w-full py-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                Skip this question →
                            </button>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════ PHASE: RESULTS ═══════════════ */}
                {phase === "results" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-5">
                        {/* Score Hero */}
                        <div className="text-center py-6">
                            <div className="text-5xl mb-3">
                                {performanceEmoji[report?.performanceLevel || "good"]}
                            </div>
                            <div className="relative inline-flex items-center justify-center w-28 h-28 mb-4">
                                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="6" />
                                    <motion.circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke={percentage >= 80 ? "#22C55E" : percentage >= 50 ? "#F59E0B" : "#EF4444"}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - percentage / 100) }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute">
                                    <span className="text-3xl font-black text-[var(--foreground)]">{percentage}%</span>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                                {totalScore}/{maxScore} Correct
                            </h2>
                            <p className="text-xs text-[var(--foreground-muted)]">{topic} — Oral Examination</p>
                        </div>

                        {/* Professor's Closing */}
                        {report && (
                            <div className="p-5 rounded-2xl bg-[#6366F1]/5 border border-[#6366F1]/15">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-sm">school</span>
                                    </div>
                                    <span className="text-xs font-bold text-[#6366F1] uppercase">The Professor&apos;s Remarks</span>
                                </div>
                                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed italic">
                                    &ldquo;{report.closingStatement}&rdquo;
                                </p>
                                {report.reviewTopics.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-[#6366F1]/10">
                                        <p className="text-[10px] font-bold uppercase text-[var(--foreground-muted)] mb-1.5">Recommended Review</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {report.reviewTopics.map((t, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-medium border border-[#6366F1]/20">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Detailed Results */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Question Breakdown</h3>
                            {results.map((r, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${gradeConfig[r.grade]?.bg || ""}`}>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <p className="text-sm font-medium text-[var(--foreground)] flex-1">{r.question}</p>
                                        <span className={`material-symbols-outlined text-lg flex-shrink-0 ${gradeConfig[r.grade]?.color || ""}`}>
                                            {gradeConfig[r.grade]?.icon}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--foreground-secondary)] mb-1">
                                        <strong className="text-[var(--foreground-muted)]">Your answer:</strong> {r.studentAnswer}
                                    </p>
                                    <p className="text-xs text-[var(--foreground-secondary)] italic">{r.feedback}</p>
                                    {r.correction && (
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1 pt-1 border-t border-[var(--border)]/50">
                                            💡 {r.correction}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2.5">
                            <button
                                onClick={resetExam}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold hover:shadow-xl hover:shadow-[#6366F1]/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">refresh</span>
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = "/create"}
                                className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">add</span>
                                Create Study Materials
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ProfessorPage() {
    return (
        <Suspense fallback={<div className="flex h-screen bg-[var(--background)] items-center justify-center text-[var(--foreground-muted)]">Loading...</div>}>
            <ProfessorExamContent />
        </Suspense>
    );
}
