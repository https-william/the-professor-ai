"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowRight, Flame, Zap, Shield, Coins, PlusCircle,
    Library, BookOpen, Swords, Play, Pause, RotateCcw,
    Clock, Target, Sparkles, History as HistoryIcon,
    ChevronRight, BrainCircuit, Layers, FileText
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
    handleBuyFreeze: () => void;
    handleShare?: () => void;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   "COMMAND CENTER" DASHBOARD
   Aesthetic: Arc Browser Ã— Raycast Ã— Linear
   Philosophy: Dense information, zero clutter, ambient energy
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

// Stoic quotes woven into the greeting
const DAILY_LINES = [
    "The obstacle is the way.",
    "Begin at once to live.",
    "Waste no more time arguing what a good person should be.",
    "First say what you would be; then do what you have to do.",
    "He who fears death will never do anything worthy of a living man.",
    "We suffer more often in imagination than in reality.",
    "What stands in the way becomes the way.",
];

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

import StandardContainer from "@/components/ui/StandardContainer";

export default function DashboardWeb({
    user, activityData, dueCount, greeting, firstName,
    handleRecover, canRecover, isProcessingAction, handleBuyFreeze,
}: DashboardWebProps) {

    const level = calculateLevel(user.xp);
    const progress = getLevelProgress(user.xp);
    const title = getLevelTitle(level);
    const xpToNext = Math.pow(level, 2) * 100 - user.xp;

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dailyLine = DAILY_LINES[today.getDay() % DAILY_LINES.length];

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

    // Focus Timer (embedded)
    const [timerLeft, setTimerLeft] = useState(25 * 60);
    const [timerActive, setTimerActive] = useState(false);
    const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");

    useEffect(() => {
        if (!timerActive || timerLeft <= 0) return;
        const iv = setInterval(() => setTimerLeft(t => t - 1), 1000);
        return () => clearInterval(iv);
    }, [timerActive, timerLeft]);

    useEffect(() => {
        if (timerLeft === 0) {
            setTimerActive(false);
            if (timerMode === "focus") { setTimerMode("break"); setTimerLeft(5 * 60); }
            else { setTimerMode("focus"); setTimerLeft(25 * 60); }
        }
    }, [timerLeft, timerMode]);

    const timerMins = Math.floor(timerLeft / 60);
    const timerSecs = timerLeft % 60;
    const timerProgress = 1 - (timerLeft / (timerMode === "focus" ? 25 * 60 : 5 * 60));

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
        { label: "Create", desc: "Generate new material", icon: PlusCircle, href: "/create", accent: "var(--accent)" },
        { label: "Library", desc: "Your study vault", icon: Library, href: "/library", accent: "#10B981" },
        { label: "Arena", desc: "Duel others", icon: Swords, href: "/arena", accent: "#EF4444" },
        { label: "Blog", desc: "Study secrets", icon: BookOpen, href: "/blog", accent: "#8B5CF6" },
    ];

    // Recent generation types for visual variety mapped to real data
    const totalGenerations = Math.max(1, libStats.flashcards + libStats.quiz + libStats.summary);
    const recentTypes = [
        { type: "flashcards", icon: Layers, color: "var(--accent)", label: "Flashcards", count: libStats.flashcards },
        { type: "quiz", icon: BrainCircuit, color: "#6366F1", label: "Quiz", count: libStats.quiz },
        { type: "summary", icon: FileText, color: "#10B981", label: "Summary", count: libStats.summary },
    ];

    return (
        <div className="w-full min-h-screen relative bg-[var(--background)] selection:bg-[var(--accent)]/10">
            {/* Scroll sentinel for header pill morph */}
            <div data-header-sentinel className="absolute top-0 left-0 right-0 h-1 pointer-events-none z-50" />

            <StandardContainer className="pt-16 pb-20 relative z-10">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Hero Zone */}
                    <motion.div variants={fadeUp} className="mb-8">
                        <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden bg-transparent border-b border-[var(--border)]">
                            <div className="relative z-10">
                                <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-[var(--foreground-secondary)] mb-1.5">{dateStr}</p>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] leading-tight mb-3">
                                    {greeting}, <span className="text-[var(--accent)]">{firstName}</span>
                                </h1>
                                <p className="text-sm text-[var(--foreground-secondary)] italic font-serif max-w-md">
                                    &ldquo;{dailyLine}&rdquo;
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stat Ribbon */}
                    <motion.div variants={fadeUp} className="mb-6 flex flex-wrap gap-2">
                        {[
                            { icon: Zap, label: "XP", value: user.xp?.toLocaleString(), sub: `Lvl ${level} · ${title}`, color: "var(--accent)" },
                            { icon: Flame, label: "Streak", value: `${user.streak}d`, sub: user.streak > 0 ? "Active" : "Start today", color: "#EF4444" },
                            { icon: Shield, label: "Freezes", value: user.streakFreezeCount, sub: "Protection", color: "#22D3EE" },
                            { icon: Coins, label: "Credits", value: user.credits, sub: "Available", color: "#A78BFA" },
                        ].map(({ icon: Icon, label, value, sub, color }) => (
                            <div key={label} className="flex items-center gap-3 px-2 py-2.5 transition-all group flex-1 min-w-[140px] border-b border-transparent hover:border-[var(--border)]">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
                                    <Icon size={14} style={{ color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono text-sm font-black text-[var(--foreground)] tabular-nums leading-tight">{value}</p>
                                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider leading-tight">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Level Progress */}
                    <motion.div variants={fadeUp} className="mb-6">
                        <div className="flex items-center gap-3 py-3 border-t border-b border-[var(--border)]">
                            <div className="flex items-center gap-2 shrink-0">
                                <Sparkles size={12} className="text-[var(--accent)]" />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">Level {level}</span>
                            </div>
                            <div className="flex-1 h-1.5 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
                                    className="h-full rounded-full bg-[var(--accent)]"
                                />
                            </div>
                            <span className="font-mono text-[10px] text-[var(--foreground-muted)] tabular-nums shrink-0">{xpToNext > 0 ? `${xpToNext.toLocaleString()} XP left` : "Max!"}</span>
                        </div>
                    </motion.div>

                    {/* Urgent Actions */}
                    <AnimatePresence>
                        {dueCount > 0 && (
                            <motion.div variants={fadeUp} className="mb-4">
                                <Link href="/review" className="group block">
                                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/12 transition-all">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_6px_var(--accent)]" />
                                            <span className="text-sm font-bold text-[var(--accent)]">{dueCount} concepts due for review</span>
                                        </div>
                                        <ArrowRight size={14} className="text-[var(--accent)] group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>
                            </motion.div>
                        )}
                        {canRecover && (
                            <motion.div variants={fadeUp} className="mb-4">
                                <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                                    <div className="flex items-center gap-2.5">
                                        <HistoryIcon size={13} className="text-amber-500" />
                                        <span className="text-sm text-[var(--foreground-muted)]">Restore <b className="text-[var(--foreground)]">{user.lastStreak}d</b> streak</span>
                                    </div>
                                    <button onClick={handleRecover} disabled={isProcessingAction} className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">Restore · 3 CR</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Col 1+2: Workspace */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <Link href="/create" className="group block">
                                <div className="relative p-6 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] bg-[var(--background-secondary)]/30 border border-transparent hover:border-[var(--accent)]/30">
                                    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[50px] opacity-20 bg-[var(--accent)]" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center"><PlusCircle size={18} className="text-[var(--accent)]" /></div>
                                            <div>
                                                <p className="text-base font-bold text-[var(--foreground)]">Start Studying</p>
                                                <p className="text-xs text-[var(--foreground-muted)]">Automate your degree in seconds</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-[var(--accent)] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            </Link>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {actions.map(({ label, desc, icon: Icon, href, accent }) => (
                                    <Link key={label} href={href} className="group">
                                        <div className="p-4 rounded-2xl h-full transition-all hover:-translate-y-1 bg-transparent hover:bg-[var(--background-secondary)]/50 border border-transparent hover:border-[var(--border)]">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)` }}>
                                                <Icon size={14} strokeWidth={1.8} style={{ color: accent }} />
                                            </div>
                                            <p className="text-[12px] font-bold text-[var(--foreground)] leading-tight">{label}</p>
                                            <p className="text-[9px] text-[var(--foreground-muted)] leading-tight mt-0.5">{desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-transparent border-t border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <Flame size={12} className="text-[var(--accent)]" />
                                            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">This Week</span>
                                        </div>
                                        <span className="font-mono text-[10px] font-bold text-[var(--accent)] tabular-nums">{user.streak}d</span>
                                    </div>
                                    <div className="flex gap-1.5 w-full">
                                        {weekDays.map((day, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                                <div className={`w-full aspect-square rounded-lg flex items-center justify-center relative transition-all ${day.active ? "bg-[var(--accent)] shadow-[0_2px_8px_var(--accent-glow)]" : day.isToday ? "border border-dashed border-[var(--accent)]/40" : "bg-[var(--foreground)]/[0.04]"}`}>
                                                    <span className={`text-[9px] font-black ${day.active ? "text-[var(--background)]" : day.isToday ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]/40"}`}>{day.label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-transparent border-t border-[var(--border)]">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <Target size={12} className="text-emerald-400" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Recent Activity</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {recentTypes.map(({ type, icon: Icon, color, label, count }) => (
                                            <div key={type} className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
                                                    <Icon size={11} style={{ color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="h-1 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(5, (count / totalGenerations) * 100)}%` }} transition={{ duration: 1, delay: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }} className="h-full rounded-full" style={{ background: color }} />
                                                    </div>
                                                </div>
                                                <span className="font-mono text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider shrink-0">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Link href="/analytics" className="mt-3 flex items-center gap-1.5 text-[9px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wider font-bold">
                                        <span>Full Analytics</span>
                                        <ArrowRight size={9} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Col 3: Focus Panel */}
                        <div className="flex flex-col gap-4">
                            <div className="p-6 rounded-3xl relative overflow-hidden bg-[var(--background-secondary)]/20 border border-[var(--border)]">
                                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-15 transition-colors duration-1000 ${timerMode === "focus" ? "bg-[var(--accent)]" : "bg-blue-400"}`} />
                                <div className="flex items-center gap-2 mb-4 relative z-10">
                                    <Clock size={12} className={timerMode === "focus" ? "text-[var(--accent)]" : "text-blue-400"} />
                                    <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Pomodoro</span>
                                    {timerActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                </div>
                                <div className="flex flex-col items-center py-2 relative z-10">
                                    <div className="relative w-28 h-28 mb-4">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--border)" strokeWidth="2.5" opacity="0.3" />
                                            <motion.circle cx="50" cy="50" r="42" fill="transparent" stroke={timerMode === "focus" ? "var(--accent)" : "rgb(96 165 250)"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={264} initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * timerProgress) }} transition={{ ease: "linear", duration: 1 }} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-xl font-black text-[var(--foreground)] tabular-nums font-mono leading-none">{timerMins.toString().padStart(2, "0")}:{timerSecs.toString().padStart(2, "0")}</span>
                                            <span className="text-[8px] text-[var(--foreground-muted)] uppercase tracking-wider mt-1">{timerMode}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setTimerActive(!timerActive)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--foreground)]/5 border border-[var(--border)] active:scale-95 transition-all text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--background)] hover:border-transparent">{timerActive ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}</button>
                                        <button onClick={() => { setTimerActive(false); setTimerMode("focus"); setTimerLeft(25 * 60); }} className="w-9 h-9 rounded-xl flex items-center justify-center bg-transparent border border-[var(--border)] active:scale-95 transition-all text-[var(--foreground-muted)] hover:text-[var(--foreground)]"><RotateCcw size={12} /></button>
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        <button onClick={() => { setTimerMode("focus"); setTimerLeft(25 * 60); setTimerActive(false); }} className={`font-mono text-[9px] uppercase tracking-widest transition-colors ${timerMode === "focus" ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>25m Focus</button>
                                        <button onClick={() => { setTimerMode("break"); setTimerLeft(5 * 60); setTimerActive(false); }} className={`font-mono text-[9px] uppercase tracking-widest transition-colors ${timerMode === "break" ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}>5m Break</button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-transparent border-t border-[var(--border)]">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Shield size={12} className="text-cyan-400" />
                                    <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Streak Insurance</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[var(--foreground)]">{user.streakFreezeCount} <span className="text-[var(--foreground-muted)] font-normal">banked</span></p>
                                        <p className="text-[9px] text-[var(--foreground-muted)]">Protects your streak on missed days</p>
                                    </div>
                                    <button onClick={handleBuyFreeze} disabled={isProcessingAction || user.credits < 5} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all disabled:opacity-30">Buy · 5 CR</button>
                                </div>
                            </div>

                            <div className="p-5 bg-transparent border-t border-[var(--border)]">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <BookOpen size={12} className="text-[var(--foreground-muted)]" />
                                    <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--foreground-muted)]">Mindset</span>
                                </div>
                                <p className="text-sm font-serif italic text-[var(--foreground)]/80 leading-relaxed">&ldquo;{dailyLine}&rdquo;</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </StandardContainer>
        </div>
    );
}


