"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { GlassCard, Grainient } from "@/components/ui/VisualEffects";
import BrandLogo from "@/components/ui/BrandLogo";
import { createClient } from "@/lib/supabase/client";

interface RecentItem {
    id: string;
    title: string;
    type: "flashcards" | "quiz" | "summary" | "mindmap";
    createdAt: string;
}

const typeConfig = {
    flashcards: { icon: "style", color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" },
    quiz: { icon: "quiz", color: "text-[var(--secondary)]", bg: "bg-[var(--secondary)]/10" },
    summary: { icon: "summarize", color: "text-blue-500", bg: "bg-blue-500/10" },
    mindmap: { icon: "hub", color: "text-orange-500", bg: "bg-orange-500/10" },
};

const TOOLS = [
    { icon: "style", label: "Flashcards", href: "/create?tool=flashcards", color: "var(--accent)", bg: "rgba(245,158,11,0.1)" },
    { icon: "quiz", label: "Quiz", href: "/create?tool=quiz", color: "var(--secondary)", bg: "rgba(99,102,241,0.1)" },
    { icon: "summarize", label: "Summary", href: "/create?tool=summary", color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
    { icon: "account_tree", label: "Mind Map", href: "/create?tool=mindmap", color: "#F97316", bg: "rgba(249,115,22,0.1)" },
    { icon: "school", label: "Ask Prof", href: "/professor", color: "var(--accent)", bg: "rgba(245,158,11,0.1)" },
];

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up,";
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    if (hour < 21) return "Good evening,";
    return "Late night grind,";
}

export default function DashboardPage() {
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [examDate, setExamDate] = useState("");
    const [savedExam, setSavedExam] = useState<{ date: string; name: string } | null>(null);
    const [examName, setExamName] = useState("");
    const [editingExam, setEditingExam] = useState(false);
    const [recentSessions, setRecentSessions] = useState<RecentItem[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem("exam_countdown");
            if (stored) setSavedExam(JSON.parse(stored));
        } catch { }
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        async function fetchRecent() {
            setLoadingSessions(true);
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(3);

            if (!error && data) {
                const formatted = data.map((item: any) => ({
                    id: item.id,
                    title: item.title || "Untitled",
                    type: item.type,
                    createdAt: new Date(item.created_at).toLocaleDateString(),
                }));
                setRecentSessions(formatted);
            }
            setLoadingSessions(false);
        }

        fetchRecent();
    }, [user?.id]);

    function saveExam() {
        if (!examDate) return;
        const exam = { date: examDate, name: examName || "Exam" };
        localStorage.setItem("exam_countdown", JSON.stringify(exam));
        setSavedExam(exam);
        setEditingExam(false);
        setExamDate("");
        setExamName("");
    }

    function clearExam() {
        localStorage.removeItem("exam_countdown");
        setSavedExam(null);
    }

    function getDaysUntil(dateStr: string) {
        const diff = new Date(dateStr).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[var(--background)] p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="h-14 w-64 rounded-2xl shimmer" />
                    <div className="grid grid-cols-3 gap-4">
                        {[0, 1, 2].map(i => <div key={i} className="h-32 rounded-2xl shimmer" />)}
                    </div>
                </div>
            </div>
        );
    }

    const days = savedExam ? getDaysUntil(savedExam.date) : null;
    const urgency = days !== null
        ? days <= 2 ? "danger" : days <= 5 ? "warning" : "calm"
        : null;

    const urgencyColor = urgency === "danger" ? "#EF4444"
        : urgency === "warning" ? "var(--accent)"
            : "#10B981";

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 relative overflow-hidden">
            <Grainient className="fixed inset-0 opacity-30 z-0 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 bg-[var(--background)]/70 backdrop-blur-xl border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                        <BrandLogo size="sm" />
                        <span className="text-xs font-bold tracking-widest text-[var(--foreground-muted)] uppercase hidden sm:block">The Professor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 transition-all"
                            title="Toggle theme"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                            </span>
                        </button>
                        {/* Upgrade — text on desktop, icon-only on mobile */}
                        <Link
                            href="/settings/billing"
                            className="flex items-center gap-1 px-2.5 sm:px-4 py-2 rounded-xl bg-[var(--accent)] text-[#08080E] text-xs font-black hover:opacity-90 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            <span className="hidden sm:inline">Upgrade</span>
                        </Link>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">

                    {/* Greeting */}
                    <div className="animate-fade-in-up">
                        <p className="text-[var(--foreground-muted)] text-sm font-medium tracking-wide uppercase mb-1">
                            {getGreeting()}
                        </p>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold text-[var(--foreground)] leading-tight">
                            {user.name}
                        </h1>
                        <p className="text-[var(--foreground-secondary)] mt-2 text-base">
                            Your AI study engine is ready. What are we tackling today?
                        </p>
                    </div>

                    {/* Exam Countdown Widget */}
                    <div className="animate-fade-in-up animation-delay-100">
                        {savedExam && !editingExam ? (
                            <GlassCard className="p-6 border border-[var(--border)]" style={{ borderColor: `${urgencyColor}30` } as React.CSSProperties}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-1">
                                            Exam Countdown
                                        </p>
                                        <p className="text-[var(--foreground-secondary)] text-sm">{savedExam.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-heading text-5xl font-bold" style={{ color: urgencyColor }}>
                                            {days !== null && days > 0 ? days : days === 0 ? "🔥" : "⏰"}
                                        </div>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                            {days !== null && days > 0 ? "days left" : days === 0 ? "TODAY" : "PASSED"}
                                        </p>
                                    </div>
                                </div>
                                {urgency === "danger" && (
                                    <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                                        🚨 Panic mode activated. Focus on high-yield topics only.
                                    </div>
                                )}
                                {urgency === "warning" && (
                                    <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                                        ⚡ Crunch time. Review flashcards and do a practice quiz today.
                                    </div>
                                )}
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setEditingExam(true)} className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                                        Edit
                                    </button>
                                    <span className="text-[var(--border)]">·</span>
                                    <button onClick={clearExam} className="text-xs text-[var(--foreground-muted)] hover:text-red-400 transition-colors">
                                        Clear
                                    </button>
                                </div>
                            </GlassCard>
                        ) : (
                            <GlassCard className="p-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">
                                    📅 Set Exam Countdown
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <input
                                        type="text"
                                        placeholder="Exam name (e.g. Chemistry Finals)"
                                        value={examName}
                                        onChange={e => setExamName(e.target.value)}
                                        className="flex-1 min-w-[180px] bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] rounded-xl px-4 py-2.5 text-sm border border-[var(--border)] focus:border-[var(--accent)] transition-colors"
                                        style={{ outline: "none", boxShadow: "none" }}
                                    />
                                    <input
                                        type="date"
                                        value={examDate}
                                        onChange={e => setExamDate(e.target.value)}
                                        className="bg-[var(--background-secondary)] text-[var(--foreground)] rounded-xl px-4 py-2.5 text-sm border border-[var(--border)] focus:border-[var(--accent)] transition-colors"
                                        style={{ outline: "none", boxShadow: "none" }}
                                    />
                                    <button
                                        onClick={saveExam}
                                        disabled={!examDate}
                                        className="btn-primary text-sm px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Set Countdown
                                    </button>
                                </div>
                            </GlassCard>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 animate-fade-in-up animation-delay-200">
                        <GlassCard className="p-5 text-center">
                            <div className="text-3xl font-heading font-bold text-[var(--accent)]">{user.streak ?? 0}</div>
                            <div className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wider">Day Streak</div>
                        </GlassCard>
                        <GlassCard className="p-5 text-center">
                            <div className="text-3xl font-heading font-bold text-[var(--secondary)]">{user.credits ?? 0}</div>
                            <div className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wider">Credits</div>
                        </GlassCard>
                        <Link href="/history" className="block">
                            <GlassCard className="p-5 text-center h-full hover:border-[var(--accent)]/30 transition-all cursor-pointer group">
                                <div className="text-3xl font-heading font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">→</div>
                                <div className="text-xs text-[var(--foreground-muted)] mt-1 uppercase tracking-wider">Library</div>
                            </GlassCard>
                        </Link>
                    </div>

                    {/* Study Tools Grid */}
                    <div className="animate-fade-in-up animation-delay-300">
                        <h2 className="font-heading text-xl font-semibold text-[var(--foreground)] mb-4">
                            Start Studying
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {TOOLS.map((tool, i) => (
                                <Link key={tool.label} href={tool.href}>
                                    <GlassCard
                                        className="p-5 group hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                                            style={{ background: tool.bg, color: tool.color }}
                                        >
                                            <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                                        </div>
                                        <div className="font-semibold text-[var(--foreground)] text-sm">{tool.label}</div>
                                        <div className="text-xs text-[var(--foreground-muted)] mt-0.5">Generate now →</div>
                                    </GlassCard>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent activity */}
                    <div className="animate-fade-in-up animation-delay-400">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-heading text-xl font-semibold text-[var(--foreground)]">Recent Sessions</h2>
                            <Link href="/history" className="text-xs font-bold text-[var(--accent)] hover:underline uppercase tracking-wide">
                                View All
                            </Link>
                        </div>

                        {loadingSessions ? (
                            <GlassCard className="p-6">
                                <div className="h-12 rounded-xl shimmer mb-2" />
                                <div className="h-12 rounded-xl shimmer" />
                            </GlassCard>
                        ) : recentSessions.length > 0 ? (
                            <div className="grid gap-3">
                                {recentSessions.map((session) => {
                                    const config = typeConfig[session.type] || typeConfig.flashcards;
                                    return (
                                        <Link key={session.id} href="/history">
                                            <GlassCard className="p-4 flex items-center justify-between hover:border-[var(--accent)]/30 transition-all cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}>
                                                        <span className="material-symbols-outlined text-xl">{config.icon}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{session.title}</h3>
                                                        <p className="text-xs text-[var(--foreground-muted)] capitalize">{session.type} · {session.createdAt}</p>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors">chevron_right</span>
                                            </GlassCard>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <GlassCard className="p-10 flex flex-col items-center justify-center text-center gap-3">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--accent)]/10"
                                >
                                    <span className="material-symbols-outlined text-3xl text-[var(--accent)]/60">auto_awesome</span>
                                </div>
                                <p className="text-[var(--foreground-secondary)] text-sm">
                                    Your generated sessions will appear here
                                </p>
                                <Link href="/create" className="btn-primary text-sm px-6 py-2.5 mt-1">
                                    Create Your First Session
                                </Link>
                            </GlassCard>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
