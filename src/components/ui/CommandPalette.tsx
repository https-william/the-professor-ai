"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, Zap, Flame, Home, Layers, X, PlusCircle } from "lucide-react";

type Action = {
    id: string;
    label: string;
    icon: any;
    shortcut?: string;
    onSelect: () => void;
    category: string;
};

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const actions: Action[] = [
        { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "G D", category: "Navigation", onSelect: () => router.push("/dashboard") },
        { id: "create", label: "Create Studio", icon: PlusCircle, shortcut: "G C", category: "Navigation", onSelect: () => router.push("/create") },
        { id: "match", label: "Match Game", icon: Zap, category: "Navigation", onSelect: () => router.push("/match") },
        { id: "flashcards", label: "Review Flashcards", icon: Layers, category: "Actions", onSelect: () => router.push("/review") },
    ];

    const filteredActions = query === "" 
        ? actions 
        : actions.filter(action => action.label.toLowerCase().includes(query.toLowerCase()));

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100000] flex items-start justify-center pt-[15vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-3 border-b border-[var(--border)]">
                            <Search className="text-[var(--foreground-muted)] mr-3" size={20} />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Type a command or search..."
                                className="flex-1 bg-transparent border-none outline-none text-base text-[var(--foreground)] placeholder-[var(--foreground-muted)]"
                            />
                            <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded-md bg-[var(--background-secondary)] border border-[var(--border)] text-[9px] font-mono text-[var(--foreground-muted)]">ESC</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {filteredActions.length === 0 ? (
                                <div className="py-14 text-center text-[var(--foreground-muted)]">
                                    <p className="text-sm">No results found.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredActions.map((action, index) => (
                                        <button
                                            key={action.id}
                                            onClick={() => { action.onSelect(); setOpen(false); }}
                                            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[var(--background-secondary)] text-left transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--foreground)]/5 flex items-center justify-center group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)] transition-colors">
                                                    <action.icon size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{action.label}</span>
                                            </div>
                                            {action.shortcut && (
                                                <span className="text-xs text-[var(--foreground-muted)] font-mono">{action.shortcut}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
