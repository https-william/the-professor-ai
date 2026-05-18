"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowRight, Flame, Zap, Shield, Coins, PlusCircle,
    Library, BookOpen, Swords, Play, Pause, RotateCcw,
    Clock, Target, Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText, TrendingUp, Trophy
} from "lucide-react";
import { calculateLevel, getLevelTitle, getLevelProgress } from "@/lib/profiles-client";

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

/* â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
   "COMMAND CENTER" DASHBOARD
   Aesthetic: Arc Browser Ã— Raycast Ã— Linear
   Philosophy: Dense information, zero clutter, ambient energy
   â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */

// Import education tip
import { getDailyTip } from "@/lib/education-tips";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

import StandardContainer from "@/components/ui/StandardContainer";

export default function DashboardWeb({
    user, activityData, dueCount, studyPlan, planLoading, greeting, firstName,
    handleRecover, canRecover, isProcessingAction,
}: DashboardWebProps) {

    const level = calculateLevel(user.xp);
    const progress = getLevelProgress(user.xp);
    const title = getLevelTitle(level);
    const xpToNext = Math.pow(level, 2) * 100 - user.xp;

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dailyLine = getDailyTip(user.id || "");

    // Streak calendar
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
    }, [activityData]);

    // Focus Timer moved to widget

    // Fetch library stats for recent activity
    const [libStats, setLibStats] = useState({ flashcards: 0, quiz: 0, summary: 0 });
    useEffect(() => {
        if (!user?.id) return;
        fetch('/api/library')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.generations)) {
                    const newStats = { flashcards: 0, quiz: 0, summary: 0 };
                    data.generations.forEach((g: any) => {
                        if (g.type === 'flashcards') newStats.flashcards++;
                        if (g.type === 'quiz') newStats.quiz++;
                        if (g.type === 'summary') newStats.summary++;
                    });
                    setLibStats(newStats);
                }
            })
            .catch(err => console.error("Failed to fetch library stats:", err));
    }, [user?.id]);

    // Quick actions
    const actions = [
        { label: "Create", desc: "Generate new material", icon: PlusCircle, href: "/create", accent: "var(--blue)" },
        { label: "Library", desc: "Your study vault", icon: Library, href: "/library", accent: "var(--violet)" },
        { label: "Arena", desc: "Duel others", icon: Swords, href: "/arena", accent: "var(--crimson)" },
        { label: "Blog", desc: "Study secrets", icon: BookOpen, href: "/blog", accent: "var(--cyan)" },
    ];

    // Recent generation types for visual variety mapped to real data
    const totalGenerations = Math.max(1, libStats.flashcards + libStats.quiz + libStats.summary);
    const recentTypes = [
        { type: "flashcards", icon: Layers, color: "var(--blue)", label: "Flashcards", count: libStats.flashcards },
        { type: "quiz", icon: BrainCircuit, color: "var(--cyan)", label: "Quiz", count: libStats.quiz },
        { type: "summary", icon: FileText, color: "var(--emerald)", label: "Summary", count: libStats.summary },
    ];

    return (
        <div className="w-full min-h-screen relative bg-[var(--bg)] selection:bg-[var(--blue-dim)]">
            {/* Scroll sentinel for header pill morph */}
            <div data-header-sentinel className="absolute top-0 left-0 right-0 h-1 pointer-events-none z-50" />

            <StandardContainer className="pt-24 pb-20 relative z-10">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Hero Zone */}
                    <motion.div variants={fadeUp} className="mb-10">
                        <div className="scholar-card relative p-8 sm:p-12 overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl" style={{ borderRadius: "32px" }}>
                            <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-[var(--blue)] pointer-events-none"><Sparkles size={160} /></div>
                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--text-3)] font-bold">{dateStr}</span>
                                    </div>
                                    <FocusTimer widget={true} />
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text)] leading-[0.95] mb-6">
                                    {greeting}{greeting.match(/[?!]$/) ? "" : ","} <span className="text-[var(--blue)]">{firstName}</span>
                                </h1>
                                <p className="text-[17px] text-[var(--text-2)] italic font-medium max-w-xl leading-relaxed">
                                    &ldquo;{dailyLine}&rdquo;
                                </p>
                            </div>
                        </div>
                    </motion.div>

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
                    <motion.div variants={fadeUp} className="mb-10">
                        <div className="flex items-center gap-4 py-4 border-t border-b border-[var(--border)]">
                            <div className="flex items-center gap-2.5 shrink-0">
                                <Sparkles size={14} className="text-[var(--blue)]" />
                                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-2)] font-bold">Level {level}</span>
                            </div>
                            <div className="flex-1 h-2 bg-[var(--text-4)] rounded-full overflow-hidden shadow-inner">
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
                                    <div className="scholar-card flex items-center justify-between gap-4 px-6 py-4 border-[var(--blue-border)] bg-[var(--blue-dim)] hover:translate-x-1" style={{ borderRadius: "20px" }}>
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

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Col 1+2: Workspace */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Link href="/create" className="group block">
                                <div className="scholar-card relative p-8 transition-all hover:scale-[1.01] bg-gradient-to-br from-[var(--bg-2)]/40 to-transparent" style={{ borderRadius: "28px" }}>
                                    <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-[80px] opacity-10 bg-[var(--blue)] group-hover:opacity-20 transition-opacity" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <PlusCircle size={28} className="text-[var(--blue)]" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-[var(--text)] tracking-tight">Start a new session</p>
                                                <p className="text-sm text-[var(--text-2)] font-medium">Turn your notes into just the good parts.</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--blue-border)] transition-colors">
                                            <ChevronRight size={20} className="text-[var(--blue)] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {actions.map(({ label, desc, icon: Icon, href, accent }) => (
                                    <Link key={label} href={href} className="group">
                                        <div className="scholar-card p-5 h-full transition-all hover:-translate-y-1.5" style={{ borderRadius: "20px" }}>
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" style={{ background: `color-mix(in srgb, ${accent}, transparent 90%)`, border: `1px solid color-mix(in srgb, ${accent}, transparent 80%)` }}>
                                                <Icon size={18} strokeWidth={2} style={{ color: accent }} />
                                            </div>
                                            <p className="text-[14px] font-black text-[var(--text)] leading-tight mb-1">{label}</p>
                                            <p className="text-[10px] text-[var(--text-3)] leading-snug font-medium">{desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-6 border-t border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <Flame size={14} className="text-[var(--amber)]" />
                                            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--text-3)] font-bold">Momentum</span>
                                        </div>
                                        <span className="font-mono text-sm font-black text-[var(--amber)] tabular-nums">{user.streak}d</span>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        {weekDays.map((day, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <div className={`w-full aspect-square rounded-xl flex items-center justify-center relative transition-all ${day.active ? "bg-[var(--amber)] shadow-[0_4px_12px_var(--amber-glow)] border-t border-white/20" : day.isToday ? "border-2 border-dashed border-[var(--amber-border)]" : "bg-[var(--text-4)] opacity-50"}`}>
                                                    <span className={`text-[10px] font-black ${day.active ? "text-[#000]" : day.isToday ? "text-[var(--amber)]" : "text-[var(--text-3)]/40"}`}>{day.label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="scholar-card p-6 min-h-[200px] flex flex-col justify-between relative overflow-hidden group" style={{ borderRadius: "28px" }}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--amber)]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--amber)]/20 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Trophy size={16} className="text-[var(--amber)]" />
                                                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--text-3)] font-bold">Trophy Room</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] font-mono text-[10px] font-black">3 Unlocked</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--amber)]/20 border border-[var(--amber)]/40 flex items-center justify-center text-[var(--amber)] shrink-0 shadow-[0_0_15px_var(--amber-glow)] animate-bounce">
                                                    <Flame size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-black text-[var(--text)] truncate">Prometheus Flame</p>
                                                        <span className="text-[10px] font-mono text-[var(--amber)] font-black">100%</span>
                                                    </div>
                                                    <p className="text-[10px] text-[var(--text-3)] truncate mb-1.5">Maintain a 7-day scholarly streak</p>
                                                    <div className="h-1 w-full bg-[var(--text-4)] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[var(--amber)] w-full shadow-[0_0_8px_var(--amber)]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] opacity-80">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/20 border border-[var(--blue)]/40 flex items-center justify-center text-[var(--blue)] shrink-0 shadow-[0_0_15px_var(--blue-glow)]">
                                                    <Zap size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-black text-[var(--text)] truncate">Neural Architect</p>
                                                        <span className="text-[10px] font-mono text-[var(--blue)] font-black">50%</span>
                                                    </div>
                                                    <p className="text-[10px] text-[var(--text-3)] truncate mb-1.5">Generate 10 study packs</p>
                                                    <div className="h-1 w-full bg-[var(--text-4)] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[var(--blue)] w-1/2 shadow-[0_0_8px_var(--blue)]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href="/achievements" className="mt-8 relative z-10 flex items-center justify-between p-4 rounded-2xl bg-[var(--text)]/5 border border-[var(--border)] hover:border-[var(--amber-border)] hover:bg-[var(--amber-dim)] group/btn transition-all shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--amber)] group-hover/btn:scale-110 transition-transform shadow-sm">
                                                <Trophy size={14} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] group-hover/btn:text-[var(--text)] transition-colors">Claim Achievements</span>
                                        </div>
                                        <ArrowRight size={14} className="text-[var(--text-3)] group-hover/btn:text-[var(--amber)] group-hover/btn:translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Col 3: Focus Panel */}
                        <div className="flex flex-col gap-6">
                            <WeeklyWrappedCard />
                        </div>
                    </div>
                </motion.div>
            </StandardContainer>
        </div>
    );
}


