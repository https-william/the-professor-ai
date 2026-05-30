"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    User, 
    LogOut, 
    Moon, 
    Bell, 
    Shield, 
    Sparkles, 
    ChevronRight, 
    Smartphone, 
    Target, 
    Zap,
    CheckCircle2
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ui/ThemeToggle";
import StandardContainer from "@/components/ui/StandardContainer";
import { useToasts } from "@/components/ui/GlobalToasts";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user, updateUser } = useUser();
    const { addToast } = useToasts();
    const isLoading = user.isLoading;
    const router = useRouter();
    const supabase = createClient();

    const [isSaving, setIsSaving] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name || "");

    const handleSignOut = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        await supabase.auth.signOut();
        router.push('/login');
    };

    const updatePref = async (key: string, value: any) => {
        if (key === 'alias') {
            updateUser({ name: value });
            if (typeof window !== "undefined") {
                localStorage.setItem('user_display_name', value);
            }
        } else {
            const storeKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            updateUser({ [storeKey]: value });
        }
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (res.ok) {
                addToast("Setting synchronized", "success");
            } else {
                addToast("Failed to sync setting to cloud (saved locally)", "info");
            }
        } catch (error) {
            addToast("Saved locally (will sync when online)", "info");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-[var(--foreground)] selection:bg-amber-500/30 pb-32">
            {/* ═══ Header Section — Impeccable Rhythm ═══ */}
            <section className="pt-24 pb-8 md:pt-32 md:pb-12 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[var(--accent)]/[0.03] to-transparent pointer-events-none" />
                
                <StandardContainer narrow>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                                <Sparkles size={12} className="text-[var(--accent)]" />
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--foreground-muted)]">The Study Lab</p>
                            </div>
                            <h1 className="font-heading text-5xl md:text-6xl font-black tracking-tight">Your Preferences</h1>
                            <p className="text-[var(--foreground-muted)] max-w-sm text-sm leading-relaxed">
                                Make yourself at home. Let's get your study space exactly how you like it.
                            </p>
                        </div>
                        
                        <div className="glass-panel p-3 pl-5 rounded-2xl flex items-center gap-4 border border-[var(--border)] shadow-xl">
                            <div className="text-right">
                                {isEditingName ? (
                                    <input 
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onBlur={() => {
                                            if (newName !== user.name) updatePref('alias', newName);
                                            setIsEditingName(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (newName !== user.name) updatePref('alias', newName);
                                                setIsEditingName(false);
                                            }
                                        }}
                                        className="bg-transparent text-right text-xs font-bold text-[var(--foreground)] border-b border-[var(--accent)] outline-none w-24"
                                    />
                                ) : (
                                    <p 
                                        onClick={() => {
                                            setNewName(user?.name || "");
                                            setIsEditingName(true);
                                        }}
                                        className="text-xs font-bold text-[var(--foreground)] cursor-pointer hover:text-[var(--accent)] transition-colors"
                                    >
                                        {user?.name || "Scholar"}
                                    </p>
                                )}
                                <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-wider">
                                    {isEditingName ? "What should the professor call you?" : "Lifelong Scholar"}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-amber-300 flex items-center justify-center text-black font-black text-sm relative group overflow-hidden shadow-lg shadow-amber-500/20">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <span className="relative z-10">{user?.avatar?.startsWith('http') ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user?.avatar || (user?.email?.[0] || "S").toUpperCase())}</span>
                            </div>
                        </div>
                    </div>
                </StandardContainer>
            </section>

            {/* ═══ Main Content ═══ */}
            <section className="py-8">
                <StandardContainer narrow>
                    <div className="space-y-8 md:space-y-12">
                        
                        {/* ─── Profile & Appearance ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="scholar-card p-8 flex flex-col justify-between group">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center shadow-inner">
                                            <User size={22} className="text-[var(--accent)]" />
                                        </div>
                                        <button className="btn-skeuo px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[var(--background-secondary)]">
                                            Edit
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Academy Email</p>
                                        <p className="text-lg font-bold font-heading truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                        <Shield size={12} />
                                        Verified Identity
                                    </div>
                                </div>
                            </div>

                            <div className="scholar-card p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center shadow-inner">
                                            <Moon size={22} className="text-[var(--accent)]" />
                                        </div>
                                        <ThemeToggle variant="default" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Atmosphere</p>
                                        <p className="text-lg font-bold font-heading">Visual Mode</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
                                    Adaptive Depth System
                                </div>
                            </div>
                        </div>

                        {/* ─── Cognitive Parameters ─── */}
                        <div className="scholar-card p-1 pb-8">
                            <div className="p-8 border-b border-[var(--border)]">
                                <h3 className="font-heading text-xl font-black tracking-tight">Study Habits</h3>
                                <p className="text-sm text-[var(--foreground-muted)]">Set your pace. We'll handle the heavy lifting.</p>
                            </div>
                            
                            <div className="p-8 space-y-12">
                                {/* Study Goals */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center shadow-inner">
                                            <Target size={20} className="text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide">Daily Goal</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase font-medium">Minutes you want to study</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[15, 30, 60, 120].map((goal) => (
                                            <button
                                                key={goal}
                                                onClick={() => updatePref('daily_goal_minutes', goal)}
                                                className={cn(
                                                    "py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                                                    user.dailyGoalMinutes === goal 
                                                        ? "bg-[var(--accent)] text-black shadow-lg shadow-amber-500/20 scale-[1.02]" 
                                                        : "btn-skeuo bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                )}
                                            >
                                                {goal}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Baseline Difficulty */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center shadow-inner">
                                            <Zap size={20} className="text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide">Professor's Rigor</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase font-medium">How hard should I push you?</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['easy', 'medium', 'hard'].map((diff) => (
                                            <button
                                                key={diff}
                                                onClick={() => updatePref('difficulty_preference', diff)}
                                                className={cn(
                                                    "py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                                                    user.difficultyPreference === diff 
                                                        ? "bg-[var(--accent)] text-black shadow-lg shadow-amber-500/20 scale-[1.02]" 
                                                        : "btn-skeuo bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                )}
                                            >
                                                {diff}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[var(--border)]">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--foreground)]/[0.02] border border-[var(--border)]">
                                        <div className="flex items-center gap-4">
                                            <Bell size={18} className="text-[var(--foreground-muted)]" />
                                            <p className="text-xs font-bold uppercase tracking-wide">Email Alerts</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePref('notification_email', !user.notificationEmail)}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-all relative border",
                                                user.notificationEmail ? "bg-[var(--accent)] border-transparent" : "bg-[var(--foreground)]/[0.05] border-[var(--border)]"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-sm",
                                                user.notificationEmail ? "left-5.5 bg-black" : "left-0.5 bg-[var(--foreground-muted)]"
                                            )} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--foreground)]/[0.02] border border-[var(--border)]">
                                        <div className="flex items-center gap-4">
                                            <Smartphone size={18} className="text-[var(--foreground-muted)]" />
                                            <p className="text-xs font-bold uppercase tracking-wide">Push Alerts</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePref('notification_push', !user.notificationPush)}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-all relative border",
                                                user.notificationPush ? "bg-[var(--accent)] border-transparent" : "bg-[var(--foreground)]/[0.05] border-[var(--border)]"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-sm",
                                                user.notificationPush ? "left-5.5 bg-black" : "left-0.5 bg-[var(--foreground-muted)]"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── Leverage (Subscription) ─── */}
                        <div className="scholar-card p-8 relative overflow-hidden group border-2 border-[var(--accent)]/10">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover-scale-md-rotate-12 transition-transform duration-1000 pointer-events-none">
                                <Sparkles size={160} />
                            </div>
                            
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 items-center">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">The Plan</p>
                                        <h4 className="text-3xl md:text-4xl font-bold font-heading capitalize">
                                            {user.planStatus === 'free' ? "Scholar Free" : user.planStatus === 'plus' ? "Plus Scholar" : "Unlimited Professor"}
                                        </h4>
                                        <p className="text-sm text-[var(--foreground-muted)] mt-2">
                                            {user.planStatus === 'free' 
                                                ? "You are currently on the basic plan. Upgrade to get your time back faster." 
                                                : `You are currently on the ${user.planStatus} plan. Enjoy priority generation speeds and premium features.`}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-12">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Monthly Credits</p>
                                            <p className="text-3xl font-bold font-heading text-[var(--foreground)]">
                                                {user.planStatus === 'unlimited' ? "∞" : user?.credits || 0}
                                                <span className="text-xs text-[var(--foreground-muted)] ml-1">
                                                    {user.planStatus === 'free' ? "/ 100" : user.planStatus === 'plus' ? "/ 1,000" : ""}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Usage Health</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <p className="text-xl font-bold">Optimal</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => router.push('/settings/billing')}
                                    className="btn-skeuo w-full py-6 flex flex-col items-center justify-center gap-1 bg-[var(--foreground)] text-[var(--background)] group/btn overflow-hidden relative shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
                                        {user.planStatus === 'free' ? "Upgrade to Pro" : "Manage Billing"} <ChevronRight size={14} />
                                    </span>
                                    <span className="text-[9px] font-bold uppercase opacity-50 relative z-10">Expand your reach</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── Professor's Tip ─── */}
                        <div className="glass-panel p-8 md:p-10 border border-[var(--border)] relative overflow-hidden bg-[var(--foreground)]/[0.01]">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />
                            <div className="flex gap-6 items-start">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-900 flex-shrink-0 flex items-center justify-center border border-white/5 shadow-xl">
                                    <Sparkles size={24} className="text-[var(--accent)]" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-heading text-base font-bold tracking-tight">The Professor's Guidance</h4>
                                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed italic">
                                        "A disorganized environment leads to a disorganized mind. Keep your parameters tight and your goal ambitious. It's not about being 'easy' sha, it's about being effective. Calibrate well."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ─── Session Management ─── */}
                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[var(--border)] opacity-60 hover:opacity-100 transition-opacity">
                            <button 
                                onClick={handleSignOut}
                                className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500/70 hover:text-white hover:bg-red-500 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                Take a Break (Sign Out)
                            </button>
                            <div className="text-right">
                                <p className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.2em]">The Professor Protocol v2.4.0</p>
                                <p className="text-[9px] text-[var(--foreground-muted)] uppercase font-medium">All systems operational</p>
                            </div>
                        </div>
                    </div>
                </StandardContainer>
            </section>
        </div>
    );
}
