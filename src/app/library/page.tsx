"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { createClient } from "@/lib/supabase/client";
import { generateLibraryExportHTML } from "@/lib/export-utils";
import { cn } from "@/lib/utils";

import ProfessorEmptyState from "@/components/ui/ProfessorEmptyState";
import GuestSignupModal from "@/components/ui/GuestSignupModal";
import StandardContainer from "@/components/ui/StandardContainer";
import SEOHead, { getWebApplicationSchema } from "@/components/SEOHead";
import ThemeToggle from "@/components/ui/ThemeToggle";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

import { 
    Library, 
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
    Sparkles,
    Edit2
} from "lucide-react";

// Branded Midnight Scholar Type Configuration
const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    flashcards: { icon: Layers, label: "Flashcards", color: "#E5A93C" }, // Amber
    quiz: { icon: HelpCircle, label: "Quiz", color: "#9673F5" }, // Violet
    summary: { icon: FileText, label: "Summary", color: "#4A7CF5" }, // Blue
    exam_sprint: { icon: BookOpen, label: "Exam Sprint", color: "#2BB288" }, // Emerald
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

// Programmatic Web Audio Synthesizer
const playResultsSound = (type: "click" | "page-turn") => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        if (type === "click") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(580, now);
            gain.gain.setValueAtTime(0.012, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === "page-turn") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
            gain.gain.setValueAtTime(0.008, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (e) {}
};

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

    // Library Management & Sorting states
    const { addToast } = useToasts();
    const [sortOption, setSortOption] = useState<'date' | 'title' | 'type'>('date');
    const [renameItem, setRenameItem] = useState<LibraryItem | null>(null);
    const [renameTitle, setRenameTitle] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const [deleteItem, setDeleteItem] = useState<LibraryItem | null>(null);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

    // Offline view redirection lock
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!navigator.onLine) {
                setIsOfflineView(true);
            }

            const handleOffline = () => {
                setIsOfflineView(true);
            };

            const handleOnline = () => {
                setIsOfflineView(false);
            };

            window.addEventListener("offline", handleOffline);
            window.addEventListener("online", handleOnline);
            return () => {
                window.removeEventListener("offline", handleOffline);
                window.removeEventListener("online", handleOnline);
            };
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
                    setLoading(false);
                } catch (e) {}
            } else {
                setLoading(true);
            }

            const supabase = createClient();
            
            try {
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

    // Apply search filter and sorting
    const sortedAndFiltered = (() => {
        const filteredList = searchQuery.trim()
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

        const list = [...filteredList];
        if (sortOption === "title") {
            return list.sort((a, b) => (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase()));
        } else if (sortOption === "type") {
            return list.sort((a, b) => a.type.localeCompare(b.type));
        } else {
            // date desc
            return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    })();

    const handleOpen = (item: LibraryItem) => {
        playResultsSound("click");
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
        playResultsSound("click");
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= 10) return prev;
            return [...prev, id];
        });
        if (!isSelectionMode) setIsSelectionMode(true);
    };

    const handleBatchDelete = async () => {
        playResultsSound("click");
        if (selectedIds.length === 0) return;
        setShowBatchDeleteModal(true);
    };

    const confirmBatchDelete = async () => {
        setIsProcessing(true);
        try {
            if (isOfflineView) {
                const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                selectedIds.forEach(id => delete packsObj[id]);
                localStorage.setItem("offline_study_packs", JSON.stringify(packsObj));
                setOfflineItems(prev => prev.filter(g => !selectedIds.includes(g.id)));
                setSelectedIds([]);
                setIsSelectionMode(false);
                addToast("Items deleted successfully!", "success");
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
                    addToast("Items deleted successfully!", "success");
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to delete items");
                }
            }
            setShowBatchDeleteModal(false);
        } catch (error: any) {
            console.error("Batch delete failed", error);
            addToast(`Delete failed: ${error.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRenameSubmit = async () => {
        if (!renameItem || !renameTitle.trim()) return;
        setIsRenaming(true);
        try {
            if (isOfflineView) {
                const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                if (packsObj[renameItem.id]) {
                    packsObj[renameItem.id].title = renameTitle.trim();
                    localStorage.setItem("offline_study_packs", JSON.stringify(packsObj));
                    setOfflineItems(prev => prev.map(item => item.id === renameItem.id ? { ...item, title: renameTitle.trim() } : item));
                    addToast("Item renamed successfully!", "success");
                }
            } else {
                const res = await fetch("/api/library/rename", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: renameItem.id, newTitle: renameTitle }),
                });
                if (res.ok) {
                    setItems(prev => prev.map(item => item.id === renameItem.id ? { ...item, title: renameTitle.trim() } : item));
                    addToast("Item renamed successfully!", "success");
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to rename");
                }
            }
            setRenameItem(null);
        } catch (error: any) {
            console.error("Rename failed:", error);
            addToast(`Rename failed: ${error.message}`, "error");
        } finally {
            setIsRenaming(false);
        }
    };

    const handleSingleDeleteSubmit = async () => {
        if (!deleteItem) return;
        setIsProcessing(true);
        try {
            if (isOfflineView) {
                const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                delete packsObj[deleteItem.id];
                localStorage.setItem("offline_study_packs", JSON.stringify(packsObj));
                setOfflineItems(prev => prev.filter(g => g.id !== deleteItem.id));
                addToast("Item deleted successfully!", "success");
            } else {
                const res = await fetch("/api/library/batch", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: [deleteItem.id] }),
                });
                if (res.ok) {
                    setItems(prev => prev.filter(g => g.id !== deleteItem.id));
                    addToast("Item deleted successfully!", "success");
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to delete");
                }
            }
            setDeleteItem(null);
        } catch (error: any) {
            console.error("Delete failed:", error);
            addToast(`Delete failed: ${error.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchExport = () => {
        playResultsSound("click");
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
        playResultsSound("click");
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
        <div className="bg-transparent text-zinc-100 pb-28 pt-20 relative flex flex-col flex-1 overflow-x-clip">
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />

            {/* Grid Line Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            
            {/* Ambient Radial Halos */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#9673F5]/5 via-[#4A7CF5]/5 to-transparent rounded-full blur-[110px] pointer-events-none z-0" />
            <div className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] bg-[#E5A93C]/5 rounded-full blur-[130px] pointer-events-none z-0" />

            <StandardContainer className="relative z-10">
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-600 max-w-5xl mx-auto space-y-10">
                    
                    {/* Header & Offline Toggle Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 shadow-sm">
                                    <Library size={18} className="text-white" />
                                </div>
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Unified Storage</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.9] uppercase italic font-sans">
                                Study <span className="text-[#E5A93C] drop-shadow-[0_0_15px_rgba(229,169,60,0.15)]">Vault</span>
                            </h1>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">
                                {isOfflineView ? "Local Device Storage · Zero Latency" : "Real-time Cloud Synchronization"}
                            </p>
                        </div>

                        {/* Actions & Offline Toggle */}
                        <div className="flex flex-wrap items-center gap-3">
                            <ThemeToggle />
                            {/* Offline Toggle */}
                            <div className="flex items-center p-1 rounded-xl bg-zinc-950/40 border border-white/5 backdrop-blur-md shadow-inner">
                                <button
                                    onClick={() => { playResultsSound("click"); setIsOfflineView(false); exitSelectionMode(); }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                        !isOfflineView ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <Cloud size={13} /> Cloud History
                                </button>
                                <button
                                    onClick={() => { playResultsSound("click"); setIsOfflineView(true); exitSelectionMode(); }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent",
                                        isOfflineView ? "bg-[#2BB288]/20 text-[#2BB288] border-[#2BB288]/30 shadow-md" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <WifiOff size={13} /> Offline Vault ({offlineItems.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Bento Row */}
                    {!isOfflineView && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Exam Sprints", count: sprintCount, icon: BookOpen, color: "#2BB288" },
                                { label: "Flashcards", count: flashcardCount, icon: Layers, color: "#E5A93C" },
                                { label: "Quizzes", count: quizCount, icon: HelpCircle, color: "#9673F5" },
                                { label: "Summaries", count: summaryCount, icon: FileText, color: "#4A7CF5" },
                            ].map((s) => (
                                <GlassmorphicCard 
                                    key={s.label} 
                                    intensity="medium" 
                                    radius="20px" 
                                    hoverLift={true}
                                    className="p-5 flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div 
                                            className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner transition-all" 
                                            style={{ color: s.color, backgroundColor: `${s.color}10`, borderColor: `${s.color}25` }}
                                        >
                                            <s.icon size={16} strokeWidth={2} />
                                        </div>
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Active</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl sm:text-3xl font-black text-white leading-none tracking-tight mb-1">{s.count}</div>
                                        <div className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">{s.label}</div>
                                    </div>
                                </GlassmorphicCard>
                            ))}
                        </div>
                    )}

                    {/* Filter & Sort Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                            {filters.map(f => {
                                const isActive = filter === f.id;
                                return (
                                    <button 
                                        key={f.id} 
                                        onClick={() => {
                                            playResultsSound("click");
                                            setFilter(f.id);
                                        }}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border",
                                            isActive
                                                ? isOfflineView 
                                                    ? "bg-[#2BB288]/10 text-[#2BB288] border-[#2BB288]/30 shadow-[0_0_15px_rgba(43,178,136,0.15)]"
                                                    : "bg-white/10 text-white border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                                                : "bg-white/5 text-zinc-400 hover:text-white border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <f.icon size={13} />
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Sort by</span>
                            <select
                                value={sortOption}
                                onChange={(e) => {
                                    playResultsSound("click");
                                    setSortOption(e.target.value as any);
                                }}
                                className="px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 outline-none cursor-pointer transition-all"
                            >
                                <option value="date" className="bg-[#09090b] text-white">Date Created</option>
                                <option value="title" className="bg-[#09090b] text-white">Title</option>
                                <option value="type" className="bg-[#09090b] text-white">Type</option>
                            </select>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6 rounded-2xl border border-white/5 focus-within:border-[#E5A93C]/30 focus-within:shadow-[0_0_15px_rgba(229,169,60,0.08)] transition-all bg-zinc-950/40 overflow-hidden">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-white/40">
                            {searchQuery.includes("type:") ? <Filter size={16} /> : <Search size={16} />}
                        </div>
                        <input
                            type="text"
                            placeholder={isOfflineView ? "Search offline vault..." : 'Search "type:exam_sprint", "type:quiz history" or "biology"...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSearch(true)}
                            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                            className="w-full pl-11 pr-14 py-4 text-xs font-bold text-white placeholder:text-zinc-600 outline-none transition-all bg-transparent font-sans"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    title="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                            <div className="w-px h-4 bg-white/5 mx-0.5" />
                            <button 
                                onClick={() => setSearchQuery(prev => prev.includes("type:") ? "" : "type:")}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all cursor-pointer",
                                    searchQuery.includes("type:") ? "text-zinc-950 bg-white" : "text-white/40 hover:text-white"
                                )}
                                title="Filter by type"
                            >
                                <Tag size={15} />
                            </button>
                        </div>

                        {/* Suggestions Panel */}
                        <AnimatePresence>
                            {showSearch && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-0 right-0 top-full mt-2 z-50 text-left"
                                >
                                    <GlassmorphicCard intensity="heavy" radius="20px" className="p-6 space-y-4">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-1.5">
                                                <Clock size={11} /> Recent Study Packs
                                            </h4>
                                            <div className="flex flex-col gap-1.5">
                                                {activeItems.slice(0, 2).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleOpen(item)}
                                                        className="text-left text-xs font-bold text-zinc-300 hover:text-white transition-colors truncate cursor-pointer"
                                                    >
                                                        {item.title || "Untitled Study Pack"}
                                                    </button>
                                                ))}
                                                {activeItems.length === 0 && (
                                                    <span className="text-xs text-zinc-600 italic">No packs generated yet.</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/5 pt-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5A93C] mb-2 flex items-center gap-1.5">
                                                <Sparkles size={11} /> Highly Reviewed Core Concepts
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {["Action Potentials", "Cardiac Cycle", "Renal Clearance"].map((concept) => (
                                                    <button
                                                        key={concept}
                                                        onClick={() => { playResultsSound("click"); setSearchQuery(concept); }}
                                                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                                                    >
                                                        {concept}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/5 pt-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9673F5] mb-2 flex items-center gap-1.5">
                                                <BellRing size={11} /> Flagged Exam Questions
                                            </h4>
                                            <div className="flex flex-col gap-1.5 text-xs text-zinc-400 font-medium">
                                                <button onClick={() => { playResultsSound("click"); setSearchQuery("murmur"); }} className="text-left hover:text-white transition-colors truncate cursor-pointer">
                                                    Q: "What is the classic murmur triad?"
                                                </button>
                                                <button onClick={() => { playResultsSound("click"); setSearchQuery("action potential"); }} className="text-left hover:text-white transition-colors truncate cursor-pointer">
                                                    Q: "Explain phase 0 depolarization dynamics."
                                                </button>
                                            </div>
                                        </div>
                                    </GlassmorphicCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Content List */}
                    {loading && !isOfflineView ? (
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="h-18 rounded-2xl animate-pulse bg-white/5 border border-white/5 shadow-sm" />
                            ))}
                        </div>
                    ) : sortedAndFiltered.length === 0 ? (
                        <ProfessorEmptyState 
                            type={searchQuery ? "search" : filter !== "all" ? filter as any : isOfflineView ? "library" : "library"}
                            actionLabel={isOfflineView ? "Browse Cloud Library" : "Start Creating"}
                            actionHref={isOfflineView ? "/library" : "/create"}
                        />
                    ) : (
                        <div className="space-y-2.5">
                            {sortedAndFiltered.map((item) => {
                                const cfg = typeConfig[item.type] ?? typeConfig.summary;
                                const count = getItemCount(item);
                                const isSelected = selectedIds.includes(item.id);
                                const itemDate = new Date(item.created_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });

                                return (
                                    <div key={item.id} className="relative flex items-center group w-full">
                                        <GlassmorphicCard
                                            intensity="light"
                                            radius="20px"
                                            hoverLift={true}
                                            className="flex-1 overflow-hidden"
                                        >
                                            <div className="flex items-center w-full relative">
                                                <button 
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        toggleSelection(item.id);
                                                    }}
                                                    onClick={() => handleOpen(item)}
                                                    className="w-full flex items-center gap-4 py-4 pl-6 pr-28 text-left outline-none cursor-pointer bg-transparent"
                                                >
                                                    {/* Selection Indicator */}
                                                    <AnimatePresence>
                                                        {isSelectionMode && (
                                                            <motion.div 
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                className="w-5 h-5 rounded-lg border flex items-center justify-center mr-1 shadow-xs flex-shrink-0"
                                                                style={{ 
                                                                    borderColor: isSelected ? "white" : "rgba(255,255,255,0.1)",
                                                                    background: isSelected ? "white" : "transparent"
                                                                }}
                                                            >
                                                                {isSelected && <Check size={13} strokeWidth={3} className="text-zinc-950" />}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <div 
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm transition-all"
                                                        style={{ color: cfg.color, backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}25` }}
                                                    >
                                                        <cfg.icon size={18} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs sm:text-sm font-black text-white truncate group-hover:text-white/80 transition-colors uppercase italic tracking-tight font-sans">
                                                                {item.title || "Untitled Scholarly Work"}
                                                            </span>
                                                            <span 
                                                                className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-md flex-shrink-0 border transition-all"
                                                                style={{ borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}15`, color: cfg.color }}
                                                            >
                                                                {cfg.label}
                                                            </span>
                                                            {dueIds.has(item.id) && !isOfflineView && (
                                                                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-[#E5A93C] text-[#09090b] shadow-xs animate-pulse">
                                                                    DUE
                                                                </span>
                                                            )}
                                                            {item.isOffline && (
                                                                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-[#2BB288]/20 text-[#2BB288] border border-[#2BB288]/30 shadow-xs flex items-center gap-1">
                                                                    <WifiOff size={8} /> OFFLINE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-zinc-500 truncate">
                                                            {count && <span className="flex items-center gap-1 shrink-0"><BookOpen size={12} /> {count}</span>}
                                                            {count && <span className="text-zinc-800 shrink-0">•</span>}
                                                            <span className="flex items-center gap-1 truncate"><Clock size={12} className="shrink-0" /> {itemDate}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors shrink-0 group-hover:opacity-0 opacity-100 duration-200">
                                                        Open <ExternalLink size={13} />
                                                    </div>
                                                </button>

                                                {/* Inline hover management buttons */}
                                                {!isSelectionMode && (
                                                    <div className="absolute right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                playResultsSound("click");
                                                                setRenameItem(item);
                                                                setRenameTitle(item.title || "");
                                                            }}
                                                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--amber)]/45 hover:bg-[var(--amber)]/10 text-zinc-400 hover:text-[var(--amber)] transition-all shadow-md cursor-pointer"
                                                            title="Rename"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                playResultsSound("click");
                                                                setDeleteItem(item);
                                                            }}
                                                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all shadow-md cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </GlassmorphicCard>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </StandardContainer>

            {/* Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-40px)] max-w-xl"
                    >
                        <GlassmorphicCard intensity="heavy" radius="32px" className="p-5 flex items-center justify-between shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden relative">
                            <div className="flex items-center gap-4 pl-3">
                                <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black text-sm shadow-lg">
                                    {selectedIds.length}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white leading-none uppercase tracking-wider">Items Selected</span>
                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">Batch Management Active</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {!isOfflineView && (
                                    <button onClick={handleBatchExport}
                                        className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all shadow-md cursor-pointer">
                                        <FileDown size={20} />
                                    </button>
                                )}
                                <button onClick={handleBatchDelete} disabled={isProcessing}
                                    className="p-3 px-5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 font-black text-[10px] uppercase tracking-wider cursor-pointer">
                                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Delete
                                </button>
                                <div className="w-px h-8 bg-white/10 mx-1" />
                                <button onClick={exitSelectionMode}
                                    className="px-5 py-3 rounded-2xl bg-white text-zinc-950 hover:bg-white/95 text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">
                                    Cancel
                                </button>
                            </div>
                        </GlassmorphicCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <GuestSignupModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            />

            {/* Rename Modal */}
            <AnimatePresence>
                {renameItem && (
                    <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRenameItem(null)}
                            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xl"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden z-10 p-8"
                            style={{ boxShadow: "inset 0 1px 1px var(--accent-glow), 0 24px 64px rgba(0,0,0,0.3)" }}
                        >
                            <button 
                                onClick={() => setRenameItem(null)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X size={14} />
                            </button>

                            <div className="mb-6">
                                <h3 className="text-lg font-black uppercase tracking-tight italic text-white flex items-center gap-2">
                                    <Edit2 size={16} className="text-[var(--amber)]" />
                                    Rename Item
                                </h3>
                                <p className="text-[11px] text-zinc-400 font-medium mt-1">Update the name of your study materials</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative rounded-2xl border border-white/5 focus-within:border-[var(--amber)]/30 transition-all bg-zinc-950/40 overflow-hidden px-4 py-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">New Title</label>
                                    <input
                                        type="text"
                                        value={renameTitle}
                                        onChange={(e) => setRenameTitle(e.target.value)}
                                        placeholder="Enter new title..."
                                        className="w-full bg-transparent text-xs font-bold text-white outline-none border-none p-0"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameSubmit();
                                        }}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setRenameItem(null)}
                                        className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRenameSubmit}
                                        disabled={isRenaming || !renameTitle.trim()}
                                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[var(--amber)] to-indigo-600 hover:from-[var(--amber-light)] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--amber)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {isRenaming ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Save Changes</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Single Delete Modal */}
            <AnimatePresence>
                {deleteItem && (
                    <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteItem(null)}
                            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xl"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden z-10 p-8"
                            style={{ boxShadow: "inset 0 1px 1px var(--accent-glow), 0 24px 64px rgba(0,0,0,0.3)" }}
                        >
                            <button 
                                onClick={() => setDeleteItem(null)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X size={14} />
                            </button>

                            <div className="mb-6 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight italic text-white">
                                        Delete Study Set?
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1 leading-relaxed">
                                        Are you sure you want to delete <span className="text-white font-bold">"{deleteItem.title}"</span>? This action is permanent and cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteItem(null)}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                    Keep Item
                                </button>
                                <button
                                    onClick={handleSingleDeleteSubmit}
                                    disabled={isProcessing}
                                    className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/15 hover:bg-red-400 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Permanently</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Batch Delete Modal */}
            <AnimatePresence>
                {showBatchDeleteModal && (
                    <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBatchDeleteModal(false)}
                            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xl"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden z-10 p-8"
                            style={{ boxShadow: "inset 0 1px 1px var(--accent-glow), 0 24px 64px rgba(0,0,0,0.3)" }}
                        >
                            <button 
                                onClick={() => setShowBatchDeleteModal(false)}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X size={14} />
                            </button>

                            <div className="mb-6 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight italic text-white">
                                        Delete {selectedIds.length} Items?
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1 leading-relaxed">
                                        Are you sure you want to permanently delete these <span className="text-white font-bold">{selectedIds.length} selected items</span>? This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowBatchDeleteModal(false)}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                    Keep Items
                                </button>
                                <button
                                    onClick={confirmBatchDelete}
                                    disabled={isProcessing}
                                    className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/15 hover:bg-red-400 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete {selectedIds.length} Items</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
