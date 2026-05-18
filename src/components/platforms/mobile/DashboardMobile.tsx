"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import StandardContainer from "@/components/ui/StandardContainer";
import { Layers, Zap, ArrowRight, Flame, Brain, Calendar, Sparkles, Coins } from "lucide-react";
import XPGauge from "@/components/features/dashboard/XPGauge";
import ProfessorsWisdom from "@/components/features/dashboard/ProfessorsWisdom";
import WeeklyWrappedCard from "@/components/features/dashboard/WeeklyWrappedCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { calculateLevel, getLevelTitle } from "@/lib/profiles-client";
import { getDailyTip } from "@/lib/education-tips";
import FocusTimer from "@/components/features/dashboard/FocusTimer";

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
    handleShare,
}: DashboardMobileProps) {
    const level = calculateLevel(user.xp);
    const title = getLevelTitle(level);
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dailyLine = getDailyTip(user.id || "");

    return (
        <div className="w-full relative font-sans bg-[var(--bg)] selection:bg-[var(--blue-dim)] pt-24 pb-32">
            {/* Ultra-Premium Glassmorphic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-5%] right-[-10%] w-[300px] h-[300px] bg-[var(--blue)]/15 blur-[80px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] bg-[var(--blue-dim)] blur-[80px] rounded-full mix-blend-screen" />
            </div>

            <StandardContainer className="relative z-10 flex flex-col gap-6">
                
                {/* ─── 1. MASTHEAD (Greeting Banner) ─── */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[36px] border border-[var(--border)] bg-[var(--background-secondary)] shadow-xl relative overflow-hidden group flex flex-col justify-end min-h-[260px]"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-[var(--blue)] pointer-events-none"><Sparkles size={140} /></div>
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--text)]/5 border border-[var(--border)] text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] backdrop-blur-md shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                                <span className="font-mono font-bold">{dateStr}</span>
                            </div>
                            <FocusTimer widget={true} />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text)] tracking-tighter mb-4 leading-[0.9]">
                            {greeting}{greeting.match(/[?!]$/) ? "" : ","} <br />
                            <span className="text-[var(--blue)] drop-shadow-[0_8px_20px_var(--blue-glow)]">{firstName}</span>
                        </h1>
                        <p className="text-sm text-[var(--text-2)] italic font-medium leading-relaxed">
                            &ldquo;{dailyLine}&rdquo;
                        </p>
                    </div>
                </motion.div>

                {/* ─── 2. ACTION CENTER (Urgent Tasks) ─── */}
                <AnimatePresence>
                    {dueCount > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <Link href="/review" className="block w-full">
                                <div className="p-6 rounded-[36px] bg-[var(--blue)] border border-[var(--blue-border)] relative overflow-hidden flex items-center justify-between shadow-lg">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-[9px] font-black uppercase tracking-[0.2em] text-black mb-3">
                                            Priority Task
                                        </div>
                                        <h3 className="text-2xl font-black text-black tracking-tighter leading-none mb-1">Resume Session</h3>
                                        <p className="text-xs font-bold text-[var(--text-2)]">{dueCount} topics pending.</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-black text-[var(--blue)] flex items-center justify-center flex-shrink-0 shadow-xl">
                                        <ArrowRight size={24} strokeWidth={3} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                    {canRecover && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <button 
                                onClick={handleRecover}
                                disabled={isProcessingAction}
                                className="w-full p-6 rounded-[32px] bg-[var(--amber-dim)] border border-[var(--amber-border)] flex items-center justify-between active:scale-[0.98] transition-all relative overflow-hidden shadow-lg disabled:opacity-50"
                            >
                                <div className="flex flex-col items-start gap-1 relative z-10">
                                    <span className="text-[9px] font-black text-[var(--amber)] uppercase tracking-[0.2em]">Streak Rescue</span>
                                    <span className="text-base font-bold text-[var(--text)]">Restore {user.lastStreak} Days</span>
                                </div>
                                <div className="px-4 py-2 bg-[var(--amber)] text-black rounded-xl text-xs font-black shadow-lg relative z-10">3 CR</div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── 3. VITAL STATS RIBBON ─── */}
                <div className="space-y-4 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] block px-2">Vital Stats</span>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-5 rounded-[28px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 mb-3 text-[var(--blue)]">
                                <Zap size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-3)]">Level</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[var(--text)]">{level}</span>
                                <span className="text-[9px] font-bold text-[var(--text-3)] truncate">· {title.split(" ")[0]}</span>
                            </div>
                        </div>
    
                        <div className="p-5 rounded-[28px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-[0.05] text-[var(--amber)]"><Flame size={50} /></div>
                            <div className="flex items-center gap-1.5 mb-3 text-[var(--amber)] relative z-10">
                                <Flame size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-3)]">Streak</span>
                            </div>
                            <div className="flex items-baseline gap-1 relative z-10">
                                <span className="text-2xl font-black text-[var(--text)]"><AnimatedCounter value={user.streak} /></span>
                                <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-tighter">Days</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-[28px] bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 mb-3 text-[var(--violet)]">
                                <Coins size={14} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-3)]">Credits</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[var(--text)]"><AnimatedCounter value={user.credits} /></span>
                                <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-tighter">Bal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── 4. PROFESSOR'S WISDOM ─── */}
                <div className="space-y-6 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] block px-2">Professor&apos;s Wisdom</span>
                    <ProfessorsWisdom />
                </div>

                {/* ─── 5. PROGRESS & INSIGHTS ─── */}
                <div className="space-y-6 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] block px-2">Progress & Insights</span>
                    <XPGauge xp={user.xp} />
                    <WeeklyWrappedCard />
                </div>

            </StandardContainer>
        </div>
    );
}
