"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/ui/Skeleton";

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
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-white text-lg">school</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)]">THE PROFESSOR</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                        </span>
                    </button>
                    <Link
                        href="/settings"
                        className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold shadow-lg hover:opacity-90 transition-all flex items-center gap-1.5"
                    >
                        UPGRADE
                        <span className="material-symbols-outlined text-sm">north_east</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
                        Welcome back, {user.name}
                    </h1>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                        Ready to learn something new today?
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Study Streak */}
                    <div className="p-5 rounded-2xl card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Study Streak</span>
                            <span className="text-xl">🔥</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--accent)]">{user.streak}</div>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">days in a row</p>
                    </div>

                    {/* Study Time */}
                    <div className="p-5 rounded-2xl card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Study Activity</span>
                            <span className="material-symbols-outlined text-[var(--secondary)]">schedule</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--secondary)]">0h</div>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">this week</p>
                    </div>

                    {/* Arena Rank */}
                    <Link href="/arena" className="p-5 rounded-2xl card group cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Arena Rank</span>
                            <span className="material-symbols-outlined text-[var(--warning)]">emoji_events</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--foreground)]">--</div>
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">Join the Arena to compete</p>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent</h2>
                        <Link href="/history" className="text-sm text-[var(--accent)] hover:underline">
                            View all
                        </Link>
                    </div>

                    {/* Empty State */}
                    <div className="p-8 rounded-2xl card text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[var(--accent)] text-3xl">history</span>
                        </div>
                        <h3 className="font-semibold text-[var(--foreground)] mb-2">No activity yet</h3>
                        <p className="text-sm text-[var(--foreground-secondary)] mb-4">
                            Start a class or create study materials to see your history here.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Link
                                href="/class"
                                className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-all"
                            >
                                Start a Class
                            </Link>
                            <Link
                                href="/create"
                                className="px-4 py-2.5 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--border)] transition-all"
                            >
                                Create Materials
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
