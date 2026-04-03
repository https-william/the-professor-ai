"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

/* ═══ Claymorphic Helpers ═══ */
const clay = {
    card: {
        background: "rgba(255,255,255,0.025)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    pill: {
        background: "rgba(255,255,255,0.04)",
        borderRadius: "14px",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.15)",
    } as React.CSSProperties,
};

/* ═══ Achievements ═══ */
const ACHIEVEMENTS = [
    { id: "first_quiz", icon: "quiz", label: "First Steps", desc: "Complete your first quiz", color: "#10B981" },
    { id: "flash_10", icon: "style", label: "Card Collector", desc: "Generate 10 flashcard sets", color: "#F59E0B" },
    { id: "streak_3", icon: "local_fire_department", label: "On Fire", desc: "3-day study streak", color: "#EF4444" },
    { id: "streak_7", icon: "whatshot", label: "Unstoppable", desc: "7-day study streak", color: "#F97316" },
    { id: "perfect_score", icon: "military_tech", label: "Perfect 10", desc: "Score 100% on any quiz", color: "#818CF8" },
    { id: "night_owl", icon: "dark_mode", label: "Night Owl", desc: "Study after midnight", color: "#6366F1" },
    { id: "early_bird", icon: "wb_sunny", label: "Early Bird", desc: "Study before 7am", color: "#FBBF24" },
    { id: "social", icon: "groups", label: "Team Player", desc: "Join a Hub room", color: "#10B981" },
    { id: "marathon", icon: "timer", label: "Marathon", desc: "60+ min session", color: "#EC4899" },
    { id: "centurion", icon: "workspace_premium", label: "Centurion", desc: "Review 100 flashcards", color: "#D97706" },
    { id: "duel_win", icon: "swords", label: "Victor", desc: "Win your first Duel", color: "#EF4444" },
    { id: "level_5", icon: "school", label: "Scholar", desc: "Reach Level 5", color: "#8B5CF6" },
];

const STATS = [
    { icon: "bolt", label: "Total XP", key: "xp", color: "#F59E0B" },
    { icon: "quiz", label: "Quizzes Done", key: "quizzes", color: "#818CF8" },
    { icon: "style", label: "Cards Reviewed", key: "cards", color: "#10B981" },
    { icon: "local_fire_department", label: "Best Streak", key: "bestStreak", color: "#EF4444" },
];

export default function ProfilePage() {
    const { user } = useUser();
    const [activeSection, setActiveSection] = useState<"achievements" | "settings">("achievements");

    const unlockedIds = new Set(["first_quiz", "night_owl"]);
    const stats = { xp: 0, quizzes: 0, cards: 0, bestStreak: user.streak ?? 0 };
    const level = 1;

    return (
        <div className="min-h-[100dvh] bg-[#06060B] text-white/90 pb-28 relative overflow-hidden">

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
                    style={{ top: "-30%", right: "-15%", background: "radial-gradient(circle, rgba(245,158,11,0.05), transparent 60%)", filter: "blur(80px)", animationDuration: "6s" }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 py-8 sm:py-12">

                {/* ═══ Profile Card — Claymorphic Bento ═══ */}
                <div className="relative overflow-hidden mb-8" style={clay.card}>
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)" }} />

                    {/* Banner with gradient mesh */}
                    <div className="h-24 sm:h-28 relative overflow-hidden" style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(99,102,241,0.05) 50%, rgba(16,185,129,0.03) 100%)",
                    }}>
                        <div className="absolute w-[200px] h-[200px] rounded-full" style={{
                            top: "-60%", right: "10%", background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)", filter: "blur(40px)",
                        }} />
                    </div>

                    <div className="px-6 sm:px-8 pb-7 -mt-9">
                        <div className="flex items-end justify-between mb-5">
                            {/* Avatar — claymorphic */}
                            <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black"
                                style={{
                                    background: "linear-gradient(145deg, #F5A623, #D4911A)",
                                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.2), 0 6px 24px rgba(245,158,11,0.35)",
                                    border: "3px solid #06060B",
                                    color: "#08080E",
                                    borderRadius: "20px",
                                }}>
                                {user.avatar || "?"}
                            </div>

                            {/* Level badge — claymorphic pill */}
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
                                style={{
                                    ...clay.pill,
                                    background: "rgba(245,158,11,0.06)",
                                    border: "1px solid rgba(245,158,11,0.1)",
                                }}>
                                <span className="material-symbols-outlined text-[13px] text-[#F59E0B]">school</span>
                                <span className="text-[11px] font-bold text-[#F59E0B]">Level {level}</span>
                                <span className="text-[11px] text-white/20">· Scholar</span>
                            </div>
                        </div>

                        <h1 className="font-heading text-2xl font-bold text-white/95 mb-0.5">{user.name || "Student"}</h1>
                        <p className="text-[13px] text-white/20">{user.email || "student@theprofessor.app"}</p>

                        {/* XP Bar — inset clay */}
                        <div className="mt-5">
                            <div className="flex items-center justify-between text-[10px] text-white/20 mb-2">
                                <span className="font-semibold">Next Level</span>
                                <span className="font-bold text-white/30">{stats.xp} / 500 XP</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(0,0,0,0.3)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)" }}>
                                <div className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${Math.max((stats.xp / 500) * 100, 2)}%`,
                                        background: "linear-gradient(90deg, #F59E0B, #D97706)",
                                        boxShadow: "0 0 10px rgba(245,158,11,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
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
                                activeSection === section ? "text-white/80" : "text-white/20 hover:text-white/35"
                            }`}
                            style={activeSection === section ? {
                                background: "rgba(255,255,255,0.05)",
                                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.2)",
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
                        <button onClick={() => {}}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group mt-4"
                            style={{ ...clay.pill, border: "1px solid rgba(239,68,68,0.06)" }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(239,68,68,0.05)", boxShadow: "inset 0 1px 2px rgba(239,68,68,0.05)" }}>
                                <span className="material-symbols-outlined text-lg text-red-400/40">logout</span>
                            </div>
                            <span className="text-[13px] font-semibold text-red-400/40 group-hover:text-red-400/70 transition-colors">Sign Out</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
