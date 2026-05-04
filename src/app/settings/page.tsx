"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Moon, Bell, Shield, Sparkles, ChevronRight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ui/ThemeToggle";
import StandardContainer from "@/components/ui/StandardContainer";

export default function SettingsPage() {
    const { user } = useUser();
    const isLoading = user.isLoading;
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="w-10 h-10 border-4 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-amber-500/30">
            {/* ═══ Header Section — Impeccable Rhythm ═══ */}
            <section className="pt-24 pb-12 md:pt-32 md:pb-16 border-b border-[var(--border)]">
                <StandardContainer narrow>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Configuration</p>
                            <h1 className="font-galaxie text-4xl md:text-6xl font-medium tracking-tight">Settings</h1>
                        </div>
                        <div className="flex items-center gap-4 p-2 pl-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                            <div className="text-right">
                                <p className="text-xs font-bold text-[var(--foreground)]">{user?.name || "Scholar"}</p>
                                <p className="text-[10px] text-[var(--foreground-muted)] font-medium uppercase tracking-wider">Free Plan</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F59E0B] to-amber-300 flex items-center justify-center text-black font-black text-sm">
                                {user?.avatar || (user?.email?.[0] || "S").toUpperCase()}
                            </div>
                        </div>
                    </div>
                </StandardContainer>
            </section>

            {/* ═══ Main Content — Asymmetric Cards ═══ */}
            <section className="py-16 md:py-24">
                <StandardContainer narrow>
                    <div className="grid grid-cols-1 gap-12 md:gap-20">
                        
                        {/* Account Section */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
                            <div className="sticky top-32">
                                <h3 className="font-heading text-lg font-bold tracking-tight mb-2">Account</h3>
                                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">Manage your personal details and authentication status.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-6 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center">
                                                <User size={22} strokeWidth={1.5} className="text-[var(--foreground-secondary)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Email Address</p>
                                                <p className="text-xs text-[var(--foreground-muted)]">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Edit</button>
                                    </div>
                                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-widest">
                                            <Shield size={12} />
                                            Verified Account
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] opacity-50">
                                            Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preferences Section */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
                            <div>
                                <h3 className="font-heading text-lg font-bold tracking-tight mb-2">Preferences</h3>
                                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">Customize your study environment and visual experience.</p>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Theme Toggle */}
                                <div className="p-6 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-between group transition-all hover:border-[var(--foreground)]/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center">
                                            <Moon size={22} strokeWidth={1.5} className="text-[var(--foreground-secondary)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Dark Mode</p>
                                            <p className="text-xs text-[var(--foreground-muted)]">Toggle system appearance</p>
                                        </div>
                                    </div>
                                    <ThemeToggle variant="default" />
                                </div>

                                {/* Notifications (Disabled/Coming Soon) */}
                                <div className="p-6 rounded-3xl bg-[var(--background-secondary)]/40 border border-[var(--border)] opacity-60 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center">
                                            <Bell size={22} strokeWidth={1.5} className="text-[var(--foreground-muted)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Email Alerts</p>
                                            <p className="text-xs text-[var(--foreground-muted)] tracking-tight">Daily streak reminders (Coming Soon)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Section */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
                            <div>
                                <h3 className="font-heading text-lg font-bold tracking-tight mb-2">Subscription</h3>
                                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">Manage your credits and platform access level.</p>
                            </div>
                            
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background)] border border-[var(--border)] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                    <Sparkles size={120} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-1">Current Plan</p>
                                            <h4 className="text-2xl font-bold font-heading">Scholar Free</h4>
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full bg-[var(--foreground)] text-[var(--background)] text-[10px] font-black uppercase tracking-widest">
                                            Active
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 mb-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">Monthly Credits</p>
                                            <p className="text-xl font-bold">{user?.credits || 0} / 100</p>
                                        </div>
                                        <div className="w-px h-10 bg-[var(--border)]" />
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">Usage Status</p>
                                            <p className="text-xl font-bold">Good</p>
                                        </div>
                                    </div>

                                    <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-xs font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-black/10">
                                        Upgrade to Pro
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Section */}
                        <div className="mt-8 pt-12 border-t border-[var(--border)]">
                            <button 
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all text-xs font-black uppercase tracking-widest"
                            >
                                <LogOut size={16} />
                                Sign Out of Session
                            </button>
                        </div>
                    </div>
                </StandardContainer>
            </section>
        </div>
    );
}
