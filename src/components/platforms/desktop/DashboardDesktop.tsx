"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Layers, Zap, ArrowRight, Calendar, History as HistoryIcon, Flame } from "lucide-react";
import XPGauge from "@/components/features/dashboard/XPGauge";
import StreakCalendar from "@/components/features/dashboard/StreakCalendar";
import RecentActivity from "@/components/features/dashboard/RecentActivity";
import QuickLaunchCard from "@/components/features/dashboard/QuickLaunchCard";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import { calculateLevel, getLevelTitle } from "@/lib/profiles-client";
import StandardContainer from "@/components/ui/StandardContainer";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import MagneticButton from "@/components/ui/MagneticButton";

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
        <div className="w-full min-h-screen relative font-sans bg-[var(--bg)] selection:bg-[var(--blue-dim)]">
            {/* Ultra-Premium Glassmorphic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[var(--blue)]/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--blue-dim)] blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <StandardContainer className="pt-24 pb-32 relative z-10 flex flex-col gap-8" wide={true}>
                
                {/* ─── MASTHEAD & PRIMARY ACTION (Row 1) ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    
                    {/* Welcome Banner (Cols 1-2) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 p-12 rounded-[40px] border border-[var(--border)] bg-[var(--background-secondary)] shadow-xl relative overflow-hidden group flex flex-col justify-end min-h-[360px]"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.05] text-[var(--blue)] pointer-events-none group-hover:opacity-[0.08] transition-opacity"><Layers size={240} /></div>
                        <div className="relative z-10 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--text)]/5 border border-[var(--border)] text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] backdrop-blur-md shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse" />
                                    {activityData?.studyGoal ? "Active Session" : "Awaiting Orders"}
                                </div>
                                <FocusTimer widget={true} />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-[var(--text)] tracking-tighter mb-4 leading-[0.9]">
                                {greeting}{greeting.match(/[?!]$/) ? "" : ","} <br />
                                <span className="text-[var(--blue)] drop-shadow-[0_10px_40px_var(--blue-glow)]">{firstName}</span>
                            </h1>
                            <p className="text-xl text-[var(--text-2)] font-medium">
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
                                        <div className="h-full p-8 rounded-[40px] bg-[var(--blue)] border border-[var(--blue-border)] relative overflow-hidden transition-all hover:shadow-[0_0_80px_var(--blue-glow)] flex flex-col justify-between">
                                            <div className="absolute top-[-50%] right-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 rotate-45 transition-all duration-700 ease-out" />
                                            
                                            <div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-black mb-6">
                                                    Priority Task
                                                </div>
                                                <h3 className="text-4xl font-black text-black tracking-tighter leading-none mb-2">Resume<br/>Session</h3>
                                                <p className="text-sm font-bold text-[var(--text-2)]">{dueCount} topics pending review.</p>
                                            </div>
 
                                            <MagneticButton className="self-end">
                                                <div className="w-16 h-16 rounded-full bg-black text-[var(--blue)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                                    <ArrowRight size={24} strokeWidth={3} />
                                                </div>
                                            </MagneticButton>
                                        </div>
                                    </Link>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ─── VITAL STATS BENTO (Row 2) ─── */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <div className="p-8 rounded-[40px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] flex flex-col justify-between group hover:bg-[var(--bg-2)] transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] mb-6">Scholar Level</span>
                        <div className="flex items-end justify-between">
                            <span className="text-5xl font-black text-[var(--text)]">{calculateLevel(user.xp)}</span>
                            <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-tighter mb-2">{getLevelTitle(calculateLevel(user.xp))}</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] flex flex-col justify-between group hover:bg-[var(--bg-2)] transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:text-[var(--amber)] transition-colors"><Flame size={120} /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] mb-6 relative z-10">Current Streak</span>
                        <div className="flex items-end gap-2 relative z-10">
                            <span className="text-5xl font-black text-[var(--text)]"><AnimatedCounter value={user.streak} /></span>
                            <span className="text-[11px] font-bold text-[var(--text-3)] mb-1.5 uppercase tracking-tighter">Days</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] flex flex-col justify-between group hover:bg-[var(--bg-2)] transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] mb-6">Credits</span>
                        <div className="flex items-end justify-between">
                            <span className="text-5xl font-black text-[var(--text)]"><AnimatedCounter value={user.credits} /></span>
                            <span className="text-[10px] font-black text-[var(--text-3)] uppercase tracking-widest opacity-70 mb-2">Bal</span>
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
                        <WeeklyWrappedCard />
                    </div>

                    {/* Toolkit & Recovery (Cols 9-12) */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {canRecover && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <div className="p-8 rounded-[40px] bg-[var(--amber-dim)] border border-[var(--amber-border)] relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h3 className="text-xs font-black text-[var(--amber)] uppercase tracking-[0.4em] mb-4">Streak Recovery</h3>
                                        <p className="text-sm text-[var(--text-3)] mb-6 font-medium">Restore <b>{user.lastStreak} days</b> of momentum.</p>
                                        <button onClick={handleRecover} disabled={isProcessingAction} className="w-full py-4 rounded-2xl bg-[var(--amber)] text-black font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50">
                                            Restore (3 CR)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </StandardContainer>
        </div>
    );
}
