"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Zap, Library, BookOpen, Swords, 
    Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText, TrendingUp, Flame, CheckCircle2, ArrowRight,
    Coins, Loader2
} from "lucide-react";
import { calculateLevel, getLevelTitle, getLevelProgress } from "@/lib/profiles-client";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StandardContainer from "@/components/ui/StandardContainer";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import { getDailyTip } from "@/lib/education-tips";



interface DashboardWebProps {
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
    handleShare?: () => void;
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
    user, activityData, dueCount, greeting, firstName,
    handleRecover, canRecover, isProcessingAction,
}: DashboardWebProps) {

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
                    // Sort by created date descending
                    const sorted = [...data.generations].sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
                    setRecentPacks(sorted.slice(0, 3));
                }
            })
            .catch(err => console.error("Failed to fetch library packs:", err))
            .finally(() => setPacksLoading(false));
    }, [user?.id]);




    return (
        <div className="w-full min-h-screen relative bg-[var(--bg)] selection:bg-[var(--blue-dim)]">
            <StandardContainer className="pt-24 pb-20 relative z-10">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Welcome Banner (Greetings replaced with Quote + Time hint) */}
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

                    {/* Stat Ribbon */}
                    <motion.div variants={fadeUp} className="mb-8 flex flex-wrap gap-4">
                        {[
                            { icon: Zap, label: "XP", value: user.xp?.toLocaleString(), sub: `Lvl ${level} · ${title}`, color: "var(--blue)" },
                            { icon: Flame, label: "Streak", value: `${user.streak}d`, sub: user.streak > 0 ? "Active" : "Start today", color: "var(--amber)" },
                            { icon: Coins, label: "Credits", value: user.credits, sub: "Available", color: "var(--violet)" },
                        ].map(({ icon: Icon, label, value, sub, color }) => (
                            <div key={label} className="scholar-card flex items-center gap-4 px-5 py-4 transition-all group flex-1 min-w-[180px]" style={{ borderRadius: "20px" }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `color-mix(in srgb, ${color}, transparent 90%)`, border: `1px solid color-mix(in srgb, ${color}, transparent 80%)` }}>
                                    <Icon size={16} style={{ color }} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono text-lg font-black text-[var(--text)] tabular-nums leading-tight">{value}</p>
                                    <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider leading-tight font-bold">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Level Progress */}
                    <motion.div variants={fadeUp} className="mb-8">
                        <div className="flex items-center gap-4 py-4 border-t border-b border-[var(--border)]">
                            <div className="flex items-center gap-2.5 shrink-0">
                                <Sparkles size={14} className="text-[var(--blue)]" />
                                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-2)] font-bold">Level {level}</span>
                            </div>
                            <div className="flex-1 h-2 bg-[var(--bg-3)] rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
                                    className="h-full rounded-full bg-[var(--blue)] shadow-[0_0_12px_var(--blue-glow)]"
                                />
                            </div>
                            <span className="font-mono text-[11px] text-[var(--text-3)] tabular-nums shrink-0 font-bold">{xpToNext > 0 ? `${xpToNext.toLocaleString()} XP left` : "Max!"}</span>
                        </div>
                    </motion.div>

                    {/* Urgent Actions */}
                    <AnimatePresence>
                        {dueCount > 0 && (
                            <motion.div variants={fadeUp} className="mb-4">
                                <Link href="/review" className="group block">
                                    <div className="scholar-card card-interactive-slide-right flex items-center justify-between gap-4 px-6 py-4 border-[var(--blue-border)] bg-[var(--blue-dim)]" style={{ borderRadius: "20px" }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--blue)] animate-pulse shadow-[0_0_10px_var(--blue)]" />
                                            <span className="text-[15px] font-bold text-[var(--blue-text)]">{dueCount} concepts require your intelligence</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--blue)] opacity-50 group-hover:opacity-100 transition-opacity">Enter Review</span>
                                            <ArrowRight size={16} className="text-[var(--blue)]" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}
                        {canRecover && (
                            <motion.div variants={fadeUp} className="mb-4">
                                <div className="scholar-card flex items-center justify-between gap-4 px-6 py-4 border-[var(--amber-border)] bg-[var(--amber-dim)]" style={{ borderRadius: "20px" }}>
                                    <div className="flex items-center gap-3">
                                        <HistoryIcon size={16} className="text-[var(--amber)]" />
                                        <span className="text-[15px] text-[var(--text-2)] font-medium">Restore <b className="text-[var(--text)] font-black">{user.lastStreak}d</b> streak loop</span>
                                    </div>
                                    <button onClick={handleRecover} disabled={isProcessingAction} className="btn-skeuo-primary px-5 py-2 text-[10px] bg-[var(--amber)] text-black font-black border-b-[3px] border-[var(--amber-dark)]">Restore · 3 CR</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Recent Study Packs */}
                            <div className="scholar-card p-6 bg-[var(--bg-2)] border border-[var(--border)]" style={{ borderRadius: "24px" }}>
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
                                                        <div className="min-w-0">
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
                        </div>
                    </div>
                </motion.div>
            </StandardContainer>
        </div>
    );
}
