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
    dueData: any;
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
    user, activityData, dueCount, dueData, greeting, firstName,
    handleRecover, canRecover, isProcessingAction,
}: DashboardWebProps) {

    // Fetch recent study packs first — we need them to determine userState
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

    // Safe numeric fallbacks to prevent crashes for new/incomplete user objects
    const userXp = user?.xp ?? 0;
    const userStreak = user?.streak ?? 0;

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
    }, [activityData, userStreak]);

    return (
        <div className="w-full min-h-screen relative bg-transparent selection:bg-white/10">
            <StandardContainer className="pt-24 pb-20 relative z-10">
                <motion.div variants={stagger} initial="hidden" animate="show">

                    {userState === 'NEW_USER' && (
                        <motion.div variants={fadeUp} className="space-y-6">
                            <div className="scholar-card relative p-8 sm:p-12 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "28px" }}>
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none"><Sparkles size={160} /></div>
                                <div className="relative z-10 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">Getting Started</span>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                                        Welcome, {firstName}!
                                    </h2>
                                    <p className="text-sm text-white/60 font-bold leading-relaxed mb-6">
                                        Let's get your study program up and running. Drop in your lecture materials below to build your very first Study Pack.
                                    </p>

                                    <Link href="/create">
                                        <div className="p-8 flex flex-col items-center justify-center text-center transition-all duration-300 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 hover:bg-zinc-900/35 cursor-pointer shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)]">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-zinc-950 shadow-[2px_2px_5px_rgba(0,0,0,0.3)] border border-white/5 text-white">
                                                <Zap className="w-5 h-5 fill-current" />
                                            </div>
                                            <h4 className="text-sm font-black text-white">Drop a lecture slide deck or PDF here to spin up your first Study Pack</h4>
                                            <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold mt-1">PDF, PPTX, DOCX, or Images</p>
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
                                <div className="scholar-card relative p-6 sm:p-10 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300" style={{ borderRadius: "28px" }}>
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none"><Sparkles size={160} /></div>
                                    <div className="relative z-10">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">{timeHint}</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/65 font-bold">{dateStr}</span>
                                            </div>
                                            <FocusTimer widget={true} />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                                            Hey {firstName},
                                        </h2>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white/80 leading-relaxed mb-3 italic uppercase">
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
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Proprietary Metric</span>
                                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase text-white/80">ERS™</span>
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight text-white leading-tight">
                                            Exam Readiness Score
                                        </h3>
                                        <div className="space-y-2 border-t border-white/5 pt-3 mt-2">
                                            <p className="text-xs font-bold text-white/70 leading-relaxed">
                                                {dueCardsCount > 0 ? (
                                                    <>
                                                        Your retention loop for <span className="text-white font-black">{dueDeckTitle}</span> degrades in {degradesIn} hours. Run a {sprintMin}-minute Flashcard Sprint right now to preserve your streak.
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
                                            <motion.circle cx="50" cy="50" r="40" stroke={readinessColor.stroke} strokeWidth="8" fill="transparent"
                                                style={{ filter: `drop-shadow(0 0 6px ${readinessColor.glow})` }}
                                                strokeDasharray="188.4 62.8"
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
                                        <Link href="/create" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900/50 border border-white/5 hover:border-emerald-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                                <Zap size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                                <span>New Session</span>
                                            </div>
                                        </Link>
                                        
                                        <Link href="/library" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900/50 border border-white/5 hover:border-blue-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                                                <Library size={12} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                <span>Library</span>
                                            </div>
                                        </Link>
 
                                        <Link href="/blog" className="group">
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900/50 border border-white/5 hover:border-indigo-500/20 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer">
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
                                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                                                    : "bg-zinc-900/50 border-white/5 hover:border-amber-500/20"
                                            )}
                                        >
                                            <Flame size={12} className={cn("text-amber-400", userStreak > 0 && "animate-pulse")} />
                                            <span><strong className="font-mono tabular-nums">{userStreak}</strong>d Streak</span>
                                        </button>
 
                                        <button
                                            onClick={() => {
                                                setShowWrappedDetails(!showWrappedDetails);
                                                setShowStreakDetails(false);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer",
                                                showWrappedDetails 
                                                    ? "bg-white/10 border-white/20 text-violet-400" 
                                                    : "bg-zinc-900/50 border-white/5 hover:border-violet-500/20"
                                            )}
                                        >
                                            <TrendingUp size={12} className="text-violet-400" />
                                            <span>Weekly Wrapped</span>
                                        </button>
                                    </div>

                                    {/* Stat Ribbon */}
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { icon: Zap, label: "XP", value: userXp?.toLocaleString(), sub: `Lvl ${level} · ${title}`, color: "var(--blue)" },
                                            { icon: Flame, label: "Streak", value: `${userStreak}d`, sub: userStreak > 0 ? "Active" : "Start today", color: "var(--amber)" },
                                        ].map(({ icon: Icon, label, value, sub, color }) => (
                                            <div key={label} className="scholar-card flex items-center gap-4 px-5 py-4 transition-all group flex-1 min-w-[140px] bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl" style={{ borderRadius: "20px" }}>
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: color.startsWith("var") ? `color-mix(in srgb, ${color}, transparent 90%)` : "rgba(255,255,255,0.05)", border: color.startsWith("var") ? `1px solid color-mix(in srgb, ${color}, transparent 80%)` : "1px solid rgba(255,255,255,0.1)" }}>
                                                    <Icon size={16} style={color.startsWith("var") ? { color } : undefined} className={cn("opacity-80 group-hover:opacity-100 transition-opacity", !color.startsWith("var") && "text-white")} />
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

                            {/* Primary Active Study Guides Grid & High-Value Empty States */}
                            <motion.div variants={fadeUp} className="mt-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-white/50">
                                        Your Active Study Guides
                                    </h3>
                                    <Link href="/library" className="text-[10px] font-black text-white hover:underline uppercase tracking-wider">
                                        View Full Archive
                                    </Link>
                                </div>
                                
                                {packsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="animate-spin text-white" />
                                    </div>
                                ) : recentPacks.length === 0 ? (
                                    <div className="scholar-card p-10 text-center flex flex-col items-center justify-center bg-zinc-950/45 border border-dashed border-zinc-800" style={{ borderRadius: "28px" }}>
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-white shadow-sm border border-white/10">
                                            <Sparkles size={28} />
                                        </div>
                                        <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight italic">No study guides created yet</h4>
                                        <p className="text-xs text-white/40 font-bold mb-6 max-w-sm">
                                            Get started by creating your first guide. Sprints help you absorb concepts 4x faster and maintain active recall before exams.
                                        </p>
                                        <Link href="/create">
                                            <div className="px-6 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all active:scale-95 cursor-pointer">
                                                Create New Sprint
                                            </div>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {recentPacks.map((pack) => (
                                            <Link key={pack.id} href={`/library/pack/${pack.id}`}>
                                                <motion.div 
                                                    layoutId={`pack-card-${pack.id}`}
                                                    className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-blue-500/20 hover:shadow-[0_0_20px_rgba(74,124,245,0.15)] transition-all flex flex-col justify-between h-40 group cursor-pointer" 
                                                    style={{ borderRadius: "24px" }}
                                                >
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Active Sprint</span>
                                                        <h4 className="text-base font-black text-white mt-1 line-clamp-2 uppercase tracking-tight italic group-hover:text-white/80 transition-colors">
                                                            {pack.title || "Untitled Pack"}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] font-mono text-white/40">
                                                        <span>{new Date(pack.created_at || pack.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                                        <span className="flex items-center gap-1 text-white/70">
                                                            Enter Lab <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}

                    {userState === 'POWER_LEARNER' && (
                        <motion.div variants={fadeUp} className="space-y-6">
                            {/* Welcome Banner for Power Learner */}
                            <div className="scholar-card relative p-6 sm:p-10 overflow-hidden bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-white/10 transition-all duration-300 mb-6" style={{ borderRadius: "28px" }}>
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white pointer-events-none"><Sparkles size={160} /></div>
                                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex-1 min-w-[280px]">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 font-bold">{timeHint} (On a roll!)</span>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/65 font-bold">{dateStr}</span>
                                            </div>
                                            <FocusTimer widget={true} />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                                            Hey {firstName},
                                        </h2>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white/80 leading-relaxed mb-3 italic uppercase">
                                            &ldquo;{dailyLine}&rdquo;
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
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
                                                <span className="text-[7px] font-black uppercase tracking-wider text-white/40">ERS™</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Three Column Telemetry Dashboard */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Column 1: Stats */}
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-blue-500/20 transition-all duration-300" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layers className="text-blue-400 w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-white/50">
                                            Study Stats
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Total XP</span>
                                            <span className="font-mono text-xs font-black text-white tabular-nums">{userXp.toLocaleString()} XP</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Level</span>
                                            <span className="font-mono text-xs font-black text-white/80 tabular-nums">Lvl {level} · {title}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Active Streak</span>
                                            <span className="font-mono text-xs font-black text-[var(--amber)] tabular-nums">{userStreak}d 🔥</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Study Packs</span>
                                            <span className="font-mono text-xs font-black text-white/80 tabular-nums">{recentPacks.length}+ active</span>
                                        </div>
                                    </div>
                                </div>
 
                                {/* Column 2: Concept Retention Curves */}
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-violet-500/20 transition-all duration-300" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BrainCircuit className="text-violet-400 w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-white/50">
                                            Retention Stability
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Exam Readiness</span>
                                            <span className="font-mono text-xs font-black text-white/80 tabular-nums">{readinessScore}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${readinessScore}%` }}
                                                transition={{ duration: 1.2, ease: "easeOut" }}
                                            />
                                        </div>
 
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Cards Due</span>
                                            <span className={cn("font-mono text-xs font-black tabular-nums", dueCardsCount > 0 ? "text-[var(--amber)]" : "text-emerald-400")}>
                                                {dueCardsCount > 0 ? `${dueCardsCount} due` : "0 due ✓"}
                                            </span>
                                        </div>
 
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-[11px] font-bold text-white/60 uppercase">Degrades In</span>
                                            <span className="font-mono text-xs font-black text-white/80 tabular-nums">{degradesIn}h</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Recent Packs */}
                                <div className="scholar-card p-6 bg-zinc-950/45 border border-white/5 backdrop-blur-2xl shadow-2xl hover:border-emerald-500/20 transition-all duration-300" style={{ borderRadius: "24px" }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="text-emerald-400 w-5 h-5" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-white/50">
                                            Active Packs
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        {recentPacks.length > 0 ? recentPacks.map((pack, idx) => (
                                            <Link key={pack.id} href={`/library/pack/${pack.id}`}>
                                                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs hover:border-emerald-500/35 hover:bg-emerald-500/5 transition-all cursor-pointer">
                                                    <span className="font-bold text-white/80 truncate max-w-[140px]">{pack.title || "Untitled Pack"}</span>
                                                    <ArrowRight size={10} className="text-white/40" />
                                                </div>
                                            </Link>
                                        )) : (
                                            <p className="text-xs text-white/40 font-bold text-center py-4">No packs yet</p>
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
