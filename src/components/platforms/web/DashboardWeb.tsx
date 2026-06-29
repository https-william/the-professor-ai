"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    X, Zap, Upload, AlertTriangle, CheckCircle2, Loader2, AlertCircle,
    FileText, Layers, Sword, Map as MapIcon, Sparkles, Type, ArrowRight,
    Flame, BookOpen, Swords, ChevronRight, BrainCircuit, TrendingUp, Coins, Sparkle, Target, Clock
} from "lucide-react";
import { calculateLevel, getLevelTitle, getLevelProgress } from "@/lib/profiles-client";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StandardContainer from "@/components/ui/StandardContainer";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";
import WeeklyWrappedModal from "@/components/modals/WeeklyWrappedModal";
import { getDailyTip } from "@/lib/education-tips";

const MAX_CHARS = 50000;

const loadingPhrases = [
    "Skimming the abstract...",
    "Reviewing notes & parsing tables...",
    "Translating academic jargon into plain English...",
    "Connecting the dots across chapters...",
    "Distilling high-yield survival concepts...",
    "Almost there. Polishing the wisdom..."
];

interface DashboardWebProps {
    user: any;
    activityData: any;
    dueCount: number;
    dueData: any;
    studyPlan: string | null;
    planLoading: boolean;
    greeting: string;
    firstName: string;
    handleRecover: () => void;
    canRecover: boolean;
    isProcessingAction: boolean;
    handleShare?: () => void;
    inputText: string;
    setInputText: (text: string) => void;
    activeTab: 'upload' | 'text';
    setActiveTab: (tab: 'upload' | 'text') => void;
    missionTitle: string;
    setMissionTitle: (title: string) => void;
    userEditedTitle: boolean;
    setUserEditedTitle: (edited: boolean) => void;
    queue: any[];
    isQueueProcessing: boolean;
    hasSuccess: boolean;
    showConfigAndActions: boolean;
    setupError: string | null;
    setSetupError: (error: string | null) => void;
    handleGenerate: (cardCount?: number, quizCount?: number) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleUploadClick: (e: React.MouseEvent) => void;
    resetSelection: () => void;
    loadDemo: (type: 'mitosis' | 'contract') => void;
    isGeneratingPack: boolean;
    setIsGeneratingPack: (v: boolean) => void;
    trickleProgress: Record<string, number>;
    filePhraseIndex: Record<string, number>;
    customStatusMsg: Record<string, string>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export default function DashboardWeb({
    user, activityData, dueCount, dueData, greeting, firstName,
    handleRecover, canRecover, isProcessingAction,
    inputText, setInputText, activeTab, setActiveTab,
    missionTitle, setMissionTitle, userEditedTitle, setUserEditedTitle,
    queue, isQueueProcessing, hasSuccess, showConfigAndActions,
    setupError, setSetupError, handleGenerate, handleFileSelect,
    handleDrop, handleUploadClick, resetSelection, loadDemo,
    isGeneratingPack, setIsGeneratingPack,
    trickleProgress, filePhraseIndex, customStatusMsg, fileInputRef,
}: DashboardWebProps) {

    // ─── Secret Admin Shortcut (Ctrl+Shift+A) ───
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                try {
                    const res = await fetch('/api/admin/grant-me-admin', { method: 'POST' });
                    if (res.ok) {
                        alert("Admin database role granted! Redirecting...");
                        window.location.href = "/admin";
                    } else {
                        alert("Failed to grant admin role (maybe not in dev mode?).");
                    }
                } catch (err) {
                    console.error("Admin grant error:", err);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ─── Fetch recent study packs ───
    const [recentPacks, setRecentPacks] = useState<any[]>([]);
    const [packsLoading, setPacksLoading] = useState(true);
    useEffect(() => {
        if (!user?.id) return;
        setPacksLoading(true);
        fetch('/api/library')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.generations)) {
                    const sorted = [...data.generations].sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
                    setRecentPacks(sorted.slice(0, 3));
                }
            })
            .catch(err => console.error("Failed to fetch library packs:", err))
            .finally(() => setPacksLoading(false));
    }, [user?.id]);

    // ─── User state derivation ───
    const userState = useMemo(() => {
        if (packsLoading) return 'RETURNING_STUDENT';
        const xp = user?.xp ?? 0;
        const packCount = recentPacks.length;
        if (packCount === 0 && xp < 50) return 'NEW_USER';
        return 'RETURNING_STUDENT';
    }, [recentPacks, packsLoading, user?.xp]);

    // ─── Safe numeric fallbacks ───
    const userXp = user?.xp ?? 0;
    const userStreak = user?.streak ?? 0;
    const userCredits = user?.credits ?? 0;

    // ─── Scholar Aura calculation ───
    const auraScore = Math.min(100, Math.max(0, (userStreak * 5) + Math.min(50, userXp / 100)));
    const auraData = useMemo(() => {
        if (auraScore >= 90) return { label: "Limitless", color: { stroke: "var(--blue)", glow: "rgba(37,99,235,0.4)", text: "text-blue-400" }, icon: Sparkles };
        if (auraScore >= 70) return { label: "Locked In", color: { stroke: "var(--emerald)", glow: "rgba(43,178,136,0.3)", text: "text-emerald-400" }, icon: Target };
        if (auraScore >= 40) return { label: "Cooking", color: { stroke: "var(--amber)", glow: "rgba(229,169,60,0.3)", text: "text-amber-400" }, icon: Flame };
        return { label: "Low Aura", color: { stroke: "var(--crimson)", glow: "rgba(232,93,117,0.2)", text: "text-rose-400" }, icon: Clock };
    }, [auraScore]);

    const auraMessage = useMemo(() => {
        if (auraScore >= 90) return `You're literally untouchable right now. With a ${userStreak}-day streak and ${userXp.toLocaleString()} XP, exams are a joke.`;
        if (auraScore >= 70) return `Solid momentum. You've stacked ${userXp.toLocaleString()} XP. Don't let the ${userStreak}-day streak die.`;
        if (auraScore >= 40) return `You're getting there with ${userXp.toLocaleString()} XP, but we need more reps. Start a sprint.`;
        return `Aura is dangerously low. Your bed misses you, but so do your grades. Wake up.`;
    }, [auraScore, userStreak, userXp]);

    // ─── Social proof / Dynamic Insight ───
    const socialProof = useMemo(() => {
        if (!user?.id) {
            return `💡 Join thousands of students saving hours every week.`;
        }
        const timeSpent = activityData?.stats?.timeSpentSeconds || 0;
        const accuracy = activityData?.stats?.questionsAnswered > 0 ? Math.round((activityData.stats.correctCount / activityData.stats.questionsAnswered) * 100) : 0;
        
        if (timeSpent > 3600 && accuracy > 70) {
            return `💡 You've maintained ${accuracy}% accuracy over ${(timeSpent / 3600).toFixed(1)} hours of study this week. Keep details sharp!`;
        } else if (activityData?.stats?.cardsFlipped > 50) {
            return `💡 Flawless active recall. You've flipped ${activityData.stats.cardsFlipped} flashcards this week!`;
        } else if (timeSpent > 0) {
            return `💡 Locked in ${Math.round(timeSpent / 60)} minutes of pure focus this week. Maintain the momentum.`;
        } else {
            return `💡 Ready to build your brain? Start a study session to generate your personalized insights.`;
        }
    }, [user?.id, activityData]);

    const level = calculateLevel(userXp);
    const progress = getLevelProgress(userXp);
    const title = getLevelTitle(level);

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const dailyLine = getDailyTip(user?.id || "");

    const [showStreakDetails, setShowStreakDetails] = useState(false);
    const [showWrappedDetails, setShowWrappedDetails] = useState(false);
    const [isWeeklyWrappedOpen, setIsWeeklyWrappedOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const creatorStudioRef = useRef<HTMLDivElement>(null);

    // Custom configuration parameters
    const [cardCount, setCardCount] = useState(10);
    const [quizCount, setQuizCount] = useState(15);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    // ─── Streak calendar days ───
    const weekDays = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getUTCDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() + mondayOffset);
        monday.setUTCHours(0, 0, 0, 0);
        const todayStr = now.toISOString().split("T")[0];
        const activeSet = new Set(activityData?.activeDatesThisWeek || []);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setUTCDate(monday.getUTCDate() + i);
            const ds = d.toISOString().split("T")[0];
            return {
                label: ["M", "T", "W", "T", "F", "S", "S"][i],
                active: activeSet.has(ds),
                isToday: ds === todayStr,
                isFuture: ds > todayStr,
            };
        });
    }, [activityData, userStreak]);

    // Handle redirection anchor scroll to Creator Studio
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("sprint") === "new") {
                setTimeout(() => {
                    creatorStudioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 600);
            }
        }
    }, []);

    // ─── ProfessorCeremony loading state ───
    if (isGeneratingPack) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-[var(--violet)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] animate-pulse">
                        Generating Study Pack...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen relative bg-transparent selection:bg-[var(--border-2)]">
            <StandardContainer className="pt-24 pb-20 relative z-10">
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

                    {/* ═══════════════════════════════════════════════════════════
                        WELCOME BAR — Elegant, borderless, text-based header
                    ═══════════════════════════════════════════════════════════ */}
                    <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2 border-b border-[var(--border)]">
                        <div className="space-y-2 max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-3">
                                Hey {firstName},
                            </h2>
                            <p className="text-sm text-[var(--foreground-secondary)] font-bold italic leading-relaxed">
                                &ldquo;{dailyLine}&rdquo;
                            </p>
                        </div>

                        {/* Clean Status Row */}
                        <div className="flex flex-wrap items-center gap-6 shrink-0 w-fit">
                            <div className="flex items-center gap-2">
                                <Flame size={14} className={cn("text-[var(--foreground-muted)]", userStreak > 0 && "text-amber-400 animate-pulse")} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] leading-none mb-0.5">Streak</span>
                                    <span className="font-mono text-sm leading-none font-black text-[var(--foreground)]">{userStreak}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-blue-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] leading-none mb-0.5">XP</span>
                                    <span className="font-mono text-sm leading-none font-black text-[var(--foreground)]">{userXp.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Coins size={14} className="text-emerald-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-secondary)] leading-none mb-0.5">Credits</span>
                                    <span className="font-mono text-sm leading-none font-black text-[var(--foreground)]">{userCredits}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══════════════════════════════════════════════════════════
                        SYMMETRIC GRID: Left Column (65%) + Right Sidebar (35%)
                    ═══════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4">

                        {/* ─── LEFT COLUMN (65% width) ─── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Creator Studio Inline Card */}
                            <motion.div
                                ref={creatorStudioRef}
                                variants={fadeUp}
                                className="scholar-card relative w-full bg-[var(--bg-2)]/45 ring-1 ring-[var(--border)] backdrop-blur-2xl shadow-2xl rounded-[24px] flex flex-col p-5 space-y-5"
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-[var(--violet)] animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-secondary)] italic">Creator Studio</span>
                                    </div>
                                    {(inputText || queue.length > 0) && (
                                        <button
                                            onClick={resetSelection}
                                            className="text-[9px] font-black text-[var(--foreground-muted)] hover:text-[var(--foreground)] uppercase tracking-wider transition-colors cursor-pointer border-0 bg-transparent"
                                        >
                                            Reset Form
                                        </button>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="space-y-5">
                                    {/* Ingestion type tabs */}
                                    <div className="flex bg-[var(--border)]/30 border border-[var(--border)] p-1 rounded-2xl gap-1">
                                        <button
                                            onClick={() => setActiveTab('upload')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2.5 py-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-xl border-0",
                                                activeTab === 'upload'
                                                    ? 'bg-[var(--border-2)] text-[var(--foreground)] shadow-md'
                                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/15'
                                            )}
                                        >
                                            <Upload size={12} strokeWidth={2.5} />
                                            Upload File
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('text')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2.5 py-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-xl border-0",
                                                activeTab === 'text'
                                                    ? 'bg-[var(--border-2)] text-[var(--foreground)] shadow-md'
                                                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/15'
                                            )}
                                        >
                                            <Type size={12} strokeWidth={2.5} />
                                            Paste Text
                                        </button>
                                    </div>

                                    {/* Tab Body */}
                                    {activeTab === 'upload' ? (
                                        <div className="space-y-4">
                                            <div
                                                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                                onDragOver={(e) => { e.preventDefault(); }}
                                                onDrop={(e) => { setDragActive(false); handleDrop(e); }}
                                                onClick={handleUploadClick}
                                                className={cn(
                                                    "py-10 px-4 flex flex-col items-center justify-center text-center transition-all rounded-2xl border border-dashed cursor-pointer relative overflow-hidden group select-none",
                                                    dragActive
                                                        ? "bg-white/[0.04] border-white/30 scale-[0.99]"
                                                        : "bg-[var(--border)]/15 border-[var(--border-2)] hover:bg-[var(--border)]/30 hover:border-white/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 bg-[var(--border)] border border-[var(--border)] shadow-md group-hover:scale-105",
                                                    dragActive ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "text-[var(--foreground)]"
                                                )}>
                                                    <Upload className="w-4.5 h-4.5" strokeWidth={2} />
                                                </div>
                                                <h4 className="text-xs font-black text-[var(--foreground)] tracking-wide">Drag & drop your notes here, or click to browse</h4>
                                                <p className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-[0.15em] font-bold mt-1">PDF, PPTX, DOCX, TXT, or Images</p>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)] opacity-55">Or load a demo pack:</span>
                                                <button
                                                    onClick={() => loadDemo('mitosis')}
                                                    className="px-3 py-1.5 rounded-lg bg-[var(--border)] hover:bg-[var(--border-2)] border border-[var(--border)] text-[9px] font-black uppercase tracking-wider text-[var(--foreground)] transition-all cursor-pointer shadow active:scale-95"
                                                >
                                                    Mitosis
                                                </button>
                                                <button
                                                    onClick={() => loadDemo('contract')}
                                                    className="px-3 py-1.5 rounded-lg bg-[var(--border)] hover:bg-[var(--border-2)] border border-[var(--border)] text-[9px] font-black uppercase tracking-wider text-[var(--foreground)] transition-all cursor-pointer shadow active:scale-95"
                                                >
                                                    Contract Law
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Paste Lecture Notes</label>
                                                <span className={`text-[9px] font-mono font-black ${inputText.length > MAX_CHARS * 0.8 ? 'text-red-400' : 'text-[var(--foreground-muted)]/40'}`}>
                                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                                </span>
                                            </div>
                                            <div className="relative group rounded-2xl overflow-hidden border border-[var(--border)] focus-within:border-white/15 transition-all bg-[var(--border)]/15">
                                                <textarea
                                                    value={inputText}
                                                    onChange={(e) => {
                                                        if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
                                                    }}
                                                    placeholder="Paste your syllabus, textbook chapters, or transcript content here..."
                                                    className="w-full h-36 p-4 bg-transparent text-[11px] leading-relaxed outline-none font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 resize-none custom-scrollbar transition-all"
                                                    disabled={isQueueProcessing}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Config parameters */}
                                    {showConfigAndActions && (
                                        <div className="space-y-5 pt-4 border-t border-[var(--border)] animate-fade-in">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex flex-col space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Sprint Name</label>
                                                    <div className="relative rounded-xl border border-[var(--border)] focus-within:border-white/15 transition-all bg-[var(--border)]/15 overflow-hidden">
                                                        <input
                                                            type="text"
                                                            value={missionTitle}
                                                            onChange={(e) => {
                                                                setMissionTitle(e.target.value);
                                                                setUserEditedTitle(true);
                                                            }}
                                                            placeholder="e.g. 'Bio-Chem Prep' or 'Contract Law'"
                                                            className="w-full bg-transparent px-3.5 py-2.5 text-[11px] font-bold text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/30 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="p-3.5 rounded-xl bg-[var(--border)]/15 border border-[var(--border)] flex flex-col justify-center relative">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Cost</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Zap size={11} className="text-emerald-400 fill-current" />
                                                        <span className="text-sm font-black italic tracking-tight uppercase text-[var(--foreground)] leading-none">10 Credits</span>
                                                    </div>
                                                    <p className="text-[8px] text-[var(--foreground-muted)] mt-1 font-bold">You have {userCredits} credits remaining.</p>
                                                </div>
                                            </div>

                                            {/* CUSTOM CONFIGURATION SETTINGS (Cards & Quiz counts) */}
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer border-0 bg-transparent"
                                                >
                                                    <Sparkle size={12} className={showAdvancedSettings ? "text-amber-400" : ""} />
                                                    <span>{showAdvancedSettings ? "Hide Advanced Settings" : "Advanced Config"}</span>
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {showAdvancedSettings && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-4 rounded-2xl bg-[var(--border)]/30 border border-[var(--border)] space-y-4">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-secondary)] block">Custom Sprint Configuration</span>
                                                            
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <div className="flex justify-between items-center">
                                                                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Flashcards Count</label>
                                                                        <span className="text-[10px] font-mono font-black text-amber-400">{cardCount} Cards</span>
                                                                    </div>
                                                                    <select
                                                                        value={cardCount}
                                                                        onChange={(e) => setCardCount(Number(e.target.value))}
                                                                        className="w-full bg-[var(--bg-2)] border border-[var(--border-2)] rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--foreground)] outline-none cursor-pointer hover:border-white/20 transition-all border-0"
                                                                    >
                                                                        <option value={5}>5 Cards (Quick recap)</option>
                                                                        <option value={10}>10 Cards (Standard)</option>
                                                                        <option value={15}>15 Cards (Thorough)</option>
                                                                        <option value={20}>20 Cards (Deep study)</option>
                                                                        <option value={25}>25 Cards (Intense)</option>
                                                                        <option value={30}>30 Cards (Exam cram)</option>
                                                                    </select>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <div className="flex justify-between items-center">
                                                                        <label className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Quiz Questions</label>
                                                                        <span className="text-[10px] font-mono font-black text-amber-400">{quizCount} Questions</span>
                                                                    </div>
                                                                    <select
                                                                        value={quizCount}
                                                                        onChange={(e) => setQuizCount(Number(e.target.value))}
                                                                        className="w-full bg-[var(--bg-2)] border border-[var(--border-2)] rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--foreground)] outline-none cursor-pointer hover:border-white/20 transition-all border-0"
                                                                    >
                                                                        <option value={5}>5 Questions (Short quiz)</option>
                                                                        <option value={10}>10 Questions (Regular)</option>
                                                                        <option value={15}>15 Questions (Standard exam)</option>
                                                                        <option value={20}>20 Questions (Heavy practice)</option>
                                                                        <option value={25}>25 Questions (Simulated exam)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Ingestion Queue */}
                                            {queue.length > 0 && (
                                                <div className="space-y-2.5 pt-2 border-t border-[var(--border)] w-full">
                                                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Ingestion Progress</h3>
                                                    <div className="grid gap-2 w-full">
                                                        {queue.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="p-3.5 rounded-xl bg-[var(--border)]/15 border border-[var(--border)] flex flex-col gap-2 relative overflow-hidden w-full"
                                                            >
                                                                <div className="flex items-center justify-between gap-3 w-full">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <FileText size={14} className="text-[var(--foreground-secondary)] shrink-0" />
                                                                        <h4 className="text-[11px] font-black text-[var(--foreground)] truncate max-w-[280px]">{item.name}</h4>
                                                                    </div>
                                                                    <div className="shrink-0">
                                                                        {item.status === 'success' && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400">Absorbed</span>
                                                                        )}
                                                                        {item.status === 'error' && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black uppercase text-red-400">Failed</span>
                                                                        )}
                                                                        {(item.status === 'reading' || item.status === 'learning') && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-[var(--border)] border border-[var(--border-2)] text-[8px] font-black uppercase text-[var(--foreground)] flex items-center gap-1">
                                                                                <Loader2 size={8} className="animate-spin text-[var(--foreground)]" />
                                                                                <span>Reading</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {item.status === 'error' ? (
                                                                    <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">
                                                                        <AlertCircle size={10} />
                                                                        <span>{item.errorMessage || "Failed to process document."}</span>
                                                                    </p>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center justify-between text-[9px] font-bold text-[var(--foreground-muted)]">
                                                                            <span>{customStatusMsg[item.id] || (item.status === 'success' ? "Ready for sprint" : loadingPhrases[filePhraseIndex[item.id] || 0])}</span>
                                                                            <span className="text-[var(--foreground)] font-mono">{item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%</span>
                                                                        </div>
                                                                        <div className="w-full bg-[var(--border)] rounded-full h-1 overflow-hidden border border-[var(--border)]">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%` }}
                                                                                className="h-full bg-white rounded-full"
                                                                                transition={{ ease: "easeOut" }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Setup Errors */}
                                            {setupError && (
                                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-wider">
                                                        <AlertTriangle size={14} className="shrink-0" />
                                                        <span>{setupError}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setSetupError(null)}
                                                        className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[8px] uppercase tracking-wider font-black rounded hover:bg-red-500/30 transition-colors cursor-pointer shrink-0 border-0"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            )}

                                            {/* Form Actions */}
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    onClick={resetSelection}
                                                    className="px-5 py-3 border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all cursor-pointer border-0 bg-transparent"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => handleGenerate(cardCount, quizCount)}
                                                    disabled={!hasSuccess || isQueueProcessing}
                                                    className={cn(
                                                        "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer border-0",
                                                        !hasSuccess || isQueueProcessing
                                                            ? 'opacity-40 cursor-not-allowed bg-[var(--border)] text-[var(--foreground-muted)]/50 border border-[var(--border)]'
                                                            : 'bg-white text-black hover:bg-zinc-150 active:scale-[0.98]'
                                                    )}
                                                >
                                                    <Zap size={12} className={hasSuccess && !isQueueProcessing ? "animate-pulse" : ""} />
                                                    <span>Start Exam Sprint</span>
                                                    <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Section 1: Active Study Packs */}
                            <motion.div variants={fadeUp} className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
                                        <BookOpen size={16} className="text-[var(--violet)]" />
                                        <span>Active Study Packs</span>
                                    </h3>
                                    <button
                                        onClick={() => creatorStudioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-[var(--foreground)] font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                                    >
                                        <Zap size={12} className="fill-current text-[var(--foreground)]" />
                                        <span>+ New Sprint</span>
                                    </button>
                                </div>

                                {packsLoading ? (
                                    <div className="scholar-card p-10 bg-[var(--bg-2)]/45 border border-[var(--border)] backdrop-blur-2xl flex items-center justify-center rounded-[24px]">
                                        <Loader2 size={24} className="animate-spin text-[var(--violet)]" />
                                    </div>
                                ) : recentPacks.length === 0 ? (
                                    <div className="scholar-card p-8 bg-gradient-to-b from-zinc-950/60 to-zinc-950/20 shadow-2xl shadow-black/80 ring-1 ring-[var(--border)] backdrop-blur-3xl text-center rounded-[24px] space-y-4">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--border-2)]/30 text-[var(--foreground-secondary)] mb-2 shadow-inner">
                                            <BookOpen size={18} />
                                        </div>
                                        <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-wider italic">No active sprints yet</h4>
                                        <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto leading-relaxed font-bold">
                                            Let's turn your lecture notes or textbooks into instant memory sprints. Construct your first pack using the Creator Studio above!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recentPacks.map((pack) => {
                                            const completedPhases = Object.keys(pack.phases_data || {}).filter(k => k !== '_config' && k !== '_mastered');
                                            return (
                                                <Link href={`/library/pack/${pack.id}`} key={pack.id} className="block group">
                                                    <div className="scholar-card p-4 sm:p-5 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 shadow-xl shadow-black/50 ring-1 ring-[var(--border)] group-hover:ring-[var(--blue)]/30 group-hover:shadow-[0_8px_30px_var(--blue-glow)] group-active:scale-[0.99] backdrop-blur-3xl rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300">
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <h4 className="text-sm font-black text-[var(--foreground)] group-hover:text-[var(--blue-text)] transition-colors uppercase tracking-wide truncate max-w-[280px]">
                                                                {pack.title || "Untitled Pack"}
                                                            </h4>
                                                            <p className="text-[9px] text-[var(--foreground-muted)]/80 font-bold uppercase tracking-wider">
                                                                Created {new Date(pack.created_at || pack.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>

                                                        {/* Phase tracker icons */}
                                                        <div className="flex items-center gap-2">
                                                            {[
                                                                { id: 'distill', icon: FileText, label: 'Summary' },
                                                                { id: 'retain', icon: Layers, label: 'Cards' },
                                                                { id: 'test', icon: Sword, label: 'Quiz' },
                                                                { id: 'predict', icon: MapIcon, label: 'Roadmap' }
                                                            ].map((ph) => {
                                                                const isDone = completedPhases.includes(ph.id);
                                                                const Icon = ph.icon;
                                                                return (
                                                                    <div
                                                                        key={ph.id}
                                                                        className={cn(
                                                                            "flex items-center justify-center transition-all relative group/phase",
                                                                            isDone
                                                                                ? "text-emerald-400"
                                                                                : "text-[var(--foreground-muted)]/50"
                                                                        )}
                                                                    >
                                                                        <Icon size={14} />
                                                                        <span className="absolute bottom-full mb-2 hidden group-hover/phase:block bg-zinc-950 border border-[var(--border-2)] text-[8px] font-black uppercase tracking-wider text-[var(--foreground)] px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-50">
                                                                            {ph.label}: {isDone ? "Ready" : "Pending"}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                            <div className="ml-4 pl-4 border-l border-[var(--border)] text-[var(--foreground-muted)]/50 group-hover:text-[var(--foreground)] transition-colors">
                                                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                        </div>

                        {/* ─── RIGHT SIDEBAR (35% width) ─── */}
                        <div className="space-y-6">

                            <motion.div variants={fadeUp}>
                                <div
                                    className="scholar-card p-5 bg-[var(--bg-2)]/45 border border-[var(--border)] backdrop-blur-2xl shadow-2xl rounded-[24px] space-y-5"
                                >
                                    {/* Sidebar Section Header */}
                                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                                        <div className="flex items-center gap-2">
                                            <BrainCircuit size={13} className="text-amber-400" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-secondary)] italic">Progress & Retention</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowStreakDetails(!showStreakDetails);
                                                setShowWrappedDetails(false);
                                            }}
                                            className="text-[9px] font-black text-[var(--foreground-muted)] hover:text-[var(--foreground)] uppercase tracking-wider transition-colors cursor-pointer border-0 bg-transparent"
                                        >
                                            {showStreakDetails ? "Hide Stats" : "Stats"}
                                        </button>
                                    </div>

                                    {/* Side-by-Side: ERS Donut (Left) + Streak dots (Right) */}
                                    <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl">
                                        
                                        {/* Scholar Aura Donut */}
                                        <div className="flex flex-col items-center justify-center flex-1 py-1 relative">
                                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--foreground-muted)] mb-2">Scholar Aura</span>
                                            
                                            {userState === 'NEW_USER' ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--border)]/30">
                                                        <Sparkles size={14} className="text-[var(--foreground-muted)]/50" />
                                                    </div>
                                                    <span className="text-[7px] font-black uppercase tracking-wider text-[var(--foreground-muted)]/80 mt-1">Awaiting</span>
                                                </div>
                                            ) : (
                                                <div className="relative w-16 h-16 flex items-center justify-center">
                                                    <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.02)" strokeWidth="10" fill="transparent" strokeDasharray="188.4 62.8" strokeLinecap="round" />
                                                        <motion.circle cx="50" cy="50" r="40" stroke={auraData.color.stroke} strokeWidth="10" fill="transparent"
                                                            style={{ filter: `drop-shadow(0 0 4px ${auraData.color.glow})` }}
                                                            strokeDasharray="188.4 62.8"
                                                            initial={{ strokeDashoffset: 188.4 }}
                                                            animate={{ strokeDashoffset: 188.4 * (1 - auraScore / 100) }}
                                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                                            strokeLinecap="round" />
                                                    </svg>
                                                    <div className="absolute flex flex-col items-center justify-center pt-0.5">
                                                        <auraData.icon size={10} className={cn("mb-1", auraData.color.text)} />
                                                        <span className={cn("text-[5px] font-black uppercase tracking-[0.2em] leading-none text-center px-2", auraData.color.text)}>{auraData.label}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Vertical divider */}
                                        <div className="w-[1px] h-12 bg-[var(--border)] shrink-0" />

                                        {/* Streak Dots Calendar */}
                                        <div className="flex flex-col items-center justify-center flex-1 py-1">
                                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--foreground-muted)] mb-2">Weekly Streak</span>
                                            
                                            <div className="flex items-center gap-1.5">
                                                {weekDays.map((day, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                                        <span className={cn("text-[7px] font-black uppercase", day.isToday ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]/80")}>{day.label}</span>
                                                        <div
                                                            className={cn(
                                                                "w-5 h-5 flex items-center justify-center transition-all",
                                                                day.active ? "text-amber-400 drop-shadow-[0_0_8px_rgba(229,169,60,0.6)]" : 
                                                                day.isToday ? "bg-[var(--border-2)] rounded-full" : ""
                                                            )}
                                                        >
                                                            {day.active ? (
                                                                <Flame size={12} className="fill-current" />
                                                            ) : day.isToday ? (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                                                            ) : (
                                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Scholar Aura narratives / stats description */}
                                    <div className="space-y-3 pt-1">
                                        {userState === 'NEW_USER' ? (
                                            <p className="text-[11px] font-bold text-[var(--foreground-secondary)] leading-relaxed text-center">
                                                Drop your notes in Creator Studio. Your Scholar Aura will automatically compute here after your first study sprint.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-bold text-[var(--foreground-secondary)] leading-relaxed text-center">
                                                    {auraMessage}
                                                </p>
                                                <p className="text-[10px] text-[var(--foreground-muted)] font-bold text-center">{socialProof}</p>
                                            </div>
                                        )}

                                        {dueCount > 0 && userState !== 'NEW_USER' && (
                                            <Link href="/review" className="block w-full">
                                                <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-black font-black text-[9px] uppercase tracking-[0.2em] shadow-md hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer border-0">
                                                    <Swords size={11} className="text-black" />
                                                    <span>Resume Active Review ({dueCount} Cards)</span>
                                                </div>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Streak details expand */}
                                    <AnimatePresence>
                                        {showStreakDetails && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-[var(--foreground-secondary)] uppercase">Active Streak</span>
                                                        <span className="font-mono font-black text-[var(--amber)]">{userStreak} Days 🔥</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-[var(--foreground-secondary)] uppercase">Academic Level</span>
                                                        <span className="font-mono font-black text-white/80">Lvl {level} · {title}</span>
                                                    </div>
                                                    <div className="w-full bg-[var(--border)] h-1 rounded-full overflow-hidden border border-[var(--border)] mt-1">
                                                        <motion.div
                                                            className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                    <p className="text-[8px] text-[var(--foreground-muted)]/80 font-bold">{Math.round(progress)}% to next rank</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Weekly Wrapped Quick Launcher */}
                                    <div className="pt-3 border-t border-[var(--border)]">
                                        <button
                                            onClick={() => {
                                                setShowWrappedDetails(!showWrappedDetails);
                                                setShowStreakDetails(false);
                                            }}
                                            className="flex items-center justify-between w-full cursor-pointer text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                                        >
                                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                                                <TrendingUp size={11} className="text-violet-400" />
                                                <span>Weekly Wrapped Stories</span>
                                            </div>
                                            <ChevronRight size={11} className={cn("text-[var(--foreground-muted)]/80 transition-transform duration-200", showWrappedDetails && "rotate-90")} />
                                        </button>

                                        <AnimatePresence>
                                            {showWrappedDetails && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-3">
                                                        <WeeklyWrappedCard 
                                                            activityData={activityData} 
                                                            isGuest={userState === 'NEW_USER' || !user?.id} 
                                                            onLaunchWrapped={() => setIsWeeklyWrappedOpen(true)}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>

                        </div>

                    </div>

                </motion.div>
            </StandardContainer>
            <WeeklyWrappedModal
                isOpen={isWeeklyWrappedOpen}
                onClose={() => setIsWeeklyWrappedOpen(false)}
                activityData={activityData}
                firstName={firstName}
                isGuest={userState === 'NEW_USER' || !user?.id}
            />
        </div>
    );
}
