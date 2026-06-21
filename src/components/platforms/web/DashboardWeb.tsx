"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    X, Zap, Upload, AlertTriangle, CheckCircle2, Loader2, AlertCircle,
    FileText, Layers, Sword, Map as MapIcon, Sparkles, Type, ArrowRight,
    Lock, Sparkle, Flame, Library, BookOpen, Swords, ChevronRight,
    BrainCircuit, TrendingUp, Coins
} from "lucide-react";
import { calculateLevel, getLevelTitle, getLevelProgress } from "@/lib/profiles-client";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StandardContainer from "@/components/ui/StandardContainer";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";
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
    handleGenerate: () => void;
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
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
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

    // ─── ERS calculation ───
    const totalCards = dueData?.totalCardsCount || 0;
    const dueCardsCount = dueCount;
    const readinessScore = totalCards > 0 ? Math.max(30, Math.round(((totalCards - dueCardsCount) / totalCards) * 100)) : 100;
    const highestDueDeck = dueData?.decks?.reduce((max: any, deck: any) => deck.dueCount > max.dueCount ? deck : max, { dueCount: 0 });
    const dueDeckTitle = highestDueDeck?.dueCount > 0 ? highestDueDeck.title : "your study packs";
    const degradesIn = dueCardsCount > 0 ? Math.max(2, Math.round(24 - (dueCardsCount * 0.5))) : 24;
    const sprintMin = dueData?.estimatedMinutes || 4;

    // ─── Social proof ───
    const socialProof = useMemo(() => {
        const names = ["Tunde", "Amaka", "Ifeanyi", "Bolu"];
        let hash = 0;
        if (user?.id) {
            for (let i = 0; i < user.id.length; i++) {
                hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
            }
        }
        const nameIdx = Math.abs(hash) % names.length;
        const percent = 12 + (Math.abs(hash) % 8);
        return `💡 ${names[nameIdx]} increased their score by ${percent}% with this sprint last week.`;
    }, [user?.id]);

    const level = calculateLevel(userXp);
    const progress = getLevelProgress(userXp);
    const title = getLevelTitle(level);

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dailyLine = getDailyTip(user?.id || "");

    const readinessColor = useMemo(() => {
        if (readinessScore >= 80) return { stroke: "var(--emerald)", glow: "rgba(43,178,136,0.6)", text: "text-emerald-400" };
        if (readinessScore >= 50) return { stroke: "var(--amber)", glow: "rgba(229,169,60,0.6)", text: "text-amber-400" };
        return { stroke: "var(--crimson)", glow: "rgba(232,93,117,0.6)", text: "text-rose-400" };
    }, [readinessScore]);

    const [showStreakDetails, setShowStreakDetails] = useState(false);
    const [showWrappedDetails, setShowWrappedDetails] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // ─── Time-based category hint ───
    const timeHint = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 5) return "MIDNIGHT CRAM";
        if (hour < 12) return "MORNING FOCUS";
        if (hour < 17) return "AFTERNOON PUSH";
        if (hour < 22) return "EVENING RECAP";
        return "MIDNIGHT PREP";
    }, []);

    // ─── Streak calendar days ───
    const weekDays = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const todayStr = now.toISOString().split("T")[0];
        const activeSet = new Set(activityData?.activeDatesThisWeek || []);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const ds = d.toISOString().split("T")[0];
            return {
                label: ["M", "T", "W", "T", "F", "S", "S"][i],
                active: activeSet.has(ds),
                isToday: ds === todayStr,
                isFuture: ds > todayStr,
            };
        });
    }, [activityData, userStreak]);

    // ─── ProfessorCeremony loading state ───
    if (isGeneratingPack) {
        return (
            <div className="min-h-[calc(100vh-5rem)] bg-transparent pt-20 flex flex-col items-center relative overflow-y-auto">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40 z-0" />
                <StandardContainer className="relative z-10 my-auto">

                    <div className="mb-8 text-center">
                        <button
                            onClick={() => setIsGeneratingPack(false)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-white transition-colors inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-white/5 border border-white/5"
                        >
                            <X size={12} /> Cancel Generation
                        </button>
                    </div>
                    <ProfessorCeremony className="w-full py-12" />
                </StandardContainer>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen relative bg-transparent selection:bg-white/10">
            <StandardContainer className="pt-24 pb-20 relative z-10">
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

                    {/* ═══════════════════════════════════════════════════════════
                        WELCOME BAR — compact single row
                    ═══════════════════════════════════════════════════════════ */}
                    <motion.div variants={fadeUp}>
                        <div
                            className="scholar-card relative p-5 sm:p-6 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                            style={{ borderRadius: "24px" }}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-white pointer-events-none">
                                <Sparkles size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">{timeHint}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/65 font-bold">{dateStr}</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
                                        <Flame size={11} className={cn("text-amber-400", userStreak > 0 && "animate-pulse")} />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400 font-black">{userStreak}d</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
                                        <Zap size={11} className="text-blue-400" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-400 font-black">{userXp.toLocaleString()} XP</span>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                                        <Coins size={11} className="text-emerald-400" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400 font-black">{userCredits}</span>
                                    </div>

                                    <FocusTimer widget={true} />
                                </div>

                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
                                    Hey {firstName},
                                </h2>
                                <p className="text-xs text-white/40 font-bold italic leading-relaxed max-w-2xl">
                                    &ldquo;{dailyLine}&rdquo;
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══════════════════════════════════════════════════════════
                        TWO-COLUMN LAYOUT: Create Zone + Sidebar
                    ═══════════════════════════════════════════════════════════ */}
                    <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-5 gap-6">

                        {/* ─── LEFT: CREATE ZONE (60%) ─── */}
                        <div className="md:col-span-3 space-y-5">

                            {/* Pipeline Pills */}
                            <div className="p-1 border border-white/5 rounded-3xl bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                                <div className="flex flex-wrap items-center gap-1.5 p-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mr-2 flex items-center gap-1.5 shrink-0 ml-2">
                                        <Sparkles size={11} className="text-[#F59E0B]" /> Pipeline:
                                    </span>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/25 transition-all shrink-0">
                                        <FileText size={10} className="text-emerald-400" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400">Summary</span>
                                    </div>
                                    <span className="text-[var(--foreground-muted)]/30 text-[9px] shrink-0 font-bold">➔</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/25 transition-all shrink-0">
                                        <Layers size={10} className="text-indigo-400" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-indigo-400">Cards</span>
                                    </div>
                                    <span className="text-[var(--foreground-muted)]/30 text-[9px] shrink-0 font-bold">➔</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/25 transition-all shrink-0">
                                        <Sword size={10} className="text-red-400" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-red-400">Quiz</span>
                                    </div>
                                    <span className="text-[var(--foreground-muted)]/30 text-[9px] shrink-0 font-bold">➔</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/25 transition-all shrink-0">
                                        <MapIcon size={10} className="text-amber-400" />
                                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-400">Roadmap</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Ingestion Card */}
                            <div
                                className="rounded-[2rem] bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden"
                            >
                                {/* Tab Headers */}
                                <div className="flex bg-white/[0.02] border-b border-white/5 p-2 gap-2">
                                    <button
                                        onClick={() => setActiveTab('upload')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2.5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-2xl",
                                            activeTab === 'upload'
                                                ? 'bg-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5'
                                                : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.02]'
                                        )}
                                    >
                                        <Upload size={13} strokeWidth={2.5} />
                                        Upload File
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('text')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2.5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-2xl",
                                            activeTab === 'text'
                                                ? 'bg-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5'
                                                : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.02]'
                                        )}
                                    >
                                        <Type size={13} strokeWidth={2.5} />
                                        Paste Text
                                    </button>
                                </div>

                                {/* Workspace body */}
                                <div className="p-6 sm:p-8 space-y-6 relative">

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.pptx,.jpg,.jpeg,.png,.webp"
                                    />

                                    {/* Upload Tab */}
                                    {activeTab === 'upload' ? (
                                        <div className="space-y-5">
                                            <div
                                                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                                onDragOver={(e) => { e.preventDefault(); }}
                                                onDrop={(e) => { setDragActive(false); handleDrop(e); }}
                                                onClick={handleUploadClick}
                                                className={cn(
                                                    "py-14 px-6 flex flex-col items-center justify-center text-center transition-all duration-350 rounded-3xl border border-dashed cursor-pointer relative overflow-hidden group select-none",
                                                    dragActive
                                                        ? "bg-white/[0.04] border-white/30 scale-[0.99] shadow-inner"
                                                        : "bg-white/[0.01] border-white/10 hover:bg-white/[0.03] hover:border-white/20"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 bg-white/5 border border-white/5 shadow-lg group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/10",
                                                    dragActive ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "text-white"
                                                )}>
                                                    <Upload className="w-5 h-5" strokeWidth={2} />
                                                </div>
                                                <h4 className="text-sm font-black text-white tracking-wide">Drag & drop your notes here, or click to browse</h4>
                                                <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-[0.15em] font-bold mt-2">PDF, PPTX, DOCX, TXT, or Images</p>
                                                <div className="absolute inset-0 border border-white/0 group-hover:border-white/5 rounded-3xl pointer-events-none transition-all duration-300" />
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] opacity-60">No materials? Try a demo:</span>
                                                <button
                                                    onClick={() => loadDemo('mitosis')}
                                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-md active:scale-95"
                                                >
                                                    Biology (Mitosis)
                                                </button>
                                                <button
                                                    onClick={() => loadDemo('contract')}
                                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-md active:scale-95"
                                                >
                                                    Contract Law
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Paste Lecture Notes</label>
                                                <span className={`text-[10px] font-mono font-black tracking-tighter ${inputText.length > MAX_CHARS * 0.8 ? 'text-red-400' : 'text-[var(--foreground-muted)]/40'}`}>
                                                    {inputText.length > 0 ? `${inputText.length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}` : ''}
                                                </span>
                                            </div>
                                            <div className="relative group rounded-3xl overflow-hidden border border-white/5 focus-within:border-white/20 transition-all bg-white/[0.01]">
                                                <textarea
                                                    value={inputText}
                                                    onChange={(e) => {
                                                        if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
                                                    }}
                                                    placeholder="Paste your syllabus, textbook pages, raw lecture text, or class transcripts here..."
                                                    className="w-full h-44 p-5 bg-transparent text-xs leading-relaxed outline-none font-bold text-white placeholder:text-[var(--foreground-muted)]/35 resize-none custom-scrollbar transition-all"
                                                    disabled={isQueueProcessing}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Config & Actions (AnimatePresence) */}
                                    <AnimatePresence>
                                        {showConfigAndActions && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-6 overflow-hidden"
                                            >
                                                {/* Title & Cost */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                    <div className="flex flex-col space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Sprint Name</label>
                                                        <div className="relative rounded-2xl border border-white/5 focus-within:border-white/20 transition-all bg-white/[0.01] overflow-hidden">
                                                            <input
                                                                type="text"
                                                                value={missionTitle}
                                                                onChange={(e) => {
                                                                    setMissionTitle(e.target.value);
                                                                    setUserEditedTitle(true);
                                                                }}
                                                                placeholder="e.g., 'Bio-Chem Prep' or 'Law 101 Exam'"
                                                                className="w-full bg-transparent px-4 py-3.5 text-xs font-bold text-white placeholder:text-[var(--foreground-muted)]/30 outline-none transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col justify-center shadow-lg relative">
                                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                                            <Zap size={20} className="text-[#F59E0B]" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Cost</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Zap size={13} className="text-emerald-400 fill-current" />
                                                            <span className="text-base font-black italic tracking-tight leading-none uppercase text-white">10 Credits</span>
                                                        </div>
                                                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1.5 font-bold">You have {userCredits} credits.</p>
                                                    </div>
                                                </div>

                                                {/* Ingestion Progress Queue */}
                                                {queue.length > 0 && (
                                                    <div className="space-y-3 pt-4 border-t border-white/5 w-full">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Ingestion Queue</h3>
                                                        <div className="grid gap-3 w-full">
                                                            {queue.map((item) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col gap-3 relative overflow-hidden animate-in fade-in duration-300 w-full"
                                                                >
                                                                    <div className="flex items-center justify-between gap-3 w-full">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0">
                                                                                <FileText size={16} />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                                                                                {item.file && (
                                                                                    <p className="text-[9px] text-[var(--foreground-muted)] font-mono font-bold uppercase">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="shrink-0">
                                                                            {item.status === 'success' && (
                                                                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">Ready</span>
                                                                            )}
                                                                            {item.status === 'error' && (
                                                                                <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase text-red-400">Error</span>
                                                                            )}
                                                                            {(item.status === 'reading' || item.status === 'learning') && (
                                                                                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white flex items-center gap-1.5">
                                                                                    <Loader2 size={10} className="animate-spin text-white" />
                                                                                    <span>Ingesting</span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {item.status === 'error' ? (
                                                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                                                                            <AlertCircle size={12} />
                                                                            <span>{item.errorMessage || "Failed to process document."}</span>
                                                                        </p>
                                                                    ) : (
                                                                        <div className="space-y-1.5">
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <p className="text-[10px] font-bold text-[var(--foreground-muted)]">
                                                                                    {customStatusMsg[item.id] || (item.status === 'success' ? "All notes successfully absorbed" : loadingPhrases[filePhraseIndex[item.id] || 0])}
                                                                                </p>
                                                                                <span className="text-[10px] font-mono font-black text-white">
                                                                                    {item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                                                                <motion.div
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%` }}
                                                                                    className="h-full bg-white rounded-full shadow-[0_0_10px_white]"
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

                                                {/* Errors */}
                                                {setupError && (
                                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in shake duration-500">
                                                        <div className="flex items-center gap-2.5 text-[11px] font-black text-red-400 uppercase tracking-wider">
                                                            <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
                                                            <span className="leading-snug">{setupError}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => { setSetupError(null); }}
                                                            className="px-3 py-1.5 bg-red-500/20 text-red-400 text-[9px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer shrink-0 ml-2"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 pt-2">
                                                    {inputText.trim().length > 0 && (
                                                        <button
                                                            onClick={resetSelection}
                                                            className="px-6 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                                        >
                                                            Clear All
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleGenerate}
                                                        disabled={!hasSuccess || isQueueProcessing}
                                                        className={cn(
                                                            "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-2xl cursor-pointer",
                                                            !hasSuccess || isQueueProcessing
                                                                ? 'opacity-40 cursor-not-allowed bg-white/5 border border-white/5 text-white/20 shadow-none'
                                                                : 'bg-white text-black hover:bg-white/95 active:scale-[0.98]'
                                                        )}
                                                    >
                                                        <Zap size={15} strokeWidth={2.5} className={hasSuccess && !isQueueProcessing ? "animate-pulse" : ""} />
                                                        <span>Start Exam Sprint</span>
                                                        <ArrowRight size={13} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* ─── RIGHT: CONTEXTUAL SIDEBAR (40%) ─── */}
                        <div className="md:col-span-2 space-y-5">

                            {/* ERS Donut Card */}
                            {userState === 'NEW_USER' ? (
                                <div
                                    className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                                    style={{ borderRadius: "24px" }}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles size={14} className="text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Getting Started</span>
                                    </div>
                                    <p className="text-sm font-bold text-white mb-2">Welcome to The Professor!</p>
                                    <p className="text-xs text-white/50 font-bold leading-relaxed mb-4">
                                        Drop your first lecture notes in the Create Zone to build your first Study Pack. Your Exam Readiness Score will appear here after your first session.
                                    </p>
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 w-fit">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Awaiting first sprint</span>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                                    style={{ borderRadius: "24px" }}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Exam Readiness</span>
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase text-white/80">ERS™</span>
                                    </div>

                                    <div className="flex items-center gap-5">
                                        {/* Compact ERS Donut */}
                                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                            <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" strokeDasharray="188.4 62.8" strokeLinecap="round" />
                                                <motion.circle cx="50" cy="50" r="40" stroke={readinessColor.stroke} strokeWidth="8" fill="transparent"
                                                    style={{ filter: `drop-shadow(0 0 6px ${readinessColor.glow})` }}
                                                    strokeDasharray="188.4 62.8"
                                                    initial={{ strokeDashoffset: 188.4 }}
                                                    animate={{ strokeDashoffset: 188.4 * (1 - readinessScore / 100) }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className={cn("font-mono text-xl font-black tabular-nums", readinessColor.text)}>{readinessScore}%</span>
                                                <span className="text-[7px] font-black uppercase tracking-wider text-white/40">Ready</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs font-bold text-white/70 leading-relaxed">
                                                {dueCardsCount > 0 ? (
                                                    <>
                                                        Retention for <span className="text-white font-black">{dueDeckTitle}</span> degrades in {degradesIn}h. Run a {sprintMin}-min sprint to preserve your streak.
                                                    </>
                                                ) : (
                                                    <>All caught up! Your memory retention is in perfect shape.</>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-white/40 font-medium">{socialProof}</p>
                                        </div>
                                    </div>

                                    {dueCardsCount > 0 && (
                                        <Link href="/review" className="inline-block mt-4">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer">
                                                <Zap size={12} className="fill-current animate-pulse text-black" />
                                                <span>Resume Active Sprint</span>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Recent Packs */}
                            <div
                                className="scholar-card p-5 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                                style={{ borderRadius: "24px" }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText size={13} className="text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">Recent Packs</span>
                                    </div>
                                    <Link href="/library" className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-wider transition-colors">
                                        View All
                                    </Link>
                                </div>
                                {packsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 size={18} className="animate-spin text-white/40" />
                                    </div>
                                ) : recentPacks.length === 0 ? (
                                    <p className="text-xs text-white/40 font-bold text-center py-4">No packs yet — create your first one!</p>
                                ) : (
                                    <div className="space-y-2">
                                        {recentPacks.map((pack) => (
                                            <Link key={pack.id} href={`/library/pack/${pack.id}`}>
                                                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer">
                                                    <span className="font-bold text-white/80 truncate max-w-[180px]">{pack.title || "Untitled Pack"}</span>
                                                    <ArrowRight size={10} className="text-white/40 shrink-0" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Action Pills */}
                            <div
                                className="scholar-card p-5 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                                style={{ borderRadius: "24px" }}
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic mb-3 block">Quick Actions</span>
                                <div className="flex flex-wrap gap-2">
                                    <Link href="/library" className="group">
                                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/50 border border-white/5 hover:border-blue-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                            <Library size={11} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                            <span>Library</span>
                                        </div>
                                    </Link>
                                    <Link href="/review" className="group">
                                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/50 border border-white/5 hover:border-amber-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                            <Swords size={11} className="text-amber-400 group-hover:scale-110 transition-transform" />
                                            <span>Review</span>
                                        </div>
                                    </Link>
                                    <Link href="/blog" className="group">
                                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/50 border border-white/5 hover:border-indigo-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                            <BookOpen size={11} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                            <span>Blog</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Streak Calendar */}
                            <div
                                className="scholar-card p-5 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                                style={{ borderRadius: "24px" }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Flame size={13} className={cn("text-amber-400", userStreak > 0 && "animate-pulse")} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">Streak · {userStreak}d</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowStreakDetails(!showStreakDetails);
                                            setShowWrappedDetails(false);
                                        }}
                                        className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        {showStreakDetails ? "Hide" : "Details"}
                                    </button>
                                </div>

                                {/* Week dots */}
                                <div className="flex items-center justify-between gap-1.5">
                                    {weekDays.map((day, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1.5">
                                            <span className="text-[9px] font-black text-white/30 uppercase">{day.label}</span>
                                            <div
                                                className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all border",
                                                    day.active
                                                        ? "bg-amber-500/20 border-amber-500/30 shadow-[0_0_8px_rgba(229,169,60,0.2)]"
                                                        : day.isToday
                                                            ? "bg-white/5 border-white/20"
                                                            : day.isFuture
                                                                ? "bg-transparent border-white/5"
                                                                : "bg-white/[0.02] border-white/5"
                                                )}
                                            >
                                                {day.active ? (
                                                    <Flame size={11} className="text-amber-400" />
                                                ) : day.isToday ? (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
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
                                            <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-white/60 uppercase">Active Streak</span>
                                                    <span className="font-mono text-xs font-black text-[var(--amber)] tabular-nums">{userStreak}d 🔥</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-white/60 uppercase">Level</span>
                                                    <span className="font-mono text-xs font-black text-white/80 tabular-nums">Lvl {level} · {title}</span>
                                                </div>
                                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 mt-1">
                                                    <motion.div
                                                        className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-white/30 font-bold">{Math.round(progress)}% to next level</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Weekly Wrapped Toggle */}
                            <div
                                className="scholar-card p-5 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300"
                                style={{ borderRadius: "24px" }}
                            >
                                <button
                                    onClick={() => {
                                        setShowWrappedDetails(!showWrappedDetails);
                                        setShowStreakDetails(false);
                                    }}
                                    className="flex items-center justify-between w-full cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={13} className="text-violet-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">Weekly Wrapped</span>
                                    </div>
                                    <ChevronRight size={14} className={cn("text-white/30 transition-transform duration-200", showWrappedDetails && "rotate-90")} />
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
                                            <div className="pt-4">
                                                <WeeklyWrappedCard />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>
            </StandardContainer>
        </div>
    );
}
