"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { calculateLevel, getLevelProgress, getLevelTitle } from "@/lib/profiles-client";
import { AppMode } from "@/components/ui/SiteHeader";

/* ═══ Claymorphic Helpers ═══ */
const clay = {
    card: {
        background: "var(--card)",
        borderRadius: "24px",
        border: "1px solid var(--card-border)",
        boxShadow: "inset 0 1px 1px var(--accent-glow), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    pill: {
        background: "var(--background-secondary)",
        borderRadius: "14px",
        boxShadow: "inset 0 1px 1px var(--card-border), inset 0 -1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.15)",
    } as React.CSSProperties,
};

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

const STATS = [
    { icon: "bolt", label: "Total XP", key: "xp", color: "var(--accent)" },
    { icon: "quiz", label: "Quizzes Done", key: "quizzes", color: "var(--secondary)" },
    { icon: "style", label: "Cards Reviewed", key: "cards", color: "var(--success)" },
    { icon: "local_fire_department", label: "Best Streak", key: "bestStreak", color: "var(--error)" },
];

export default function ProfilePage() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") as "achievements" | "settings" || "achievements";
    const [activeSection, setActiveSection] = useState<"achievements" | "settings">(initialTab);
    const [stats, setStats] = useState({ xp: 0, quizzes: 0, cards: 0, bestStreak: 0 });
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
    const supabase = createClient();

    const level = calculateLevel(user.xp || 0);
    const levelProgress = getLevelProgress(user.xp || 0);
    const levelTitle = getLevelTitle(level);
    const nextLevelXp = Math.pow(level, 2) * 100;
    const currentLevelXp = Math.pow(level - 1, 2) * 100;
    
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("Are you sure? This action is permanent and will delete all your uploaded PDFs, generated flashcards, and quizzes. This cannot be undone.");
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session found");

            const res = await fetch("/api/user/delete", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            if (res.ok) {
                await supabase.auth.signOut();
                router.push("/signup");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete account");
            }
        } catch (error) {
            console.error("Delete account error:", error);
            alert("An error occurred while deleting your account.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Fetch real stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!user.id) return;
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

                    // Determine unlocked achievements based on real data
                    const unlocked = new Set<string>();
                    if (data.stats?.quizzes > 0) unlocked.add("first_quiz");
                    if (data.stats?.flashcards >= 10) unlocked.add("flash_10");
                    if ((data.streak || 0) >= 3) unlocked.add("streak_3");
                    if ((data.streak || 0) >= 7) unlocked.add("streak_7");
                    if (level >= 5) unlocked.add("level_5");
                    if (user.wins > 0) unlocked.add("duel_win");
                    // Time-based achievements
                    const hour = new Date().getHours();
                    if (hour >= 0 && hour < 5) unlocked.add("night_owl");
                    if (hour >= 5 && hour < 7) unlocked.add("early_bird");
                    setUnlockedIds(unlocked);
                }
            } catch (err) {
                console.error("Error fetching profile stats:", err);
            }
        };
        fetchStats();
    }, [user.id, user.xp, user.streak, user.wins, level]);

    const handleModeChange = (mode: AppMode) => {
        if (mode === "CREATE") router.push("/dashboard?mode=create");
        if (mode === "HUB") router.push("/hub");
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] pb-28 relative overflow-hidden">
            <div className="pt-20"> {/* Unified spacing for global header */}
            </div>

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
                    style={{ top: "-30%", right: "-15%", background: "radial-gradient(circle, var(--accent-glow), transparent 60%)", filter: "blur(80px)", animationDuration: "6s" }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 py-8 sm:py-12">

                {/* ═══ Profile Card — Claymorphic Bento ═══ */}
                <div className="relative overflow-hidden mb-8" style={clay.card}>
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, var(--accent-glow), transparent)" }} />

                    {/* Banner with gradient mesh */}
                    <div className="h-24 sm:h-28 relative overflow-hidden" style={{
                        background: "linear-gradient(135deg, var(--accent-bg) 0%, var(--secondary-bg) 50%, var(--success)/0.03 100%)",
                    }}>
                        <div className="absolute w-[200px] h-[200px] rounded-full" style={{
                            top: "-60%", right: "10%", background: "radial-gradient(circle, var(--accent-glow), transparent 70%)", filter: "blur(40px)",
                        }} />
                    </div>

                    <div className="px-6 sm:px-8 pb-7 -mt-9">
                        <div className="flex items-end justify-between mb-5">
                            {/* Avatar — claymorphic */}
                            <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black"
                                style={{
                                    background: "linear-gradient(145deg, var(--accent), var(--accent-dark))",
                                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.2), 0 6px 24px var(--accent-glow)",
                                    border: "3px solid var(--background)",
                                    color: "var(--background)",
                                    borderRadius: "20px",
                                }}>
                                {user.avatar || "?"}
                            </div>

                            {/* Level badge — claymorphic pill */}
                             <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
                                style={{
                                    ...clay.pill,
                                    background: "var(--accent-bg)",
                                    border: "1px solid var(--accent-glow)",
                                }}>
                                <span className="material-symbols-outlined text-[13px] text-[var(--accent)]">school</span>
                                <span className="text-[11px] font-bold text-[var(--accent)]">Level {level}</span>
                                <span className="text-[11px] text-[var(--foreground-muted)]">· {levelTitle}</span>
                            </div>
                        </div>

                        <h1 className="font-heading text-2xl font-bold text-white/95 mb-0.5">{user.name || "Student"}</h1>
                        <p className="text-[13px] text-white/20">{user.email || "student@theprofessor.app"}</p>

                        {/* XP Bar — inset clay */}
                        <div className="mt-5">
                            <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] mb-2">
                                <span className="font-semibold">Next Level</span>
                                <span className="font-bold text-[var(--foreground-secondary)]">{stats.xp} / {nextLevelXp} XP</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden"
                                style={{ background: "var(--background-tertiary)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)" }}>
                                <div className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${Math.max(levelProgress, 2)}%`,
                                        background: "linear-gradient(90deg, var(--accent), var(--accent-dark))",
                                        boxShadow: "0 0 10px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.2)",
                                    }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Stats — Bento Grid (2+2) ═══ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {STATS.map((s) => (
                        <div key={s.key} className="text-center p-4 transition-all duration-300 hover:translate-y-[-2px]"
                            style={{
                                ...clay.card,
                                borderRadius: "18px",
                            }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                                style={{ background: `${s.color}10`, boxShadow: `inset 0 1px 2px ${s.color}12` }}>
                                <span className="material-symbols-outlined text-[15px]" style={{ color: `${s.color}90` }}>{s.icon}</span>
                            </div>
                            <div className="text-xl font-bold text-white/65">{(stats as any)[s.key] ?? 0}</div>
                            <div className="text-[10px] text-white/15 font-medium mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ═══ Section Toggle — Claymorphic tabs ═══ */}
                <div className="flex gap-1 mb-6 p-1.5 rounded-2xl" style={clay.pill}>
                    {(["achievements", "settings"] as const).map((section) => (
                        <button key={section} onClick={() => setActiveSection(section)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-300 ${
                                activeSection === section ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
                            }`}
                            style={activeSection === section ? {
                                background: "var(--accent-bg)",
                                boxShadow: "inset 0 1px 1px var(--card-border), 0 2px 6px rgba(0,0,0,0.2)",
                                borderRadius: "12px",
                            } : {}}>
                            <span className="material-symbols-outlined text-[14px]">
                                {section === "achievements" ? "emoji_events" : "settings"}
                            </span>
                            {section === "achievements" ? "Achievements" : "Settings"}
                        </button>
                    ))}
                </div>

                {/* ═══ Achievements — Badge Grid ═══ */}
                {activeSection === "achievements" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ACHIEVEMENTS.map((badge) => {
                            const unlocked = unlockedIds.has(badge.id);
                            return (
                                <div key={badge.id}
                                    className={`relative overflow-hidden transition-all duration-300 ${unlocked ? "hover:translate-y-[-3px]" : ""}`}
                                    style={{
                                        ...clay.card,
                                        borderRadius: "20px",
                                        background: unlocked ? `${badge.color}05` : "rgba(255,255,255,0.012)",
                                        border: `1px solid ${unlocked ? `${badge.color}12` : "rgba(255,255,255,0.03)"}`,
                                        opacity: unlocked ? 1 : 0.4,
                                        boxShadow: unlocked
                                            ? `inset 0 1px 2px ${badge.color}10, inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.25)`
                                            : "0 2px 8px rgba(0,0,0,0.15)",
                                    }}>
                                    {/* Top edge color */}
                                    {unlocked && (
                                        <div className="absolute top-0 left-0 right-0 h-px"
                                            style={{ background: `linear-gradient(90deg, transparent, ${badge.color}30, transparent)` }} />
                                    )}

                                    {!unlocked && (
                                        <div className="absolute top-3 right-3">
                                            <span className="material-symbols-outlined text-[13px] text-white/8">lock</span>
                                        </div>
                                    )}

                                    <div className="p-4">
                                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                                            style={{
                                                background: unlocked ? `${badge.color}12` : "rgba(255,255,255,0.02)",
                                                boxShadow: unlocked ? `inset 0 1px 2px ${badge.color}15, 0 2px 8px rgba(0,0,0,0.15)` : "none",
                                            }}>
                                            <span className="material-symbols-outlined text-xl"
                                                style={{ color: unlocked ? badge.color : "rgba(255,255,255,0.1)" }}>
                                                {badge.icon}
                                            </span>
                                        </div>
                                        <h3 className="text-[13px] font-semibold text-white/65 mb-0.5">{badge.label}</h3>
                                        <p className="text-[11px] text-white/15 leading-relaxed">{badge.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ═══ Settings ═══ */}
                {activeSection === "settings" && (
                    <div className="space-y-2">
                        {[
                            { icon: "person", label: "Account", desc: "Name, email, avatar" },
                            { icon: "tune", label: "Preferences", desc: "Theme, language, style" },
                            { icon: "record_voice_over", label: "Voice & Live Mode", desc: "Professor voice, speed" },
                            { icon: "data_saver_on", label: "Data Saver", desc: "Reduce animations and auto-play" },
                            { icon: "credit_card", label: "Billing & Credits", desc: "Manage credits", href: "/settings/billing" },
                            { icon: "help", label: "Help & Support", desc: "FAQs, feedback", href: "/help" },
                        ].map((item) => (
                            <Link key={item.label} href={item.href || "#"}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group"
                                style={clay.pill}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                            >
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: "rgba(255,255,255,0.03)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.12)" }}>
                                    <span className="material-symbols-outlined text-lg text-white/25">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-white/60 group-hover:text-white/80 transition-colors">{item.label}</div>
                                    <div className="text-[11px] text-white/15">{item.desc}</div>
                                </div>
                                <span className="material-symbols-outlined text-base text-white/8 group-hover:text-white/25 transition-colors">
                                    chevron_right
                                </span>
                            </Link>
                        ))}

                        {/* Sign Out */}
                        <button onClick={async () => {
                             await supabase.auth.signOut();
                             router.push('/login');
                         }}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group mt-4"
                            style={{ ...clay.pill, border: "1px solid rgba(239,68,68,0.06)" }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(239,68,68,0.05)", boxShadow: "inset 0 1px 2px rgba(239,68,68,0.05)" }}>
                                <span className="material-symbols-outlined text-lg text-red-400/40">logout</span>
                            </div>
                            <span className="text-[13px] font-semibold text-red-400/40 group-hover:text-red-400/70 transition-colors">Sign Out</span>
                        </button>

                        {/* Danger Zone */}
                        <div className="mt-8 pt-8 border-t border-[var(--border)] space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/50 mb-2">Danger Zone</h4>
                            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col gap-3">
                                <p className="text-[11px] text-red-400/60 leading-relaxed">
                                    <strong>GDPR/CCPA Data Wipe:</strong> Deleting your account will permanently remove all your personal data, uploaded PDFs, quizzes, and history from our servers.
                                </p>
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="w-full py-2.5 rounded-xl font-bold text-[12px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {isDeleting ? "Wiping Data..." : "Permanently Delete My Account"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
