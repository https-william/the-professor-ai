"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateLevel, getLevelProgress } from "@/lib/profiles-client";

interface ProfileClientProps {
    profile?: any;
    username?: string;
    level?: number;
    progress?: number;
}

export default function ProfileClient({ profile: initialProfile, username: initialUsername, level: initialLevel, progress: initialProgress }: ProfileClientProps) {
    const searchParams = useSearchParams();
    const [profile, setProfile] = useState<any>(initialProfile);
    const [username, setUsername] = useState<string | undefined>(initialUsername);
    const [level, setLevel] = useState<number>(initialLevel || 1);
    const [progress, setProgress] = useState<number>(initialProgress || 0);
    const [loading, setLoading] = useState(!initialProfile);
    const [error, setError] = useState<string | null>(null);

    const clay = {
        card: "bg-white/[0.02] rounded-[32px] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),inset_0_-1px_2px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)]",
        badge: "bg-white/[0.04] rounded-2xl px-4 py-2 flex items-center gap-2 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
    };

    useEffect(() => {
        if (!profile) {
            const fetchProfile = async () => {
                const queryUsername = searchParams.get("username");
                if (!queryUsername) {
                    setError("No scholar specified");
                    setLoading(false);
                    return;
                }

                try {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("username", queryUsername.toLowerCase())
                        .single();

                    if (error || !data) {
                        setError("Scholar not found in our records");
                    } else {
                        setProfile(data);
                        setUsername(queryUsername);
                        setLevel(calculateLevel(data.xp_total || 0));
                        setProgress(getLevelProgress(data.xp_total || 0));
                    }
                } catch (err) {
                    setError("Connection to The Professor Network lost");
                } finally {
                    setLoading(false);
                }
            };

            fetchProfile();
        }
    }, [profile, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#06060B] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--secondary)]/20 border-t-[var(--secondary)] animate-spin mb-8 shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Authenticating Scholar Credentials...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#06060B] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-10 shadow-2xl">
                    <span className="material-symbols-outlined text-4xl text-[var(--foreground-muted)]">person_off</span>
                </div>
                <h2 className="text-2xl font-black mb-4">Scholar Identification Failed</h2>
                <p className="text-sm text-[var(--foreground-muted)] mb-10 max-w-xs">{error || "The profile you are looking for has been archived or does not exist."}</p>
                <Link href="/" className="px-8 py-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] font-black tracking-widest text-[10px] uppercase transition-all hover:bg-[var(--background-tertiary)]">
                    Return to Campus
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-amber-500/30 overflow-hidden relative">
            {/* Ambient Aurora */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--secondary)]/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 max-w-2xl mx-auto px-6 pt-20 pb-20">
                {/* Branding */}
                <Link href="/" className="flex items-center gap-3 mb-12 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--secondary)] to-[var(--secondary-light)] flex items-center justify-center shadow-[0_4px_16px_var(--secondary-glow)]">
                        <span className="material-symbols-outlined text-[var(--background)] text-2xl font-black">school</span>
                    </div>
                    <span className="text-lg font-black tracking-tighter text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">THE PROFESSOR</span>
                </Link>

                {/* Identity Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clay.card}
                >
                    <div className="h-24 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--secondary)]/10 rounded-t-[32px] border-b border-[var(--border)]" />
                    <div className="px-8 pb-10">
                        <div className="flex items-end justify-between -mt-8 mb-6">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--secondary)] to-[var(--secondary-light)] p-[3px] shadow-[0_12px_32px_var(--secondary-glow)]">
                                <div className="w-full h-full rounded-[21px] bg-[var(--background)] flex items-center justify-center text-4xl font-black text-[var(--secondary)]">
                                    {(profile.full_name || username || "").charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className={clay.badge}>
                                <span className="material-symbols-outlined text-[var(--secondary)] text-lg">workspace_premium</span>
                                <span className="text-xs font-black text-[var(--secondary)] uppercase tracking-widest">Level {level}</span>
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-[var(--foreground)] mb-1 tracking-tight">{profile.full_name || username}</h1>
                        <p className="text-sm font-bold text-[var(--foreground-muted)] mb-8 uppercase tracking-[0.2em]">@{username}</p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="p-5 rounded-2xl bg-[var(--foreground)]/[0.02] border border-[var(--border)] flex flex-col items-center">
                                <span className="text-2xl font-black text-[var(--foreground)]">{profile.xp_total || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-1">Scholar XP</span>
                            </div>
                            <div className="p-5 rounded-2xl bg-[var(--foreground)]/[0.02] border border-[var(--border)] flex flex-col items-center">
                                <span className="text-2xl font-black text-[var(--error)] flex items-center gap-2">
                                    {profile.current_streak} <span className="material-symbols-outlined text-xl">local_fire_department</span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--error)]/40 mt-1">Study Streak</span>
                            </div>
                        </div>

                        {/* XP Bar */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] px-1">
                                <span>Academic Status</span>
                                <span>{Math.round(progress)}% to Level {level + 1}</span>
                            </div>
                            <div className="h-3 rounded-full bg-[var(--background-secondary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] p-0.5 border border-[var(--border)]">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-light)] shadow-[0_0_12px_var(--secondary-glow)]"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Call to Action for Visitors */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-[var(--foreground-muted)] mb-6 font-medium italic">"The elite study tools used by hundreds of scholars across the globe."</p>
                    <Link 
                        href="/signup" 
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[var(--foreground)]/[0.04] border border-[var(--border)] hover:bg-[var(--foreground)]/[0.08] transition-all hover-scale-lg active:scale-95 group"
                    >
                        <span className="text-sm font-black uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">Apply for Admission</span>
                        <span className="material-symbols-outlined text-[var(--secondary)] transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </Link>
                </div>

                {/* Footer Refinement */}
                <div className="mt-24 pt-8 border-t border-[var(--border)] text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)]">The Professor Academic Integrity Network</p>
                </div>
            </main>
        </div>
    );
}
