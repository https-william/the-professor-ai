"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { generateLibraryExportHTML } from "@/lib/export-utils";

import ProfessorEmptyState from "@/components/ui/ProfessorEmptyState";
import GuestSignupModal from "@/components/ui/GuestSignupModal";
import StandardContainer from "@/components/ui/StandardContainer";
import SEOHead, { getWebApplicationSchema } from "@/components/SEOHead";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
    Loader2,
    WifiOff,
    Cloud,
    BookOpen,
    ExternalLink,
    Clock,
    Zap,
    Sparkles
} from "lucide-react";

/* ═══ Flat 2.0 Design Tokens & Helpers ═══ */
const flat20 = {
    card: {
        background: "var(--card)",
        borderRadius: "28px",
        border: "2px solid var(--border)",
        boxShadow: "var(--shadow-md)",
    } as React.CSSProperties,
    pill: {
        background: "var(--background-secondary)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.1)",
    } as React.CSSProperties,
    listContainer: {
        background: "var(--card)",
        borderRadius: "28px",
        border: "2px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
    } as React.CSSProperties,
};

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    flashcards: { icon: Layers, label: "Flashcards", color: "#F59E0B" },
    quiz: { icon: HelpCircle, label: "Quiz", color: "#818CF8" },
    summary: { icon: FileText, label: "Summary", color: "#6366F1" },
    exam_sprint: { icon: BookOpen, label: "Exam Sprint", color: "#10B981" },
};

const filters = [
    { id: "all", label: "All", icon: LayoutGrid },
    { id: "exam_sprint", label: "Exam Sprints", icon: BookOpen },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "quiz", label: "Quizzes", icon: HelpCircle },
    { id: "summary", label: "Summaries", icon: FileText },
];

interface LibraryItem {
    id: string;
    title: string;
    type: string;
    created_at: string;
    content?: any;
    phases_data?: any;
    source_text?: string;
    isOffline?: boolean;
    savedAt?: number;
}

export default function LibraryPage() {
    const { user } = useUser();
    const router = useRouter();
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [offlineItems, setOfflineItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [dueIds, setDueIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    
    // View mode toggle: Cloud History vs Offline Vault
    const [isOfflineView, setIsOfflineView] = useState(false);

    // Multi-selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);

    // Offline auto-fallback detection
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!navigator.onLine) {
                router.push("/library/offline");
            }

            const handleOffline = () => {
                router.push("/library/offline");
            };

            window.addEventListener("offline", handleOffline);
            return () => window.removeEventListener("offline", handleOffline);
        }
    }, [router]);

    useEffect(() => {
        if (typeof window !== "undefined" && !user.isAuthenticated && !user.isLoading) {
            const isGuest = sessionStorage.getItem("shared_view") === "true";
            if (isGuest) {
                setShowGuestModal(true);
            }
        }
    }, [user.isAuthenticated, user.isLoading]);

    // Load Offline Vault items from localStorage
    useEffect(() => {
        try {
            const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
            const packsArray = Object.values(packsObj).map((p: any) => ({
                id: p.id,
                title: p.title || "Untitled Study Pack",
                type: "exam_sprint",
                created_at: new Date(p.savedAt || Date.now()).toISOString(),
                phases_data: p.phases_data,
                source_text: p.source_text,
                isOffline: true,
                savedAt: p.savedAt
            }));
            packsArray.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
            setOfflineItems(packsArray);
        } catch (err) {
            console.error("Failed to load offline items:", err);
        }
    }, []);

    // Parallel optimized fetching for Cloud History & Stats
    useEffect(() => {
        if (!user.id) return;
        const fetchLibrary = async () => {
            const cacheKey = `prof_cached_lib_${user.id}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setItems(parsed);
                    setLoading(false); // Instantly render cached items in 0ms!
                } catch (e) {}
            } else {
                setLoading(true);
            }

            const supabase = createClient();
            
            try {
                // Fetch generations, study packs, and due cards in parallel
                const [genRes, packRes, dueRes] = await Promise.all([
                    supabase
                        .from("generations")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false }),
                    supabase
                        .from("study_packs")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false }),
                    fetch("/api/user/due-cards").catch(() => null)
                ]);

                const combined: LibraryItem[] = [];

                if (genRes.data) {
                    combined.push(...genRes.data);
                }
                if (packRes.data) {
                    const packsAsItems = packRes.data.map((p: any) => ({
                        id: p.id,
                        title: p.title || "Untitled Exam Sprint",
                        type: "exam_sprint",
                        created_at: p.created_at,
                        phases_data: p.phases_data,
                        source_text: p.source_text
                    }));
                    combined.push(...packsAsItems);
                }

                // Sort combined by created_at descending
                combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setItems(combined);
                localStorage.setItem(cacheKey, JSON.stringify(combined));

                if (dueRes && dueRes.ok) {
                    const dueData = await dueRes.json();
                    const ids = new Set<string>(dueData.decks.map((d: any) => d.generationId as string));
                    setDueIds(ids);
                }
            } catch (err) {
                console.error("Library sync failure:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, [user.id]);

    const activeItems = isOfflineView ? offlineItems : items;

    const filtered = filter === "all" 
        ? activeItems 
        : filter === "due"
            ? activeItems.filter(g => dueIds.has(g.id))
            : activeItems.filter(g => g.type === filter);

    // Apply search filter
    const searchFiltered = searchQuery.trim()
        ? filtered.filter(item => {
            const query = searchQuery.toLowerCase();
            const title = (item.title || "").toLowerCase();
            const type = item.type.toLowerCase();
            const source = (item.source_text || "").toLowerCase();
            
            if (query.includes("type:")) {
                const parts = query.split(" ");
                const typeQuery = parts.find(p => p.startsWith("type:"))?.replace("type:", "");
                const textQuery = parts.filter(p => !p.startsWith("type:")).join(" ");
                
                const typeMatch = typeQuery ? type.includes(typeQuery) : true;
                const textMatch = textQuery ? title.includes(textQuery) || source.includes(textQuery) : true;
                return typeMatch && textMatch;
            }

            return title.includes(query) || type.includes(query) || source.includes(query);
        })
        : filtered;

    const handleOpen = (item: LibraryItem) => {
        if (isSelectionMode) {
            toggleSelection(item.id);
            return;
        }

        if (item.isOffline) {
            router.push(`/library/pack/${item.id}`);
            return;
        }

        if (item.type === "exam_sprint") {
            router.push(`/library/pack/${item.id}`);
        } else if (item.type === "flashcards") {
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
            if (isOfflineView) {
                const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                selectedIds.forEach(id => delete packsObj[id]);
                localStorage.setItem("offline_study_packs", JSON.stringify(packsObj));
                setOfflineItems(prev => prev.filter(g => !selectedIds.includes(g.id)));
                setSelectedIds([]);
                setIsSelectionMode(false);
            } else {
                const res = await fetch("/api/library/batch", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: selectedIds }),
                });
                if (res.ok) {
                    setItems(prev => prev.filter(g => !selectedIds.includes(g.id)));
                    setSelectedIds([]);
                    setIsSelectionMode(false);
                }
            }
        } catch (error) {
            console.error("Batch delete failed", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchExport = () => {
        if (selectedIds.length === 0) return;
        const itemsToExport = activeItems.filter(g => selectedIds.includes(g.id));
        const html = generateLibraryExportHTML(itemsToExport as any);
        
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

    const getItemCount = (item: LibraryItem): string => {
        if (item.type === "exam_sprint") {
            const completedCount = Object.keys(item.phases_data || {}).length;
            return `${completedCount} / 4 Phases`;
        }
        if (item.content?.flashcards) return `${item.content.flashcards.length} cards`;
        if (item.content?.questions) return `${item.content.questions.length} questions`;
        return "";
    };

    const flashcardCount = items.filter(g => g.type === "flashcards").length;
    const quizCount = items.filter(g => g.type === "quiz").length;
    const summaryCount = items.filter(g => g.type === "summary").length;
    const sprintCount = items.filter(g => g.type === "exam_sprint").length;

    return (
        <StandardContainer className="min-h-[100dvh] bg-transparent text-[var(--foreground)] pb-28 relative overflow-hidden py-12">
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />

            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
                    style={{ top: "-20%", left: "-15%", background: "radial-gradient(circle, var(--foreground-muted), transparent 60%)", opacity: 0.03, filter: "blur(80px)", animationDuration: "7s" }} />
                <div className="absolute w-[400px] h-[400px] rounded-full animate-pulse"
                    style={{ bottom: "10%", right: "-10%", background: "radial-gradient(circle, var(--foreground-muted), transparent 60%)", opacity: 0.02, filter: "blur(70px)", animationDuration: "9s" }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header & Offline Toggle Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                                <Library size={18} strokeWidth={2} className="text-[var(--foreground)]" />
                            </div>
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--foreground-muted)]">Unified Storage</span>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-black italic text-[var(--foreground)] tracking-tighter mb-1.5 leading-tight uppercase">
                            Your Study Vault.
                        </h1>
                        <p className="text-[11px] text-[var(--foreground-muted)] font-bold uppercase tracking-[0.2em] opacity-80">
                            {isOfflineView ? "Local Device Storage · Zero Latency" : "Real-time Cloud Synchronization"}
                        </p>
                    </div>

                    {/* Actions & Offline Toggle */}
                    <div className="flex flex-wrap items-center gap-3">
                        <ThemeToggle />
                        {/* Offline Toggle */}
                        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] shadow-inner">
                            <button
                                onClick={() => { setIsOfflineView(false); exitSelectionMode(); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${!isOfflineView ? "bg-[var(--foreground)] text-[var(--background)] shadow-md" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
                            >
                                <Cloud size={13} /> Cloud History
                            </button>
                            <button
                                onClick={() => { setIsOfflineView(true); exitSelectionMode(); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${isOfflineView ? "bg-[var(--emerald)] text-[var(--background)] shadow-md" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
                            >
                                <WifiOff size={13} /> Offline Vault ({offlineItems.length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ Stats — Flat 2.0 Bento Row ═══ */}
                {!isOfflineView && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {[
                            { label: "Exam Sprints", count: sprintCount, icon: BookOpen, color: "#10B981" },
                            { label: "Flashcards", count: flashcardCount, icon: Layers, color: "#F59E0B" },
                            { label: "Quizzes", count: quizCount, icon: HelpCircle, color: "#818CF8" },
                            { label: "Summaries", count: summaryCount, icon: FileText, color: "#6366F1" },
                        ].map((s) => (
                            <div key={s.label} className="p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--background)] border border-[var(--border)] shadow-inner" style={{ color: s.color }}>
                                        <s.icon size={16} strokeWidth={2} />
                                    </div>
                                    <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">Active</span>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-[var(--foreground)] leading-none tracking-tight mb-1">{s.count}</div>
                                    <div className="text-[9px] text-[var(--foreground-muted)] font-black uppercase tracking-widest opacity-80">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ Filter Pills — Flex Wrap ═══ */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {filters.map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm"
                            style={{
                                ...(filter === f.id ? {
                                    background: isOfflineView ? "var(--emerald)" : "var(--foreground)",
                                    color: "var(--background)",
                                    border: "1px solid transparent",
                                    transform: "translateY(-1px)",
                                } : {
                                    background: "var(--background-secondary)",
                                    color: "var(--foreground-muted)",
                                    border: "1px solid var(--border)",
                                }),
                            }}>
                            <f.icon size={14} strokeWidth={2} />
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-[var(--foreground-muted)]">
                        {searchQuery.includes("type:") ? <Filter size={16} strokeWidth={2} /> : <Search size={16} strokeWidth={2} />}
                    </div>
                    <input
                        type="text"
                        placeholder={isOfflineView ? "Search offline vault..." : 'Search "type:exam_sprint", "type:quiz history" or "biology"...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearch(true)}
                        className="w-full pl-11 pr-14 py-3.5 rounded-2xl text-xs font-medium bg-[var(--bg-2)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
                                title="Clear search"
                            >
                                <X size={15} strokeWidth={2} />
                            </button>
                        )}
                        <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
                        <button 
                            onClick={() => setSearchQuery(prev => prev.includes("type:") ? "" : "type:")}
                            className={`p-1.5 rounded-lg transition-all ${searchQuery.includes("type:") ? "text-[var(--background)] bg-[var(--foreground)]" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
                            title="Filter by type"
                        >
                            <Tag size={15} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* ═══ Content ═══ */}
                {loading && !isOfflineView ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-18 rounded-2xl animate-pulse bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm" />
                        ))}
                    </div>
                ) : searchFiltered.length === 0 ? (
                    <ProfessorEmptyState 
                        type={searchQuery ? "search" : filter !== "all" ? filter as any : isOfflineView ? "library" : "library"}
                        actionLabel={isOfflineView ? "Browse Cloud Library" : "Start Creating"}
                        actionHref={isOfflineView ? "/library" : "/create"}
                    />
                ) : (
                    <div className="space-y-2.5">
                        {searchFiltered.map((item) => {
                            const cfg = typeConfig[item.type] ?? typeConfig.summary;
                            const count = getItemCount(item);
                            const isSelected = selectedIds.includes(item.id);
                            const itemDate = new Date(item.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            });

                            return (
                                <div key={item.id} className="relative flex items-center group">
                                    <button 
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            toggleSelection(item.id);
                                        }}
                                        onClick={() => handleOpen(item)}
                                        className="flex-1 flex items-center gap-4 py-3.5 px-4 sm:px-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--foreground)] transition-all shadow-sm text-left outline-none">

                                        {/* Selection Indicator */}
                                        <AnimatePresence>
                                            {isSelectionMode && (
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    className="w-5 h-5 rounded-lg border border-[var(--border)] flex items-center justify-center mr-1 shadow-xs flex-shrink-0"
                                                    style={{ 
                                                        borderColor: isSelected ? "var(--foreground)" : "var(--border)",
                                                        background: isSelected ? "var(--foreground)" : "transparent"
                                                    }}
                                                >
                                                    {isSelected && <Check size={13} strokeWidth={3} className="text-[var(--background)]" />}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--background)] border border-[var(--border)] shadow-sm group-hover-scale-sm transition-transform"
                                            style={{ color: cfg.color }}>
                                            <cfg.icon size={18} strokeWidth={2} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs sm:text-sm font-black text-[var(--foreground)] truncate group-hover:text-[var(--emerald)] transition-colors uppercase italic tracking-tight">
                                                    {item.title || "Untitled Scholarly Work"}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex-shrink-0 border border-[var(--border)] shadow-xs"
                                                    style={{ background: "var(--background)", color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                                {dueIds.has(item.id) && !isOfflineView && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#F59E0B] text-[#06060B] shadow-xs animate-pulse">
                                                        DUE
                                                    </span>
                                                )}
                                                {item.isOffline && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--emerald)] text-[var(--background)] shadow-xs flex items-center gap-1">
                                                        <WifiOff size={8} /> OFFLINE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2.5 text-[11px] font-bold text-[var(--foreground-muted)] truncate">
                                                {count && <span className="flex items-center gap-1 shrink-0"><BookOpen size={12} /> {count}</span>}
                                                {count && <span className="text-[var(--border)] shrink-0">•</span>}
                                                <span className="flex items-center gap-1 truncate"><Clock size={12} className="shrink-0" /> {itemDate}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors shrink-0">
                                            Open <ExternalLink size={14} />
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══ Batch Action Bar — Floating Flat 2.0 ═══ */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-40px)] max-w-xl"
                    >
                        <div className="bg-[var(--card)] backdrop-blur-2xl border-2 border-[var(--border)] rounded-[32px] p-5 flex items-center justify-between shadow-2xl overflow-hidden relative">
                            <div className="flex items-center gap-4 pl-3">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-black text-sm shadow-md">
                                    {selectedIds.length}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-[var(--foreground)] leading-none uppercase tracking-wider">Items Selected</span>
                                    <span className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-widest mt-1">Batch Management Active</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {!isOfflineView && (
                                    <button onClick={handleBatchExport}
                                        className="p-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--bg-2)] text-[var(--foreground)] transition-all shadow-md">
                                        <FileDown size={20} strokeWidth={2} />
                                    </button>
                                )}
                                <button onClick={handleBatchDelete} disabled={isProcessing}
                                    className="p-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} strokeWidth={2} />}
                                    Delete
                                </button>
                                <div className="w-px h-8 bg-[var(--border)] mx-1" />
                                <button onClick={exitSelectionMode}
                                    className="px-5 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--bg-2)] text-[var(--foreground)] text-xs font-black uppercase tracking-wider transition-all shadow-md">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            />
        </StandardContainer>
    );
}
