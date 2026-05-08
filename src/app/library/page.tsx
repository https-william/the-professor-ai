"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import ProfessorEmptyState from "@/components/ui/ProfessorEmptyState";
import { generateLibraryExportHTML } from "@/lib/export-utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppMode } from "@/components/ui/SiteHeader";
import { 
    Library, 
    Plus, 
    Layers, 
    HelpCircle, 
    FileText, 
    LayoutGrid, 
    BellRing, 
    Filter, 
    Search, 
    X, 
    Tag, 
    Check, 
    FileDown, 
    Trash2,
    Loader2 
} from "lucide-react";

/* ═══ Claymorphic Helpers ═══ */
/* ═══ Claymorphic Helpers ═══ */
const clay = {
    card: {
        background: "var(--card)",
        borderRadius: "24px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
    } as React.CSSProperties,
    pill: {
        background: "var(--background-secondary)",
        borderRadius: "14px",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)",
    } as React.CSSProperties,
    list: {
        background: "var(--card)",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
    } as React.CSSProperties,
};

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    flashcards: { icon: Layers, label: "Flashcards", color: "#F59E0B" },
    quiz: { icon: HelpCircle, label: "Quiz", color: "#818CF8" },
    summary: { icon: FileText, label: "Summary", color: "#6366F1" },
};

const filters = [
    { id: "all", label: "All", icon: LayoutGrid },
    { id: "due", label: "Due Today", icon: BellRing },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "quiz", label: "Quizzes", icon: HelpCircle },
    { id: "summary", label: "Summaries", icon: FileText },
];

export default function LibraryPage() {
    const { user } = useUser();
    const router = useRouter();
    const [generations, setGenerations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [dueIds, setDueIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    
    // Multi-selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleModeChange = (mode: AppMode) => {
        if (mode === "CREATE") router.push("/dashboard?mode=create");
        if (mode === "HUB") router.push("/hub");
    };

    useEffect(() => {
        if (!user.id) return;
        const fetchLibrary = async () => {
            setLoading(true);
            const supabase = createClient();
            
            // Query with explicit nocache/revalidate behavior
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setGenerations(data);
                console.log(`Fetched ${data.length} scholarly records.`);
            } else if (error) {
                console.error("Library sync failure:", error.message);
            }
            
            // Fetch due card info
            try {
                const res = await fetch("/api/user/due-cards");
                if (res.ok) {
                    const dueData = await res.json();
                    const ids = new Set<string>(dueData.decks.map((d: any) => d.generationId as string));
                    setDueIds(ids);
                }
            } catch (err) {
                console.error("Failed to fetch due IDs:", err);
            }
            
            setLoading(false);
        };
        fetchLibrary();
    }, [user.id, router]); // Refresh on navigation to catch new generations

    const filtered = filter === "all" 
        ? generations 
        : filter === "due"
            ? generations.filter(g => dueIds.has(g.id))
            : generations.filter(g => g.type === filter);

    // Apply search filter
    const searchFiltered = searchQuery.trim()
        ? filtered.filter(item => {
            const query = searchQuery.toLowerCase();
            const title = (item.title || "").toLowerCase();
            const type = item.type.toLowerCase();
            
            // Smart Category matching (e.g., "type:flashcards history")
            if (query.includes("type:")) {
                const parts = query.split(" ");
                const typeQuery = parts.find(p => p.startsWith("type:"))?.replace("type:", "");
                const textQuery = parts.filter(p => !p.startsWith("type:")).join(" ");
                
                const typeMatch = typeQuery ? type.includes(typeQuery) : true;
                const textMatch = textQuery ? title.includes(textQuery) : true;
                return typeMatch && textMatch;
            }

            return title.includes(query) || type.includes(query);
        })
        : filtered;

    const handleOpen = (item: any) => {
        if (isSelectionMode) {
            toggleSelection(item.id);
            return;
        }

        if (item.type === "flashcards") {
            router.push(`/flashcards?id=${item.id}`);
        } else if (item.type === "quiz") {
            router.push(`/quiz?id=${item.id}`);
        } else if (item.type === "summary") {
            router.push(`/summary?id=${item.id}`);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= 10) return prev; // Maximum of 10 limit
            return [...prev, id];
        });
        if (!isSelectionMode) setIsSelectionMode(true);
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`);
        if (!confirmed) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/api/library/batch", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            });
            if (res.ok) {
                setGenerations(prev => prev.filter(g => !selectedIds.includes(g.id)));
                setSelectedIds([]);
                setIsSelectionMode(false);
            }
        } catch (error) {
            console.error("Batch delete failed", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchExport = () => {
        if (selectedIds.length === 0) return;
        const itemsToExport = generations.filter(g => selectedIds.includes(g.id));
        const html = generateLibraryExportHTML(itemsToExport);
        
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const exitSelectionMode = () => {
        setSelectedIds([]);
        setIsSelectionMode(false);
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
        <div className="min-h-[100dvh] bg-transparent text-[var(--foreground)] pb-28 relative overflow-hidden">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
                    style={{ top: "-20%", left: "-15%", background: "radial-gradient(circle, var(--foreground-muted), transparent 60%)", opacity: 0.03, filter: "blur(80px)", animationDuration: "7s" }} />
                <div className="absolute w-[400px] h-[400px] rounded-full animate-pulse"
                    style={{ bottom: "10%", right: "-10%", background: "radial-gradient(circle, var(--foreground-muted), transparent 60%)", opacity: 0.02, filter: "blur(70px)", animationDuration: "9s" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-24">
                {/* Header Scroll Sentinel */}
                <div data-header-sentinel className="absolute top-0 left-0 h-1 w-full pointer-events-none" />

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: "var(--background-secondary)",
                                    boxShadow: "var(--shadow-sm)",
                                    border: "1px solid var(--border)",
                                }}>
                                <Library size={20} strokeWidth={1.5} className="text-[var(--foreground)]" />
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--text-3)]">My Library</span>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-[44px] font-bold italic text-[var(--foreground)] tracking-tight mb-2 leading-tight">
                            Your Study Vault
                        </h1>
                        <p className="text-[11px] text-[var(--foreground-muted)] font-black uppercase tracking-[0.2em] opacity-70">Preserving scholarly progress in real-time.</p>
                    </div>
                    <Link href="/create"
                        className="flex items-center gap-1.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-[var(--foreground)] text-[var(--background)] transition-all active:scale-[0.98] shadow-xl"
                    >
                        <Plus size={14} strokeWidth={2} />
                        Create
                    </Link>
                </div>

                {/* ═══ Stats — Bento Row ═══ */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { label: "Flashcard Sets", count: flashcardCount, icon: Layers },
                        { label: "Quizzes", count: quizCount, icon: HelpCircle },
                        { label: "Summaries", count: summaryCount, icon: FileText },
                    ].map((s) => (
                        <div key={s.label} className="text-center p-6 transition-all duration-300 hover:translate-y-[-2px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-sm">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-[var(--foreground)]/[0.03] border border-[var(--border)] shadow-sm">
                                <s.icon size={18} strokeWidth={2} className="text-[var(--foreground)]" />
                            </div>
                            <div className="text-3xl font-black text-[var(--foreground)] leading-none">{s.count}</div>
                            <div className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-widest opacity-70 mt-2">{s.label}</div>
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
                                    border: "1px solid var(--border)",
                                    color: "var(--text-3)",
                                }),
                            }}>
                            <f.icon size={13} strokeWidth={1.5} />
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" 
                        style={{ color: searchQuery ? "#F59E0B" : "var(--text-3)" }}>
                        {searchQuery.includes("type:") ? <Filter size={18} strokeWidth={1.5} /> : <Search size={18} strokeWidth={1.5} />}
                    </div>
                    <input
                        type="text"
                        placeholder='Search "type:quiz history" or "biology"...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearch(true)}
                        className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[#F59E0B]/30 focus:bg-[var(--bg-2)] transition-all"
                        style={{ 
                            boxShadow: searchQuery ? "0 0 20px rgba(245,158,11,0.05), inset 0 1px 2px rgba(0,0,0,0.2)" : "inset 0 1px 2px rgba(0,0,0,0.1)",
                        }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-white/50 hover:bg-[var(--bg-2)] transition-all"
                                title="Clear search"
                            >
                                <X size={16} strokeWidth={1.5} />
                            </button>
                        )}
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button 
                            onClick={() => setSearchQuery(prev => prev.includes("type:") ? "" : "type:")}
                            className={`p-1.5 rounded-lg transition-all ${searchQuery.includes("type:") ? "text-[#F59E0B] bg-[#F59E0B]/10" : "text-[var(--text-3)] hover:text-[var(--text-3)]"}`}
                            title="Filter by type"
                        >
                            <Tag size={18} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* ═══ Content ═══ */}
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />
                        ))}
                    </div>
                ) : searchFiltered.length === 0 ? (
                    <ProfessorEmptyState 
                        type={searchQuery ? "search" : filter !== "all" ? filter === "flashcards" ? "flashcards" : filter === "quiz" ? "quizzes" : "summaries" : "library"}
                        actionLabel="Start Creating"
                        actionHref="/create"
                    />
                ) : (
                    <div className="overflow-hidden" style={clay.list}>
                        {/* Top edge highlight */}
                        <div className="absolute top-0 left-0 right-0 h-px relative"
                            style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)" }} />

                        {searchFiltered.map((item, i) => {
                            const cfg = typeConfig[item.type] ?? typeConfig.summary;
                            const count = getItemCount(item);
                            const isSelected = selectedIds.includes(item.id);

                            return (
                                <div key={item.id} className="relative flex items-center group">
                                    {/* Selection Toggle Mask (Long press or tap in selection mode) */}
                                    <button 
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            toggleSelection(item.id);
                                        }}
                                        onClick={() => handleOpen(item)}
                                        className="flex-1 flex items-center gap-4 px-5 sm:px-6 py-4 transition-all hover:bg-[var(--bg-2)] text-left outline-none"
                                        style={{ borderBottom: i < searchFiltered.length - 1 ? "1px solid var(--border)" : "none" }}>

                                        {/* Selection Indicator */}
                                        <AnimatePresence>
                                            {isSelectionMode && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    className="w-5 h-5 rounded-lg border-2 border-[var(--border)] flex items-center justify-center mr-1"
                                                    style={{ 
                                                        borderColor: isSelected ? "#F59E0B" : "rgba(255,255,255,0.1)",
                                                        background: isSelected ? "#F59E0B" : "transparent"
                                                    }}
                                                >
                                                    {isSelected && <Check size={14} strokeWidth={2.5} className="text-[#06060B]" />}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: isSelected ? "#F59E0B20" : `${cfg.color}08`,
                                                boxShadow: isSelected 
                                                    ? `0 0 15px #F59E0B30` 
                                                    : `inset 0 1px 2px ${cfg.color}10, 0 2px 6px rgba(0,0,0,0.1)`,
                                                border: isSelected ? `1px solid #F59E0B40` : "1px solid transparent",
                                                transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)"
                                            }}>
                                            <cfg.icon size={18} strokeWidth={1.5} style={{ color: isSelected ? "#F59E0B" : `${cfg.color}CC` }} />
                                        </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[14px] font-bold text-[var(--foreground)] truncate group-hover:opacity-70 transition-opacity">
                                                {item.title || "Untitled Scholarly Work"}
                                            </span>
                                            <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md flex-shrink-0"
                                                style={{ background: "var(--foreground-muted)", color: "var(--background)", opacity: 0.15 }}>
                                                {cfg.label}
                                            </span>
                                            {dueIds.has(item.id) && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#F59E0B] text-[#06060B] shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse">
                                                    DUE
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-3)]">
                                            {count && <span>{count}</span>}
                                            {count && <span className="text-[var(--text-3)]">·</span>}
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══ Batch Action Bar — Floating Claymorphic ═══ */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-40px)] max-w-lg"
                    >
                        <div className="bg-[var(--card)] backdrop-blur-2xl border border-[var(--border)] rounded-[28px] p-4 flex items-center justify-between shadow-2xl overflow-hidden relative">
                            {/* Accent Glow */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--foreground)]/10 to-transparent" />
                            
                            <div className="flex items-center gap-3 pl-2">
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-black text-[var(--foreground)] leading-none uppercase tracking-widest">{selectedIds.length} Selected</span>
                                    <span className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-tighter mt-1">{selectedIds.length === 10 ? "Capacity Reached" : "Batch Processing Locked"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={handleBatchExport}
                                    className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-white/10 text-white/50 hover:text-white transition-all">
                                    <FileDown size={20} strokeWidth={1.5} />
                                </button>
                                <button onClick={handleBatchDelete} disabled={isProcessing}
                                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all disabled:opacity-50">
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} strokeWidth={1.5} />}
                                </button>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button onClick={exitSelectionMode}
                                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-white/10 text-[var(--text-3)]0 text-[12px] font-bold transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
