"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Zap,
    ChevronLeft,
    FileText,
    Layers,
    Sword,
    Map as MapIcon,
    Share2,
    Sparkles,
    CheckCircle2,
    Clock,
    ArrowRight,
    Lock,
    Trophy,
    BrainCircuit,
    Star,
    X,
    Maximize2,
    Download,
    Terminal,
    Target,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import StandardContainer from "@/components/ui/StandardContainer";
import { useToasts } from "@/components/ui/GlobalToasts";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";

// Import Interactive Components
import { InteractiveSummary } from "@/components/features/InteractiveSummary";
import { InteractiveFlashcards } from "@/components/features/InteractiveFlashcards";
import { InteractiveQuiz } from "@/components/features/InteractiveQuiz";
import { StudyRoadmap } from "@/components/features/StudyRoadmap";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface Phase {
    id: string;
    title: string;
    icon: any;
    color: string;
    desc: string;
    content: string;
}

export default function StudyPackPage() {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToasts();
    const { user } = useUser();
    const userLoading = user.isLoading;

    const [completedPhases, setCompletedPhases] = useState<string[]>([]);
    const [isAllCompleted, setIsAllCompleted] = useState(false);
    const [packLoading, setPackLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Workflow States
    const [viewingPhaseIndex, setViewingPhaseIndex] = useState<number | null>(null);
    const [isPerforming, setIsPerforming] = useState(false);
    const [hasTaskCompleted, setHasTaskCompleted] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        quiz: null as { score: number; correct: number; time: string; total: number } | null,
        flashcards: null as { totalCards: number } | null,
        startTime: Date.now(),
        finishTime: null as number | null
    });

    const packId = params.id as string;

    const [phasesData, setPhasesData] = useState<Record<string, any>>({});
    const [isLoadingPhase, setIsLoadingPhase] = useState(false);
    const [sourceText, setSourceText] = useState("");
    const [packTitle, setPackTitle] = useState("Study Pack");

    const phases: Phase[] = [
        {
            id: "distill",
            title: "Deep Summary",
            icon: FileText,
            color: "var(--blue)",
            desc: "The Professor's simple breakdown of your notes.",
            content: "### Simple Breakdown\n\nWe've organized your material into easy-to-understand summaries. This is your foundation."
        },
        {
            id: "retain",
            title: "Memory Cards",
            icon: Layers,
            color: "var(--amber)",
            desc: "Study flashcards with easy memory hooks.",
            content: "### Memory Hooks\n\nThese cards use active practice to help you remember the most important parts."
        },
        {
            id: "test",
            title: "Practice Quiz",
            icon: Sword,
            color: "var(--crimson)",
            desc: "Practice questions tailored to your material.",
            content: "### Final Check\n\nThis quiz helps you find any areas you might need to review again."
        },
        {
            id: "predict",
            title: "Study Roadmap",
            icon: MapIcon,
            color: "var(--emerald)",
            desc: "A simple guide to help you master the subject.",
            content: "### Study Plan\n\nA simple plan for your remaining study time."
        },
    ];

    const supabase = createClient();

    useEffect(() => {
        if (userLoading) return;
        if (!user.isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchPack = async () => {
            setPackLoading(true);
            try {
                const { data, error } = await supabase
                    .from("study_packs")
                    .select("*")
                    .eq("id", packId)
                    .single();

                if (error) {
                    console.error("Fetch Pack Error:", error.message, error.details, error.hint);
                    addToast(`Error: ${error.message || "Failed to load Study Pack"}`, "error");
                    router.push("/library");
                    return;
                }

                if (data) {
                    setSourceText(data.source_text || "");
                    setPackTitle(data.title || "Study Pack");
                    setPhasesData(data.phases_data || {});
                    // Restore progress from DB
                    const completed = Object.keys(data.phases_data || {});
                    setCompletedPhases(completed);
                }
            } catch (err) {
                console.error("Fetch Pack Unexpected Error:", err);
            } finally {
                setPackLoading(false);
            }
        };

        fetchPack();
    }, [packId, user.isAuthenticated, userLoading]);

    const currentPhase = viewingPhaseIndex !== null ? phases[viewingPhaseIndex] : null;

    const handleEnterPhase = (index: number) => {
        if (index > completedPhases.length) {
            addToast("Phase Locked: Complete the earlier steps first.", "error");
            return;
        }
        setViewingPhaseIndex(index);
        setIsPerforming(false);
        setHasTaskCompleted(false);
    };

    const handleBeginTask = async () => {
        const phase = currentPhase;
        if (!phase) return;

        if (phasesData[phase.id]) {
            setIsPerforming(true);
            return;
        }

        if (!sourceText) {
            addToast("Source material is missing. Try creating the pack again.", "error");
            return;
        }

        setIsLoadingPhase(true);
        try {
            const res = await fetch("/api/generate/pack-phase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId,
                    phaseId: phase.id,
                    sourceText
                })
            });

            const result = await res.json();
            if (result.success) {
                setPhasesData(prev => ({ ...prev, [phase.id]: result.data }));
                setIsPerforming(true);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            console.error("Phase Generation Error:", err);
            addToast("The Professor is taking a quick break. Please try again in a moment.", "error");
        } finally {
            setIsLoadingPhase(false);
        }
    };

    const handleMasterPhase = async (stats?: any) => {
        if (!currentPhase) return;

        // Record stats if provided
        if (currentPhase.id === 'test' && stats) {
            setSessionStats(prev => ({ ...prev, quiz: stats }));
        }
        if (currentPhase.id === 'retain' && stats) {
            setSessionStats(prev => ({ ...prev, flashcards: stats }));
        }

        const nextCompleted = completedPhases.includes(currentPhase.id)
            ? completedPhases
            : [...completedPhases, currentPhase.id];

        setCompletedPhases(nextCompleted);

        // Persist to DB
        try {
            const { error: updateError } = await supabase
                .from("study_packs")
                .update({
                    phases_data: {
                        ...phasesData,
                        _mastered: nextCompleted
                    }
                })
                .eq("id", packId);

            if (updateError) throw updateError;
        } catch (err) {
            console.error("Mastery Persistence Error:", err);
        }

        const isLastPhase = viewingPhaseIndex === phases.length - 1;

        if (nextCompleted.length === phases.length || isLastPhase) {
            setSessionStats(prev => ({ ...prev, finishTime: Date.now() }));
            setIsAllCompleted(true);
            setViewingPhaseIndex(null);
            setIsPerforming(false);
            addToast("All steps complete! Your Study Report is now ready.", "success");

            // Wait for DOM update then scroll to report
            setTimeout(() => {
                const reportElement = document.getElementById('final-report');
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            // Auto-advance to next phase intro
            const nextIdx = viewingPhaseIndex! + 1;
            if (phases[nextIdx]) {
                setViewingPhaseIndex(nextIdx);
                setIsPerforming(false);
                setHasTaskCompleted(false);
                addToast(`Phase Mastered! Unlocked: ${phases[nextIdx].title}`, "success");
            } else {
                // Fallback for safety
                setIsAllCompleted(true);
                setViewingPhaseIndex(null);
                setIsPerforming(false);
            }
        }
    };

    const handleShare = () => {
        addToast("Preparing your guide... link copied.", "info");
    };

    const handleExport = () => {
        addToast("Report Exported: Your study plan has been saved.", "success");
    };

    const renderPhaseInteractive = (phase: Phase) => {
        const data = phasesData[phase.id];
        if (!data) return null;

        switch (phase.id) {
            case "distill":
                const summaryText = typeof data === 'string' ? data : (data.summary ? (typeof data.summary === 'string' ? data.summary : JSON.stringify(data.summary)) : "No summary available.");
                return (
                    <InteractiveSummary
                        rawText={sourceText.substring(0, 1000) + "..."}
                        refinedText={summaryText}
                        autoReveal={true}
                    />
                );
            case "retain":
                const rawCards = Array.isArray(data) ? data : (data.cards || []);
                // Map to component schema if needed
                const cards = rawCards.map((c: any, idx: number) => ({
                    front: c.front || c.question || "Term",
                    back: c.back || c.answer || "Definition",
                    topic: c.topic || "Active Recall"
                }));
                return <InteractiveFlashcards cards={cards} onFinish={(stats) => handleMasterPhase(stats)} />;
            case "test":
                const quizQuestions = Array.isArray(data) ? data : (data.questions || [data]);
                return <InteractiveQuiz questions={quizQuestions} onFinish={(stats) => handleMasterPhase(stats)} />;
            case "predict":
                return <StudyRoadmap data={data} />;
            default:
                return null;
        }
    };

    if (!isMounted || packLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[var(--blue)] border-t-transparent animate-spin shadow-[0_0_30px_var(--blue-glow)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--foreground-muted)] animate-pulse">Setting up your study lab</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-16 pt-12 overflow-x-hidden transition-all duration-700">
            <StandardContainer>
                {/* Back Link */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/library')}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2 group"
                    >
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
                    </button>
                </div>

                {/* Hero Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[var(--blue-glow)]">
                                <Zap size={12} className="fill-current" /> Study Pack
                            </div>
                            <div className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Clock size={11} /> {completedPhases.length} / {phases.length} Phases Mastered
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-[0.9] italic mb-4">
                            Your <span className="text-[var(--blue)]">Study Guide</span> <br />
                            Is Ready.
                        </h1>
                        <p className="text-sm sm:text-base text-[var(--foreground-muted)] font-medium leading-relaxed opacity-80">
                            A simple 4-step path. Finish each one to unlock your final <span className="text-[var(--foreground)] font-black">Study Report</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={handleShare}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--border)] transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            <Share2 size={14} /> Share Guide
                        </button>
                    </div>
                </div>

                {/* Phase Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {phases.map((phase, i) => {
                        const isCompleted = completedPhases.includes(phase.id);
                        const isLocked = i > completedPhases.length;

                        return (
                            <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "group p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden",
                                    isLocked ? "bg-[var(--background)] border-[var(--border)] opacity-40 grayscale" :
                                        isCompleted ? "bg-[var(--background-secondary)] border-[var(--emerald)]/30" :
                                            "bg-[var(--background-secondary)] border-[var(--border)] hover:border-[var(--blue)]/40 shadow-2xl"
                                )}
                            >
                                {isCompleted && (
                                    <div className="absolute top-8 right-8">
                                        <div className="w-10 h-10 rounded-full bg-[var(--emerald)] text-white flex items-center justify-center shadow-lg">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-6 mb-8">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all shadow-inner",
                                        isLocked ? "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)]" : ""
                                    )}
                                        style={!isLocked ? {
                                            background: `color-mix(in srgb, ${phase.color}, transparent 92%)`,
                                            borderColor: `color-mix(in srgb, ${phase.color}, transparent 80%)`,
                                            color: phase.color
                                        } : {}}>
                                        {isLocked ? <Lock size={28} strokeWidth={1.5} /> : <phase.icon size={32} strokeWidth={1.5} />}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Phase 0{i + 1}</span>
                                        <h3 className="text-2xl font-black tracking-tight text-[var(--foreground)] uppercase italic leading-none">{phase.title}</h3>
                                    </div>
                                </div>

                                <div className="text-[15px] text-[var(--foreground-muted)] font-medium mb-10 leading-relaxed min-h-[48px] prose prose-invert prose-p:leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {isLocked ? "Complete the previous steps to unlock your final **Study Report**." : phase.desc}
                                    </ReactMarkdown>
                                </div>

                                <div className="flex items-center gap-3 mt-auto">
                                    <button
                                        onClick={() => handleEnterPhase(i)}
                                        disabled={isLocked}
                                        className={cn(
                                            "flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                                            isCompleted ? "bg-[var(--emerald)]/10 text-[var(--emerald)] border border-[var(--emerald)]/20 hover:bg-[var(--emerald)]/20" :
                                                isLocked ? "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)] cursor-not-allowed" :
                                                    "bg-[var(--foreground)] text-[var(--background)] hover:scale-[1.02] shadow-[0_12px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                                        )}
                                    >
                                        {isCompleted ? "REVISIT PHASE" : isLocked ? "LOCKED" : "ENTER PHASE"}
                                        {!isCompleted && !isLocked && <ArrowRight size={16} />}
                                    </button>
                                    {!isLocked && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const url = typeof window !== 'undefined' ? window.location.href : '';
                                                navigator.clipboard.writeText(url);
                                                addToast(`${phase.title} link copied!`, "success");
                                            }}
                                            className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all active:scale-95 shadow-lg"
                                            title={`Share ${phase.title}`}
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Performance Summary Section: THE STUDY WRAP */}
                <AnimatePresence>
                    {isAllCompleted && (
                        <motion.div 
                            key="all-completed"
                            id="final-report"
                            initial={{ opacity: 0, scale: 0.98, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="mt-16 p-6 sm:p-10 rounded-[40px] bg-[var(--background-secondary)] border border-[var(--border)] relative overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.3)] scroll-mt-12"
                        >
                            {/* Abstract Wrapped Background Decorations */}
                            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--blue)]/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[var(--emerald)]/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative z-10 text-center mb-10">
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--blue)] text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg"
                                >
                                    <Star size={14} className="fill-current" /> SESSION WRAP 2026
                                </motion.div>
                                <h2 className="text-3xl sm:text-5xl font-black text-[var(--foreground)] tracking-tighter italic uppercase leading-none mb-3">
                                    The <span className="text-[var(--blue)]">Scholarly</span> Wrap
                                </h2>
                                <p className="text-[var(--foreground-muted)] font-black uppercase tracking-[0.4em] text-[10px]">
                                    {packTitle} • Session Analytics
                                </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                {/* Subject Badge */}
                                <div className="group p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-lg relative overflow-hidden flex flex-col justify-center border-l-4 border-l-[var(--blue)]">
                                    <h4 className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--blue)] mb-1 opacity-80">Cognitive Domain</h4>
                                    <div className="text-xs font-black text-[var(--foreground)] truncate uppercase tracking-tight">
                                        {packTitle}
                                    </div>
                                </div>
                                {/* Quiz Achievement */}
                                <div className="group p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-lg relative overflow-hidden flex flex-col justify-center">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--blue)] mb-1">Accuracy</h4>
                                    <div className="text-2xl font-black text-[var(--foreground)] italic tracking-tighter">
                                        {sessionStats.quiz ? `${sessionStats.quiz.score}%` : 'N/A'}
                                    </div>
                                </div>

                                {/* Flashcard Achievement */}
                                <div className="group p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-lg relative overflow-hidden flex flex-col justify-center">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--amber)] mb-1">Recall</h4>
                                    <div className="text-2xl font-black text-[var(--foreground)] italic tracking-tighter">
                                        {sessionStats.flashcards?.totalCards || 0} <span className="text-[10px] opacity-40">CARDS</span>
                                    </div>
                                </div>

                                {/* Speed Achievement */}
                                <div className="group p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-lg relative overflow-hidden flex flex-col justify-center">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--crimson)] mb-1">Velocity</h4>
                                    <div className="text-2xl font-black text-[var(--foreground)] italic tracking-tighter">
                                        {sessionStats.quiz?.time || "Fast"}
                                    </div>
                                </div>

                                {/* Persona Badge */}
                                <div className="group p-6 rounded-3xl bg-[var(--foreground)] text-[var(--background)] shadow-2xl relative overflow-hidden">
                                    <Sparkles className="w-6 h-6 mb-4 group-hover:rotate-12 transition-transform" />
                                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Verdict</h4>
                                    <div className="text-lg font-black italic tracking-tighter leading-none mb-2 uppercase">
                                        {sessionStats.quiz?.score && sessionStats.quiz.score >= 95 ? "Master Architect" : 
                                         sessionStats.quiz?.score && sessionStats.quiz.score >= 80 ? "Senior Scholar" : 
                                         sessionStats.quiz?.score && sessionStats.quiz.score >= 60 ? "Research Associate" : "Junior Apprentice"}
                                    </div>
                                    <p className="text-[9px] font-bold leading-tight opacity-70">
                                        Classification: Intellectual Rigor.
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[32px] bg-[var(--background)] border border-[var(--border)] mb-10 text-center relative overflow-hidden group">
                                <BrainCircuit className="w-8 h-8 text-[var(--blue)] mx-auto mb-4" />
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Professor&apos;s Assessment</h4>
                                <p className="text-base sm:text-lg text-[var(--foreground)] font-bold leading-snug italic uppercase max-w-2xl mx-auto tracking-tight">
                                    {sessionStats.quiz && sessionStats.quiz.score >= 95 
                                        ? `A surgically precise performance on ${packTitle}. You've moved beyond mere recall into structural mastery. I expect this level of rigor in all future sessions.`
                                        : sessionStats.quiz && sessionStats.quiz.score >= 80
                                        ? `Solid. You've captured the core architecture of ${packTitle}. There is still a slight friction in your analytical speed, but the foundations are secure.`
                                        : sessionStats.quiz && sessionStats.quiz.score >= 60
                                        ? `Competent, but uninspired. You've missed the finer nuances of ${packTitle}. You're seeing the trees, but the forest remains a blur. Revisit Phase 02.`
                                        : sessionStats.quiz && sessionStats.quiz.score > 0
                                        ? `Sub-par. Your grasp of ${packTitle} is currently superficial. Learning isn't passive; it requires cognitive friction. You haven't applied enough of it today.`
                                        : `Engagement pending. You've prepared the laboratory for ${packTitle} but haven't actually stepped inside. Academic success requires more than just showing up.`}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={() => {
                                        const text = `I just finished my Scholarly Wrap with The Professor! 🎓\n\n🎯 Neural Accuracy: ${sessionStats.quiz?.score || 0}%\n⚡ Recall Strength: ${sessionStats.flashcards?.totalCards || 0} cards\n⏱️ Sprint Speed: ${sessionStats.quiz?.time || "Fast"}\n\nJoin the lab: ${window.location.origin}`;
                                        navigator.clipboard.writeText(text);
                                        addToast("Wrap card copied to clipboard!", "success");
                                        
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'The Professor - Study Wrap',
                                                text: text,
                                                url: window.location.href,
                                            }).catch(() => {});
                                        }
                                    }}
                                    className="flex-[2] py-6 rounded-2xl bg-[var(--blue)] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                                >
                                    <Share2 size={20} className="group-hover:rotate-12 transition-transform" /> SHARE SPRINT
                                </button>
                                <button 
                                    onClick={() => router.push('/dashboard')}
                                    className="flex-1 py-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-black text-xs uppercase tracking-[0.2em] hover:bg-[var(--border)] transition-all"
                                >
                                    BACK TO LAB
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </StandardContainer>

            {/* IMMERSIVE PHASE OVERLAY */}
            <AnimatePresence>
                {currentPhase && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-[var(--background)] overflow-hidden flex flex-col"
                    >
                        {/* Immersive Header */}
                        <div className="px-6 h-14 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/80 backdrop-blur-md z-10 shrink-0">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setViewingPhaseIndex(null)}
                                    className="p-2 rounded-xl hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--blue)]">Step 0{viewingPhaseIndex! + 1}</span>
                                    <h2 className="text-xl font-black text-[var(--foreground)] italic uppercase tracking-tight">{currentPhase.title}</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                    <Clock size={14} className="text-[var(--foreground-muted)]" />
                                    <span className="text-[10px] font-black text-[var(--foreground)]">Estimated: 4m</span>
                                </div>
                                <button
                                    onClick={() => setViewingPhaseIndex(null)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Immersive Content Area */}
                        <div className={cn(
                            "flex-1 relative bg-[var(--background)]",
                            (currentPhase.id === 'predict' || currentPhase.id === 'distill' || currentPhase.id === 'retain' || currentPhase.id === 'test') ? "overflow-y-auto" : "overflow-hidden"
                        )}>
                            <AnimatePresence mode="wait">
                                {!isPerforming ? (
                                    <motion.div
                                        key="intro"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="h-full flex flex-col items-center justify-start px-4 sm:px-8 text-center max-w-4xl mx-auto overflow-y-auto scrollbar-none pt-10 sm:pt-20 pb-10"
                                    >
                                        <div className="p-6 rounded-[2rem] bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner mb-6 shrink-0">
                                            <currentPhase.icon size={32} strokeWidth={1} />
                                        </div>

                                        <div className="text-center mb-6">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] mb-2 block">Preparation</span>
                                            <h1 className="text-3xl sm:text-5xl font-black text-[var(--foreground)] tracking-tighter leading-none italic uppercase mb-4">
                                                {currentPhase.title}
                                            </h1>
                                            <div className="prose prose-invert max-w-xl mx-auto text-xs sm:text-sm text-[var(--foreground-muted)] font-medium leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {currentPhase.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-6 md:mb-8">
                                            <div className="p-4 md:p-6 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                                <Terminal size={18} className="text-[var(--blue)] mb-2" />
                                                <h4 className="text-[10px] font-black text-[var(--foreground)] uppercase mb-1">How it works</h4>
                                                <p className="text-[9px] text-[var(--foreground-muted)] font-medium leading-relaxed">
                                                    Go through the material to help it stick. Finish everything for the best result.
                                                </p>
                                            </div>
                                            <div className="p-4 md:p-6 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)]">
                                                <Target size={18} className="text-[var(--emerald)] mb-2" />
                                                <h4 className="text-[10px] font-black text-[var(--foreground)] uppercase mb-1">Goal</h4>
                                                <p className="text-[9px] text-[var(--foreground-muted)] font-medium leading-relaxed">
                                                    Aim to master the concepts or finish all items in this activity.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBeginTask}
                                            disabled={isLoadingPhase}
                                            className="px-10 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-4 group disabled:opacity-50 shrink-0"
                                        >
                                            {isLoadingPhase ? (
                                                <>Thinking... <Loader2 size={16} className="animate-spin" /></>
                                            ) : (
                                                <>Get Started <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" /></>
                                            )}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="task"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "flex flex-col items-center px-4",
                                            (currentPhase.id === 'predict' || currentPhase.id === 'distill' || currentPhase.id === 'retain' || currentPhase.id === 'test') ? "h-auto min-h-full overflow-visible w-full" : "h-full overflow-hidden"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-full mx-auto flex flex-col py-4 md:py-6",
                                            (currentPhase.id === 'predict' || currentPhase.id === 'distill' || currentPhase.id === 'retain' || currentPhase.id === 'test') ? "max-w-5xl h-auto overflow-visible" : "max-w-4xl h-full overflow-hidden"
                                        )}>
                                            <div className="text-center mb-4 shrink-0">
                                                {currentPhase.id !== 'predict' && (
                                                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-2">
                                                        <div className="w-1 h-1 rounded-full bg-[var(--emerald)] animate-pulse" />
                                                        Active
                                                    </div>
                                                )}
                                                {currentPhase.id !== 'predict' && (
                                                    <h3 className="text-lg md:text-xl font-black text-[var(--foreground)] italic tracking-tight uppercase">Checking Understanding</h3>
                                                )}
                                            </div>

                                            <div className={cn(
                                                "w-full relative transition-all duration-500",
                                                (currentPhase.id === 'predict' || currentPhase.id === 'distill' || currentPhase.id === 'retain' || currentPhase.id === 'test')
                                                    ? "bg-transparent border-none p-0 h-auto overflow-visible mb-8"
                                                    : "flex-1 bg-[var(--background-secondary)]/30 rounded-[32px] border border-[var(--border)] p-1 sm:p-2 overflow-hidden mb-3"
                                            )}>
                                                {(currentPhase.id === 'predict' || currentPhase.id === 'distill' || currentPhase.id === 'retain' || currentPhase.id === 'test') ? (
                                                    renderPhaseInteractive(currentPhase)
                                                ) : (
                                                    <div className="w-full h-full overflow-y-auto pr-1 scrollbar-none">
                                                        {renderPhaseInteractive(currentPhase)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Final Phase Action - Only show for non-interactive phases */}
                                            {currentPhase.id !== 'retain' && currentPhase.id !== 'test' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="w-full max-w-md mx-auto shrink-0 pb-6"
                                                >
                                                    <button
                                                        onClick={handleMasterPhase}
                                                        className="w-full py-5 rounded-2xl bg-[var(--blue)] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                                    >
                                                        <CheckCircle2 size={18} /> Finish & Continue
                                                    </button>
                                                    <p className="text-center text-[9px] text-[var(--foreground-muted)] font-bold mt-4 uppercase tracking-widest opacity-60">
                                                        Saving progress to study library
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
