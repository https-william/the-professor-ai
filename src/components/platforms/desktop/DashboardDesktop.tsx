"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Zap, Library, BookOpen, Swords, 
    Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText, TrendingUp, Flame, CheckCircle2, ArrowRight,
    Loader2, X, Upload, Type, Sparkle, AlertCircle, AlertTriangle, Coins, FolderOpen
} from "lucide-react";
import { calculateLevel, getLevelTitle, getLevelProgress } from "@/lib/profiles-client";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StandardContainer from "@/components/ui/StandardContainer";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import { getDailyTip } from "@/lib/education-tips";

interface DashboardDesktopProps {
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
    handleShare: () => void;
    // Ingestion Props
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
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export default function DashboardDesktop({
    user, activityData, dueCount, dueData, firstName,
    handleRecover, canRecover, isProcessingAction,
    inputText, setInputText, activeTab, setActiveTab,
    missionTitle, setMissionTitle, userEditedTitle, setUserEditedTitle,
    queue, isQueueProcessing, hasSuccess, showConfigAndActions,
    setupError, setSetupError, handleGenerate, handleFileSelect,
    handleDrop, handleUploadClick, resetSelection, loadDemo,
    isGeneratingPack, setIsGeneratingPack,
    trickleProgress, filePhraseIndex, customStatusMsg, fileInputRef,
}: DashboardDesktopProps) {

    const userCredits = user?.credits ?? 0;
    const [cardCount, setCardCount] = useState(10);
    const [quizCount, setQuizCount] = useState(15);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const creatorStudioRef = useRef<HTMLDivElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const loadingPhrases = [
        "Skimming the abstract...",
        "Reviewing notes & parsing tables...",
        "Translating academic jargon into plain English...",
        "Connecting the dots across chapters...",
        "Distilling high-yield survival concepts...",
        "Almost there. Polishing the wisdom..."
    ];

    const MAX_CHARS = 50000;

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

    const level = calculateLevel(user.xp);
    const progress = getLevelProgress(user.xp);
    const title = getLevelTitle(level);
    const xpToNext = Math.pow(level, 2) * 100 - user.xp;

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dailyLine = getDailyTip(user.id || "");

    const [showStreakDetails, setShowStreakDetails] = useState(false);
    const [showWrappedDetails, setShowWrappedDetails] = useState(false);

    // Dynamic ERS calculation
    const totalCards = dueData?.totalCardsCount || 0;
    const dueCardsCount = dueCount;
    const readinessScore = totalCards > 0 ? Math.max(30, Math.round(((totalCards - dueCardsCount) / totalCards) * 100)) : 100;

    const readinessColor = useMemo(() => {
        if (readinessScore >= 80) return { stroke: "var(--emerald)", glow: "rgba(43,178,136,0.6)", text: "text-emerald-400" };
        if (readinessScore >= 50) return { stroke: "var(--amber)", glow: "rgba(229,169,60,0.6)", text: "text-amber-400" };
        return { stroke: "var(--crimson)", glow: "rgba(232,93,117,0.6)", text: "text-rose-400" };
    }, [readinessScore]);

    // Highest due deck
    const highestDueDeck = dueData?.decks?.reduce((max: any, deck: any) => deck.dueCount > max.dueCount ? deck : max, { dueCount: 0 });
    const dueDeckTitle = highestDueDeck?.dueCount > 0 ? highestDueDeck.title : "your study packs";

    // Dynamic degrades hours and sprint duration
    const degradesIn = dueCardsCount > 0 ? Math.max(2, Math.round(24 - (dueCardsCount * 0.5))) : 24;
    const sprintMin = dueData?.estimatedMinutes || 4;

    // Dynamic social proof
    const socialProof = useMemo(() => {
        const names = ["Tunde", "Amaka", "Ifeanyi", "Bolu"];
        let hash = 0;
        if (user?.id) {
            for (let i = 0; i < user.id.length; i++) {
                hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
            }
        }
        const nameIdx = Math.abs(hash) % names.length;
        const percent = 12 + (Math.abs(hash) % 8); // 12% to 19%
        return `💡 ${names[nameIdx]} increased their score by ${percent}% with this sprint last week.`;
    }, [user?.id]);

    // Fetch recent study packs
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

    // Auto-derive userState from real data — no dev toggle needed
    const userState = useMemo(() => {
        if (packsLoading) return 'RETURNING_STUDENT'; // show returning while loading
        const xp = user?.xp ?? 0;
        const packCount = recentPacks.length;
        if (packCount === 0 && xp < 50) return 'NEW_USER';
        if (xp >= 500 && packCount >= 3) return 'POWER_LEARNER';
        return 'RETURNING_STUDENT';
    }, [recentPacks, packsLoading, user?.xp]);

    // Time-based category hint
    const timeHint = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 5) return "MIDNIGHT CRAM";
        if (hour < 12) return "MORNING FOCUS";
        if (hour < 17) return "AFTERNOON PUSH";
        if (hour < 22) return "EVENING RECAP";
        return "MIDNIGHT Prep";
    }, []);

    // Streak calendar days
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
    }, [activityData, user?.streak]);

    const renderCreatorStudio = () => (
        <motion.div
            ref={creatorStudioRef}
            variants={fadeUp}
            className="scholar-card relative w-full bg-zinc-950/45 ring-1 ring-white/5 backdrop-blur-2xl shadow-2xl rounded-[24px] flex flex-col p-5 space-y-5"
        >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--violet)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">Creator Studio</span>
                </div>
                {(inputText || queue.length > 0) && (
                    <button
                        onClick={resetSelection}
                        className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-wider transition-colors cursor-pointer border-0 bg-transparent"
                    >
                        Reset Form
                    </button>
                )}
            </div>

            {/* Card Body */}
            <div className="space-y-5">
                {/* Ingestion type tabs */}
                <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-2xl gap-1">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 py-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-xl border-0",
                            activeTab === 'upload'
                                ? 'bg-white/10 text-white shadow-md'
                                : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.01]'
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
                                ? 'bg-white/10 text-white shadow-md'
                                : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/[0.01]'
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
                                    : "bg-white/[0.01] border-white/10 hover:bg-white/[0.02] hover:border-white/20"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 bg-white/5 border border-white/5 shadow-md group-hover:scale-105",
                                dragActive ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "text-white"
                            )}>
                                <Upload className="w-4.5 h-4.5" strokeWidth={2} />
                            </div>
                            <h4 className="text-xs font-black text-white tracking-wide">Drag & drop your notes here, or click to browse</h4>
                            <p className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-[0.15em] font-bold mt-1">PDF, PPTX, DOCX, TXT, or Images</p>
                        </div>

                        {/* Explicit Browse button — only shown on Tauri desktop for clear native UX */}
                        <button
                            onClick={handleUploadClick}
                            disabled={isQueueProcessing}
                            className="w-full py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-white hover:border-white/30 hover:bg-white/[0.02] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
                        >
                            <FolderOpen size={13} />
                            Browse Files
                        </button>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)] opacity-55">Or load a demo pack:</span>
                            <button
                                onClick={() => loadDemo('mitosis')}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow active:scale-95"
                            >
                                Mitosis
                            </button>
                            <button
                                onClick={() => loadDemo('contract')}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow active:scale-95"
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
                        <div className="relative group rounded-2xl overflow-hidden border border-white/5 focus-within:border-white/15 transition-all bg-white/[0.01]">
                            <textarea
                                value={inputText}
                                onChange={(e) => {
                                    if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value);
                                }}
                                placeholder="Paste your syllabus, textbook chapters, or transcript content here..."
                                className="w-full h-36 p-4 bg-transparent text-[11px] leading-relaxed outline-none font-bold text-white placeholder:text-[var(--foreground-muted)]/30 resize-none custom-scrollbar transition-all"
                                disabled={isQueueProcessing}
                            />
                        </div>
                    </div>
                )}

                {/* Config parameters */}
                {showConfigAndActions && (
                    <div className="space-y-5 pt-4 border-t border-white/5 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Sprint Name</label>
                                <div className="relative rounded-xl border border-white/5 focus-within:border-white/15 transition-all bg-white/[0.01] overflow-hidden">
                                    <input
                                        type="text"
                                        value={missionTitle}
                                        onChange={(e) => {
                                            setMissionTitle(e.target.value);
                                            setUserEditedTitle(true);
                                        }}
                                        placeholder="e.g. 'Bio-Chem Prep' or 'Contract Law'"
                                        className="w-full bg-transparent px-3.5 py-2.5 text-[11px] font-bold text-white placeholder:text-[var(--foreground-muted)]/30 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            
                            <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-center relative">
                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">Cost</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Zap size={11} className="text-emerald-400 fill-current" />
                                    <span className="text-sm font-black italic tracking-tight uppercase text-white leading-none">10 Credits</span>
                                </div>
                                <p className="text-[8px] text-[var(--foreground-muted)] mt-1 font-bold">You have {userCredits} credits remaining.</p>
                            </div>
                        </div>

                        {/* CUSTOM CONFIGURATION SETTINGS (Cards & Quiz counts) */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
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
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60 block">Custom Sprint Configuration</span>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Flashcards Count</label>
                                                    <span className="text-[10px] font-mono font-black text-amber-400">{cardCount} Cards</span>
                                                </div>
                                                <select
                                                    value={cardCount}
                                                    onChange={(e) => setCardCount(Number(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-white outline-none cursor-pointer hover:border-white/20 transition-all border-0"
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
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-white outline-none cursor-pointer hover:border-white/20 transition-all border-0"
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
                            <div className="space-y-2.5 pt-2 border-t border-white/5 w-full">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Ingestion Progress</h3>
                                <div className="grid gap-2 w-full">
                                    {queue.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-2 relative overflow-hidden w-full"
                                        >
                                            <div className="flex items-center justify-between gap-3 w-full">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText size={14} className="text-white/60 shrink-0" />
                                                    <h4 className="text-[11px] font-black text-white truncate max-w-[280px]">{item.name}</h4>
                                                </div>
                                                <div className="shrink-0">
                                                    {item.status === 'success' && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400">Absorbed</span>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black uppercase text-red-400">Failed</span>
                                                    )}
                                                    {(item.status === 'reading' || item.status === 'learning') && (
                                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase text-white flex items-center gap-1">
                                                            <Loader2 size={8} className="animate-spin text-white" />
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
                                                        <span className="text-white font-mono">{item.status === 'success' ? 100 : (trickleProgress[item.id] || item.progress || 20)}%</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5">
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
                                className="px-5 py-3 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer border-0 bg-transparent"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => handleGenerate(cardCount, quizCount)}
                                disabled={!hasSuccess || isQueueProcessing}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer border-0",
                                    !hasSuccess || isQueueProcessing
                                        ? 'opacity-40 cursor-not-allowed bg-white/5 text-white/20 border border-white/5'
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
    );

    return (
        <div className="w-full min-h-screen relative bg-transparent selection:bg-white/10">
            <StandardContainer className="pt-24 pb-20 relative z-10" wide={true}>
                <motion.div variants={stagger} initial="hidden" animate="show">

                    {userState === 'NEW_USER' && (
                        <motion.div variants={fadeUp} className="space-y-6">
                            <div className="scholar-card relative p-8 sm:p-12 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "28px" }}>
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white/60 pointer-events-none"><Sparkles size={160} /></div>
                                <div className="relative z-10 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">Getting Started</span>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                                        Welcome, {firstName}!
                                    </h2>
                                    <p className="text-sm text-white/40 font-bold leading-relaxed mb-6">
                                        Let's get your study program up and running. Drop in your lecture materials below to build your very first Study Pack.
                                    </p>
                                </div>
                            </div>

                            {renderCreatorStudio()}
                        </motion.div>
                    )}

                    {userState === 'RETURNING_STUDENT' && (
                        <div className="space-y-6">
                            {/* Welcome Banner */}
                            <motion.div variants={fadeUp} className="mb-6">
                                <div className="scholar-card relative p-6 sm:p-10 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "28px" }}>
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white/60 pointer-events-none"><Sparkles size={160} /></div>
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">{timeHint}</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">{dateStr}</span>
                                            </div>
                                            <FocusTimer widget={true} />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                                            Hey {firstName},
                                        </h2>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white/70 leading-relaxed mb-3 italic uppercase">
                                            &ldquo;{dailyLine}&rdquo;
                                        </h1>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Exam Readiness Score (ERS) & Actionable Narrative Layer */}
                            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="scholar-card p-8 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderRadius: "28px" }}>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Proprietary Metric</span>
                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase text-white/70">ERS™</span>
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight text-white leading-tight">
                                            Exam Readiness Score
                                        </h3>
                                        <div className="space-y-2 border-t border-[var(--border)] pt-3 mt-2">
                                            <p className="text-xs font-bold text-white/70 leading-relaxed">
                                                {dueCardsCount > 0 ? (
                                                    <>
                                                        Your retention loop for <span className="text-white/70 font-black">{dueDeckTitle}</span> degrades in {degradesIn} hours. Run a {sprintMin}-minute Flashcard Sprint right now to preserve your streak.
                                                    </>
                                                ) : (
                                                    <>
                                                        All caught up! Your memory retention is in perfect shape. Keep it up!
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-white/40 font-medium">
                                                {socialProof}
                                            </p>
                                        </div>
                                        <Link href="/review" className="inline-block mt-2">
                                            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer">
                                                <Zap size={13} className="fill-current animate-pulse text-black" />
                                                <span>Resume Active Sprint</span>
                                            </div>
                                        </Link>
                                    </div>
                                    
                                    {/* ERS Donut Progress Meter */}
                                    <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" strokeDasharray="188.4 62.8" strokeLinecap="round" />
                                            <motion.circle cx="50" cy="50" r="40" stroke={readinessColor.stroke} strokeWidth="8" fill="transparent" style={{ filter: `drop-shadow(0 0 6px ${readinessColor.glow})` }} strokeDasharray="188.4 62.8"
                                                initial={{ strokeDashoffset: 188.4 }}
                                                animate={{ strokeDashoffset: 188.4 * (1 - readinessScore / 100) }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className={cn("font-mono text-2xl font-black tabular-nums", readinessColor.text)}>{readinessScore}%</span>
                                            <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Ready</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 flex flex-col justify-between">
                                    <div className="flex flex-wrap gap-2.5 items-center">
                                        <button
                                            onClick={() => creatorStudioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                            className="group border-0 bg-transparent p-0 outline-none cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-emerald-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm">
                                                <Zap size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                                <span>New Session</span>
                                            </div>
                                        </button>
                                        
                                        <Link href="/library" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-blue-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm cursor-pointer">
                                                <Library size={12} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                <span>Library</span>
                                            </div>
                                        </Link>
 
                                        <Link href="/blog" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-indigo-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm cursor-pointer">
                                                <BookOpen size={12} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                                <span>Blog</span>
                                            </div>
                                        </Link>
 
                                        <button
                                            onClick={() => {
                                                setShowStreakDetails(!showStreakDetails);
                                                setShowWrappedDetails(false);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                                showStreakDetails 
                                                    ? "bg-[var(--amber-dim)] border-[var(--amber-border)] text-amber-400" 
                                                    : "bg-[var(--bg-2)] border-[var(--border)] hover:border-amber-500/20"
                                            )}
                                        >
                                            <Flame size={12} className={cn("text-amber-400", user.streak > 0 && "animate-pulse")} />
                                            <span>{user.streak}d Streak</span>
                                        </button>
 
                                        <button
                                            onClick={() => {
                                                setShowWrappedDetails(!showWrappedDetails);
                                                setShowStreakDetails(false);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                                showWrappedDetails 
                                                    ? "bg-[var(--blue-dim)] border-[var(--blue-border)] text-violet-400" 
                                                    : "bg-[var(--bg-2)] border-[var(--border)] hover:border-violet-500/20"
                                            )}
                                        >
                                            <TrendingUp size={12} className="text-violet-400" />
                                            <span>Weekly Wrapped</span>
                                        </button>
                                    </div>

                                    {/* Stat Ribbon */}
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { icon: Zap, label: "XP", value: user.xp?.toLocaleString(), sub: `Lvl ${level} · ${title}`, color: "var(--blue)" },
                                            { icon: Flame, label: "Streak", value: `${user.streak}d`, sub: user.streak > 0 ? "Active" : "Start today", color: "var(--amber)" },
                                        ].map(({ icon: Icon, label, value, sub, color }) => (
                                            <div key={label} className="scholar-card flex items-center gap-4 px-5 py-4 transition-all group flex-1 min-w-[140px]" style={{ borderRadius: "20px" }}>
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `color-mix(in srgb, ${color}, transparent 90%)`, border: `1px solid color-mix(in srgb, ${color}, transparent 80%)` }}>
                                                    <Icon size={16} style={{ color }} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-mono text-lg font-black text-white tabular-nums leading-tight">{value}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider leading-tight font-bold">{sub}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {showStreakDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6 overflow-hidden"
                                        key="streak-details"
                                    >
                                        <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300 shadow-md" style={{ borderRadius: "24px" }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Flame size={16} className="text-[var(--amber)]" />
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-white/70">Momentum Daily Loop</span>
                                                </div>
                                                <div className="text-[11px] font-mono font-black text-[var(--amber)]">{user.streak} Days Active</div>
                                            </div>
                                            <div className="flex w-full justify-between items-center gap-2">
                                                {weekDays.map((day, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all text-xs font-black",
                                                            day.active 
                                                                ? "bg-[var(--amber)] border-[var(--amber-light)]/20 text-black shadow-[0_0_15px_var(--amber-glow)]" 
                                                                : day.isToday 
                                                                ? "border-2 border-dashed border-[var(--amber)] bg-[var(--amber-dim)] text-[var(--amber)]" 
                                                                : "bg-[var(--bg-3)] border-[var(--border)] text-white/40"
                                                        )}>
                                                            {day.label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {showWrappedDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6 overflow-hidden"
                                        key="wrapped-details"
                                    >
                                        <WeeklyWrappedCard />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Progress details */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                    <div className="flex items-center gap-4 py-4 border-t border-b border-[var(--border)]">
                                        <span className="font-mono text-[11px] uppercase tracking-wider text-white/70 font-bold">Level {level}</span>
                                        <div className="flex-1 h-2 bg-[var(--bg-3)] rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full rounded-full bg-[var(--blue)] shadow-[0_0_12px_var(--blue-glow)]" style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="font-mono text-[11px] text-white/40 tabular-nums font-bold">{xpToNext > 0 ? `${xpToNext.toLocaleString()} XP left` : "Max!"}</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {dueCount > 0 && (
                                    <motion.div variants={fadeUp} className="mt-6">
                                        <Link href="/review" className="block group">
                                            <div className="p-6 rounded-[28px] bg-[var(--blue)] border border-[var(--blue-border)] relative overflow-hidden transition-all hover:shadow-[0_0_40px_var(--blue-glow)] flex items-center justify-between">
                                                <div>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-[9px] font-black uppercase tracking-[0.2em] text-black mb-3">
                                                        Priority Task
                                                    </span>
                                                    <h3 className="text-2xl font-black text-black tracking-tighter leading-none mb-1">Resume Session</h3>
                                                    <p className="text-xs font-bold text-white/70">{dueCount} topics pending review.</p>
                                                </div>
                                                <div className="w-14 h-14 rounded-full bg-black text-white/60 flex items-center justify-center shadow-xl group-hover-scale-md transition-transform">
                                                    <ArrowRight size={20} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )}
                                {canRecover && (
                                    <motion.div variants={fadeUp} className="mt-4">
                                        <div className="p-6 rounded-[28px] bg-[var(--amber-dim)] border border-[var(--amber-border)] flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xs font-black text-[var(--amber)] uppercase tracking-[0.4em] mb-2">Streak Recovery</h3>
                                                <p className="text-xs text-white/40 font-medium">Restore {user.lastStreak} days of momentum.</p>
                                            </div>
                                            <button onClick={handleRecover} disabled={isProcessingAction} className="px-5 py-2.5 rounded-xl bg-[var(--amber)] text-black font-black text-[10px] uppercase tracking-widest shadow-md">
                                                Restore (3 CR)
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {renderCreatorStudio()}

                            {/* Recent Study Packs */}
                            <motion.div variants={fadeUp} className="mt-8">
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300 max-w-4xl" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2">
                                            <Library size={14} className="text-white/60" /> Recent Study Packs
                                        </h3>
                                        <Link href="/library" className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:underline flex items-center gap-1.5 transition-all">
                                            View Library <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                    {packsLoading ? (
                                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="animate-spin text-white/40" size={20} />
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Loading packs...</p>
                                        </div>
                                    ) : recentPacks.length === 0 ? (
                                        <div className="py-8 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-[var(--border)]">
                                            <BookOpen size={48} className="text-white/40 mb-3" />
                                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">No study packs generated yet</p>
                                            <button
                                                onClick={() => creatorStudioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--foreground)] text-[var(--background)] font-black text-[9px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer border-0"
                                            >
                                                Create First Pack
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {recentPacks.map((pack) => {
                                                const packType = pack.type || "summary";
                                                const typeBadgeColor = 
                                                    packType === "flashcards" ? "bg-[var(--blue-dim)] border-[var(--blue-border)] text-white/60" :
                                                    packType === "quiz" ? "bg-[var(--cyan-dim)] border-[var(--cyan-border)] text-white/60" :
                                                    "bg-[var(--emerald-dim)] border-[var(--emerald-border)] text-[var(--emerald)]";
                                                const packUrl = packType === "summary" 
                                                    ? `/summary/${pack.id || pack.generation_id}` 
                                                    : `/library/pack/${pack.id || pack.generation_id}`;

                                                return (
                                                    <Link href={packUrl} key={pack.id || pack.generation_id} className="group block">
                                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-[var(--border)] hover:border-[var(--text-3)]/40 transition-all flex-wrap sm:flex-nowrap gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-sans text-sm font-bold text-white truncate group-hover:text-white/60 transition-colors">{pack.title || "Untitled Pack"}</p>
                                                                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                                                                    {new Date(pack.created_at || pack.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className={cn("px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider", typeBadgeColor)}>
                                                                    {packType}
                                                                </span>
                                                                <ChevronRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition-transform" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {userState === 'POWER_LEARNER' && (
                        <motion.div variants={fadeUp} className="space-y-6">
                            {/* Welcome Banner for Power Learner */}
                            <div className="scholar-card relative p-6 sm:p-10 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300 mb-6" style={{ borderRadius: "28px" }}>
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white/60 pointer-events-none"><Sparkles size={160} /></div>
                                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex-1 min-w-[280px]">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">{timeHint} (On a roll!)</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">{dateStr}</span>
                                            </div>
                                            <FocusTimer widget={true} />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                                            Hey {firstName},
                                        </h2>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white/70 leading-relaxed mb-3 italic uppercase">
                                            &ldquo;{dailyLine}&rdquo;
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                            <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" strokeDasharray="188.4 62.8" strokeLinecap="round" />
                                                <motion.circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" fill="transparent" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.5))" }} strokeDasharray="188.4 62.8"
                                                    initial={{ strokeDashoffset: 188.4 }}
                                                    animate={{ strokeDashoffset: 188.4 * (1 - readinessScore / 100) }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="font-mono text-xl font-black text-white tabular-nums">{readinessScore}%</span>
                                                <span className="text-[7px] font-black uppercase tracking-wider text-white/40">ERS™</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Three Column Telemetry Dashboard */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Column 1: Stats */}
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layers className="text-white/60 w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                                            Study Stats
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Total XP</span>
                                            <span className="font-mono text-xs font-black text-white/60 tabular-nums">{user.xp?.toLocaleString()} XP</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Level</span>
                                            <span className="font-mono text-xs font-black text-white tabular-nums">Lvl {level} · {title}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Active Streak</span>
                                            <span className="font-mono text-xs font-black text-[var(--amber)] tabular-nums">{user.streak}d 🔥</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Study Packs</span>
                                            <span className="font-mono text-xs font-black text-[var(--emerald)] tabular-nums">{recentPacks.length}+ active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Concept Retention Curves */}
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BrainCircuit className="text-white/60 w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                                            Retention Stability
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Exam Readiness</span>
                                            <span className="font-mono text-xs font-black text-white tabular-nums">{readinessScore}%</span>
                                        </div>
                                        <div className="w-full bg-[var(--bg-3)] h-2 rounded-full overflow-hidden">
                                            <motion.div
                                                className="bg-[var(--blue)] h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${readinessScore}%` }}
                                                transition={{ duration: 1.2, ease: "easeOut" }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Cards Due</span>
                                            <span className={cn("font-mono text-xs font-black tabular-nums", dueCardsCount > 0 ? "text-[var(--amber)]" : "text-[var(--emerald)]")}>
                                                {dueCardsCount > 0 ? `${dueCardsCount} due` : "0 due ✓"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] font-bold text-white/70 uppercase">Degrades In</span>
                                            <span className="font-mono text-xs font-black text-white tabular-nums">{degradesIn}h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Active Packs */}
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="text-white/60 w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                                            Active Packs
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {recentPacks.length > 0 ? recentPacks.map((pack) => {
                                            const packId = pack.id || pack.generation_id;
                                            return (
                                                <Link key={packId} href={`/library/pack/${packId}`}>
                                                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-white/5 border border-[var(--border)] text-xs hover:border-white/20 transition-all cursor-pointer">
                                                        <span className="font-bold text-white truncate max-w-[140px]">{pack.title || "Untitled Pack"}</span>
                                                        <ArrowRight size={10} className="text-white/40" />
                                                    </div>
                                                </Link>
                                            );
                                        }) : (
                                            <p className="text-xs text-white/40 font-bold text-center py-4">No packs yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {renderCreatorStudio()}
                        </motion.div>
                    )}
                 </motion.div>
            </StandardContainer>
        </div>
    );
}
