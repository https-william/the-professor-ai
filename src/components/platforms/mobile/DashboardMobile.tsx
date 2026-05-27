"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Zap, Library, BookOpen, Swords, 
    Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText, TrendingUp, Flame, CheckCircle2, ArrowRight,
    Loader2
} from "lucide-react";
import { calculateLevel, getLevelTitle } from "@/lib/profiles-client";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StandardContainer from "@/components/ui/StandardContainer";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import { getDailyTip } from "@/lib/education-tips";

interface DashboardMobileProps {
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

export default function DashboardMobile({
    user, activityData, dueCount, firstName,
    handleRecover, canRecover, isProcessingAction,
}: DashboardMobileProps) {

    const level = calculateLevel(user.xp);
    const title = getLevelTitle(level);

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dailyLine = getDailyTip(user.id || "");

    const [showStreakDetails, setShowStreakDetails] = useState(false);
    const [showWrappedDetails, setShowWrappedDetails] = useState(false);

    // Fetch recent study packs
    const [recentPacks, setRecentPacks] = useState<any[]>([]);
    const [packsLoading, setPacksLoading] = useState(true);
    useState(() => {
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
    });

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
        <div className="w-full relative bg-[var(--bg)] selection:bg-[var(--blue-dim)] pt-24 pb-32">
            <StandardContainer className="relative z-10 flex flex-col gap-6">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Welcome Banner */}
                    <motion.div variants={fadeUp} className="mb-4">
                        <div className="scholar-card relative p-6 overflow-hidden bg-[var(--bg-2)] border border-[var(--border)] shadow-xl animate-in fade-in duration-300" style={{ borderRadius: "24px" }}>
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[var(--blue)] pointer-events-none"><Sparkles size={120} /></div>
                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--blue-text)] font-bold">{timeHint}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--text-3)] font-bold">{dateStr}</span>
                                    </div>
                                    <FocusTimer widget={true} />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-[var(--text)] mb-1">
                                    Hey {firstName},
                                </h2>
                                <h1 className="text-base font-black tracking-tight text-[var(--text-2)] leading-relaxed mb-3 italic uppercase">
                                    &ldquo;{dailyLine}&rdquo;
                                </h1>
                            </div>
                        </div>
                    </motion.div>

                    {/* Compact Navigation & Status Pills Row */}
                    <motion.div variants={fadeUp} className="mb-4 flex flex-wrap gap-2 items-center">
                        {/* Start Session Pill */}
                        <Link href="/create" className="group">
                            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--text)] text-[var(--bg)] font-black text-[10px] uppercase tracking-[0.15em] shadow-lg hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer">
                                <Zap size={12} className="fill-current animate-pulse text-[var(--bg)]" />
                                <span>Start Session</span>
                            </div>
                        </Link>
                        
                        {/* Library Pill */}
                        <Link href="/library" className="group">
                            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text)] font-black text-[9px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                <Library size={11} className="text-[var(--violet)]" />
                                <span>Library</span>
                            </div>
                        </Link>



                        {/* Blog Pill */}
                        <Link href="/blog" className="group">
                            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text)] font-black text-[9px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                <BookOpen size={11} className="text-[var(--cyan)]" />
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
                                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-[var(--text)] font-black text-[9px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                showStreakDetails 
                                    ? "bg-[var(--amber-dim)] border-[var(--amber-border)]" 
                                    : "bg-[var(--bg-2)] border-[var(--border)]"
                            )}
                        >
                            <Flame size={11} className={cn("text-[var(--amber)]", user.streak > 0 && "animate-pulse")} />
                            <span>{user.streak}d Streak</span>
                        </button>

                        {/* Weekly Wrapped Toggle Pill */}
                        <button
                            onClick={() => {
                                setShowWrappedDetails(!showWrappedDetails);
                                setShowStreakDetails(false);
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-[var(--text)] font-black text-[9px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                showWrappedDetails 
                                    ? "bg-[var(--blue-dim)] border-[var(--blue-border)]" 
                                    : "bg-[var(--bg-2)] border-[var(--border)]"
                            )}
                        >
                            <TrendingUp size={11} className="text-[var(--blue)]" />
                            <span>Wrapped</span>
                        </button>
                    </motion.div>

                    {/* Inline Toggled Details Cards */}
                    <AnimatePresence mode="wait">
                        {showStreakDetails && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 overflow-hidden"
                                key="streak-details"
                            >
                                <div className="p-5 rounded-[20px] bg-[var(--bg-2)] border border-[var(--border)] shadow-md">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Flame size={14} className="text-[var(--amber)]" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-2)]">Daily Loop</span>
                                        </div>
                                        <div className="text-[10px] font-mono font-black text-[var(--amber)]">{user.streak}d active</div>
                                    </div>
                                    <div className="flex w-full justify-between items-center gap-1">
                                        {weekDays.map((day, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center border transition-all text-[10px] font-black",
                                                    day.active 
                                                        ? "bg-[var(--amber)] border-[var(--amber-light)]/20 text-black shadow-[0_0_10px_var(--amber-glow)]" 
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
                                className="mb-4 overflow-hidden"
                                key="wrapped-details"
                            >
                                <WeeklyWrappedCard />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stat Ribbon */}
                    <motion.div variants={fadeUp} className="mb-4 grid grid-cols-3 gap-2">
                        {[
                            { label: "Level", value: level, color: "var(--blue)" },
                            { label: "Streak", value: `${user.streak}d`, color: "var(--amber)" },
                            { label: "Credits", value: user.credits, color: "var(--violet)" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="scholar-card flex flex-col p-4 bg-[var(--bg-2)] border border-[var(--border)] shadow-sm" style={{ borderRadius: "16px" }}>
                                <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-3)] mb-1" style={{ color }}>{label}</span>
                                <span className="font-mono text-base font-black text-[var(--text)] tabular-nums leading-none">{value}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Urgent Actions */}
                    <AnimatePresence>
                        {dueCount > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
                                <Link href="/review" className="block w-full">
                                    <div className="p-5 rounded-[24px] bg-[var(--blue)] border border-[var(--blue-border)] relative overflow-hidden flex items-center justify-between shadow-lg">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[9px] font-black uppercase tracking-[0.15em] text-black mb-2">
                                                Priority
                                            </span>
                                            <h3 className="text-xl font-black text-black tracking-tighter leading-none mb-1">Resume Session</h3>
                                            <p className="text-xs font-bold text-[var(--text-2)]">{dueCount} topics pending.</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-black text-[var(--blue)] flex items-center justify-center flex-shrink-0 shadow-xl">
                                            <ArrowRight size={20} strokeWidth={3} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}
                        {canRecover && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
                                <button 
                                    onClick={handleRecover}
                                    disabled={isProcessingAction}
                                    className="w-full p-5 rounded-[24px] bg-[var(--amber-dim)] border border-[var(--amber-border)] flex items-center justify-between shadow-lg disabled:opacity-50"
                                >
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[9px] font-black text-[var(--amber)] uppercase tracking-[0.15em]">Streak Rescue</span>
                                        <span className="text-sm font-bold text-[var(--text)]">Restore {user.lastStreak} Days</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-[var(--amber)] text-black rounded-lg text-xs font-black">3 CR</div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Recent Study Packs */}
                    <motion.div variants={fadeUp} className="mt-2">
                        <div className="scholar-card p-5 bg-[var(--bg-2)] border border-[var(--border)]" style={{ borderRadius: "24px" }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] flex items-center gap-2">
                                    <Library size={12} className="text-[var(--blue)]" /> Recent Study Packs
                                </h3>
                                <Link href="/library" className="text-[9px] font-black uppercase tracking-widest text-[var(--blue)] hover:underline flex items-center gap-1 transition-all">
                                    View Library <ArrowRight size={10} />
                                </Link>
                            </div>
                            {packsLoading ? (
                                <div className="py-6 flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="animate-spin text-[var(--text-3)]" size={16} />
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-3)]">Loading...</p>
                                </div>
                            ) : recentPacks.length === 0 ? (
                                <div className="py-6 text-center bg-[var(--bg-3)]/60 rounded-2xl border border-[var(--border)]">
                                    <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">No study packs yet</p>
                                    <Link href="/create" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--foreground)] text-[var(--background)] font-black text-[8px] uppercase tracking-wider">
                                        Create Pack
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
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
                                                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-3)]/60 border border-[var(--border)] hover:border-[var(--text-3)]/30 transition-all gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-sans text-xs font-bold text-[var(--foreground)] truncate group-hover:text-[var(--blue)] transition-colors">{pack.title || "Untitled Pack"}</p>
                                                        <p className="text-[9px] text-[var(--text-3)] font-mono mt-0.5">
                                                            {new Date(pack.created_at || pack.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={cn("px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider", typeBadgeColor)}>
                                                            {packType}
                                                        </span>
                                                        <ChevronRight size={12} className="text-[var(--text-3)]" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </StandardContainer>
        </div>
    );
}
