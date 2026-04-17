import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile, calculateLevel, getLevelProgress } from "@/lib/profiles";
import Link from "next/link";
import { motion } from "framer-motion";

// Server-side metadata for public profiles
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    const profile = await getPublicProfile(params.username);
    if (!profile) return { title: "Scholar Not Found" };
    
    return {
        title: `${profile.full_name || params.username} | Scholar Profile`,
        description: `View ${params.username}'s academic achievements and level on The Professor AI.`,
        openGraph: {
            title: `${profile.full_name || params.username} - Level ${calculateLevel(profile.xp_total || 0)} Scholar`,
            description: `Academic streak: ${profile.current_streak} days. Join the elite study tier.`,
            type: "profile",
            username: params.username,
        }
    };
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
    const profile = await getPublicProfile(params.username);
    
    if (!profile) {
        notFound();
    }

    const level = calculateLevel(profile.xp_total || 0);
    const progress = getLevelProgress(profile.xp_total || 0);

    const clay = {
        card: "bg-white/[0.02] rounded-[32px] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04),inset_0_-1px_2px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)]",
        badge: "bg-white/[0.04] rounded-2xl px-4 py-2 flex items-center gap-2 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
    };

    return (
        <div className="min-h-screen bg-[#06060B] text-white/90 selection:bg-amber-500/30 overflow-hidden relative">
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
                <div className={clay.card}>
                    <div className="h-24 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--secondary)]/10 rounded-t-[32px] border-b border-[var(--border)]" />
                    <div className="px-8 pb-10">
                        <div className="flex items-end justify-between -mt-8 mb-6">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--secondary)] to-[var(--secondary-light)] p-[3px] shadow-[0_12px_32px_var(--secondary-glow)]">
                                <div className="w-full h-full rounded-[21px] bg-[var(--background)] flex items-center justify-center text-4xl font-black text-[var(--secondary)]">
                                    {(profile.full_name || params.username).charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className={clay.badge}>
                                <span className="material-symbols-outlined text-[var(--secondary)] text-lg">workspace_premium</span>
                                <span className="text-xs font-black text-[var(--secondary)] uppercase tracking-widest">Level {level}</span>
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-white/95 mb-1 tracking-tight">{profile.full_name || params.username}</h1>
                        <p className="text-sm font-bold text-white/20 mb-8 uppercase tracking-[0.2em]">@{params.username}</p>

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
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-light)] shadow-[0_0_12px_var(--secondary-glow)] transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action for Visitors */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-[var(--foreground-muted)] mb-6 font-medium italic">"The elite study tools used by millions of scholars worldwide."</p>
                    <Link 
                        href="/signup" 
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[var(--foreground)]/[0.04] border border-[var(--border)] hover:bg-[var(--foreground)]/[0.08] transition-all hover:scale-105 active:scale-95 group"
                    >
                        <span className="text-sm font-black uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">Apply for Admission</span>
                        <span className="material-symbols-outlined text-[var(--secondary)] transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </Link>
                </div>

                {/* Footer Refinement */}
                <div className="mt-24 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">The Professor Academic Integrity Network</p>
                </div>
            </main>
        </div>
    );
}
