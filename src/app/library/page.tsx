
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
    const { user } = useUser();
    const router = useRouter();
    const [generations, setGenerations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const filters = [
        { id: "all", label: "All" },
        { id: "flashcards", label: "Flashcards" },
        { id: "quiz", label: "Quizzes" },
        { id: "roadmap", label: "Roadmaps" },
        { id: "summary", label: "Summaries" },
    ];

    useEffect(() => {
        const fetchLibrary = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setGenerations(data);
            }
            setLoading(false);
        };

        if (user.id) {
            fetchLibrary();
        }
    }, [user.id]);

    const filtered = filter === "all" ? generations : generations.filter(g => g.type === filter);

    const handleOpen = (item: any) => {
        // Store in session (legacy support) or navigating to a detail page
        // ideally we navigate to /library/[id] but for now let's reuse existing pages by hydration
        if (item.type === "flashcards") {
            sessionStorage.setItem("flashcards_data", JSON.stringify(item.content));
            router.push("/flashcards");
        } else if (item.type === "quiz") {
            sessionStorage.setItem("quiz_data", JSON.stringify(item.content));
            router.push("/quiz");
        } else if (item.type === "roadmap") {
            sessionStorage.setItem("roadmap_data", JSON.stringify(item.content));
            router.push("/professor?mode=roadmap");
        }
        // TODO: Support others
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--accent)] text-xl">library_books</span>
                    </div>
                    <div>
                        <h1 className="text-base font-medium text-[var(--foreground)]">Library</h1>
                        <p className="text-xs text-[var(--foreground-secondary)]">Your generated knowledge</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--background-tertiary)]'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-4xl text-[var(--foreground-muted)]">progress_activity</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--background-tertiary)] flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-[var(--foreground-muted)]">inbox</span>
                        </div>
                        <h3 className="text-lg font-medium text-[var(--foreground)]">No items found</h3>
                        <p className="text-[var(--foreground-secondary)] mb-6">Create something new to populate your library.</p>
                        <button onClick={() => router.push("/create")} className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90">
                            Create New
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleOpen(item)}
                                className="text-left group relative p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/5"
                            >
                                <div className="absolute top-4 right-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${item.type === 'flashcards' ? 'bg-orange-100 text-orange-600' :
                                            item.type === 'quiz' ? 'bg-teal-100 text-teal-600' :
                                                item.type === 'roadmap' ? 'bg-indigo-100 text-indigo-600' :
                                                    'bg-purple-100 text-purple-600'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                                    {item.title || "Untitled Generation"}
                                </h3>
                                <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-2">
                                    {(item.content?.flashcards?.[0]?.front) || (item.content?.questions?.[0]?.question) || "Content preview unavailable..."}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
