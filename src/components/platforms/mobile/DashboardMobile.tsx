"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Layers, Zap, ArrowRight, Flame, Brain, Calendar } from "lucide-react";
import XPGauge from "@/components/features/dashboard/XPGauge";
import RecentActivity from "@/components/features/dashboard/RecentActivity";
import AIStudyPlan from "@/components/features/dashboard/AIStudyPlan";
import QuickLaunchCard from "@/components/features/dashboard/QuickLaunchCard";
import FocusTimer from "@/components/features/dashboard/FocusTimer";
import QuoteOfTheStoic from "@/components/features/dashboard/QuoteOfTheStoic";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { calculateLevel } from "@/lib/profiles-client";

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
    handleBuyFreeze: () => void;
    handleShare: () => void;
}

export default function DashboardMobile({
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
    handleShare,
}: DashboardMobileProps) {
    return (
        <div className="w-full h-[100dvh] overflow-y-auto no-scrollbar relative font-sans bg-[var(--background)] selection:bg-[var(--accent)]/10 px-6 pt-24 pb-32">
            {/* Ultra-Premium Glassmorphic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-5%] right-[-10%] w-[300px] h-[300px] bg-[var(--accent)]/15 blur-[80px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] bg-[var(--secondary)]/10 blur-[80px] rounded-full mix-blend-screen" />
                {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" /> */}
            </div>

            <div className="relative z-10 flex flex-col gap-6">
                
                {/* ─── MASTHEAD (Banner) ─── */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[36px] border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-transparent relative overflow-hidden group flex flex-col justify-end min-h-[280px]"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0" />
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] scale-150 rotate-12">
                        <Layers size={200} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-4 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                            {activityData?.studyGoal ? "Active Session" : "Awaiting Orders"}
                        </div>
                        <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight mb-2 leading-[0.9]">
                            {greeting}, <br />
                            <span className="text-[var(--accent)] drop-shadow-[0_0_20px_var(--accent-glow)]">{firstName}</span>.
                        </h1>
                    </div>
                </motion.div>

                {/* ─── ACTION CENTER ─── */}
                <AnimatePresence>
                    {dueCount > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <Link href="/review" className="block w-full">
                                <div className="p-6 rounded-[36px] bg-[var(--accent)] border border-[var(--accent)] relative overflow-hidden flex items-center justify-between">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[9px] font-black uppercase tracking-[0.2em] text-black mb-3">
                                            Priority Task
                                        </div>
                                        <h3 className="text-2xl font-black text-black tracking-tighter leading-none mb-1">Resume Session</h3>
                                        <p className="text-xs font-bold text-black/70">{dueCount} topics pending.</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-black text-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-xl">
                                        <ArrowRight size={24} strokeWidth={3} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── VITAL STATS GRID ─── */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-[32px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-4">Level</span>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-[var(--foreground)]">{calculateLevel(user.xp)}</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-[var(--accent)]"><Flame size={80} /></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-4 relative z-10">Streak</span>
                        <div className="flex items-end gap-1.5 relative z-10">
                            <span className="text-4xl font-black text-[var(--foreground)]"><AnimatedCounter value={user.streak} /></span>
                            <span className="text-[10px] font-bold text-[var(--foreground-muted)] mb-1 uppercase tracking-tighter">Days</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-4">Freezes</span>
                        <div className="flex items-center gap-1.5 pt-2">
                            {[...Array(3)].map((_, i) => {
                                const isAvailable = i < user.streakFreezeCount;
                                const isExpiring = isAvailable && i === user.streakFreezeCount - 1;
                                return (
                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-1000 ${
                                        isAvailable 
                                        ? isExpiring ? 'bg-cyan-600/60 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                                        : 'bg-[var(--foreground)]/5'
                                    }`} />
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-[var(--card)]/50 backdrop-blur-xl border border-[var(--card-border)] flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-4">Credits</span>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-black text-[var(--foreground)]"><AnimatedCounter value={user.credits} /></span>
                        </div>
                    </div>
                </div>

                {/* ─── INSIGHTS & TOOLING ─── */}
                <div className="space-y-6 mt-4">
                    <XPGauge xp={user.xp} />
                    <FocusTimer />
                    <QuoteOfTheStoic />
                    <WeeklyWrappedCard />
                </div>

                {/* ─── LAUNCHPAD ─── */}
                <div className="space-y-4 mt-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] block px-2">Launchpad</span>
                    <div className="grid grid-cols-1 gap-3">
                        <QuickLaunchCard title="Arena" desc="Global Duels" icon="swords" href="/arena" color="var(--error)" />
                        <QuickLaunchCard title="Create Studio" desc="Generate Material" icon="add_circle" href="/create" color="var(--accent)" />
                    </div>
                </div>

                {/* ─── RECOVERY WIDGET ─── */}
                {canRecover && (
                    <button 
                        onClick={handleRecover}
                        disabled={isProcessingAction}
                        className="w-full p-6 rounded-[32px] bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/5 border border-[#F59E0B]/30 flex items-center justify-between active:scale-[0.98] transition-all relative overflow-hidden mt-6 disabled:opacity-50"
                    >
                        <div className="flex flex-col items-start gap-1 relative z-10">
                            <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-[0.2em]">Streak Rescue</span>
                            <span className="text-base font-bold text-[var(--foreground)]">Restore {user.lastStreak} Days</span>
                        </div>
                        <div className="px-4 py-2 bg-[#F59E0B] text-black rounded-xl text-xs font-black shadow-lg relative z-10">3 CR</div>
                    </button>
                )}

            </div>
        </div>
    );
}