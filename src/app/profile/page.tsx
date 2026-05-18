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
    LogOut,
    Trophy,
    Sliders,
    CreditCard,
    Flame,
    Brain,
    Clock,
    Star,
    Shield,
    Award,
    Sun,
    Moon,
    Users,
    Swords,
    GraduationCap
} from "lucide-react";

/* ═══ Achievements ═══ */
const ACHIEVEMENTS = [
    { id: "first_quiz", icon: Brain, label: "First Steps", desc: "Complete your first quiz", color: "var(--emerald)" },
    { id: "flash_10", icon: Sparkles, label: "Card Collector", desc: "Generate 10 flashcard sets", color: "var(--blue)" },
    { id: "streak_3", icon: Flame, label: "On Fire", desc: "3-day study streak", color: "var(--amber)" },
    { id: "streak_7", icon: Flame, label: "Unstoppable", desc: "7-day study streak", color: "var(--amber)" },
    { id: "perfect_score", icon: Award, label: "Perfect 10", desc: "Score 100% on any quiz", color: "var(--violet)" },
    { id: "night_owl", icon: Moon, label: "Night Owl", desc: "Study after midnight", color: "var(--blue)" },
    { id: "early_bird", icon: Sun, label: "Early Bird", desc: "Study before 7am", color: "var(--amber)" },
    { id: "social", icon: Users, label: "Team Player", desc: "Join a Hub room", color: "var(--emerald)" },
    { id: "marathon", icon: Clock, label: "Marathon", desc: "60+ min session", color: "var(--blue)" },
    { id: "centurion", icon: Star, label: "Centurion", desc: "Review 100 flashcards", color: "var(--amber)" },
    { id: "duel_win", icon: Swords, label: "Victor", desc: "Win your first Duel", color: "var(--violet)" },
    { id: "level_5", icon: GraduationCap, label: "Scholar", desc: "Reach Level 5", color: "var(--blue)" },
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
        { id: "achievements", label: "Achievements", icon: Trophy },
        { id: "habits", label: "Study Habits", icon: Sliders },
        { id: "plan", label: "The Plan", icon: CreditCard },
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
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--blue-dim)] pb-24 font-sans">
            <div className="pt-20 md:pt-28">
                <StandardContainer narrow>
                    {/* ═══ Header Section (Subtle & Elegant) ═══ */}
                    <div className="mb-8 relative">
                        <div className="scholar-card p-6 md:p-8 relative overflow-hidden group border border-[var(--border)] bg-[var(--background-secondary)]/60 backdrop-blur-md" style={{ borderRadius: "24px" }}>
                            {/* Sign Out Trigger */}
                            <button 
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push('/login');
                                }}
                                className="absolute top-5 right-5 p-2 rounded-full bg-[var(--text)]/5 border border-[var(--border)] text-[var(--text-3)] hover:text-red-500 hover:bg-red-500/10 transition-all z-20 shadow-sm"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--blue-dim)] to-[var(--amber-dim)] border border-[var(--border)] flex items-center justify-center text-2xl shadow-md shrink-0">
                                        <span>{user?.avatar || "🎓"}</span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
                                            Level {level} · {levelTitle}
                                        </div>
                                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text)]">{user?.name || "Scholar"}</h1>
                                        <p className="text-xs text-[var(--text-3)] font-mono tracking-wide">{user?.email || "student@theprofessor.xyz"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-8">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Total XP</p>
                                        <p className="text-2xl font-black font-mono text-[var(--blue)] tabular-nums">{stats.xp.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Study Streak</p>
                                        <p className="text-2xl font-black font-mono text-[var(--amber)] tabular-nums">{user?.streak || 0} days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Level Progress */}
                            <div className="mt-6 pt-4 border-t border-[var(--border)]/50 space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[var(--text-3)]">
                                    <span>Targeting Level {level + 1}</span>
                                    <span>{stats.xp} / {nextLevelXp} XP</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-[var(--text-4)] overflow-hidden shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-gradient-to-r from-[var(--blue)] to-[var(--amber)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Subtle Segmented Control ═══ */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex p-1 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                            {TABS.map((tab) => {
                                const isActive = activeSection === tab.id;
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSection(tab.id)}
                                        className={cn(
                                            "relative px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all z-10",
                                            isActive ? "text-[var(--text)] shadow-sm" : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-profile-tab-bg"
                                                className="absolute inset-0 bg-[var(--bg)] border border-[var(--border)] rounded-xl"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                        )}
                                        <IconComponent size={16} className="relative z-10" />
                                        <span className="relative z-10 uppercase tracking-wider">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═══ Content Area ═══ */}
                    <div className="animate-in fade-in duration-500">
                        {activeSection === "achievements" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">Unlocked Badges</p>
                                    <Link href="/achievements" className="text-xs font-bold text-[var(--blue)] hover:underline flex items-center gap-1">
                                        <span>Go to Trophy Room</span>
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {ACHIEVEMENTS.map((badge) => {
                                        const unlocked = unlockedIds.has(badge.id);
                                        const BadgeIcon = badge.icon;
                                        return (
                                            <div key={badge.id} className={cn(
                                                "scholar-card p-5 flex items-center gap-4 border transition-all group",
                                                unlocked ? "bg-[var(--background-secondary)] border-[var(--border)]" : "bg-[var(--background-secondary)]/30 border-[var(--border)]/40 opacity-40 grayscale"
                                            )} style={{ borderRadius: "20px" }}>
                                                <div className="w-12 h-12 rounded-xl bg-[var(--text-4)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-sm" style={{ color: unlocked ? badge.color : 'inherit' }}>
                                                    <BadgeIcon size={22} />
                                                </div>
                                                <div className="space-y-0.5 flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text)] truncate">{badge.label}</h3>
                                                        {unlocked && (
                                                            <CheckCircle2 size={14} className="text-[var(--emerald)] shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-[var(--text-2)] font-normal line-clamp-1">{badge.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeSection === "habits" && (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                <div className="scholar-card border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden" style={{ borderRadius: "24px" }}>
                                    <div className="p-6 border-b border-[var(--border)]">
                                        <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">The Study Lab</h3>
                                        <p className="text-xs text-[var(--text-2)] mt-1">Configure your focus parameters and preferred difficulty rigor.</p>
                                    </div>
                                    <div className="p-6 space-y-8">
                                        {/* Daily Goal */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Daily Focus Goal (Minutes)</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {[15, 30, 60, 120].map((goal) => (
                                                    <button
                                                        key={goal}
                                                        onClick={() => updatePref('daily_goal_minutes', goal)}
                                                        className={cn(
                                                            "py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                                                            user?.dailyGoalMinutes === goal 
                                                                ? "bg-[var(--blue)] text-black border-[var(--blue)] shadow-md font-black" 
                                                                : "bg-[var(--bg)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--text-3)] hover:text-[var(--text)]"
                                                        )}
                                                    >
                                                        {goal} mins
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rigor */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Professor's Rigor (Difficulty)</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['easy', 'medium', 'hard'].map((diff) => (
                                                    <button
                                                        key={diff}
                                                        onClick={() => updatePref('difficulty_preference', diff)}
                                                        className={cn(
                                                            "py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                                                            user?.difficultyPreference === diff 
                                                                ? "bg-[var(--blue)] text-black border-[var(--blue)] shadow-md font-black" 
                                                                : "bg-[var(--bg)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--text-3)] hover:text-[var(--text)]"
                                                        )}
                                                    >
                                                        {diff}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center pt-4">
                                    <button 
                                        onClick={handleDeleteAccount}
                                        className="px-6 py-2.5 rounded-xl border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-wider"
                                    >
                                        Wipe Account History
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "plan" && (
                            <div className="max-w-xl mx-auto">
                                <div className="scholar-card p-8 flex flex-col items-center text-center gap-6 border border-[var(--border)] bg-[var(--background-secondary)]" style={{ borderRadius: "24px" }}>
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">
                                            Protocol Status
                                        </div>
                                        <h3 className="text-2xl font-bold tracking-tight text-[var(--text)]">Scholar Free</h3>
                                        <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">You are currently on the foundational protocol. Upgrade for unlimited leverage and speed.</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-12 py-4 border-y border-[var(--border)]/60 w-full justify-center">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">Monthly Credits</p>
                                            <p className="text-3xl font-black font-mono text-[var(--text)] tabular-nums">{user?.credits || 0}<span className="text-xs text-[var(--text-3)] ml-1">/ 100</span></p>
                                        </div>
                                        <div className="w-px h-12 bg-[var(--border)]" />
                                        <div className="space-y-1 text-left">
                                            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">Service Health</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                                <p className="text-lg font-black uppercase tracking-tight text-[var(--text)]">Optimal</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link href="/settings/billing" className="w-full py-4 rounded-xl bg-[var(--text)] text-[var(--bg)] text-xs font-black uppercase tracking-widest hover:bg-[var(--text-2)] active:scale-[0.99] transition-all text-center shadow-md">
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
