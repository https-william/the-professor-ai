"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Trophy, Flame, Zap, Brain, Clock, Shield, Star, Sparkles, CheckCircle2, Lock, ArrowLeft, Award, Gift, Target, BookOpen
} from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import TiltCard from "@/components/ui/TiltCard";
import { useUser } from "@/context/UserContext";
import { calculateLevel, getLevelTitle, getAcademicEchelon, getSemesterStanding, getCurrentSemesterInfo } from "@/lib/profiles-client";

// ─── Web Audio Synthesis ──────────────────────────────────────────────────────

function useAchievementsAudio() {
    const ctxRef = useRef<AudioContext | null>(null);

    const getCtx = useCallback(() => {
        if (typeof window === "undefined") return null;
        if (!ctxRef.current || ctxRef.current.state === "closed") {
            ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (ctxRef.current.state === "suspended") {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    }, []);

    /** Claim reward: Glorious ascending pentatonic arpeggio sweep */
    const playClaimChime = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        
        const notes = [261.63, 329.63, 392.00, 440.00, 523.25, 659.25]; // C4, E4, G4, A4, C5, E5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
            
            const t = ctx.currentTime + i * 0.07;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.08, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            
            osc.start(t);
            osc.stop(t + 0.5);
        });
    }, [getCtx]);

    /** Soft hover ping for badges */
    const playHoverPing = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
    }, [getCtx]);

    /** Warm load shimmer chord */
    const playPageLoadChime = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        
        const chords = [329.63, 440.00, 659.25]; // E4, A4, E5
        chords.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            const t = ctx.currentTime;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.03, t + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
            
            osc.start(t);
            osc.stop(t + 1.6);
        });
    }, [getCtx]);

    return { playClaimChime, playHoverPing, playPageLoadChime };
}

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
        progress: 0,
        maxProgress: 3,
        xpReward: 100,
        claimed: false,
    },
    {
        id: "streak-7",
        title: "Prometheus Flame",
        description: "Maintain a 7-day study streak. You've officially built an unbreakable habit of pure academic excellence.",
        category: "streak",
        icon: Flame,
        color: "var(--amber)",
        glow: "var(--amber-glow)",
        progress: 0,
        maxProgress: 7,
        xpReward: 250,
        claimed: false,
    },
    {
        id: "streak-30",
        title: "Eternal Fire",
        description: "Achieve a 30-day scholarly streak. Absolute focus. Your group chat misses you, but your GPA doesn't.",
        category: "streak",
        icon: Star,
        color: "var(--amber)",
        glow: "var(--amber-glow)",
        progress: 0,
        maxProgress: 30,
        xpReward: 1000,
        claimed: false,
    },

    // Neural Synthesis
    {
        id: "synth-1",
        title: "First Ingestion",
        description: "Upload and simplify your first study document. Goodbye fluff, hello clean notes.",
        category: "synthesis",
        icon: Zap,
        color: "var(--violet)",
        glow: "rgba(150, 115, 245, 0.15)",
        progress: 0,
        maxProgress: 1,
        xpReward: 100,
        claimed: false,
    },
    {
        id: "synth-10",
        title: "Neural Architect",
        description: "Create 10 study packs. You're building a massive brain faster than AI can keep up.",
        category: "synthesis",
        icon: Brain,
        color: "var(--violet)",
        glow: "rgba(150, 115, 245, 0.15)",
        progress: 0,
        maxProgress: 10,
        xpReward: 300,
        claimed: false,
    },
    {
        id: "synth-50",
        title: "Synaptic Overload",
        description: "Create 50 study packs. You are the ultimate curator of wisdom.",
        category: "synthesis",
        icon: Sparkles,
        color: "var(--violet)",
        glow: "rgba(150, 115, 245, 0.15)",
        progress: 0,
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
        progress: 0,
        maxProgress: 5,
        xpReward: 250,
        claimed: false,
    },
    {
        id: "synth-deconstruct",
        title: "Syllabus Deconstructor",
        description: "Simplified 20 complex topics or study packs into clear, easy-to-read notes.",
        category: "synthesis",
        icon: Brain,
        color: "var(--violet)",
        glow: "rgba(150, 115, 245, 0.15)",
        progress: 0,
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
        progress: 0,
        maxProgress: 1,
        xpReward: 100,
        claimed: false,
    },
    {
        id: "focus-10",
        title: "Flow State Titan",
        description: "Conquer 10 Pomodoro focus sessions. Distractions bounce off your shield of concentration.",
        category: "focus",
        icon: Target,
        color: "var(--emerald)",
        glow: "var(--emerald-glow)",
        progress: 0,
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
        progress: 0,
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
        progress: 0,
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
        progress: 0,
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
        progress: 0,
        maxProgress: 5,
        xpReward: 500,
        claimed: false,
    },
    {
        id: "elite-midnight",
        title: "Midnight Scholar",
        description: "Complete a study sprint between midnight and 3 AM. Quiet hours, loud results. Midnight dedication rewarded.",
        category: "elite",
        icon: BookOpen,
        color: "var(--violet)",
        glow: "var(--violet-glow)",
        progress: 0,
        maxProgress: 1,
        xpReward: 500,
        claimed: false,
    },
    {
        id: "elite-nepa",
        title: "NEPA Defier",
        description: "Studied through a power cut or late night. Unstoppable resilience when the lights go out.",
        category: "elite",
        icon: Sparkles,
        color: "var(--violet)",
        glow: "var(--violet-glow)",
        progress: 0,
        maxProgress: 1,
        xpReward: 300,
        claimed: false,
    },
];

export default function AchievementsPage() {
    const { user, updateUser } = useUser();
    const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [celebrationText, setCelebrationText] = useState<{ title: string; reward: number } | null>(null);

    const { playClaimChime, playHoverPing, playPageLoadChime } = useAchievementsAudio();

    // Play load chime on mount
    useEffect(() => {
        const t = setTimeout(() => {
            playPageLoadChime();
        }, 300);
        return () => clearTimeout(t);
    }, [playPageLoadChime]);

    useEffect(() => {
        let active = true;

        const syncWithRealData = async () => {
            let libraryCount = 0;
            try {
                const res = await fetch("/api/library");
                if (res.ok) {
                    const data = await res.json();
                    const generations = data.generations || [];
                    libraryCount = generations.length;
                }
            } catch (err) {
                console.error("Achievements page: error fetching library count", err);
            }

            if (!active) return;

            const claimedMap = JSON.parse(localStorage.getItem("claimed_achievements") || "{}");
            const streak = user?.streak || 0;

            setAchievements(INITIAL_ACHIEVEMENTS.map(ach => {
                let currentProg = 0;
                if (ach.id === "streak-3") currentProg = Math.min(ach.maxProgress, streak);
                else if (ach.id === "streak-7") currentProg = Math.min(ach.maxProgress, streak);
                else if (ach.id === "streak-30") currentProg = Math.min(ach.maxProgress, streak);
                else if (ach.id === "synth-1") currentProg = Math.min(ach.maxProgress, libraryCount);
                else if (ach.id === "synth-10") currentProg = Math.min(ach.maxProgress, libraryCount);
                else if (ach.id === "synth-50") currentProg = Math.min(ach.maxProgress, libraryCount);
                else if (ach.id === "synth-deconstruct") currentProg = Math.min(ach.maxProgress, libraryCount);

                return {
                    ...ach,
                    progress: currentProg,
                    claimed: !!claimedMap[ach.id]
                };
            }));
        };

        if (typeof window !== "undefined") {
            syncWithRealData();
        }

        return () => {
            active = false;
        };
    }, [user?.streak, user?.xp]);

    const level = calculateLevel(user?.xp || 0);
    const title = getLevelTitle(level);
    const echelon = getAcademicEchelon(level);
    const semesterStanding = getSemesterStanding(user?.xp || 0);
    const semesterInfo = getCurrentSemesterInfo();

    const unlockedCount = achievements.filter(a => a.progress >= a.maxProgress).length;
    const totalCount = achievements.length;

    const filteredAchievements = achievements.filter(a => {
        if (activeTab === "all") return true;
        return a.category === activeTab;
    });

    const handleClaim = (id: string, reward: number, title: string) => {
        setClaimingId(id);
        playClaimChime();
        
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
        }, 5000);
    };

    return (
        <div className="w-full min-h-screen bg-[#09090b] text-[#E0E0E0] pt-24 pb-20 overflow-hidden font-sans selection:bg-amber-500/20">
            <StandardContainer className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Back Navigation & Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link 
                        href="/dashboard" 
                        onClick={playHoverPing}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-white/40 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 shadow-inner">
                        <Sparkles size={12} className="text-[#E5A93C] animate-spin" style={{ animationDuration: '8s' }} />
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold">Dopamine Vault</span>
                    </div>
                </div>

                {/* Celebration Toast / Modal Overlay */}
                <AnimatePresence>
                    {celebrationText && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center overflow-hidden bg-black/75 backdrop-blur-md"
                        >
                            {/* Floating Confetti / Sparkles */}
                            {[...Array(30)].map((_, i) => {
                                const angle = (i / 30) * Math.PI * 2;
                                const distance = Math.random() * 150 + 100;
                                const destX = Math.cos(angle) * distance;
                                const destY = Math.sin(angle) * distance - 50;
                                const colors = ['#E5A93C', '#9673F5', '#2BB288', '#F2BE65', '#81E0C1'];
                                const color = colors[i % colors.length];

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ x: 0, y: 50, scale: 0, opacity: 1 }}
                                        animate={{
                                            x: destX,
                                            y: destY,
                                            scale: Math.random() * 1.2 + 0.6,
                                            opacity: [1, 1, 0],
                                            rotate: Math.random() * 360
                                        }}
                                        transition={{ duration: 1.6, ease: "easeOut" }}
                                        className="absolute w-3.5 h-3.5 rounded-sm shadow-md"
                                        style={{ backgroundColor: color }}
                                    />
                                );
                            })}

                            {/* Big Center Popup */}
                            <motion.div
                                initial={{ scale: 0.8, y: 30, opacity: 0 }}
                                animate={{ scale: 1.0, y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: -30, opacity: 0 }}
                                transition={{ type: "spring", damping: 15, stiffness: 180 }}
                                className="bg-[#0c0c0e]/95 backdrop-blur-3xl border border-[#E5A93C]/20 p-8 sm:p-10 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.08),_0_0_50px_rgba(229,169,60,0.15)] flex flex-col items-center text-center max-w-sm mx-4 pointer-events-auto"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C] mb-6 animate-bounce">
                                    <Trophy size={32} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E5A93C] mb-2 font-mono">Trophy Unlocked</span>
                                <h3 className="text-xl sm:text-2xl font-black text-white mb-4 tracking-tight font-heading italic">{celebrationText.title}</h3>
                                <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E5A93C] to-[#F2BE65] text-black font-black text-lg tracking-wider shadow-lg shadow-amber-500/20 mb-4">
                                    +{celebrationText.reward} XP
                                </div>
                                <p className="text-[11px] text-white/50 font-mono tracking-wide">Your neural network expands. Keep it up.</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hero Banner Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative mb-8" 
                >
                    <GlassmorphicCard intensity="medium" className="p-6 sm:p-8 overflow-hidden relative" radius="24px">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-[#E5A93C]/[0.02] rounded-full blur-[90px] pointer-events-none -translate-y-1/3 translate-x-1/3" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#9673F5]/[0.02] rounded-full blur-[90px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="max-w-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C] shadow-inner">
                                        <Trophy size={18} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">Trophy Room</h1>
                                        <p className="text-[9px] text-white/45 font-mono uppercase tracking-[0.2em] mt-0.5">Where diligence meets dopamine</p>
                                    </div>
                                </div>
                                <p className="text-xs text-[#E0E0E0]/60 leading-relaxed font-sans">
                                    Celebrate every intellectual victory. Whether maintaining a flawless streak or pulling a midnight study sprint, every milestone fuels your neural expansion.
                                </p>
                            </div>

                            {/* Dual-Layer Stats Widget */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-black/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5 w-full lg:w-auto shrink-0">
                                {/* Prestige crest */}
                                <div className="space-y-1 sm:border-r border-white/5 sm:pr-5 pb-3 sm:pb-0 border-b sm:border-b-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{echelon.crest}</span>
                                        <div>
                                            <p className="text-[9px] uppercase font-bold tracking-wider text-white/45">Prestige Rank</p>
                                            <p className="text-xs sm:text-sm font-black uppercase tracking-wider" style={{ color: echelon.color }}>{echelon.name}</p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-mono text-white/50">{title} • Lvl {level}</p>
                                </div>

                                {/* Active standing */}
                                <div className="space-y-1 sm:border-r border-white/5 sm:pr-5 pb-3 sm:pb-0 border-b sm:border-b-0">
                                    <div className="flex items-center gap-2">
                                        <Target size={16} className="text-[#2BB288]" />
                                        <div>
                                            <p className="text-[9px] uppercase font-bold tracking-wider text-white/45">Semester Standing</p>
                                            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2BB288]">{semesterStanding.rankName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 text-[9px] font-mono text-white/50">
                                        <span>{semesterStanding.division}</span>
                                        <span className="text-white/35">{semesterInfo.daysRemaining}d left</span>
                                    </div>
                                </div>

                                {/* Trophies progress */}
                                <div className="space-y-1 pl-1">
                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/45">Trophies</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <p className="text-base font-black font-mono text-[#E5A93C] tabular-nums">{unlockedCount}</p>
                                        <p className="text-[10px] font-semibold text-white/35 font-mono">/ {totalCount}</p>
                                    </div>
                                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }} 
                                            transition={{ duration: 1 }}
                                            className="h-full bg-[#E5A93C] shadow-[0_0_8px_rgba(229,169,60,0.5)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassmorphicCard>
                </motion.div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    {[
                        { id: "all", label: "All Trophies", icon: Trophy, count: totalCount, color: "#E5A93C" },
                        { id: "streak", label: "Streaks", icon: Flame, count: achievements.filter(a=>a.category==="streak").length, color: "#E5A93C" },
                        { id: "synthesis", label: "Study Packs", icon: Zap, count: achievements.filter(a=>a.category==="synthesis").length, color: "#9673F5" },
                        { id: "focus", label: "Focus", icon: Clock, count: achievements.filter(a=>a.category==="focus").length, color: "#2BB288" },
                        { id: "elite", label: "Elite", icon: Award, count: achievements.filter(a=>a.category==="elite").length, color: "#9673F5" },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    playHoverPing();
                                    setActiveTab(tab.id);
                                }}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all border cursor-pointer shrink-0"
                                style={{
                                    backgroundColor: isActive ? `${tab.color}15` : "rgba(255, 255, 255, 0.02)",
                                    borderColor: isActive ? tab.color : "rgba(255, 255, 255, 0.05)",
                                    color: isActive ? tab.color : "rgba(255, 255, 255, 0.4)",
                                    boxShadow: isActive ? `0 0 12px ${tab.color}10` : "none"
                                }}
                            >
                                <tab.icon size={12} />
                                <span>{tab.label}</span>
                                <span 
                                    className="px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold"
                                    style={{
                                        backgroundColor: isActive ? `${tab.color}30` : "rgba(255, 255, 255, 0.05)",
                                        color: isActive ? tab.color : "rgba(255, 255, 255, 0.3)"
                                    }}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredAchievements.map((ach) => {
                            const isUnlocked = ach.progress >= ach.maxProgress;
                            const isClaimable = isUnlocked && !ach.claimed;
                            const IconComponent = ach.icon;

                            const cardContent = (
                                <GlassmorphicCard
                                    intensity={isClaimable ? "medium" : "light"}
                                    className="h-full p-5 flex flex-col justify-between overflow-hidden relative border transition-all duration-300"
                                    radius="20px"
                                    style={{
                                        borderColor: isClaimable ? `${ach.color}40` : isUnlocked ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                                        background: isClaimable ? `linear-gradient(135deg, rgba(25, 25, 30, 0.5) 0%, ${ach.color}08 100%)` : undefined,
                                        boxShadow: isClaimable ? `0 0 20px ${ach.color}0c` : "none"
                                    }}
                                >
                                    {/* Subtle Ambient Color Glow for Unlocked/Claimable */}
                                    {isUnlocked && (
                                        <div 
                                            className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.04] transition-all"
                                            style={{ backgroundColor: ach.color }}
                                        />
                                    )}

                                    <div className="flex flex-col">
                                        {/* Header Row: Icon & Status Pill */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div 
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-500 ${
                                                    isClaimable ? "scale-105 animate-pulse" : ""
                                                }`} 
                                                style={{ 
                                                    backgroundColor: isUnlocked ? `${ach.color}12` : "rgba(255, 255, 255, 0.02)",
                                                    borderColor: isUnlocked ? `${ach.color}25` : "rgba(255, 255, 255, 0.05)",
                                                    color: isUnlocked ? ach.color : "rgba(255, 255, 255, 0.25)",
                                                    boxShadow: isUnlocked ? `0 0 10px ${ach.color}15` : 'none'
                                                }}
                                            >
                                                <IconComponent size={16} />
                                            </div>

                                            {/* Status Badge */}
                                            {isClaimable ? (
                                                <span 
                                                    className="px-2.5 py-1 rounded-full text-black font-mono text-[8px] font-black uppercase tracking-widest animate-bounce flex items-center gap-1"
                                                    style={{
                                                        backgroundColor: ach.color,
                                                        boxShadow: `0 0 10px ${ach.color}50`
                                                    }}
                                                >
                                                    <Gift size={9} /> Claim Reward
                                                </span>
                                            ) : isUnlocked ? (
                                                <span className="px-2.5 py-1 rounded-full bg-[#2BB288]/10 border border-[#2BB288]/15 text-[#2BB288] font-mono text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={9} /> Unlocked
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-white/30 font-mono text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <Lock size={9} /> Locked
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="text-sm font-bold text-white tracking-tight mb-1 flex items-center gap-2">
                                            {ach.title}
                                        </h3>
                                        <p className="text-[11px] text-[#E0E0E0]/50 leading-relaxed font-sans mb-4">
                                            {ach.description}
                                        </p>
                                    </div>

                                    {/* Footer Row: Progress & Claim Button */}
                                    <div className="pt-4 border-t border-white/5 mt-auto">
                                        {isClaimable ? (
                                            <button
                                                onClick={() => handleClaim(ach.id, ach.xpReward, ach.title)}
                                                disabled={claimingId === ach.id}
                                                className="w-full py-2.5 rounded-xl text-black font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                style={{
                                                    backgroundColor: ach.color,
                                                    boxShadow: `0 0 12px ${ach.color}35`
                                                }}
                                            >
                                                {claimingId === ach.id ? (
                                                    <>
                                                        <Sparkles size={12} className="animate-spin" />
                                                        <span>Claiming XP...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Gift size={12} />
                                                        <span>Claim +{ach.xpReward} XP</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-between text-[9px] font-mono font-bold mb-1.5">
                                                    <span className="text-white/30 uppercase tracking-widest">Progress</span>
                                                    <span className={isUnlocked ? "text-[#2BB288] font-bold" : "text-white/60"}>
                                                        {ach.progress} / {ach.maxProgress} ({Math.round((ach.progress / ach.maxProgress) * 100)}%)
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full rounded-full"
                                                        style={{ 
                                                            backgroundColor: isUnlocked ? '#2BB288' : ach.color,
                                                            boxShadow: isUnlocked ? '0 0 8px rgba(43, 178, 136, 0.4)' : `0 0 8px ${ach.color}20`
                                                        }}
                                                    />
                                                </div>
                                                {ach.unlockedAt && (
                                                    <p className="text-[9px] font-mono text-white/30 mt-1.5 text-right">
                                                        Achieved {ach.unlockedAt}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </GlassmorphicCard>
                            );

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25 }}
                                    key={ach.id}
                                    className={isUnlocked ? "cursor-pointer" : "opacity-60"}
                                    onMouseEnter={isUnlocked ? playHoverPing : undefined}
                                >
                                    {isUnlocked ? (
                                        <TiltCard
                                            maxTilt={6}
                                            scale={1.015}
                                            glowColor={ach.color}
                                            glowOpacity={0.12}
                                            borderRadius="20px"
                                        >
                                            {cardContent}
                                        </TiltCard>
                                    ) : (
                                        cardContent
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </StandardContainer>
        </div>
    );
}
