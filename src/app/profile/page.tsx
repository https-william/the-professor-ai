"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { calculateLevel, getLevelProgress, getLevelTitle } from "@/lib/profiles-client";
import { cn } from "@/lib/utils";
import StandardContainer from "@/components/ui/StandardContainer";
import { useToasts } from "@/components/ui/GlobalToasts";
import { 
    CheckCircle2, 
    Target, 
    Zap, 
    Bell, 
    Smartphone, 
    ChevronRight,
    Sparkles,
    LogOut
} from "lucide-react";

/* ═══ Achievements ═══ */
const ACHIEVEMENTS = [
    { id: "first_quiz", icon: "quiz", label: "First Steps", desc: "Complete your first quiz", color: "var(--success)" },
    { id: "flash_10", icon: "style", label: "Card Collector", desc: "Generate 10 flashcard sets", color: "var(--accent)" },
    { id: "streak_3", icon: "local_fire_department", label: "On Fire", desc: "3-day study streak", color: "var(--error)" },
    { id: "streak_7", icon: "whatshot", label: "Unstoppable", desc: "7-day study streak", color: "var(--accent-dark)" },
    { id: "perfect_score", icon: "military_tech", label: "Perfect 10", desc: "Score 100% on any quiz", color: "var(--secondary)" },
    { id: "night_owl", icon: "dark_mode", label: "Night Owl", desc: "Study after midnight", color: "var(--secondary-light)" },
    { id: "early_bird", icon: "wb_sunny", label: "Early Bird", desc: "Study before 7am", color: "var(--accent)" },
    { id: "social", icon: "groups", label: "Team Player", desc: "Join a Hub room", color: "var(--success)" },
    { id: "marathon", icon: "timer", label: "Marathon", desc: "60+ min session", color: "var(--secondary)" },
    { id: "centurion", icon: "workspace_premium", label: "Centurion", desc: "Review 100 flashcards", color: "var(--accent-dark)" },
    { id: "duel_win", icon: "swords", label: "Victor", desc: "Win your first Duel", color: "var(--error)" },
    { id: "level_5", icon: "school", label: "Scholar", desc: "Reach Level 5", color: "var(--secondary)" },
];

export default function ProfilePage() {
    const { user, updateUser } = useUser();
    const router = useRouter();
    const { addToast } = useToasts();
    const [activeSection, setActiveSection] = useState<"achievements" | "habits" | "plan">("achievements");
    const [stats, setStats] = useState({ xp: 0, quizzes: 0, cards: 0, bestStreak: 0 });
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const level = calculateLevel(user?.xp || 0);
    const levelProgress = getLevelProgress(user?.xp || 0);
    const levelTitle = getLevelTitle(level);
    const nextLevelXp = Math.pow(level, 2) * 100;

    const updatePref = async (key: string, value: any) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (res.ok) {
                const storeKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                updateUser({ [storeKey]: value });
                addToast("Habit updated", "success");
            }
        } catch (error) {
            addToast("Sync error", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const TABS = [
        { id: "achievements", label: "Achievements", icon: "emoji_events" },
        { id: "habits", label: "Study Habits", icon: "tune" },
        { id: "plan", label: "The Plan", icon: "credit_card" },
    ] as const;

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("Are you sure? This action is permanent and will delete all your data.");
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session found");
            const res = await fetch("/api/user/delete", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                await supabase.auth.signOut();
                router.push("/signup");
            }
        } catch (error) {
            console.error("Delete account error:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            try {
                const res = await fetch("/api/user/activity-history");
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        xp: data.xp || user.xp || 0,
                        quizzes: data.stats?.quizzes || 0,
                        cards: data.stats?.flashcards || 0,
                        bestStreak: data.streak || user.streak || 0,
                    });
                    const unlocked = new Set<string>();
                    if (data.stats?.quizzes > 0) unlocked.add("first_quiz");
                    if (data.stats?.flashcards >= 10) unlocked.add("flash_10");
                    if ((data.streak || 0) >= 3) unlocked.add("streak_3");
                    if ((data.streak || 0) >= 7) unlocked.add("streak_7");
                    if (level >= 5) unlocked.add("level_5");
                    if (user.wins > 0) unlocked.add("duel_win");
                    const hour = new Date().getHours();
                    if (hour >= 0 && hour < 5) unlocked.add("night_owl");
                    if (hour >= 5 && hour < 7) unlocked.add("early_bird");
                    setUnlockedIds(unlocked);
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, [user?.id, user?.xp, user?.streak, user?.wins, level]);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-amber-500/30 pb-32">
            <div className="pt-24 md:pt-32">
                <StandardContainer narrow>
                    {/* ═══ Header Section ═══ */}
                    <div className="mb-10 relative">
                        <div className="scholar-card p-6 md:p-10 relative overflow-hidden group border-none bg-[var(--background-secondary)]/40 backdrop-blur-sm">
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--accent)] to-[var(--secondary)] rounded-full blur-[140px]" />
                            </div>

                            {/* Sign Out Trigger — Persistent */}
                            <button 
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push('/login');
                                }}
                                className="absolute top-6 right-6 p-2.5 rounded-full bg-[var(--foreground)]/[0.03] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all z-20 shadow-sm"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-[var(--accent)] to-amber-300 flex items-center justify-center text-4xl shadow-2xl border border-white/10 relative overflow-hidden flex-shrink-0">
                                        <span className="relative z-10">{user?.avatar || "🎓"}</span>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
                                            Level {level} · {levelTitle}
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tight leading-none">{user?.name || "Scholar"}</h1>
                                        <p className="text-[11px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.25em]">{user?.email || "student@theprofessor.xyz"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10 md:gap-16">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Total XP</p>
                                        <p className="text-4xl font-black font-heading leading-none tabular-nums">{stats.xp.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-muted)] mb-2">Study Streak</p>
                                        <p className="text-4xl font-black font-heading leading-none text-[var(--accent)] tabular-nums">{user?.streak || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Level Progress */}
                            <div className="mt-12 space-y-2.5">
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] opacity-50">
                                    <span>Targeting Level {level + 1}</span>
                                    <span>{stats.xp} / {nextLevelXp} XP</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        className="h-full bg-gradient-to-r from-[var(--accent)] to-amber-300 shadow-[0_0_15px_var(--accent-glow)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Premium Segmented Control ═══ */}
                    <div className="flex justify-center mb-12">
                        <div className="inline-flex p-1.5 rounded-[2.5rem] bg-[var(--background-secondary)]/60 border border-[var(--border)] shadow-2xl relative backdrop-blur-2xl">
                            {TABS.map((tab) => {
                                const isActive = activeSection === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSection(tab.id)}
                                        className={cn(
                                            "relative px-10 py-4 rounded-[2rem] flex items-center gap-3 transition-all duration-500 z-10 overflow-hidden",
                                            isActive ? "text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-profile-tab"
                                                className="absolute inset-0 bg-[#0E0E12] shadow-2xl"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="material-symbols-outlined text-2xl relative z-10">{tab.icon}</span>
                                        {isActive && (
                                            <motion.span 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-[12px] font-black uppercase tracking-[0.25em] relative z-10 whitespace-nowrap"
                                            >
                                                {tab.label}
                                            </motion.span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═══ Content Area — Animated Transition ═══ */}
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {activeSection === "achievements" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                {ACHIEVEMENTS.map((badge) => {
                                    const unlocked = unlockedIds.has(badge.id);
                                    return (
                                        <div key={badge.id} className={cn(
                                            "scholar-card p-8 flex items-center gap-8 transition-all duration-500 group hover:border-[var(--accent)]/40 hover:translate-y-[-4px]",
                                            !unlocked && "opacity-30 saturate-0"
                                        )}>
                                            <div className="w-16 h-16 rounded-[24px] bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)]/5 group-hover:scale-110 transition-all shadow-inner">
                                                <span className="material-symbols-outlined text-3xl" style={{ color: unlocked ? badge.color : 'inherit' }}>{badge.icon}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="text-sm font-black uppercase tracking-[0.15em]">{badge.label}</h3>
                                                <p className="text-[12px] text-[var(--foreground-muted)] font-medium leading-relaxed max-w-[200px]">{badge.desc}</p>
                                                {unlocked && (
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-4">
                                                        <CheckCircle2 size={12} /> Unlocked
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeSection === "habits" && (
                            <div className="space-y-8 max-w-3xl mx-auto">
                                <div className="scholar-card p-1">
                                    <div className="p-10 border-b border-[var(--border)]">
                                        <h3 className="text-2xl font-black font-heading tracking-tight mb-2">The Study Lab</h3>
                                        <p className="text-sm text-[var(--foreground-muted)]">Set your parameters. Let's make study feel like flow.</p>
                                    </div>
                                    <div className="p-10 space-y-16">
                                        {/* Daily Goal */}
                                        <div className="space-y-8">
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--foreground-muted)] text-center">Daily Focus Goal (Minutes)</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[15, 30, 60, 120].map((goal) => (
                                                    <button
                                                        key={goal}
                                                        onClick={() => updatePref('daily_goal_minutes', goal)}
                                                        className={cn(
                                                            "py-6 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300",
                                                            user?.dailyGoalMinutes === goal 
                                                                ? "bg-[var(--accent)] text-black shadow-2xl scale-[1.05]" 
                                                                : "btn-skeuo bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                        )}
                                                    >
                                                        {goal}m
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rigor */}
                                        <div className="space-y-8">
                                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--foreground-muted)] text-center">Professor's Rigor (Difficulty)</p>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['easy', 'medium', 'hard'].map((diff) => (
                                                    <button
                                                        key={diff}
                                                        onClick={() => updatePref('difficulty_preference', diff)}
                                                        className={cn(
                                                            "py-6 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300",
                                                            user?.difficultyPreference === diff 
                                                                ? "bg-[var(--accent)] text-black shadow-2xl scale-[1.05]" 
                                                                : "btn-skeuo bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                        )}
                                                    >
                                                        {diff}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-[var(--border)] text-center">
                                    <button 
                                        onClick={handleDeleteAccount}
                                        className="px-8 py-3 rounded-xl border border-red-500/10 text-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-[0.3em]"
                                    >
                                        Wipe Account History
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "plan" && (
                            <div className="max-w-2xl mx-auto">
                                <div className="scholar-card p-12 flex flex-col items-center text-center gap-10 border-2 border-[var(--accent)]/20 bg-gradient-to-br from-transparent to-[var(--accent)]/[0.03]">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Protocol Status</p>
                                        <h3 className="text-4xl font-black font-heading tracking-tight">Scholar Free</h3>
                                        <p className="text-sm text-[var(--foreground-muted)] max-w-xs mx-auto leading-relaxed">You are currently on the foundational protocol. Upgrade for unlimited leverage and speed.</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-16 py-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Monthly Credits</p>
                                            <p className="text-5xl font-black font-heading tabular-nums">{user?.credits || 0}<span className="text-sm text-[var(--foreground-muted)] ml-2">/ 100</span></p>
                                        </div>
                                        <div className="w-px h-16 bg-[var(--border)]" />
                                        <div className="space-y-2 text-left">
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Service Health</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" />
                                                <p className="text-2xl font-black uppercase tracking-tighter">Optimal</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link href="/settings/billing" className="btn-skeuo w-full py-8 bg-[var(--foreground)] text-[var(--background)] text-[16px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        Upgrade Now
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </StandardContainer>
            </div>
        </div>
    );
}
