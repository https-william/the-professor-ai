
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

const typeConfig: Record<string, { icon: string; label: string; badgeCls: string }> = {
    flashcards: { icon: "style", label: "Flashcards", badgeCls: "bg-[var(--accent)]/15 text-[var(--accent)]" },
    quiz: { icon: "quiz", label: "Quiz", badgeCls: "bg-[var(--secondary)]/15 text-[var(--secondary)]" },
    summary: { icon: "summarize", label: "Summary", badgeCls: "bg-blue-500/15 text-blue-400" },
    mindmap: { icon: "hub", label: "Mind Map", badgeCls: "bg-orange-500/15 text-orange-400" },
};

const filters = [
    { id: "all", label: "All", icon: "apps" },
    { id: "flashcards", label: "Flashcards", icon: "style" },
    { id: "quiz", label: "Quizzes", icon: "quiz" },
    { id: "summary", label: "Summaries", icon: "summarize" },
    { id: "mindmap", label: "Mind Maps", icon: "hub" },
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
        } else if (item.type === "mindmap") {
            sessionStorage.setItem("mindmapData", JSON.stringify(item.content));
            router.push("/create?view=mindmap");
        }
    };

    const getPreview = (item: any): string => {
        if (item.content?.flashcards?.[0]?.front) return item.content.flashcards[0].front;
        if (item.content?.questions?.[0]?.question) return item.content.questions[0].question;
        if (item.content?.summary) return item.content.summary.substring(0, 120) + "...";
        if (item.content?.data?.script?.[0]?.text) return item.content.data.script[0].text;
        if (item.content?.branches?.[0]?.label) return item.content.branches.map((b: any) => b.label).join(", ");
        return "Study material";
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-lg">library_books</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold">Library</h1>
                        <p className="text-[10px] text-[var(--foreground-muted)] hidden sm:block">Your generated knowledge</p>
                    </div>
                </div>
                <Link
                    href="/create"
                    className="flex items-center gap-1 px-2.5 sm:px-4 py-2 rounded-xl bg-[var(--accent)] text-[#08080E] text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span className="hidden sm:inline">Create</span>
                </Link>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Filter Pills */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === f.id
                                    ? "bg-[var(--accent)] text-[#08080E] shadow-sm"
                                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                                }`}
                        >
                            <span className="material-symbols-outlined text-xs">{f.icon}</span>
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-3xl bg-[var(--background-tertiary)] flex items-center justify-center mx-auto mb-5">
                            <span className="material-symbols-outlined text-4xl text-[var(--foreground-muted)]">library_books</span>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Nothing here yet</h3>
                        <p className="text-sm text-[var(--foreground-muted)] mb-6">
                            {filter !== "all" ? "No items match this filter." : "Generate study materials to build your library."}
                        </p>
                        <Link
                            href="/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[#08080E] text-sm font-bold hover:opacity-90 shadow-md"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Start Creating
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filtered.map((item) => {
                            const cfg = typeConfig[item.type] ?? typeConfig.summary;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleOpen(item)}
                                    className="text-left group p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all hover:shadow-lg hover:shadow-[var(--accent)]/5"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.badgeCls}`}>
                                                <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                                        {item.title || "Untitled"}
                                    </h3>
                                    <p className="text-xs text-[var(--foreground-secondary)] mb-4 line-clamp-2">
                                        {getPreview(item)}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)]">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all">
                                            Open <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
