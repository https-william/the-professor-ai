"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    list: {
        background: "rgba(255,255,255,0.02)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
};

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
    flashcards: { icon: "style", label: "Flashcards", color: "#F59E0B" },
    quiz: { icon: "quiz", label: "Quiz", color: "#818CF8" },
    summary: { icon: "summarize", label: "Summary", color: "#6366F1" },
};

const filters = [
    { id: "all", label: "All", icon: "apps" },
    { id: "flashcards", label: "Flashcards", icon: "style" },
    { id: "quiz", label: "Quizzes", icon: "quiz" },
    { id: "summary", label: "Summaries", icon: "summarize" },
];

export default function LibraryPage() {
    const { user } = useUser();
    const router = useRouter();
    const [generations, setGenerations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!user.id) return;
        const fetchLibrary = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (!error && data) setGenerations(data);
            setLoading(false);
        };
        fetchLibrary();
    }, [user.id]);

    const filtered = filter === "all" ? generations : generations.filter(g => g.type === filter);

    const handleOpen = (item: any) => {
        if (item.type === "flashcards") {
            sessionStorage.setItem("generatedContent", JSON.stringify({ type: "flashcards", data: item.content?.flashcards, title: item.title }));
            router.push("/flashcards");
        } else if (item.type === "quiz") {
            sessionStorage.setItem("quiz_data", JSON.stringify(item.content));
            router.push("/quiz");
        } else if (item.type === "summary") {
            sessionStorage.setItem("summaryData", JSON.stringify({ summary: item.content?.summary, title: item.title }));
            router.push("/create?view=summary");
        }
    };

    const getPreview = (item: any): string => {
        if (item.content?.flashcards?.[0]?.front) return item.content.flashcards[0].front;
        if (item.content?.questions?.[0]?.question) return item.content.questions[0].question;
        if (item.content?.summary) return item.content.summary.substring(0, 100) + "...";
        return "Study material";
    };

    const getItemCount = (item: any): string => {
        if (item.content?.flashcards) return `${item.content.flashcards.length} cards`;
        if (item.content?.questions) return `${item.content.questions.length} questions`;
        return "";
    };

    const flashcardCount = generations.filter(g => g.type === "flashcards").length;
    const quizCount = generations.filter(g => g.type === "quiz").length;
    const summaryCount = generations.filter(g => g.type === "summary").length;

    return (
        <div className="min-h-[100dvh] bg-[#06060B] text-white/90 pb-28 relative overflow-hidden">

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
                    style={{ top: "-20%", left: "-15%", background: "radial-gradient(circle, rgba(99,102,241,0.04), transparent 60%)", filter: "blur(80px)", animationDuration: "7s" }} />
                <div className="absolute w-[400px] h-[400px] rounded-full animate-pulse"
                    style={{ bottom: "10%", right: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.03), transparent 60%)", filter: "blur(70px)", animationDuration: "9s" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-12">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(145deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
                                    boxShadow: "inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 16px rgba(99,102,241,0.1)",
                                    border: "1px solid rgba(99,102,241,0.1)",
                                }}>
                                <span className="material-symbols-outlined text-xl text-[#818CF8]">local_library</span>
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/15">My Library</span>
                        </div>
                        <h1 className="font-heading text-3xl sm:text-[40px] font-bold text-white/95 tracking-tight mb-2 leading-tight">
                            Your Study Vault
                        </h1>
                        <p className="text-sm text-white/25">Everything you&apos;ve generated, in one place.</p>
                    </div>
                    <Link href="/create"
                        className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-[12px] font-bold transition-all active:scale-95 hover:translate-y-[-2px]"
                        style={{
                            background: "linear-gradient(145deg, #F5A623, #D4911A)",
                            color: "#08080E",
                            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 16px rgba(245,158,11,0.3)",
                        }}>
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Create
                    </Link>
                </div>

                {/* ═══ Stats — Bento Row ═══ */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { label: "Flashcard Sets", count: flashcardCount, icon: "style", color: "#F59E0B" },
                        { label: "Quizzes", count: quizCount, icon: "quiz", color: "#818CF8" },
                        { label: "Summaries", count: summaryCount, icon: "summarize", color: "#6366F1" },
                    ].map((s) => (
                        <div key={s.label} className="text-center p-4 transition-all duration-300 hover:translate-y-[-2px]"
                            style={{ ...clay.card, borderRadius: "18px" }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                                style={{ background: `${s.color}10`, boxShadow: `inset 0 1px 2px ${s.color}12` }}>
                                <span className="material-symbols-outlined text-[15px]" style={{ color: `${s.color}90` }}>{s.icon}</span>
                            </div>
                            <div className="text-2xl font-bold text-white/65">{s.count}</div>
                            <div className="text-[10px] text-white/15 font-medium mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ═══ Filter Pills — Claymorphic ═══ */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    {filters.map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-200"
                            style={{
                                ...(filter === f.id ? {
                                    background: "rgba(245,158,11,0.1)",
                                    border: "1px solid rgba(245,158,11,0.15)",
                                    color: "#F59E0B",
                                    boxShadow: "inset 0 1px 2px rgba(245,158,11,0.1), 0 2px 8px rgba(245,158,11,0.08)",
                                } : {
                                    ...clay.pill,
                                    border: "1px solid rgba(255,255,255,0.04)",
                                    color: "rgba(255,255,255,0.25)",
                                }),
                            }}>
                            <span className="material-symbols-outlined text-[13px]">{f.icon}</span>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ═══ Content ═══ */}
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 px-6" style={clay.card}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                            style={{
                                background: "linear-gradient(145deg, rgba(99,102,241,0.1), rgba(99,102,241,0.03))",
                                boxShadow: "inset 0 2px 3px rgba(255,255,255,0.04), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(99,102,241,0.06)",
                            }}>
                            <span className="material-symbols-outlined text-3xl text-[#818CF8]/40">library_books</span>
                        </div>
                        <h3 className="text-base font-bold text-white/45 mb-2">
                            {filter !== "all" ? "No items match this filter" : "Your library is empty"}
                        </h3>
                        <p className="text-[13px] text-white/15 mb-7 max-w-xs mx-auto">
                            {filter !== "all" ? "Try selecting a different filter." : "Generate study materials to start building your collection."}
                        </p>
                        <Link href="/create"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-bold transition-all active:scale-95 hover:translate-y-[-2px]"
                            style={{
                                background: "linear-gradient(145deg, #F5A623, #D4911A)",
                                color: "#08080E",
                                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 16px rgba(245,158,11,0.3)",
                            }}>
                            <span className="material-symbols-outlined text-base">add</span>
                            Create Session
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-hidden" style={clay.list}>
                        {/* Top edge highlight */}
                        <div className="absolute top-0 left-0 right-0 h-px relative"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }} />

                        {filtered.map((item, i) => {
                            const cfg = typeConfig[item.type] ?? typeConfig.summary;
                            const count = getItemCount(item);
                            return (
                                <button key={item.id} onClick={() => handleOpen(item)}
                                    className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 transition-all hover:bg-white/[0.015] group text-left"
                                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>

                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: `${cfg.color}08`,
                                            boxShadow: `inset 0 1px 2px ${cfg.color}10, 0 2px 6px rgba(0,0,0,0.1)`,
                                        }}>
                                        <span className="material-symbols-outlined text-lg" style={{ color: `${cfg.color}CC` }}>{cfg.icon}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[13px] font-semibold text-white/65 truncate group-hover:text-white/85 transition-colors">
                                                {item.title || "Untitled"}
                                            </span>
                                            <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md flex-shrink-0"
                                                style={{ background: `${cfg.color}10`, color: `${cfg.color}99` }}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-white/15">
                                            {count && <span>{count}</span>}
                                            {count && <span className="text-white/8">·</span>}
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <span className="material-symbols-outlined text-base text-white/8 group-hover:text-white/25 group-hover:translate-x-0.5 transition-all flex-shrink-0">
                                        chevron_right
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
