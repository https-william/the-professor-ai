"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Zap, Library, BookOpen, Swords, 
    Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText, TrendingUp, Flame, CheckCircle2, ArrowRight,
    Loader2
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
}: DashboardDesktopProps) {

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

    return (
        <div className="w-full min-h-screen relative bg-[var(--bg)] selection:bg-[var(--blue-dim)]">
            <StandardContainer className="pt-24 pb-20 relative z-10" wide={true}>
                <motion.div variants={stagger} initial="hidden" animate="show">

                    {userState === 'NEW_USER' && (
                        <motion.div variants={fadeUp} className="space-y-6">
                            <div className="scholar-card relative p-8 sm:p-12 overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] shadow-xl" style={{ borderRadius: "28px" }}>
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[var(--blue)] pointer-events-none"><Sparkles size={160} /></div>
                                <div className="relative z-10 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] shadow-sm mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--blue-text)] font-bold">Getting Started</span>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)] mb-3">
                                        Welcome, {firstName}!
                                    </h2>
                                    <p className="text-sm text-[var(--text-3)] font-bold leading-relaxed mb-6">
                                        Let's get your study program up and running. Drop in your lecture materials below to build your very first Study Pack.
                                    </p>

                                    <Link href="/create">
                                        <div className="p-8 flex flex-col items-center justify-center text-center transition-all duration-300 rounded-2xl border border-dashed border-zinc-700 bg-[var(--bg-3)]/20 hover:bg-[var(--bg-3)]/35 cursor-pointer shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)]">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-[var(--background)] shadow-[2px_2px_5px_rgba(0,0,0,0.3)] border border-[var(--border)] text-[var(--blue)]">
                                                <Zap className="w-5 h-5 fill-current" />
                                            </div>
                                            <h4 className="text-sm font-black text-[var(--foreground)]">Drop a lecture slide deck or PDF here to spin up your first Study Pack</h4>
                                            <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold mt-1">PDF, PPTX, DOCX, or Images</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {userState === 'RETURNING_STUDENT' && (
                        <div className="space-y-6">
                            {/* Welcome Banner */}
                            <motion.div variants={fadeUp} className="mb-6">
                                <div className="scholar-card relative p-6 sm:p-10 overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] shadow-xl" style={{ borderRadius: "28px" }}>
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[var(--blue)] pointer-events-none"><Sparkles size={160} /></div>
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--blue-text)] font-bold">{timeHint}</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--text-3)] font-bold">{dateStr}</span>
                                            </div>
                                            <FocusTimer widget={true} />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)] mb-2">
                                            Hey {firstName},
                                        </h2>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-2)] leading-relaxed mb-3 italic uppercase">
                                            &ldquo;{dailyLine}&rdquo;
                                        </h1>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Exam Readiness Score (ERS) & Actionable Narrative Layer */}
                            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="scholar-card p-8 bg-[var(--bg-2)] border border-[var(--border)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderRadius: "28px" }}>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue-text)]">Proprietary Metric</span>
                                            <span className="px-2 py-0.5 rounded bg-[var(--blue-dim)] border border-[var(--blue-border)] text-[8px] font-black uppercase text-[var(--blue-text)]">ERS™</span>
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight text-[var(--text)] leading-tight">
                                            Exam Readiness Score
                                        </h3>
                                        <div className="space-y-2 border-t border-[var(--border)] pt-3 mt-2">
                                            <p className="text-xs font-bold text-[var(--text-2)] leading-relaxed">
                                                {dueCardsCount > 0 ? (
                                                    <>
                                                        Your retention loop for <span className="text-[var(--blue-text)] font-black">{dueDeckTitle}</span> degrades in {degradesIn} hours. Run a {sprintMin}-minute Flashcard Sprint right now to preserve your streak.
                                                    </>
                                                ) : (
                                                    <>
                                                        All caught up! Your memory retention is in perfect shape. Keep it up!
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-[var(--text-3)] font-medium">
                                                {socialProof}
                                            </p>
                                        </div>
                                        <Link href="/review" className="inline-block mt-2">
                                            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--text)] text-[var(--bg)] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer">
                                                <Zap size={13} className="fill-current animate-pulse text-[var(--bg)]" />
                                                <span>Resume Active Sprint</span>
                                            </div>
                                        </Link>
                                    </div>
                                    
                                    {/* ERS Donut Progress Meter */}
                                    <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="transparent" strokeDasharray="188.4 62.8" strokeLinecap="round" />
                                            <motion.circle cx="50" cy="50" r="40" stroke="var(--blue)" strokeWidth="8" fill="transparent"
                                                strokeDasharray="188.4 62.8"
                                                initial={{ strokeDashoffset: 188.4 }}
                                                animate={{ strokeDashoffset: 188.4 * (1 - readinessScore / 100) }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="font-mono text-2xl font-black text-[var(--text)] tabular-nums">{readinessScore}%</span>
                                            <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-3)]">Ready</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 flex flex-col justify-between">
                                    {/* Compact Navigation & Status Pills Row */}
                                    <div className="flex flex-wrap gap-2.5 items-center">
                                        <Link href="/create" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--blue)]/40 text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                                <Zap size={12} className="text-[var(--blue)]" />
                                                <span>New Session</span>
                                            </div>
                                        </Link>
                                        
                                        <Link href="/library" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--violet)]/40 text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                                <Library size={12} className="text-[var(--violet)]" />
                                                <span>Library</span>
                                            </div>
                                        </Link>

                                        <Link href="/blog" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--cyan)]/40 text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                                <BookOpen size={12} className="text-[var(--cyan)]" />
                                                <span>Blog</span>
                                            </div>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setShowStreakDetails(!showStreakDetails);
                                                setShowWrappedDetails(false);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                                showStreakDetails 
                                                    ? "bg-[var(--amber-dim)] border-[var(--amber-border)]" 
                                                    : "bg-[var(--bg-2)] border-[var(--border)] hover:border-[var(--amber)]/40"
                                            )}
                                        >
                                            <Flame size={12} className={cn("text-[var(--amber)]", user.streak > 0 && "animate-pulse")} />
                                            <span>{user.streak}d Streak</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowWrappedDetails(!showWrappedDetails);
                                                setShowStreakDetails(false);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                                showWrappedDetails 
                                                    ? "bg-[var(--blue-dim)] border-[var(--blue-border)]" 
                                                    : "bg-[var(--bg-2)] border-[var(--border)] hover:border-[var(--blue)]/40"
                                            )}
                                        >
                                            <TrendingUp size={12} className="text-[var(--blue)]" />
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
                                                    <p className="font-mono text-lg font-black text-[var(--text)] tabular-nums leading-tight">{value}</p>
                                                    <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider leading-tight font-bold">{sub}</p>
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
                                        <div className="scholar-card p-6 bg-[var(--bg-2)] border border-[var(--border)] shadow-md" style={{ borderRadius: "24px" }}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Flame size={16} className="text-[var(--amber)]" />
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-2)]">Momentum Daily Loop</span>
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
                                                                : "bg-[var(--bg-3)] border-[var(--border)] text-[var(--text-3)]"
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
                                        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-2)] font-bold">Level {level}</span>
                                        <div className="flex-1 h-2 bg-[var(--bg-3)] rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full rounded-full bg-[var(--blue)] shadow-[0_0_12px_var(--blue-glow)]" style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="font-mono text-[11px] text-[var(--text-3)] tabular-nums font-bold">{xpToNext > 0 ? `${xpToNext.toLocaleString()} XP left` : "Max!"}</span>
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
                                                    <p className="text-xs font-bold text-[var(--text-2)]">{dueCount} topics pending review.</p>
                                                </div>
                                                <div className="w-14 h-14 rounded-full bg-black text-[var(--blue)] flex items-center justify-center shadow-xl group-hover-scale-md transition-transform">
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
                                                <p className="text-xs text-[var(--text-3)] font-medium">Restore {user.lastStreak} days of momentum.</p>
                                            </div>
                                            <button onClick={handleRecover} disabled={isProcessingAction} className="px-5 py-2.5 rounded-xl bg-[var(--amber)] text-black font-black text-[10px] uppercase tracking-widest shadow-md">
                                                Restore (3 CR)
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Recent Study Packs */}
                            <motion.div variants={fadeUp} className="mt-8">
                                <div className="scholar-card p-6 bg-[var(--bg-2)] border border-[var(--border)] max-w-4xl" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-[var(--text-3)] flex items-center gap-2">
                                            <Library size={14} className="text-[var(--blue)]" /> Recent Study Packs
                                        </h3>
                                        <Link href="/library" className="text-[10px] font-black uppercase tracking-widest text-[var(--blue)] hover:underline flex items-center gap-1.5 transition-all">
                                            View Library <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                    {packsLoading ? (
                                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="animate-spin text-[var(--text-3)]" size={20} />
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Loading packs...</p>
                                        </div>
                                    ) : recentPacks.length === 0 ? (
                                        <div className="py-8 flex flex-col items-center justify-center bg-[var(--bg-3)]/60 rounded-2xl border border-[var(--border)]">
                                            <BookOpen size={48} className="text-[var(--text-3)]/40 mb-3" />
                                            <p className="text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">No study packs generated yet</p>
                                            <Link href="/create" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--foreground)] text-[var(--background)] font-black text-[9px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all">
                                                Create First Pack
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {recentPacks.map((pack) => {
                                                const packType = pack.type || "summary";
                                                const typeBadgeColor = 
                                                    packType === "flashcards" ? "bg-[var(--blue-dim)] border-[var(--blue-border)] text-[var(--blue)]" :
                                                    packType === "quiz" ? "bg-[var(--cyan-dim)] border-[var(--cyan-border)] text-[var(--cyan)]" :
                                                    "bg-[var(--emerald-dim)] border-[var(--emerald-border)] text-[var(--emerald)]";
                                                const packUrl = packType === "summary" 
                                                    ? `/summary/${pack.id || pack.generation_id}` 
                                                    : `/library/pack/${pack.id || pack.generation_id}`;

                                                return (
                                                    <Link href={packUrl} key={pack.id || pack.generation_id} className="group block">
                                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-3)]/60 border border-[var(--border)] hover:border-[var(--text-3)]/40 transition-all flex-wrap sm:flex-nowrap gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-sans text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--blue)] transition-colors">{pack.title || "Untitled Pack"}</p>
                                                                <p className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">
                                                                    {new Date(pack.created_at || pack.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className={cn("px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider", typeBadgeColor)}>
                                                                    {packType}
                                                                </span>
                                                                <ChevronRight size={14} className="text-[var(--text-3)] group-hover:translate-x-0.5 transition-transform" />
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
                            <div className="scholar-card relative p-6 sm:p-10 overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] shadow-xl mb-6" style={{ borderRadius: "28px" }}>
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[var(--blue)] pointer-events-none"><Sparkles size={160} /></div>
                                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex-1 min-w-[280px]">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--blue-text)] font-bold">{timeHint} (Power Learner)</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--text-3)] font-bold">{dateStr}</span>
                                            </div>
                                            <FocusTimer widget={true} />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)] mb-2">
                                            Hey {firstName},
                                        </h2>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-2)] leading-relaxed mb-3 italic uppercase">
                                            &ldquo;{dailyLine}&rdquo;
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                            <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="transparent" strokeDasharray="188.4 62.8" strokeLinecap="round" />
                                                <motion.circle cx="50" cy="50" r="40" stroke="var(--blue)" strokeWidth="8" fill="transparent"
                                                    strokeDasharray="188.4 62.8"
                                                    initial={{ strokeDashoffset: 188.4 }}
                                                    animate={{ strokeDashoffset: 188.4 * (1 - readinessScore / 100) }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="font-mono text-xl font-black text-[var(--text)] tabular-nums">{readinessScore}%</span>
                                                <span className="text-[7px] font-black uppercase tracking-wider text-[var(--text-3)]">ERS™</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Three Column Telemetry Dashboard */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Column 1: Stats */}
                                <div className="scholar-card p-6 bg-[var(--bg-2)] border border-[var(--border)]" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layers className="text-[var(--violet)] w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-3)]">
                                            Learning Telemetry
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Total XP</span>
                                            <span className="font-mono text-xs font-black text-[var(--blue)] tabular-nums">{user.xp?.toLocaleString()} XP</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Level</span>
                                            <span className="font-mono text-xs font-black text-[var(--text)] tabular-nums">Lvl {level} · {title}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Active Streak</span>
                                            <span className="font-mono text-xs font-black text-[var(--amber)] tabular-nums">{user.streak}d 🔥</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Study Packs</span>
                                            <span className="font-mono text-xs font-black text-[var(--emerald)] tabular-nums">{recentPacks.length}+ active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Concept Retention Curves */}
                                <div className="scholar-card p-6 bg-[var(--bg-2)] border border-[var(--border)]" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BrainCircuit className="text-[var(--blue)] w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-3)]">
                                            Retention Stability
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Exam Readiness</span>
                                            <span className="font-mono text-xs font-black text-[var(--text)] tabular-nums">{readinessScore}%</span>
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
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Cards Due</span>
                                            <span className={cn("font-mono text-xs font-black tabular-nums", dueCardsCount > 0 ? "text-[var(--amber)]" : "text-[var(--emerald)]")}>
                                                {dueCardsCount > 0 ? `${dueCardsCount} due` : "0 due ✓"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] font-bold text-[var(--text-2)] uppercase">Degrades In</span>
                                            <span className="font-mono text-xs font-black text-[var(--text)] tabular-nums">{degradesIn}h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Active Packs */}
                                <div className="scholar-card p-6 bg-[var(--bg-2)] border border-[var(--border)]" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="text-[var(--cyan)] w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-3)]">
                                            Active Packs
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {recentPacks.length > 0 ? recentPacks.map((pack) => {
                                            const packId = pack.id || pack.generation_id;
                                            return (
                                                <Link key={packId} href={`/library/pack/${packId}`}>
                                                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-3)]/40 border border-[var(--border)] text-xs hover:border-[var(--blue)]/40 transition-all cursor-pointer">
                                                        <span className="font-bold text-[var(--text)] truncate max-w-[140px]">{pack.title || "Untitled Pack"}</span>
                                                        <ArrowRight size={10} className="text-[var(--text-3)]" />
                                                    </div>
                                                </Link>
                                            );
                                        }) : (
                                            <p className="text-xs text-[var(--text-3)] font-bold text-center py-4">No packs yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                 </motion.div>
            </StandardContainer>
        </div>
    );
}
