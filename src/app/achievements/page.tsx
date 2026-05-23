"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Trophy, Flame, Zap, Brain, Clock, Shield, Star, Sparkles, CheckCircle2, Lock, ArrowLeft, Award, Gift, Target, BookOpen
} from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";
import { useUser } from "@/context/UserContext";
import { calculateLevel, getLevelTitle, getAcademicEchelon, getSemesterStanding, getCurrentSemesterInfo } from "@/lib/profiles-client";

interface Achievement {
    id: string;
    title: string;
    description: string;
    category: "streak" | "synthesis" | "focus" | "elite";
    icon: any;
    color: string;
    glow: string;
    progress: number;
    maxProgress: number;
    xpReward: number;
    unlockedAt?: string;
    claimed: boolean;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    // Streak & Momentum
    {
        id: "streak-3",
        title: "Spark of Curiosity",
        description: "Ignite your scholarly journey with a 3-day streak. Your future self is nodding in approval.",
        category: "streak",
        icon: Flame,
        color: "var(--amber)",
        glow: "var(--amber-glow)",
        progress: 3,
        maxProgress: 3,
        xpReward: 100,
        unlockedAt: "2 days ago",
        claimed: true,
    },
    {
        id: "streak-7",
        title: "Prometheus Flame",
        description: "Maintain a 7-day study streak. You've officially built an unbreakable habit of pure academic excellence.",
        category: "streak",
        icon: Flame,
        color: "var(--amber)",
        glow: "var(--amber-glow)",
        progress: 7,
        maxProgress: 7,
        xpReward: 250,
        unlockedAt: "Just now",
        claimed: false, // Ready to claim!
    },
    {
        id: "streak-30",
        title: "Eternal Fire",
        description: "Achieve a 30-day scholarly streak. Absolute focus. Your group chat misses you, but your GPA doesn't.",
        category: "streak",
        icon: Star,
        color: "var(--amber)",
        glow: "var(--amber-glow)",
        progress: 12,
        maxProgress: 30,
        xpReward: 1000,
        claimed: false,
    },

    // Neural Synthesis
    {
        id: "synth-1",
        title: "First Ingestion",
        description: "Upload and distill your first study document. Goodbye fluff, hello pure knowledge.",
        category: "synthesis",
        icon: Zap,
        color: "var(--blue)",
        glow: "var(--blue-glow)",
        progress: 1,
        maxProgress: 1,
        xpReward: 100,
        unlockedAt: "5 days ago",
        claimed: true,
    },
    {
        id: "synth-10",
        title: "Neural Architect",
        description: "Synthesize 10 study packs. You're building an external brain faster than AI can keep up.",
        category: "synthesis",
        icon: Brain,
        color: "var(--blue)",
        glow: "var(--blue-glow)",
        progress: 6,
        maxProgress: 10,
        xpReward: 300,
        claimed: false,
    },
    {
        id: "synth-50",
        title: "Synaptic Overload",
        description: "Generate 50 high-fidelity study packs. You are the ultimate curator of wisdom.",
        category: "synthesis",
        icon: Sparkles,
        color: "var(--blue)",
        glow: "var(--blue-glow)",
        progress: 6,
        maxProgress: 50,
        xpReward: 1500,
        claimed: false,
    },
    {
        id: "synth-jollof",
        title: "Jollof Scholar",
        description: "Achieved a flawless 100% score on a practice quiz. Pure academic nourishment.",
        category: "synthesis",
        icon: Award,
        color: "var(--amber)",
        glow: "var(--amber-glow)",
        progress: 5,
        maxProgress: 5,
        xpReward: 250,
        unlockedAt: "Yesterday",
        claimed: false,
    },
    {
        id: "synth-deconstruct",
        title: "Syllabus Deconstructor",
        description: "Distilled 20 complex topics or study packs into clear, digestible insights.",
        category: "synthesis",
        icon: Brain,
        color: "var(--blue)",
        glow: "var(--blue-glow)",
        progress: 14,
        maxProgress: 20,
        xpReward: 500,
        claimed: false,
    },

    // Focus Sprints
    {
        id: "focus-1",
        title: "Deep Work Novice",
        description: "Complete your first 25-minute Pomodoro focus sprint without switching tabs.",
        category: "focus",
        icon: Clock,
        color: "var(--emerald)",
        glow: "var(--emerald-glow)",
        progress: 1,
        maxProgress: 1,
        xpReward: 100,
        unlockedAt: "3 days ago",
        claimed: true,
    },
    {
        id: "focus-10",
        title: "Flow State Titan",
        description: "Conquer 10 Pomodoro focus sessions. Distractions bounce off your shield of concentration.",
        category: "focus",
        icon: Target,
        color: "var(--emerald)",
        glow: "var(--emerald-glow)",
        progress: 8,
        maxProgress: 10,
        xpReward: 400,
        claimed: false,
    },
    {
        id: "focus-50",
        title: "Time Lord",
        description: "Log 50 flawless focus sprints. You bend time to your will. Einstein would be proud.",
        category: "focus",
        icon: Shield,
        color: "var(--emerald)",
        glow: "var(--emerald-glow)",
        progress: 8,
        maxProgress: 50,
        xpReward: 2000,
        claimed: false,
    },
    {
        id: "focus-library",
        title: "Library Landlord",
        description: "Accumulated 50 hours of deep focus. You practically own a seat in the digital library.",
        category: "focus",
        icon: Shield,
        color: "var(--emerald)",
        glow: "var(--emerald-glow)",
        progress: 32,
        maxProgress: 50,
        xpReward: 1000,
        claimed: false,
    },
    {
        id: "focus-ghost",
        title: "Group-Chat Ghost",
        description: "Ignored distractions and completed 10 consecutive Pomodoro sprints.",
        category: "focus",
        icon: Target,
        color: "var(--emerald)",
        glow: "var(--emerald-glow)",
        progress: 8,
        maxProgress: 10,
        xpReward: 600,
        claimed: false,
    },

    // Elite Scholar
    {
        id: "elite-quiz",
        title: "Feynman's Disciple",
        description: "Score 100% on 5 consecutive practice quizzes. You don't just memorize; you understand deeply.",
        category: "elite",
        icon: Award,
        color: "var(--violet)",
        glow: "var(--violet-glow)",
        progress: 3,
        maxProgress: 5,
        xpReward: 500,
        claimed: false,
    },
    {
        id: "elite-midnight",
        title: "Midnight Scholar",
        description: "Complete a study sprint between midnight and 3 AM. Your bed misses you, but excellence doesn't sleep.",
        category: "elite",
        icon: BookOpen,
        color: "var(--violet)",
        glow: "var(--violet-glow)",
        progress: 1,
        maxProgress: 1,
        xpReward: 500,
        unlockedAt: "Yesterday",
        claimed: false, // Ready to claim!
    },
    {
        id: "elite-nepa",
        title: "NEPA Defier",
        description: "Studied through a power cut or late night. Unstoppable resilience when the lights go out.",
        category: "elite",
        icon: Sparkles,
        color: "var(--violet)",
        glow: "var(--violet-glow)",
        progress: 1,
        maxProgress: 1,
        xpReward: 300,
        unlockedAt: "Today",
        claimed: false,
    },
];

export default function AchievementsPage() {
    const { user, updateUser } = useUser();
    const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [celebrationText, setCelebrationText] = useState<{ title: string; reward: number } | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const claimedMap = JSON.parse(localStorage.getItem("claimed_achievements") || "{}");
            const streak = user?.streak || 0;
            const xp = user?.xp || 1250;
            
            setAchievements(INITIAL_ACHIEVEMENTS.map(ach => {
                let currentProg = ach.progress;
                if (ach.id === "streak-3") currentProg = Math.min(ach.maxProgress, streak);
                if (ach.id === "streak-7") currentProg = Math.min(ach.maxProgress, streak);
                if (ach.id === "streak-30") currentProg = Math.min(ach.maxProgress, streak);
                if (ach.id === "synth-1") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 200));
                if (ach.id === "synth-10") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 200));
                if (ach.id === "synth-50") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 200));
                if (ach.id === "synth-jollof") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 300));
                if (ach.id === "synth-deconstruct") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 250));
                if (ach.id === "focus-1") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 150));
                if (ach.id === "focus-10") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 150));
                if (ach.id === "focus-50") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 150));
                if (ach.id === "focus-library") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 100));
                if (ach.id === "focus-ghost") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 180));
                if (ach.id === "elite-quiz") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 400));
                if (ach.id === "elite-midnight") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 500));
                if (ach.id === "elite-nepa") currentProg = Math.min(ach.maxProgress, Math.floor(xp / 600));

                return {
                    ...ach,
                    progress: currentProg,
                    claimed: !!claimedMap[ach.id]
                };
            }));
        }
    }, [user?.streak, user?.xp]);

    const level = calculateLevel(user?.xp || 1250);
    const title = getLevelTitle(level);
    const echelon = getAcademicEchelon(level);
    const semesterStanding = getSemesterStanding(user?.xp || 1250);
    const semesterInfo = getCurrentSemesterInfo();

    const unlockedCount = achievements.filter(a => a.progress >= a.maxProgress).length;
    const totalCount = achievements.length;

    const filteredAchievements = achievements.filter(a => {
        if (activeTab === "all") return true;
        return a.category === activeTab;
    });

    const handleClaim = (id: string, reward: number, title: string) => {
        setClaimingId(id);
        setCelebr(id, reward, title);
    };

    const setCelebr = (id: string, reward: number, title: string) => {
        setClaimingId(id);
        setCelebrationText({ title, reward });
        
        if (typeof window !== "undefined") {
            const claimedMap = JSON.parse(localStorage.getItem("claimed_achievements") || "{}");
            claimedMap[id] = true;
            localStorage.setItem("claimed_achievements", JSON.stringify(claimedMap));
            window.dispatchEvent(new Event("achievements_updated"));
        }

        if (updateUser && user) {
            updateUser({ xp: (user.xp || 0) + reward });
        }

        setTimeout(() => {
            setAchievements(prev => prev.map(a => a.id === id ? { ...a, claimed: true } : a));
            setClaimingId(null);
        }, 1200);

        setTimeout(() => {
            setCelebrationText(null);
        }, 6000);
    };

    return (
        <div className="w-full min-h-screen bg-[var(--bg)] selection:bg-[var(--blue-dim)] text-[var(--text)] pt-24 pb-20 overflow-hidden font-sans">
            <StandardContainer className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
                {/* Back Navigation & Header */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-[var(--text-3)] hover:text-[var(--text)] transition-colors uppercase tracking-widest group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text)]/5 border border-[var(--border)] shadow-sm">
                        <Sparkles size={12} className="text-[var(--amber)] animate-spin" style={{ animationDuration: '6s' }} />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-2)] font-bold">Dopamine Vault</span>
                    </div>
                </div>

                {/* Celebration Toast / Modal Overlay */}
                <AnimatePresence>
                    {celebrationText && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100000] pointer-events-none flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-sm"
                        >
                            {/* Floating Confetti / Sparkles */}
                            {[...Array(24)].map((_, i) => {
                                const randomX = (Math.random() - 0.5) * window.innerWidth * 0.8;
                                const randomY = (Math.random() - 0.5) * window.innerHeight * 0.8;
                                const randomScale = Math.random() * 1.5 + 0.5;
                                const colors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];
                                const color = colors[i % colors.length];

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                        animate={{
                                            x: randomX,
                                            y: randomY,
                                            scale: randomScale,
                                            opacity: [1, 1, 0],
                                            rotate: Math.random() * 360
                                        }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="absolute w-4 h-4 rounded-full flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: color }}
                                    >
                                        <Sparkles size={10} className="text-white" />
                                    </motion.div>
                                );
                            })}

                            {/* Big Center Popup */}
                            <motion.div
                                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                                animate={{ scale: [1.2, 1], y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: -50, opacity: 0 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                className="bg-[#0A0A0F]/95 backdrop-blur-3xl border border-[var(--amber)]/40 p-8 sm:p-10 rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.15),_0_0_60px_rgba(245,158,11,0.2)] flex flex-col items-center text-center max-w-md mx-4 pointer-events-auto transition-all"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-[var(--amber)] mb-6 shadow-[0_8px_30px_rgba(245,158,11,0.25),_inset_0_1px_1px_rgba(255,255,255,0.1)] animate-bounce">
                                    <Trophy size={40} />
                                </div>
                                <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-[var(--amber)] mb-2">Achievement Unlocked</span>
                                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">{celebrationText.title}</h3>
                                <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xl tracking-wider shadow-[0_8px_25px_rgba(245,158,11,0.3)] mb-4">
                                    +{celebrationText.reward} XP
                                </div>
                                <p className="text-xs text-[var(--text-2)] font-mono">Your neural network expands. Diligence rewarded.</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hero Banner (Subtle & Compact) */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="scholar-card relative p-6 sm:p-8 mb-8 overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl" 
                    style={{ borderRadius: "24px" }}
                >
                    <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--amber)]/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-[var(--blue)]/5 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/30 flex items-center justify-center text-[var(--amber)] shadow-[0_0_15px_var(--amber-glow)]">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">Trophy Room</h1>
                                    <p className="text-[10px] text-[var(--text-3)] font-mono uppercase tracking-widest mt-0.5">Where diligence meets dopamine</p>
                                </div>
                            </div>
                            <p className="text-xs text-[var(--text-2)] leading-relaxed">
                                Celebrate every intellectual victory. Whether maintaining a flawless streak or pulling a midnight study sprint, every milestone fuels your neural expansion.
                            </p>
                        </div>

                        {/* COD/LOL Inspired Dual-Layer Stats Widget */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[var(--bg)]/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm w-full md:w-auto shrink-0">
                            {/* Layer 1: Lifetime Academic Echelon */}
                            <div className="space-y-1 sm:border-r border-[var(--border)] sm:pr-5 pb-3 sm:pb-0 border-b sm:border-b-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{echelon.crest}</span>
                                    <div>
                                        <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-3)]">Lifetime Prestige</p>
                                        <p className="text-sm sm:text-base font-bold" style={{ color: echelon.color }}>{echelon.name}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-mono text-[var(--text-2)]">{title} • Level {level}</p>
                            </div>

                            {/* Layer 2: Seasonal Semester Standing */}
                            <div className="space-y-1 sm:border-r border-[var(--border)] sm:pr-5 pb-3 sm:pb-0 border-b sm:border-b-0">
                                <div className="flex items-center gap-2">
                                    <Target size={18} className="text-[var(--emerald)]" />
                                    <div>
                                        <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-3)]">Active Semester</p>
                                        <p className="text-sm sm:text-base font-bold text-[var(--emerald)]">{semesterStanding.rankName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-[var(--text-2)]">
                                    <span>{semesterStanding.division}</span>
                                    <span className="text-[var(--text-3)]">{semesterInfo.daysRemaining}d left</span>
                                </div>
                            </div>

                            {/* Trophies Unlocked */}
                            <div className="space-y-0.5 pl-1">
                                <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-3)]">Trophies Unlocked</p>
                                <div className="flex items-baseline gap-1.5">
                                    <p className="text-xl font-bold font-mono text-[var(--amber)] tabular-nums">{unlockedCount}</p>
                                    <p className="text-xs font-semibold text-[var(--text-3)] font-mono">/ {totalCount}</p>
                                </div>
                                <div className="w-28 h-1 bg-[var(--text-4)] rounded-full overflow-hidden mt-1.5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(unlockedCount / totalCount) * 100}%` }} 
                                        transition={{ duration: 1 }}
                                        className="h-full bg-[var(--amber)] shadow-[0_0_8px_var(--amber)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Category Filter Tabs (Wrapping cleanly with flex-wrap, zero horizontal scroll) */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    {[
                        { id: "all", label: "All Trophies", icon: Trophy, count: totalCount },
                        { id: "streak", label: "Streak & Momentum", icon: Flame, count: achievements.filter(a=>a.category==="streak").length },
                        { id: "synthesis", label: "Neural Synthesis", icon: Zap, count: achievements.filter(a=>a.category==="synthesis").length },
                        { id: "focus", label: "Focus Sprints", icon: Clock, count: achievements.filter(a=>a.category==="focus").length },
                        { id: "elite", label: "Elite Scholar", icon: Award, count: achievements.filter(a=>a.category==="elite").length },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 border ${
                                    isActive 
                                    ? "bg-[var(--blue)] text-black border-[var(--blue)] shadow-[0_0_15px_var(--blue-glow)]" 
                                    : "bg-[var(--background-secondary)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--text-3)] hover:text-[var(--text)]"
                                }`}
                            >
                                <tab.icon size={14} />
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${isActive ? "bg-black/20 text-black" : "bg-[var(--text-4)] text-[var(--text-3)]"}`}>{tab.count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Achievements Grid (Refined, Subtle Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {filteredAchievements.map((ach) => {
                            const isUnlocked = ach.progress >= ach.maxProgress;
                            const isClaimable = isUnlocked && !ach.claimed;
                            const IconComponent = ach.icon;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25 }}
                                    key={ach.id}
                                    className={`scholar-card relative p-5 flex flex-col justify-between overflow-hidden border transition-all duration-300 ${
                                        isClaimable 
                                        ? "bg-gradient-to-br from-[var(--background-secondary)] via-[var(--bg-2)] to-[var(--amber-dim)] border-[var(--amber-border)] shadow-[0_0_20px_var(--amber-glow)] scale-[1.01]" 
                                        : isUnlocked 
                                        ? "bg-[var(--background-secondary)] border-[var(--border)] hover:border-[var(--blue-border)]" 
                                        : "bg-[var(--background-secondary)]/40 border-[var(--border)]/50 opacity-70"
                                    }`}
                                    style={{ borderRadius: "20px" }}
                                >
                                    {/* Ambient Glow for Unlocked/Claimable (Subtle) */}
                                    {isUnlocked && (
                                        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10" style={{ backgroundColor: ach.color }} />
                                    )}

                                    <div>
                                        {/* Header Row: Icon & Status Pill */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-500 ${
                                                isClaimable ? "scale-105 animate-pulse" : ""
                                            }`} style={{ 
                                                backgroundColor: isUnlocked ? `color-mix(in srgb, ${ach.color}, transparent 88%)` : 'var(--text-4)',
                                                borderColor: isUnlocked ? `color-mix(in srgb, ${ach.color}, transparent 70%)` : 'var(--border)',
                                                color: isUnlocked ? ach.color : 'var(--text-3)',
                                                boxShadow: isUnlocked ? `0 0 12px ${ach.glow}` : 'none'
                                            }}>
                                                <IconComponent size={20} className={isClaimable ? "animate-spin" : ""} style={{ animationDuration: '10s' }} />
                                            </div>

                                            {/* Status Badge */}
                                            {isClaimable ? (
                                                <span className="px-2.5 py-1 rounded-full bg-[var(--amber)] text-black font-mono text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_var(--amber)] animate-bounce flex items-center gap-1">
                                                    <Gift size={10} /> Claim Reward
                                                </span>
                                            ) : isUnlocked ? (
                                                <span className="px-2.5 py-1 rounded-full bg-[var(--emerald-dim)] border border-[var(--emerald-border)] text-[var(--emerald)] font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Unlocked
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full bg-[var(--text-4)] text-[var(--text-3)] font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Lock size={10} /> Locked
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="text-base font-bold text-[var(--text)] tracking-tight mb-1.5 flex items-center gap-2">
                                            {ach.title}
                                        </h3>
                                        <p className="text-xs text-[var(--text-2)] leading-relaxed mb-5">
                                            {ach.description}
                                        </p>
                                    </div>

                                    {/* Footer Row: Progress & Claim Button */}
                                    <div className="pt-3.5 border-t border-[var(--border)] mt-auto">
                                        {isClaimable ? (
                                            <button
                                                onClick={() => handleClaim(ach.id, ach.xpReward, ach.title)}
                                                disabled={claimingId === ach.id}
                                                className="w-full py-2.5 rounded-xl bg-[var(--amber)] text-black font-bold text-xs uppercase tracking-wider hover:bg-[var(--amber-light)] active:scale-95 transition-all shadow-[0_0_15px_var(--amber-glow)] flex items-center justify-center gap-1.5"
                                            >
                                                {claimingId === ach.id ? (
                                                    <>
                                                        <Sparkles size={14} className="animate-spin" />
                                                        <span>Claiming XP...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Gift size={14} />
                                                        <span>Claim +{ach.xpReward} XP</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-between text-[10px] font-mono font-semibold mb-1.5">
                                                    <span className="text-[var(--text-3)] uppercase tracking-wider">Progress</span>
                                                    <span className={isUnlocked ? "text-[var(--emerald)] font-bold" : "text-[var(--text-2)]"}>
                                                        {ach.progress} / {ach.maxProgress} ({Math.round((ach.progress / ach.maxProgress) * 100)}%)
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-[var(--text-4)] rounded-full overflow-hidden shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full rounded-full"
                                                        style={{ 
                                                            backgroundColor: isUnlocked ? 'var(--emerald)' : ach.color,
                                                            boxShadow: isUnlocked ? '0 0 8px var(--emerald-glow)' : `0 0 8px ${ach.glow}`
                                                        }}
                                                    />
                                                </div>
                                                {ach.unlockedAt && (
                                                    <p className="text-[9px] font-mono text-[var(--text-3)] mt-1.5 text-right">
                                                        Achieved {ach.unlockedAt}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </StandardContainer>
        </div>
    );
}

