"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings as SettingsIcon, Bell, Shield, Moon } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUser(user);
            else router.push("/login");
        };
        fetchUser();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] pb-24 pt-8 px-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-8">Settings</h1>

            {/* Profile Section */}
            <section className="mb-8 p-6 rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F59E0B] to-amber-300 flex items-center justify-center text-black font-bold text-xl uppercase">
                        {user?.email?.charAt(0) || <User size={24} />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">{user?.email?.split('@')[0] || "Scholar"}</h2>
                        <p className="text-sm text-[var(--foreground-muted)]">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                    <span className="text-sm font-medium text-[var(--foreground-secondary)]">Plan</span>
                    <span className="text-sm font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full">Free Tier</span>
                </div>
            </section>

            {/* Preferences */}
            <section className="mb-8 space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-4 px-2">Preferences</h3>
                
                <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center text-[var(--foreground)]">
                            <Moon size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--foreground)]">Theme</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Toggle light and dark mode</p>
                        </div>
                    </div>
                    <ThemeToggle variant="default" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] opacity-50 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--foreground)]/5 flex items-center justify-center text-[var(--foreground)]">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--foreground)]">Notifications</p>
                            <p className="text-xs text-[var(--foreground-muted)]">Manage email alerts (Coming Soon)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="mt-12">
                <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </section>
        </div>
    );
}
