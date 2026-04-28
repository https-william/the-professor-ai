"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Layers, Zap, ArrowRight, Calendar, History as HistoryIcon, Flame } from "lucide-react";
import XPGauge from "@/components/features/dashboard/XPGauge";
import StreakCalendar from "@/components/features/dashboard/StreakCalendar";
import RecentActivity from "@/components/features/dashboard/RecentActivity";
import AIStudyPlan from "@/components/features/dashboard/AIStudyPlan";
import QuickLaunchCard from "@/components/features/dashboard/QuickLaunchCard";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import QuoteOfTheStoic from "@/components/features/dashboard/QuoteOfTheStoic";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import MagneticButton from "@/components/ui/MagneticButton";
import { calculateLevel, getLevelTitle } from "@/lib/profiles-client";

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
    handleBuyFreeze: () => void;
    handleShare: () => void;
}

export default function DashboardDesktop({
    user,
    activityData,
    dueCount,
    studyPlan,
    planLoading,
    greeting,
    firstName,
    handleRecover,
    canRecover,
    isProcessingAction,
    handleBuyFreeze,
    handleShare
}: DashboardDesktopProps) {
    const formatStudyGoal = (goalStr: any) => {
        if (!goalStr) return null;
        try {
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
            return typeof goalStr === 'string' ? goalStr : "your custom plan";
        }
        return typeof goalStr === 'string' ? goalStr : "your custom plan";
    };

    return (
        <div className="w-full h-[100dvh] overflow-y-auto no-scrollbar relative font-sans bg-[var(--background)] selection:bg-[var(--accent)]/10">
            {/* Ultra-Premium Glassmorphic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[var(--accent)]/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--secondary)]/10 blur-[120px] rounded-full mix-blend-screen" />
                {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" /> */}
            </div>

            <div className="max-w-[1800px] mx-auto px-8 md:px-16 pt-24 pb-32 relative z-10 flex flex-col gap-8">
                
                {/* ─── MASTHEAD & PRIMARY ACTION (Row 1) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    
                    {/* Welcome Banner (Cols 1-2) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 p-12 rounded-[40px] border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-transparent relative overflow-hidden group flex flex-col justify-end min-h-[360px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0" />
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 rotate-12 group-hover:rotate-0 scale-150">
                            <Layers size={400} />
                        </div>
                        
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-6 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                                {activityData?.studyGoal ? "Active Session" : "Awaiting Orders"}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-[var(--foreground)] tracking-tight mb-4 leading-[0.9]">
                                {greeting}, <br />
                                <span className="text-[var(--accent)] drop-shadow-[0_0_30px_var(--accent-glow)]">{firstName}</span>.
                            </h1>
                            <p className="text-xl text-[var(--foreground-muted)] font-medium">
                                {activityData?.studyGoal
                                    ? formatStudyGoal(activityData.studyGoal)
                                    : "Define your study goal to begin."
                                }
                            </p>
                        </div>
                    </motion.div>

                    {/* Action Center (Col 3) */}
                    <div className="flex flex-col gap-8">
                        <AnimatePresence>
                            {dueCount > 0 ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1">
                                    <Link href="/review" className="block h-full group">
                                        <div className="h-full p-8 rounded-[40px] bg-[var(--accent)] border border-[var(--accent)] relative overflow-hidden transition-all hover:shadow-[0_0_80px_var(--accent-glow)] flex flex-col justify-between">
                                            <div className="absolute top-[-50%] right-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 rotate-45 transition-all duration-700 ease-out" />
                                            
                                            <div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-black mb-6">
                                                    Priority Task
                                                </div>
                                                <h3 className="text-4xl font-black text-black tracking-tighter leading-none mb-2">Resume<br/>Session</h3>
                                                <p className="text-sm font-bold text-black/70">{dueCount} topics pending review.</p>
                                            </div>

                                            <MagneticButton className="self-end">
                                                <div className="w-16 h-16 rounded-full bg-black text-[var(--accent)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                                    <ArrowRight size={24} strokeWidth={3} />
                                                </div>
                                            </MagneticButton>
                                        </div>
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="flex-1 p-8 rounded-[40px] bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center text-center opacity-50">
                                    <Layers size={48} className="text-[var(--foreground-muted)] mb-4" />
                                    <p className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-widest">No pending reviews</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ─── VITAL STATS BENTO (Row 2) ─── */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    <div className="p-8 rounded-[40px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between group hover:bg-[var(--card)] transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-6">Scholar Level</span>
                        <div className="flex items-end justify-between">
                            <span className="text-5xl font-black text-[var(--foreground)]">{calculateLevel(user.xp)}</span>
                            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-tighter mb-2">{getLevelTitle(calculateLevel(user.xp))}</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between group hover:bg-[var(--card)] transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:text-[var(--accent)] transition-colors"><Flame size={120} /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-6 relative z-10">Current Streak</span>
                        <div className="flex items-end gap-2 relative z-10">
                            <span className="text-5xl font-black text-[var(--foreground)]"><AnimatedCounter value={user.streak} /></span>
                            <span className="text-[11px] font-bold text-[var(--foreground-muted)] mb-1.5 uppercase tracking-tighter">Days</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between group hover:bg-[var(--card)] transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-6">Vault Freezes</span>
                        <div className="flex items-center gap-2 pt-4">
                            {[...Array(3)].map((_, i) => {
                                const isAvailable = i < user.streakFreezeCount;
                                const isExpiring = isAvailable && i === user.streakFreezeCount - 1;
                                return (
                                    <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-1000 ${
                                        isAvailable 
                                        ? isExpiring ? 'bg-cyan-600/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]' 
                                        : 'bg-[var(--foreground)]/5'
                                    }`} />
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between group hover:bg-[var(--card)] transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-6">Credits</span>
                        <div className="flex items-end justify-between">
                            <span className="text-5xl font-black text-[var(--foreground)]"><AnimatedCounter value={user.credits} /></span>
                            <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest opacity-40 mb-2">Bal</span>
                        </div>
                    </div>
                </motion.div>

                {/* ─── INSIGHTS & TOOLING (Row 3) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Activity (Cols 1-4) */}
                    <div className="lg:col-span-4 space-y-8">
                        <XPGauge xp={user.xp} />
                        <StreakCalendar streak={user.streak} activeDates={activityData?.activeDatesThisWeek || []} />
                    </div>

                    {/* Widgets (Cols 5-8) */}
                    <div className="lg:col-span-4 space-y-8 flex flex-col">
                        <FocusTimer />
                        <QuoteOfTheStoic />
                        <WeeklyWrappedCard />
                    </div>

                    {/* Toolkit & Recovery (Cols 9-12) */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="p-8 rounded-[40px] bg-[var(--card)] border border-[var(--border)] flex-1">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] mb-8">Launchpad</h3>
                            <div className="flex flex-col gap-4">
                                <QuickLaunchCard title="Arena" desc="Global Duels" icon="swords" href="/arena" color="var(--error)" />
                                <QuickLaunchCard title="Create Studio" desc="Generate Study Material" icon="add_circle" href="/create" color="var(--accent)" />
                                <QuickLaunchCard title="Library" desc="Your Decks & Plans" icon="library_books" href="/library" color="var(--secondary)" />
                            </div>
                        </div>

                        {canRecover && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <div className="p-8 rounded-[40px] bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/5 border border-[#F59E0B]/30 relative overflow-hidden group">
                                    <div className="absolute -right-8 -top-8 opacity-10 group-hover:rotate-45 transition-transform duration-700">
                                        <HistoryIcon size={160} className="text-[#F59E0B]" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xs font-black text-[#F59E0B] uppercase tracking-[0.4em] mb-4">Streak Recovery</h3>
                                        <p className="text-sm text-[var(--foreground-muted)] mb-6 font-medium">Restore <b>{user.lastStreak} days</b> of momentum.</p>
                                        <button onClick={handleRecover} disabled={isProcessingAction} className="w-full py-4 rounded-2xl bg-[#F59E0B] text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50">
                                            Restore (3 CR)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}