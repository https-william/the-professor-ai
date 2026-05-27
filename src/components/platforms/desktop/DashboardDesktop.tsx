"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Zap, Library, BookOpen, Swords, 
    Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText, TrendingUp, Flame, CheckCircle2, ArrowRight
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
    user, activityData, dueCount, firstName,
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
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] leading-relaxed mb-3 italic uppercase">
                                    &ldquo;{dailyLine}&rdquo;
                                </h1>
                                <p className="text-[10px] text-[var(--text-3)] font-black uppercase tracking-[0.2em]">
                                    Active prepared session for <span className="text-[var(--text)]">{firstName}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Compact Navigation & Status Pills Row */}
                    <motion.div variants={fadeUp} className="mb-6 flex flex-wrap gap-2.5 items-center">
                        {/* Start Session Pill */}
                        <Link href="/create" className="group">
                            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--text)] text-[var(--bg)] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer">
                                <Zap size={13} className="fill-current animate-pulse text-[var(--bg)]" />
                                <span>Start New Session</span>
                            </div>
                        </Link>
                        
                        {/* Library Pill */}
                        <Link href="/library" className="group">
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--violet)]/40 text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                <Library size={12} className="text-[var(--violet)]" />
                                <span>Library</span>
                            </div>
                        </Link>

                        {/* Arena Pill */}
                        <Link href="/arena" className="group">
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--crimson)]/40 text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                <Swords size={12} className="text-[var(--crimson)]" />
                                <span>Arena</span>
                            </div>
                        </Link>

                        {/* Blog Pill */}
                        <Link href="/blog" className="group">
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--cyan)]/40 text-[var(--text)] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                <BookOpen size={12} className="text-[var(--cyan)]" />
                                <span>Blog</span>
                            </div>
                        </Link>

                        {/* Momentum Streak Toggle Pill */}
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

                        {/* Weekly Wrapped Toggle Pill */}
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
                    </motion.div>

                    {/* Inline Toggled Details Cards */}
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

                    {/* Stat Bento */}
                    <motion.div 
                        variants={fadeUp}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    >
                        <div className="p-6 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] flex flex-col justify-between hover:bg-[var(--bg-3)]/60 transition-colors">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] mb-4">Scholar Level</span>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-[var(--text)]">{calculateLevel(user.xp)}</span>
                                <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-tighter mb-1">{getLevelTitle(calculateLevel(user.xp))}</span>
                            </div>
                        </div>

                        <div className="p-6 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] flex flex-col justify-between hover:bg-[var(--bg-3)]/60 transition-colors">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] mb-4">Current Streak</span>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-[var(--text)]"><AnimatedCounter value={user.streak} /></span>
                                <span className="text-[10px] font-bold text-[var(--text-3)] mb-1 uppercase tracking-tighter">Days</span>
                            </div>
                        </div>

                        <div className="p-6 rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] flex flex-col justify-between hover:bg-[var(--bg-3)]/60 transition-colors">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] mb-4">Credits Balance</span>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-[var(--text)]"><AnimatedCounter value={user.credits} /></span>
                                <span className="text-[10px] font-black text-[var(--text-3)] uppercase tracking-widest opacity-70 mb-1">BAL</span>
                            </div>
                        </div>
                    </motion.div>

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

                </motion.div>
            </StandardContainer>
        </div>
    );
}
