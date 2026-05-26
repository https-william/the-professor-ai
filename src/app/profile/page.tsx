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
    Award,
    Sun,
    Moon,
    Users,
    Swords,
    GraduationCap,
    Shield
} from "lucide-react";

/* ═══ Achievements ═══ */
const ACHIEVEMENTS = [
    { id: "first_quiz", icon: Brain, label: "First Steps", desc: "Complete your first quiz", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "flash_10", icon: Sparkles, label: "Card Collector", desc: "Generate 10 flashcard sets", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "streak_3", icon: Flame, label: "On Fire", desc: "3-day study streak", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "streak_7", icon: Flame, label: "Unstoppable", desc: "7-day study streak", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "perfect_score", icon: Award, label: "Perfect 10", desc: "Score 100% on any quiz", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { id: "night_owl", icon: Moon, label: "Night Owl", desc: "Study after midnight", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { id: "early_bird", icon: Sun, label: "Early Bird", desc: "Study before 7am", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "social", icon: Users, label: "Team Player", desc: "Join a Hub room", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "marathon", icon: Clock, label: "Marathon", desc: "60+ min session", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "centurion", icon: Star, label: "Centurion", desc: "Review 100 flashcards", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "duel_win", icon: Swords, label: "Victor", desc: "Win your first Duel", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { id: "level_5", icon: GraduationCap, label: "Scholar", desc: "Reach Level 5", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
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
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-blue-500/10 pb-24 font-sans">
            <div className="pt-20 md:pt-28">
                <StandardContainer narrow>
                    
                    {/* ═══ Header Section (Flat 2.0 Branding Card) ═══ */}
                    <div className="mb-8 relative">
                        <div className="p-6 md:p-8 relative overflow-hidden border border-[var(--border)] bg-[var(--card)] rounded-[28px] shadow-lg">
                          
                            {/* Ambient Brand Glowing Orbs */}
                            <div className="absolute top-[-30%] right-[-20%] w-80 h-80 rounded-full bg-blue-500/5 filter blur-[60px] pointer-events-none select-none" />
                            <div className="absolute bottom-[-30%] left-[-20%] w-80 h-80 rounded-full bg-amber-500/3 filter blur-[60px] pointer-events-none select-none" />

                            {/* Sign Out Trigger */}
                            <button 
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push('/login');
                                }}
                                className="absolute top-5 right-5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] hover:bg-red-500/10 hover:border-red-500/20 text-[var(--foreground-muted)] hover:text-red-400 transition-all z-20 shadow-sm cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-amber-500/5 border border-[var(--border)] flex items-center justify-center text-2xl shadow-sm shrink-0 select-none">
                                        <span>{user?.avatar || "🎓"}</span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider text-blue-400">
                                            Level {level} · {levelTitle}
                                        </div>
                                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--foreground)]">{user?.name || "Scholar"}</h1>
                                        <p className="text-[11px] text-[var(--foreground-muted)] font-mono tracking-wide">{user?.email || "student@theprofessor.xyz"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-[var(--border)]/60 pt-4 md:pt-0 md:pl-8">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-0.5">Total XP</p>
                                        <p className="text-xl md:text-2xl font-black font-mono text-blue-400 tabular-nums">{stats.xp.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-0.5">Study Streak</p>
                                        <p className="text-xl md:text-2xl font-black font-mono text-amber-500 tabular-nums">🔥 {user?.streak || 0} days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Level Progress Slider */}
                            <div className="mt-6 pt-4 border-t border-[var(--border)]/50 space-y-2 relative z-10">
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[var(--foreground-muted)]">
                                    <span>Targeting Level {level + 1}</span>
                                    <span>{stats.xp} / {nextLevelXp} XP</span>
                                </div>
                                <div className="h-2 rounded-full bg-[var(--bg-3)] overflow-hidden border border-[var(--border)]">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Segmented Tab Controller (Flat 2.0 Styled) ═══ */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex p-1 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] shadow-sm">
                            {TABS.map((tab) => {
                                const isActive = activeSection === tab.id;
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSection(tab.id)}
                                        className={cn(
                                            "relative px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all z-10 cursor-pointer",
                                            isActive ? "text-blue-400 shadow-sm" : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-profile-tab-bg"
                                                className="absolute inset-0 bg-blue-500/5 border border-blue-500/15 rounded-xl"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                        )}
                                        <IconComponent size={14} className="relative z-10" />
                                        <span className="relative z-10 uppercase tracking-wider text-[10px]">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ═══ Tab Contents (Dynamic & Personalised) ═══ */}
                    <div className="animate-in fade-in duration-500">
                        {activeSection === "achievements" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Unlocked Badges</p>
                                    <Link href="/achievements" className="text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-500 flex items-center gap-1">
                                        <span>Trophy Room</span>
                                        <ChevronRight size={12} />
                                    </Link>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {ACHIEVEMENTS.map((badge) => {
                                        const unlocked = unlockedIds.has(badge.id);
                                        const BadgeIcon = badge.icon;
                                        return (
                                            <div 
                                                key={badge.id} 
                                                className={cn(
                                                    "p-5 flex items-center gap-4 border transition-all duration-300 relative overflow-hidden",
                                                    unlocked 
                                                        ? "bg-[var(--bg-2)] border-[var(--border)] hover:border-blue-500/20 hover-lift-sm" 
                                                        : "bg-[var(--bg-2)]/30 border-[var(--border)]/40 opacity-30 grayscale pointer-events-none"
                                                )} 
                                                style={{ borderRadius: "20px" }}
                                            >
                                                {/* Mini Background Glow for Unlocked Badges */}
                                                {unlocked && (
                                                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-blue-500/5 filter blur-[20px] pointer-events-none" />
                                                )}
                                                
                                                <div className={cn(
                                                    "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
                                                    unlocked ? `${badge.bg} ${badge.border} ${badge.color}` : "bg-[var(--bg-3)] border-[var(--border)] text-[var(--foreground-muted)]"
                                                )}>
                                                    <BadgeIcon size={20} />
                                                </div>
                                                <div className="space-y-0.5 flex-1 min-w-0 z-10">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)] truncate">{badge.label}</h3>
                                                        {unlocked && (
                                                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-[var(--foreground-muted)] font-medium line-clamp-1">{badge.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeSection === "habits" && (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                <div className="border border-[var(--border)] bg-[var(--card)] rounded-[28px] overflow-hidden shadow-md">
                                    <div className="p-6 border-b border-[var(--border)]">
                                        <h3 className="text-base font-black text-[var(--foreground)] tracking-tight">The Study Lab</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1 font-medium">Configure your preferred default parameters for new syntheses.</p>
                                    </div>
                                    <div className="p-6 space-y-8">
                                        
                                        {/* Daily Goal Input Selector */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Daily Focus Goal</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {[15, 30, 60, 120].map((goal) => (
                                                    <button
                                                        key={goal}
                                                        onClick={() => updatePref('daily_goal_minutes', goal)}
                                                        className={cn(
                                                            "py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer",
                                                            user?.dailyGoalMinutes === goal 
                                                                ? "bg-blue-500/10 border-blue-500 text-blue-400 font-extrabold shadow-sm shadow-blue-500/5" 
                                                                : "bg-[var(--bg-2)]/60 text-[var(--foreground-secondary)] border-[var(--border)] hover:bg-[var(--border)]"
                                                        )}
                                                    >
                                                        {goal} mins
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rigor Selector */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Default Rigor (Difficulty)</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['easy', 'medium', 'hard'].map((diff) => (
                                                    <button
                                                        key={diff}
                                                        onClick={() => updatePref('difficulty_preference', diff)}
                                                        className={cn(
                                                            "py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer",
                                                            user?.difficultyPreference === diff 
                                                                ? "bg-blue-500/10 border-blue-500 text-blue-400 font-extrabold shadow-sm shadow-blue-500/5" 
                                                                : "bg-[var(--bg-2)]/60 text-[var(--foreground-secondary)] border-[var(--border)] hover:bg-[var(--border)]"
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
                                        className="px-5 py-2.5 rounded-xl border border-red-500/15 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer"
                                    >
                                        Wipe Account History
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "plan" && (
                            <div className="max-w-xl mx-auto">
                                <div className="p-8 flex flex-col items-center text-center gap-6 border border-[var(--border)] bg-[var(--card)] rounded-[28px] shadow-md relative overflow-hidden">
                                    
                                    {/* Subtle Ambient Radial Glow */}
                                    <div className="absolute top-[-30%] left-[-30%] w-72 h-72 rounded-full bg-blue-500/5 filter blur-[50px] pointer-events-none" />

                                    <div className="space-y-2 relative z-10">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider text-blue-400">
                                            Protocol Status
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight text-[var(--foreground)]">Scholar Free</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] max-w-xs mx-auto leading-relaxed font-medium">You are currently on the foundational protocol. Upgrade for unlimited leverage and speed.</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-12 py-4 border-y border-[var(--border)]/60 w-full justify-center relative z-10">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Monthly Credits</p>
                                            <p className="text-2xl font-black font-mono text-[var(--foreground)] tabular-nums">{user?.credits || 0}<span className="text-xs text-[var(--foreground-muted)] ml-1">/ 100</span></p>
                                        </div>
                                        <div className="w-px h-10 bg-[var(--border)]" />
                                        <div className="space-y-1 text-left">
                                            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">Service Health</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                                                <p className="text-base font-black uppercase tracking-tight text-[var(--foreground)]">Optimal</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link href="/settings/billing" className="w-full py-4.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all text-center shadow-lg hover:shadow-blue-500/10 relative z-10">
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
