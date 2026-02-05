"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/ui/Skeleton";

interface HistoryItem {
    id: string;
    title: string;
    type: "flashcards" | "quiz" | "summary" | "lecture" | "mindmap";
    count: number;
    subject: string;
    createdAt: string;
    preview?: string;
}

const typeConfig = {
    flashcards: { icon: "style", label: "Flashcards", color: "accent" },
    quiz: { icon: "quiz", label: "Quiz", color: "secondary" },
    summary: { icon: "summarize", label: "Summary", color: "warning" },
    lecture: { icon: "mic", label: "Lecture", color: "info" },
    mindmap: { icon: "hub", label: "Mind Map", color: "success" },
};

const initialHistory: HistoryItem[] = [
    { id: "1", title: "Cell Division & Mitosis", type: "flashcards", count: 24, subject: "Biology", createdAt: "2h ago", preview: "Mitosis is the process of cell division..." },
    { id: "2", title: "Newton's Laws Practice", type: "quiz", count: 15, subject: "Physics", createdAt: "5h ago", preview: "Test your knowledge on Newton's three laws" },
    { id: "3", title: "Organic Chemistry Basics", type: "summary", count: 3, subject: "Chemistry", createdAt: "1d ago", preview: "Key concepts: functional groups, bonding..." },
    { id: "4", title: "Thermodynamics Lecture", type: "lecture", count: 45, subject: "Physics", createdAt: "2d ago", preview: "Understanding heat transfer and energy" },
    { id: "5", title: "DNA Replication Map", type: "mindmap", count: 12, subject: "Biology", createdAt: "3d ago", preview: "Visual connections between replication steps" },
    { id: "6", title: "Chemical Bonding", type: "flashcards", count: 36, subject: "Chemistry", createdAt: "4d ago", preview: "Ionic, covalent, and metallic bonds" },
];

const filters = [
    { id: "all", label: "All", icon: "apps" },
    { id: "flashcards", label: "Flashcards", icon: "style" },
    { id: "quiz", label: "Quizzes", icon: "quiz" },
    { id: "summary", label: "Summaries", icon: "summarize" },
    { id: "lecture", label: "Lectures", icon: "mic" },
    { id: "mindmap", label: "Mind Maps", icon: "hub" },
];

export default function HistoryPage() {
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHistory(initialHistory);
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const filteredHistory = history
        .filter(item =>
            (activeFilter === "all" || item.type === activeFilter) &&
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Ambient Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="blob blob-teal absolute w-[500px] h-[500px] top-[20%] right-[10%] animate-float" />
                <div className="blob blob-coral absolute w-[300px] h-[300px] bottom-[30%] left-[5%]" style={{ animationDelay: "2s" }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-xl">history</span>
                    </div>
                    <div>
                        <h1 className="text-base font-medium text-[var(--foreground)]">History</h1>
                        <p className="text-xs text-[var(--foreground-secondary)]">
                            {loading ? "Loading..." : `${filteredHistory.length} generated items`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                        title={resolvedTheme === "light" ? "Switch to dark" : "Switch to light"}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                        </span>
                    </button>

                    {/* Search */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--foreground-muted)] text-lg">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search history..."
                            className="w-64 pl-10 pr-4 py-2.5 bg-[var(--card)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)]"
                        />
                    </div>

                    {/* New Button */}
                    <Link
                        href="/create"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-dark)] transition-all shadow-md"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Create
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
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="group relative p-5 rounded-2xl card cursor-pointer animate-fade-in-up"
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
                                        <span className="text-[10px] text-[var(--foreground-muted)]">{item.subject} · {item.createdAt}</span>
                                        <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all">
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            Open
                                        </button>
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
