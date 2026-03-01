"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";

interface HistoryItem {
    id: string;
    title: string;
    type: "flashcards" | "quiz" | "summary" | "podcast" | "mindmap";
    count: number;
    createdAt: string;
    preview?: string;
    content?: any;
}

const typeConfig = {
    flashcards: { icon: "style", label: "Flashcards", color: "accent" },
    quiz: { icon: "quiz", label: "Quiz", color: "secondary" },
    summary: { icon: "summarize", label: "Summary", color: "warning" },
    podcast: { icon: "mic", label: "Podcast", color: "info" },
    mindmap: { icon: "hub", label: "Mind Map", color: "success" },
};

const filters = [
    { id: "all", label: "All", icon: "apps" },
    { id: "flashcards", label: "Flashcards", icon: "style" },
    { id: "quiz", label: "Quizzes", icon: "quiz" },
    { id: "summary", label: "Summaries", icon: "summarize" },
    { id: "podcast", label: "Podcasts", icon: "mic" },
    { id: "mindmap", label: "Mind Maps", icon: "hub" },
];

export default function HistoryPage() {
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user?.id) return;

        async function fetchHistory() {
            setLoading(true);
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to fetch history:", error);
            } else if (data) {
                const formatted = data.map((item: any): HistoryItem => {
                    let count = 0;
                    let preview = "Study material";

                    if (item.type === "flashcards" && item.content?.flashcards) {
                        count = item.content.flashcards.length;
                        preview = item.content.flashcards[0]?.front || preview;
                    } else if (item.type === "quiz" && item.content?.questions) {
                        count = item.content.questions.length;
                        preview = item.content.questions[0]?.question || preview;
                    } else if (item.type === "summary" && item.content?.summary) {
                        count = 1;
                        preview = item.content.summary.substring(0, 100) + "...";
                    } else if (item.type === "mindmap" && item.content?.branches) {
                        count = item.content.branches.length;
                        preview = item.content.branches[0]?.name || preview;
                    } else if (item.type === "podcast" && item.content?.summary) {
                        count = 1;
                        preview = item.content.summary;
                    }

                    return {
                        id: item.id,
                        title: item.title || "Untitled",
                        type: item.type === "lecture" ? "podcast" : item.type,
                        count,
                        createdAt: new Date(item.created_at).toLocaleDateString(),
                        preview,
                        content: item.content
                    };
                });
                setHistory(formatted);
            }
            setLoading(false);
        }

        fetchHistory();
    }, [user?.id]);

    const filteredHistory = history
        .filter(item =>
            (activeFilter === "all" || item.type === activeFilter) &&
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
        const { error } = await supabase.from("generations").delete().eq("id", id);
        if (error) console.error("Failed to delete generation:", error);
    };

    const handleOpen = (item: HistoryItem) => {
        if (!item.content) return;
        if (item.type === "flashcards") {
            sessionStorage.setItem("generatedContent", JSON.stringify({ type: "flashcards", data: item.content.flashcards, title: item.title }));
            router.push("/flashcards");
        } else if (item.type === "quiz") {
            sessionStorage.setItem("quiz_data", JSON.stringify(item.content));
            router.push("/quiz");
        } else if (item.type === "podcast") {
            sessionStorage.setItem("podcastData", JSON.stringify({ podcast: { script: item.content?.data?.script || [], title: item.title }, title: item.title }));
            router.push("/podcast");
        } else if (item.type === "summary") {
            sessionStorage.setItem("summaryData", JSON.stringify({ summary: item.content.summary, title: item.title }));
            router.push("/create?view=summary");
        } else if (item.type === "mindmap") {
            sessionStorage.setItem("mindmapData", JSON.stringify(item.content));
            router.push("/create?view=mindmap");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="blob blob-teal absolute w-[500px] h-[500px] top-[20%] right-[10%] animate-float" />
                <div className="blob blob-coral absolute w-[300px] h-[300px] bottom-[30%] left-[5%]" style={{ animationDelay: "2s" }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-lg">history</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)]">History</h1>
                        <p className="text-[10px] text-[var(--foreground-secondary)] hidden sm:block">
                            {loading ? "Loading..." : `${filteredHistory.length} items`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Search — full on desktop, icon-toggle on mobile */}
                    <div className="relative">
                        {showSearch ? (
                            <div className="flex items-center gap-1">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-40 sm:w-52 pl-3 pr-3 py-2 bg-[var(--card)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--foreground-muted)] border border-[var(--border)] focus:outline-none"
                                />
                                <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowSearch(true)} className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all">
                                <span className="material-symbols-outlined text-lg">search</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all hidden sm:flex"
                    >
                        <span className="material-symbols-outlined text-lg">{resolvedTheme === "light" ? "dark_mode" : "light_mode"}</span>
                    </button>

                    <Link
                        href="/create"
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl bg-[var(--accent)] text-[#08080E] text-xs font-bold hover:bg-[var(--accent-dark)] transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span className="hidden sm:inline">Create</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Filter Pills */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter.id
                                ? "bg-[var(--accent)] text-white shadow-md"
                                : "bg-[var(--card)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{filter.icon}</span>
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* History Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-44 rounded-2xl" />
                        ))}
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredHistory.map((item, index) => {
                            const config = typeConfig[item.type];
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleOpen(item)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="group relative p-5 rounded-2xl card cursor-pointer animate-fade-in-up hover:border-[var(--accent)]/30 transition-all"
                                >
                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>

                                    {/* Type Badge */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--${config.color})]/10 text-[var(--${config.color})]`}>
                                            <span className="material-symbols-outlined text-xl">{config.icon}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-[var(--foreground)]">{config.label}</span>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">{item.count} items</p>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-[var(--foreground)] font-medium mb-1 line-clamp-1">{item.title}</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] mb-4 line-clamp-2">{item.preview}</p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                                        <span className="text-[10px] text-[var(--foreground-muted)]">{item.createdAt}</span>
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-all">
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            Open
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-3xl bg-[var(--background-tertiary)] flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-[var(--foreground-muted)] text-4xl">history</span>
                        </div>
                        <h3 className="text-lg font-medium text-[var(--foreground-secondary)] mb-2">No history yet</h3>
                        <p className="text-sm text-[var(--foreground-muted)] mb-6">
                            {searchQuery ? `No results for "${searchQuery}"` : "Create your first study material to see it here"}
                        </p>
                        <Link
                            href="/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-dark)] transition-colors shadow-md"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Create Something
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
