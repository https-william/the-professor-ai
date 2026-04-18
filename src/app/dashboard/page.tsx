"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import SiteHeader from "@/components/ui/SiteHeader";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SEOHead, { getWebApplicationSchema, getBreadcrumbSchema } from "@/components/SEOHead";
import { calculateLevel, getLevelProgress } from "@/lib/profiles-client";
import SpacedRepetitionCalendar from "@/components/features/SpacedRepetitionCalendar";
import GlobalLeaderboard from "@/components/features/arena/GlobalLeaderboard";

import StreakMilestone from "@/components/features/StreakMilestone";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useQuery } from "@tanstack/react-query";
import Markdown from "@/components/ui/Markdown";
import { 
    Layers, 
    HelpCircle, 
    FileText, 
    Map as MapIcon, 
    BookText, 
    GraduationCap, 
    Flame, 
    Check, 
    History, 
    Brain, 
    ChevronUp, 
    ChevronDown, 
    Zap, 
    ArrowRight, 
    Snowflake, 
    Coins, 
    MessageCircle, 
    Swords, 
    PlusCircle,
    Calendar,
    History as HistoryIcon,
    ArrowRight as ArrowRightIcon
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
interface ActivityData {
    streak: number;
    lastStudyDate: string | null;
    xp: number;
    educationLevel: string | null;
    studyGoal: string | null;
    activeDatesThisWeek: string[];
    totalThisWeek: number;
    recentActivity: {
        id: string;
        title: string;
        type: string;
        createdAt: string;
    }[];
    stats: {
        flashcards: number;
        quizzes: number;
        summaries: number;
    };
}

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
const clayCard = "bg-[var(--card)] border border-[var(--card-border)] shadow-[inset_0_1px_1px_var(--accent-glow),0_4px_24px_var(--shadow)] rounded-[28px] overflow-hidden transition-all duration-300";

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 6) return "Burning the midnight oil";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Late night session";
}

function getTypeIcon(type: string): any {
    switch (type) {
        case "flashcards": return Layers;
        case "quiz": return HelpCircle;
        case "summary": return FileText;
        case "roadmap": return MapIcon;
        default: return BookText;
    }
}

function getTypeColor(type: string): string {
    switch (type) {
        case "flashcards": return "var(--accent)";
        case "quiz": return "var(--secondary)";
        case "summary": return "var(--success)";
        case "roadmap": return "var(--error)";
        default: return "var(--foreground-muted)";
    }
}

function getTypeLabel(type: string): string {
    switch (type) {
        case "flashcards": return "Flashcards";
        case "quiz": return "Quiz";
        case "summary": return "Summary";
        case "roadmap": return "Roadmap";
        default: return type;
    }
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ═══════════════════════════════════════════════════
   WIDGETS
   ═══════════════════════════════════════════════════ */

function XPGauge({ xp }: { xp: number }) {
    const level = calculateLevel(xp);
    const progress = getLevelProgress(xp);
    const nextLevelXp = Math.pow(level, 2) * 100;
    const currentLevelXp = Math.pow(level - 1, 2) * 100;
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const levelTitles: Record<number, string> = {
        1: "Novice", 2: "Apprentice", 3: "Student", 4: "Scholar",
        5: "Adept", 6: "Expert", 7: "Master", 8: "Sage",
        9: "Professor", 10: "Luminary",
    };
    const levelTitle = levelTitles[Math.min(level, 10)] || "Legend";

    return (
        <div className={`p-6 md:p-8 flex items-center gap-6 md:gap-8 ${clayCard}`}>
            <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-[var(--border)]" strokeWidth="6" fill="none" opacity="0.6" />
                    <motion.circle
                        cx="50" cy="50" r="40"
                        stroke="url(#xp-gradient)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                        strokeDasharray={circumference}
                    />
                    <defs>
                        <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent)" />
                            <stop offset="100%" stopColor="var(--secondary)" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] md:text-[26px] font-black text-[var(--foreground)] leading-none">{level}</span>
                    <span className="text-[9px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest mt-0.5">Level</span>
                </div>
            </div>
            <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/15 mb-2">
                    <GraduationCap size={12} strokeWidth={1.5} className="text-[var(--accent)]" />
                    <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider">{levelTitle}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--foreground)] mb-1 tracking-tight">{xp.toLocaleString()} XP</h3>
                <p className="text-[12px] text-[var(--foreground-muted)]">
                    {nextLevelXp - xp > 0 ? `${(nextLevelXp - xp).toLocaleString()} XP to Level ${level + 1}` : "Max level reached!"}
                </p>
            </div>
        </div>
    );
}

function StreakCalendar({ streak, activeDates }: { streak: number; activeDates: string[] }) {
    // Build this week's dates (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });

    const today = now.toISOString().split('T')[0];
    const activeSet = new Set(activeDates);

    return (
        <div className={`p-6 md:p-8 flex flex-col justify-between ${clayCard}`}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-1 flex items-center gap-2">
                        <Flame size={20} strokeWidth={1.5} className="text-[var(--accent)]" />
                        {streak > 0 ? `${streak} Day Streak` : "Start a Streak"}
                    </h3>
                    <p className="text-[12px] text-[var(--foreground-muted)]">
                        {streak >= 7 ? "You're on a roll — keep it up!" :
                         streak >= 3 ? "Great momentum this week." :
                         streak > 0 ? "Building consistency, one day at a time." :
                         "Study today to start your streak."}
                    </p>
                </div>
                {streak > 0 && (
                    <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                        <span className="text-[16px] font-black text-[var(--accent)]">{streak}</span>
                    </div>
                )}
            </div>
            <div className="flex gap-2 w-full justify-between">
                {WEEKDAYS.map((day, i) => {
                    const dateStr = weekDates[i];
                    const isActive = activeSet.has(dateStr);
                    const isToday = dateStr === today;
                    const isFuture = dateStr > today;

                    return (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <span className={`text-[10px] font-bold ${isToday ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"}`}>{day}</span>
                            <div className="w-full aspect-square rounded-full flex items-center justify-center relative">
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
                                        className="absolute inset-0 bg-[var(--accent)] rounded-full shadow-[0_0_12px_var(--accent-glow)]"
                                    />
                                )}
                                {isToday && !isActive && (
                                    <div className="absolute inset-0 border-2 border-dashed border-[var(--accent)]/40 rounded-full animate-pulse" />
                                )}
                                <div className={`relative z-10 w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-full border-2 ${
                                    isActive ? 'border-transparent' :
                                    isToday ? 'border-transparent' :
                                    isFuture ? 'border-[var(--border)]/30' :
                                    'border-[var(--border)]'
                                }`}>
                                    {isActive && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Check size={12} strokeWidth={2.5} className="text-[var(--background)]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RecentActivity({ activities }: { activities: ActivityData["recentActivity"] }) {
    if (activities.length === 0) {
        return (
            <div className={`flex flex-col h-full p-6 md:p-8 ${clayCard}`}>
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                    <History size={18} strokeWidth={1.5} className="text-[var(--secondary)]" />
                    Recent Activity
                </h3>
            </div>
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap size={36} strokeWidth={1.5} className="text-[var(--foreground-muted)]/40 mb-3" />
                    <p className="text-[13px] text-[var(--foreground-muted)]">No study sessions yet.</p>
                    <Link href="/create" className="mt-4 text-[12px] font-bold text-[var(--accent)] hover:underline">
                        Create your first deck →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full p-6 md:p-8 ${clayCard}`}>
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                    <History size={18} strokeWidth={1.5} className="text-[var(--secondary)]" />
                    Recent Activity
                </h3>
                <Link href="/library" className="text-[11px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wider">
                    View All
                </Link>
            </div>
            <div className="space-y-2 flex-1">
                {activities.slice(0, 5).map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={i >= 2 ? "hidden lg:block" : "block"}
                    >
                        <Link
                            href={`/${item.type === "quiz" ? "quiz" : item.type === "summary" ? "summary" : "flashcards"}?id=${item.id}`}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--foreground)]/[0.03] transition-colors group"
                        >
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${getTypeColor(item.type)} 12%, transparent)` }}
                            >
                                {(() => {
                                    const IconComp = getTypeIcon(item.type);
                                    return <IconComp size={16} strokeWidth={1.5} style={{ color: getTypeColor(item.type) }} />;
                                })()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">{item.title}</p>
                                <p className="text-[11px] text-[var(--foreground-muted)]">{getTypeLabel(item.type)}</p>
                            </div>
                            <span className="text-[10px] text-[var(--foreground-muted)] shrink-0">{formatRelativeTime(item.createdAt)}</span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function AIStudyPlan({ plan, loading }: { plan: string | null; loading: boolean }) {
    const [expanded, setExpanded] = useState(false);

    if (loading) {
        return (
            <div className={`w-full p-8 md:p-10 flex flex-col items-center justify-center min-h-[240px] ${clayCard}`}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                    <Brain size={36} strokeWidth={1.5} className="text-[var(--success)] opacity-40" />
                </motion.div>
                <p className="mt-5 text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest animate-pulse">Building your study plan...</p>
            </div>
        );
    }

    if (!plan) return null;

    return (
        <div className={`w-full p-8 md:p-10 relative overflow-hidden ${clayCard}`}>
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[var(--success)]/5 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[14px] bg-[var(--success)]/10 border border-[var(--success)]/20 flex items-center justify-center">
                    <Brain size={20} strokeWidth={1.5} className="text-[var(--success)]" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] tracking-tight">Your Study Plan</h2>
                    <p className="text-[12px] text-[var(--foreground-muted)]">Personalized from your goals and progress.</p>
                </div>
            </div>

            <div className="relative z-10">
                <div
                    className={`max-w-none text-[14px] leading-relaxed overflow-hidden transition-all duration-500 ${
                        expanded ? "" : "max-h-[400px]"
                    }`}
                >
                    <div className="dashboard-markdown">
                        <Markdown>{plan}</Markdown>
                    </div>
                </div>

                {/* Fade overlay when collapsed */}
                {!expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--card)] to-transparent pointer-events-none" />
                )}

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="relative z-10 mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                >
                    {expanded ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
                    {expanded ? "Show less" : "Show full plan"}
                </button>
            </div>

            <div className="mt-8 flex border-t border-[var(--border)] pt-6 relative z-10">
                <Link href="/create" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold text-[13px] hover:scale-[1.02] transition-transform active:scale-[0.98]">
                    <Zap size={16} strokeWidth={1.5} />
                    Start Studying
                </Link>
            </div>
        </div>
    );
}

function QuickLaunchCard({ title, desc, icon, href, color }: {
    title: string; desc: string; icon: string; href: string; color: string;
}) {
    return (
        <Link href={href} className="group relative">
            <div className={`p-6 md:p-7 h-full flex flex-col justify-between transition-transform duration-500 group-hover:-translate-y-1 ${clayCard}`}>
                <div>
                    <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5"
                        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, boxShadow: `0 4px 16px color-mix(in srgb, ${color} 10%, transparent)` }}
                    >
                        {(() => {
                            const IconMap: Record<string, any> = {
                                forum: MessageCircle,
                                swords: Swords,
                                add_circle: PlusCircle,
                                arrow_forward: ArrowRight
                            };
                            const IconComp = IconMap[icon] || HelpCircle;
                            return <IconComp size={20} strokeWidth={1.5} style={{ color }} />;
                        })()}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{title}</h3>
                    <p className="text-[12px] text-[var(--foreground-muted)] leading-relaxed">{desc}</p>
                </div>
                <div className="mt-6 flex justify-end">
                    <div className="w-7 h-7 rounded-full bg-[var(--foreground)]/5 group-hover:bg-[var(--foreground)] flex items-center justify-center transition-colors">
                        <ArrowRight size={14} strokeWidth={1.5} className="text-[var(--foreground-muted)] group-hover:text-[var(--background)]" />
                    </div>
                </div>
            </div>
        </Link>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function DashboardPage() {
    const { user, refreshUser, buyStreakFreeze, recoverStreak } = useUser();
    const { addToast } = useToasts();
    const router = useRouter();
    const [milestoneToCelebrate, setMilestoneToCelebrate] = useState<number | null>(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    // Fetch activity data via React Query
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['activity-history', user.id],
        queryFn: async () => {
            const res = await fetch("/api/user/activity-history");
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            
            // Milestone Check hook logic
            const milestones = [7, 14, 30, 60, 100];
            const currentStreak = data.streak || 0;
            if (milestones.includes(currentStreak)) {
                const key = `milestone_celebrated_${currentStreak}`;
                const alreadyCelebrated = localStorage.getItem(key);
                if (!alreadyCelebrated) {
                    setMilestoneToCelebrate(currentStreak);
                    localStorage.setItem(key, "true");
                    
                    fetch("/api/user/activity", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "daily_challenge",
                            customXp: currentStreak === 7 ? 25 : currentStreak === 14 ? 50 : currentStreak === 30 ? 100 : currentStreak === 60 ? 200 : 500
                        })
                    }).then(() => refreshUser()).catch(err => console.error("Failed to award milestone XP:", err));
                }
            }
            return data as ActivityData;
        },
        enabled: !!user.id,
    });

    // Fetch due cards via React Query
    const { data: dueData } = useQuery({
        queryKey: ['due-cards', user.id],
        queryFn: async () => {
            const res = await fetch("/api/user/due-cards");
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        },
        enabled: !!user.id,
    });
    const dueCount = dueData?.totalDue || 0;

    const canRecover = user.streak === 0 && user.lastStreak > 0 && user.streakResetAt && (Date.now() - new Date(user.streakResetAt).getTime()) < 24 * 60 * 60 * 1000;

    const handleBuyFreeze = async () => {
        setIsProcessingAction(true);
        const success = await buyStreakFreeze();
        if (success) {
            addToast("Streak Freeze banked!", "success", "ac_unit");
        } else {
            addToast("Failed to buy freeze. Check your credits.", "error");
        }
        setIsProcessingAction(false);
    };

    const handleRecover = async () => {
        setIsProcessingAction(true);
        const success = await recoverStreak();
        if (success) {
            addToast("Streak restored! Welcome back.", "success", "restore");
        } else {
            addToast("Recovery failed or window expired.", "error");
        }
        setIsProcessingAction(false);
    };

    // Fetch study plan via React Query
    const { data: studyPlanData, isLoading: planLoading } = useQuery({
        queryKey: ['study-plan', user.id],
        queryFn: async () => {
            const res = await fetch("/api/ai/study-plan", { method: "POST" });
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            
            return (data.plan || "") as string;
        },
        enabled: !!user.id,
    });
    
    const studyPlan = studyPlanData || null;

    const formatStudyGoal = (goalStr: any) => {
        if (!goalStr) return null;
        try {
            // Handle both stringified and already-parsed JSON
            const parsed = typeof goalStr === 'string' ? JSON.parse(goalStr) : goalStr;
            
            if (parsed.painPoints || parsed.commitmentTime) {
                const parts = [];
                if (parsed.painPoints?.length) {
                    const points = Array.isArray(parsed.painPoints) ? parsed.painPoints : [parsed.painPoints];
                    parts.push(`${points.join(", ")}`);
                }
                if (parsed.commitmentTime) parts.push(`with ${parsed.commitmentTime} daily`);
                return parts.length > 0 ? parts.join(" ") : "your custom plan";
            }
        } catch (e) {
            console.error("Goal parse error:", e);
            return typeof goalStr === 'string' ? goalStr : "your custom plan";
        }
        return typeof goalStr === 'string' ? goalStr : "your custom plan";
    };

    const greeting = getGreeting();
    const firstName = user.name?.split(" ")[0] || "Scholar";
    const realXp = activityData?.xp ?? user.xp ?? 0;
    const realStreak = activityData?.streak ?? user.streak ?? 0;

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />
            <SEOHead type="BreadcrumbList" data={getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Dashboard", url: "/dashboard" }])} />

            <div className="w-full max-w-6xl mx-auto px-5 pt-28 pb-24 relative">
                {/* Header Scroll Sentinel */}
                <div data-header-sentinel className="absolute top-0 left-0 h-1 w-full pointer-events-none" />
                
                {/* Streak Recovery Banner */}
                {canRecover && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 rounded-[28px] bg-[#F59E0B]/10 border border-[#F59E0B]/30 backdrop-blur-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F59E0B]" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-4">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                                    <History size={30} strokeWidth={1.5} className="text-[#F59E0B]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[var(--foreground)] leading-tight">Streak Recovery Available</h3>
                                    <p className="text-sm text-[var(--foreground-secondary)] mt-1 max-w-md">You lost your <b>{user.lastStreak} day streak</b>. Restore it now for <span className="text-[#F59E0B] font-bold">3 Credits</span>. Window ends in 24h.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleRecover}
                                disabled={isProcessingAction}
                                className="px-8 py-3.5 rounded-2xl bg-[#F59E0B] text-[#06060B] font-black text-[13px] tracking-wide shadow-[0_8px_20px_rgba(245,158,11,0.25)] hover:scale-[1.03] active:scale-[0.97] transition-all whitespace-nowrap"
                            >
                                {isProcessingAction ? "Restoring..." : `Restore ${user.lastStreak} Days`}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Header Section */}
                <motion.div
                    className="mb-10"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight mb-2">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)]">{firstName}</span>.
                    </h1>
                    <p className="text-[14px] text-[var(--foreground-muted)] font-medium capitalize">
                        {activityData?.studyGoal
                            ? `Working toward: ${formatStudyGoal(activityData.studyGoal)}`
                            : activityData?.totalThisWeek
                                ? `${activityData.totalThisWeek} study sessions this week — keep going.`
                                : "Ready to learn something new today?"
                        }
                    </p>
                </motion.div>

                {/* Daily Review Reminder */}
                <AnimatePresence>
                    {dueCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-8"
                        >
                            <Link href="/review" className="block group">
                                <div className="p-6 md:p-8 relative overflow-hidden flex items-center justify-between nm-card border border-[var(--accent)]/20">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                                            <Layers size={30} strokeWidth={1.5} className="text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Active Recall Ready</h2>
                                            <p className="text-[13px] text-[var(--foreground-muted)]">{dueCount} card{dueCount === 1 ? '' : 's'} are waiting for your review today.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="hidden md:flex flex-col items-end">
                                            <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">~{Math.ceil(dueCount * 0.5)} min</span>
                                            <span className="text-[9px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">Est. Study Time</span>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Link 
                                                href="/review?mode=quick"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-4 py-2 rounded-xl bg-[var(--foreground)]/5 border border-[var(--border)] hover:bg-[var(--foreground)]/10 transition-colors text-[11px] font-bold text-[var(--foreground)]/60 flex items-center gap-2"
                                            >
                                                <Zap size={16} strokeWidth={1.5} />
                                                2-Min Blitz
                                            </Link>
                                            
                                            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--background)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <ArrowRight size={20} strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Row */}
                {activityLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`h-[140px] animate-pulse ${clayCard}`} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10 items-start">
                        {/* LEFT COLUMN: Main Stats & Challenges */}
                        <div className="lg:col-span-8 flex flex-col gap-5">
                            {/* Top Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <XPGauge xp={realXp} />
                                </motion.div>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                    <StreakCalendar streak={realStreak} activeDates={activityData?.activeDatesThisWeek || []} />
                                </motion.div>
                            </div>
                            
                            {/* Challenges Row moved to SiteHeader */}
                        </div>

                        {/* RIGHT COLUMN: Side Widgets */}
                        <div className="lg:col-span-4 flex flex-col gap-5">
                            {/* Streak Protection Widget */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                                <div className={`p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group w-full ${clayCard}`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent blur-2xl pointer-events-none" />
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center overflow-hidden">
                                                    <Snowflake size={20} strokeWidth={1.5} className="text-cyan-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[14px] font-bold text-[var(--foreground)]">Protection</h3>
                                                    <p className="text-[10px] text-[var(--foreground-muted)] font-medium tracking-wider uppercase">Streak Freezes</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className={`w-3 h-3 rounded-full border ${i < user.streakFreezeCount ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-[var(--foreground)]/5 border-[var(--border)]'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed mb-6">Equip freezes to automatically protect your streak if you miss a day.</p>
                                    </div>
                                    <button 
                                        onClick={handleBuyFreeze}
                                        disabled={isProcessingAction || user.streakFreezeCount >= 3 || user.credits < 1}
                                        className="w-full py-3 rounded-xl bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 border border-[var(--border)] text-[11px] font-bold text-[var(--foreground)] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        <Coins size={12} strokeWidth={1.5} className="flex items-center justify-center" />
                                        {user.streakFreezeCount >= 3 ? "Max Banked" : "Buy for 1 Credit"}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Leaderboard */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                                <GlobalLeaderboard currentUser={user} />
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* AI Study Plan */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
                    <AIStudyPlan plan={studyPlan} loading={planLoading} />
                </motion.div>

                {/* Master Grid: Calendar & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-[14px] bg-[var(--secondary)]/10 border border-[var(--secondary)]/15 flex items-center justify-center">
                                <Calendar size={20} strokeWidth={1.5} className="text-[var(--secondary)]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Review Schedule</h2>
                                <p className="text-[12px] text-[var(--foreground-muted)]">Spaced repetition keeps knowledge locked in.</p>
                            </div>
                        </div>
                        <div className="flex-1">
                            <SpacedRepetitionCalendar />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-4 flex flex-col h-full mt-4 lg:mt-0">
                        {activityData && <RecentActivity activities={activityData.recentActivity || []} />}
                    </motion.div>
                </div>

                {/* Quick Launch */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 tracking-tight">Quick Start</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <QuickLaunchCard
                            title="Chat with The Professor"
                            desc="Ask questions, get explanations, work through problems together."
                            icon="forum"
                            href="/chat"
                            color="var(--success)"
                        />
                        <QuickLaunchCard
                            title="Arena Duel"
                            desc={`Challenge someone — ${activityData?.stats ? `${activityData.stats.quizzes} quizzes completed so far.` : "test your knowledge under pressure."}`}
                            icon="swords"
                            href="/arena"
                            color="var(--error)"
                        />
                        <QuickLaunchCard
                            title="Create Study Materials"
                            desc={`Generate flashcards, quizzes, or summaries${activityData?.stats ? ` — ${activityData.stats.flashcards + activityData.stats.quizzes + activityData.stats.summaries} created total.` : "."}`}
                            icon="add_circle"
                            href="/create"
                            color="var(--accent)"
                        />
                    </div>
                </motion.div>
            </div>

            <StreakMilestone 
                count={milestoneToCelebrate || 0}
                isVisible={!!milestoneToCelebrate}
                onClose={() => setMilestoneToCelebrate(null)}
            />
        </main>
    );
}
