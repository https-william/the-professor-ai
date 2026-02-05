"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { GlassCard, Grainient } from "@/components/ui/VisualEffects";
import BrandLogo from "@/components/ui/BrandLogo";

export default function DashboardPage() {
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[var(--background)] p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 relative overflow-hidden">
            <Grainient className="fixed inset-0 opacity-30 z-0 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[var(--background)]/60 backdrop-blur-xl border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <BrandLogo size="sm" />
                        <span className="text-sm font-bold text-[var(--foreground)] tracking-wide">THE PROFESSOR</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                            </span>
                        </button>
                        <Link
                            href="/settings"
                            className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-bold shadow-[var(--shadow-glow)] hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                        >
                            UPGRADE
                            <span className="material-symbols-outlined text-sm">bolt</span>
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-5xl mx-auto px-6 py-10">
                    {/* Greeting */}
                    <div className="mb-10 animate-fade-in-up">
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                            Welcome back, {user.name}
                        </h1>
                        <p className="text-[var(--foreground-secondary)]">
                            Your second brain is online and ready.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        {/* Study Streak */}
                        <GlassCard className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                                <span className="text-4xl">🔥</span>
                            </div>
                            <div className="relative z-10">
                                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Study Streak</span>
                                <div className="text-4xl font-black text-[var(--accent)] mt-2">{user.streak}</div>
                                <p className="text-xs text-[var(--foreground-secondary)] mt-1 font-medium">days in a row</p>
                            </div>
                        </GlassCard>

                        {/* Study Time */}
                        <GlassCard className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="material-symbols-outlined text-4xl text-[var(--secondary)]/50 group-hover:text-[var(--secondary)] transition-colors">schedule</span>
                            </div>
                            <div className="relative z-10">
                                <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Activity</span>
                                <div className="text-4xl font-black text-[var(--secondary)] mt-2">0h</div>
                                <p className="text-xs text-[var(--foreground-secondary)] mt-1 font-medium">this week</p>
                            </div>
                        </GlassCard>

                        {/* Arena Rank */}
                        <Link href="/arena" className="block h-full">
                            <GlassCard className="p-6 h-full relative overflow-hidden group hover:border-[var(--warning)]/50 transition-all cursor-pointer">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="material-symbols-outlined text-4xl text-[var(--warning)]/50 group-hover:text-[var(--warning)] animate-pulse-soft">emoji_events</span>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Arena Rank</span>
                                    <div className="text-4xl font-black text-[var(--foreground)] mt-2">--</div>
                                    <p className="text-xs text-[var(--warning)] mt-1 font-bold group-hover:translate-x-1 transition-transform">Enter the Arena →</p>
                                </div>
                            </GlassCard>
                        </Link>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-[var(--foreground)]">Create New</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/create" className="group">
                                    <GlassCard className="p-4 text-center hover:bg-[var(--accent)]/10 transition-colors h-full flex flex-col items-center justify-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">add_circle</span>
                                        </div>
                                        <span className="text-sm font-semibold">Upload Material</span>
                                    </GlassCard>
                                </Link>
                                <Link href="/class" className="group">
                                    <GlassCard className="p-4 text-center hover:bg-[var(--secondary)]/10 transition-colors h-full flex flex-col items-center justify-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)] group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">school</span>
                                        </div>
                                        <span className="text-sm font-semibold">Start Class</span>
                                    </GlassCard>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-[var(--foreground)]">Recent</h2>
                                <Link href="/history" className="text-xs font-bold text-[var(--accent)] hover:underline">VIEW ALL</Link>
                            </div>
                            <GlassCard className="p-8 text-center flex flex-col items-center justify-center min-h-[140px]">
                                <div className="w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-[var(--foreground-muted)] mb-3">
                                    <span className="material-symbols-outlined">history</span>
                                </div>
                                <p className="text-sm text-[var(--foreground-secondary)]">No recent history</p>
                            </GlassCard>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

