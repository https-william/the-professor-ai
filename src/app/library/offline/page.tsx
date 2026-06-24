"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Download, 
    Trash2, 
    ExternalLink, 
    ChevronLeft, 
    Clock, 
    BookOpen, 
    WifiOff, 
    Sparkles,
    CheckCircle2,
    Cloud,
    Search,
    X,
    Filter,
    Layers,
    HelpCircle,
    FileText,
    Zap
} from "lucide-react";
import StandardContainer from "@/components/ui/StandardContainer";
import BrandLogo from "@/components/ui/BrandLogo";
import { useToasts } from "@/components/ui/GlobalToasts";
import SEOHead, { getWebApplicationSchema } from "@/components/SEOHead";
import TiltCard from "@/components/ui/TiltCard";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";

interface OfflinePack {
    id: string;
    title: string;
    source_text: string;
    phases_data: Record<string, any>;
    savedAt: any; // Can be string or number
}

function openProfessorDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("IndexedDB is only available in the browser"));
            return;
        }
        const request = indexedDB.open("ProfessorOffline", 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("savedPacks")) {
                db.createObjectStore("savedPacks", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getSavedPacks(): Promise<OfflinePack[]> {
    const db = await openProfessorDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("savedPacks", "readonly");
        const store = tx.objectStore("savedPacks");
        const all = store.getAll();
        all.onsuccess = () => {
            const results = all.result || [];
            resolve(results.map(r => ({
                id: r.id,
                title: r.title,
                source_text: r.source_text || "",
                phases_data: r.phases_data || {},
                savedAt: typeof r.savedAt === "string" ? new Date(r.savedAt).getTime() : (r.savedAt || 0)
            })));
        };
        all.onerror = () => reject(all.error);
    });
}

export default function OfflineVaultPage() {
    const router = useRouter();
    const { addToast } = useToasts();
    const [offlinePacks, setOfflinePacks] = useState<OfflinePack[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        const loadPacks = async () => {
            try {
                // Try IndexedDB first
                const dbPacks = await getSavedPacks();
                if (dbPacks && dbPacks.length > 0) {
                    dbPacks.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
                    setOfflinePacks(dbPacks);
                } else {
                    // Fallback to localStorage
                    const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                    const packsArray = Object.values(packsObj).map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        source_text: r.source_text || "",
                        phases_data: r.phases_data || {},
                        savedAt: typeof r.savedAt === "string" ? new Date(r.savedAt).getTime() : (r.savedAt || 0)
                    })) as OfflinePack[];
                    packsArray.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
                    setOfflinePacks(packsArray);
                }
            } catch (err) {
                console.error("Failed to load offline packs:", err);
                // Fallback to localStorage
                try {
                    const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
                    const packsArray = Object.values(packsObj).map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        source_text: r.source_text || "",
                        phases_data: r.phases_data || {},
                        savedAt: typeof r.savedAt === "string" ? new Date(r.savedAt).getTime() : (r.savedAt || 0)
                    })) as OfflinePack[];
                    packsArray.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
                    setOfflinePacks(packsArray);
                } catch (localErr) {
                    console.error("Local storage load failed too:", localErr);
                }
            }
        };

        loadPacks();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Delete from IndexedDB
            try {
                const db = await openProfessorDB();
                const tx = db.transaction("savedPacks", "readwrite");
                tx.objectStore("savedPacks").delete(id);
                await new Promise<void>((resolve, reject) => {
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error);
                });
            } catch (dbErr) {
                console.error("IndexedDB delete failed:", dbErr);
            }

            // Delete from localStorage fallback
            const packsObj = JSON.parse(localStorage.getItem("offline_study_packs") || "{}");
            delete packsObj[id];
            localStorage.setItem("offline_study_packs", JSON.stringify(packsObj));

            setOfflinePacks(prev => prev.filter(p => p.id !== id));
            addToast("Removed from Offline Vault", "success");
        } catch (err) {
            console.error("Failed to delete offline pack:", err);
            addToast("Failed to remove pack", "error");
        }
    };

    const filteredPacks = searchQuery.trim() 
        ? offlinePacks.filter(p => 
            (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.source_text || "").toLowerCase().includes(searchQuery.toLowerCase())
          )
        : offlinePacks;

    if (!isMounted) return null;

    return (
        <StandardContainer className="py-12 min-h-screen bg-transparent text-[var(--foreground)]">
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />

            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-10">
                <button
                    onClick={() => router.push("/library")}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2 group"
                >
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Cloud Library
                </button>
                <div className="flex items-center gap-3">
                    {isOnline ? (
                        <button
                            onClick={() => router.push("/library")}
                            className="px-4 py-2 rounded-xl bg-[var(--blue)]/10 border border-[var(--blue)]/30 text-[var(--blue)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--blue)]/20 transition-all shadow-lg"
                        >
                            <Cloud size={14} /> Switch to Cloud Mode
                        </button>
                    ) : (
                        <div className="px-4 py-2 rounded-xl bg-[var(--emerald)]/10 border border-[var(--emerald)]/30 text-[var(--emerald)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                            <WifiOff size={14} /> Offline Active
                        </div>
                    )}
                </div>
            </div>

            {/* Header */}
            <div className="max-w-3xl mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 rounded-full bg-[var(--emerald)] text-[var(--background)] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        <Download size={12} className="fill-current" /> Offline Vault
                    </div>
                    <div className="text-[9px] font-black text-[var(--foreground-muted)] uppercase tracking-widest flex items-center gap-2">
                        <WifiOff size={11} /> Zero Internet Required
                    </div>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-[0.9] italic mb-4 uppercase">
                    Your Offline <br />
                    <span className="text-[var(--emerald)]">Study Vault.</span>
                </h1>
                <p className="text-sm sm:text-base text-[var(--foreground-muted)] font-medium leading-relaxed opacity-80">
                    Access your complete study packs, summaries, flashcards, and quizzes anytime, anywhere. Fully interactive with zero network latency.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8 max-w-xl">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                    <Search size={18} strokeWidth={1.5} />
                </div>
                <input
                    type="text"
                    placeholder="Search offline study packs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm bg-[var(--bg-2)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--emerald)]/40 transition-all shadow-inner"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Grid */}
            <AnimatePresence mode="popLayout">
                {filteredPacks.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full py-20 px-8 rounded-[2.5rem] bg-[var(--background-secondary)] border border-[var(--border)] text-center shadow-2xl flex flex-col items-center justify-center max-w-lg mx-auto mt-6"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[var(--emerald)]/10 border border-[var(--emerald)]/20 flex items-center justify-center mb-6 text-[var(--emerald)] shadow-xl">
                            <WifiOff size={28} />
                        </div>
                        <h3 className="text-xl font-black mb-2 tracking-tight uppercase italic">No Offline Packs Found</h3>
                        <p className="text-xs text-[var(--foreground-muted)] max-w-xs mx-auto mb-8 leading-relaxed font-medium">
                            {searchQuery ? "No study packs match your search query." : "When viewing any study pack in your library, click the 'Save for Offline' button to make it available here instantly."}
                        </p>
                        <button
                            onClick={() => router.push("/library")}
                            className="px-8 py-3.5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] text-xs font-black uppercase tracking-widest hover-scale-md active:scale-[0.9] transition-all shadow-xl"
                        >
                            Browse Cloud Library
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPacks.map((pack, index) => {
                            const completedCount = Object.keys(pack.phases_data || {}).length;
                            const savedDate = new Date(pack.savedAt || Date.now()).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            });

                            return (
                                <motion.div
                                    key={pack.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    onClick={() => router.push(`/library/pack/${pack.id}`)}
                                    className="cursor-pointer"
                                >
                                    <TiltCard glowColor="rgba(43, 178, 136, 0.15)" borderRadius="28px" className="h-full">
                                        <GlassmorphicCard
                                            intensity="medium"
                                            radius="28px"
                                            className="group relative p-8 border border-white/5 hover:border-[var(--emerald)]/40 transition-all flex flex-col justify-between h-full overflow-hidden"
                                        >
                                            {/* Top Metadata */}
                                            <div>
                                                <div className="flex items-center justify-between gap-4 mb-6">
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] shadow-inner">
                                                        <Clock size={11} /> Saved {savedDate}
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDelete(pack.id, e)}
                                                        className="p-2 rounded-xl bg-black/40 border border-white/5 text-[var(--foreground-muted)] hover:text-red-500 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                                        title="Remove from Offline Vault"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <h3 className="text-xl font-black tracking-tight mb-3 line-clamp-2 group-hover:text-[var(--emerald)] transition-colors uppercase italic">
                                                    {pack.title || "Untitled Study Pack"}
                                                </h3>
                                                <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 mb-6 leading-relaxed font-medium font-serif">
                                                    {pack.source_text || "No preview available"}
                                                </p>
                                            </div>

                                            {/* Bottom Progress & Action */}
                                            <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
                                                    <BookOpen size={13} className="text-[var(--emerald)]" /> {completedCount} / 4 Phases Ready
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--emerald)] group-hover-translate-x-sm transition-transform">
                                                    Open Pack <ExternalLink size={12} />
                                                </div>
                                            </div>
                                        </GlassmorphicCard>
                                    </TiltCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>
        </StandardContainer>
    );
}
