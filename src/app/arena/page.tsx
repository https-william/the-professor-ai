"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { createClient } from "@/lib/supabase/client";
import StandardContainer from "@/components/ui/StandardContainer";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { cn } from "@/lib/utils";
import {
    Sword,
    Users,
    UserPlus,
    Tv,
    Shield,
    Zap,
    Trophy,
    X,
    Play,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import { DuelLobby } from "@/components/features/arena";

function ArenaContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const duelId = searchParams.get("id");
    const { user } = useUser();
    const { addToast } = useToasts();
    const supabase = createClient();

    // Lobbies & Quizzes states for Dashboard
    const [activeLobbies, setActiveLobbies] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loadingPacks, setLoadingPacks] = useState(false);
    const [selectedQuizId, setSelectedQuizId] = useState<string>("");
    const [wagerXp, setWagerXp] = useState<number>(50);
    const [joinCodeInput, setJoinCodeInput] = useState<string>("");
    const [wagerError, setWagerError] = useState<string | null>(null);
    const [hostMode, setHostMode] = useState<'notes' | 'topic'>('notes');
    const [activeTab, setActiveTab] = useState<'host' | 'join' | 'match'>('host');
    const [quickTopicInput, setQuickTopicInput] = useState("");
    const [isQuickGenerating, setIsQuickGenerating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Duel Detail State when loading a specific duel
    const [duel, setDuel] = useState<any>(null);
    const [loadingDuel, setLoadingDuel] = useState(false);

    // Fetch duel details if `id` is present
    const fetchDuelDetails = async () => {
        if (!duelId) return;
        setLoadingDuel(true);
        try {
            const res = await fetch(`/api/arena/${duelId}`);
            const data = await res.json();
            if (data.success && data.duel) {
                setDuel(data.duel);
            } else {
                addToast(data.error || "Failed to load duel lobby", "error");
                router.push("/arena");
            }
        } catch (err) {
            console.error("Failed to load duel lobby:", err);
            addToast("Network error loading duel", "error");
            router.push("/arena");
        } finally {
            setLoadingDuel(false);
        }
    };

    useEffect(() => {
        if (duelId) {
            fetchDuelDetails();
        } else {
            setDuel(null);
        }
    }, [duelId]);

    // Realtime subscriptions for arena lobbies
    useEffect(() => {
        if (duelId) return; // Don't subscribe to global lobby list if we are inside a specific room

        const fetchLobbies = async () => {
            try {
                const res = await fetch("/api/arena");
                const data = await res.json();
                if (data.success && data.lobbies) {
                    setActiveLobbies(data.lobbies);
                }
            } catch (err) {
                console.error("Failed to fetch active lobbies:", err);
            }
        };
        fetchLobbies();

        // Subscribe to arena_duels changes
        const channel = supabase
            .channel('public:arena_duels_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_duels' }, (payload: any) => {
                fetchLobbies();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [duelId]);

    // Load available study packs for hosting from notes
    useEffect(() => {
        if (duelId || !user?.id) return;
        
        const fetchQuizzes = async () => {
            setLoadingPacks(true);
            try {
                const res = await fetch("/api/library");
                const data = await res.json();
                if (data.success && data.packs) {
                    const available = data.packs.filter((p: any) => p.quiz && p.quiz.length > 0);
                    setQuizzes(available);
                    if (available.length > 0) {
                        setSelectedQuizId(available[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch quizzes:", err);
            } finally {
                setLoadingPacks(false);
            }
        };

        fetchQuizzes();
    }, [duelId, user?.id]);

    const handleCreateLobby = async () => {
        if (!user) {
            addToast("You must be logged in to host a duel", "error");
            return;
        }

        const currentXp = user.xp || 0;
        if (currentXp < wagerXp) {
            setWagerError(`Insufficient XP balance (${currentXp} available)`);
            addToast(`You need at least ${wagerXp} XP to wager this amount`, "error");
            return;
        }

        if (hostMode === 'notes' && !selectedQuizId) {
            addToast("Please select a study quiz from your library", "error");
            return;
        }

        if (hostMode === 'topic' && !quickTopicInput.trim()) {
            addToast("Please enter a topic for quick match generation", "error");
            return;
        }

        setIsQuickGenerating(true);
        addToast("Preparing Study Duel arena...", "info");

        try {
            const bodyPayload = hostMode === 'notes' 
                ? { packId: selectedQuizId, wagerXp }
                : { topic: quickTopicInput.trim(), wagerXp };

            const res = await fetch("/api/arena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload)
            });

            const data = await res.json();
            if (data.success && data.duel) {
                addToast("Lobby created! Share code with your opponent.", "success");
                router.push(`/arena?id=${data.duel.id}`);
            } else {
                addToast(data.error || "Failed to create duel", "error");
            }
        } catch (err) {
            console.error("Error hosting duel:", err);
            addToast("Network error creating duel", "error");
        } finally {
            setIsQuickGenerating(false);
        }
    };

    const handleJoinWithCode = async () => {
        if (!joinCodeInput.trim() || joinCodeInput.length < 6) {
            addToast("Please enter a valid 6-character room code", "error");
            return;
        }

        addToast("Connecting to room...", "info");
        try {
            const res = await fetch(`/api/arena?code=${joinCodeInput.toUpperCase()}`);
            const data = await res.json();
            if (data.success && data.duel) {
                router.push(`/arena?id=${data.duel.id}`);
            } else {
                addToast(data.error || "Room not found or already full", "error");
            }
        } catch (err) {
            console.error("Error joining room:", err);
            addToast("Failed to join room", "error");
        }
    };

    const handleQuickMatch = async () => {
        if (!user) {
            addToast("You must be logged in for matchmaking", "error");
            return;
        }
        
        setIsSearching(true);
        addToast("Searching for an active study partner...", "info");
        
        try {
            const openLobbies = activeLobbies.filter(l => l.status === 'waiting' && l.hostId !== user.id);
            if (openLobbies.length > 0) {
                const targetLobby = openLobbies[0];
                const res = await fetch(`/api/arena?code=${targetLobby.code}`);
                const data = await res.json();
                if (data.success && data.duel) {
                    addToast("Match found! Joining lobby...", "success");
                    router.push(`/arena?id=${data.duel.id}`);
                    return;
                }
            }
            
            addToast("No open public lobbies found right now. Host one to let classmates join you!", "info");
        } catch (err) {
            console.error("Matchmaking error:", err);
            addToast("Matchmaking failed", "error");
        } finally {
            setIsSearching(false);
        }
    };

    if (duelId) {
        if (loadingDuel) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-[var(--foreground)]">
                    <Loader2 className="animate-spin text-[var(--blue)] w-10 h-10 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Entering Study Duel...</p>
                </div>
            );
        }

        if (duel) {
            const isHost = user?.id === duel.host.id;
            return (
                <div className="pt-20 pb-12 min-h-screen bg-[var(--background)]">
                    <StandardContainer>
                        <button
                            onClick={() => router.push("/arena")}
                            className="mb-6 px-4 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <X size={14} />
                            <span>Leave Room</span>
                        </button>
                        <DuelLobby
                            duelId={duel.id}
                            code={duel.code}
                            status={duel.status}
                            isHost={isHost}
                            host={duel.host}
                            challenger={duel.challenger}
                            generation={duel.generation}
                            timeLimit={duel.timeLimit}
                        />
                    </StandardContainer>
                </div>
            );
        }
    }

    const currentStudentName = user?.firstName || user?.name || "Scholar";

    return (
        <div className="bg-transparent text-[var(--foreground)] pt-[84px] pb-6 md:pb-8 relative flex flex-col flex-1 min-h-[calc(100vh-68px)]">
            <StandardContainer className="relative z-10 flex-1 flex flex-col py-0">
                <div className="w-full max-w-5xl mx-auto flex flex-col justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                    
                    {/* Header Block — Punchy Value Proposition */}
                    <div className="text-center space-y-3 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] mb-3 flex items-center justify-center gap-3">
                            <span className="text-[var(--amber)] flex items-center gap-1"><Trophy size={13} /> Study Duels</span>
                            <span>•</span>
                            <span className="text-[var(--foreground)]">⚡ {user?.xp?.toLocaleString() || "0"} XP Available</span>
                        </p>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase italic leading-none text-[var(--foreground)]">
                            The Study <span className="text-[var(--blue)] drop-shadow-sm">Arena</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-xl mx-auto font-medium leading-relaxed">
                            Test your recall under pressure. Challenge classmates to live rapid-fire quizzes generated from your lecture notes or quick topics.
                        </p>
                    </div>

                    {/* Impeccable 2-Column Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
                        
                        {/* Left Column (7 Cols): Unified Command Center */}
                        <div className="lg:col-span-7 flex flex-col gap-5">
                            <GlassmorphicCard 
                                intensity="medium" 
                                radius="28px" 
                                className="p-6 flex flex-col justify-between relative overflow-hidden border border-[var(--border-2)] shadow-xl bg-[var(--surface)] min-h-[460px]"
                            >
                                <div className="space-y-6">
                                    {/* Action Mode Tabs */}
                                    <div className="flex p-1 bg-[var(--background)] border border-[var(--border)] rounded-2xl">
                                        <button
                                            onClick={() => setActiveTab('host')}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                                activeTab === 'host'
                                                    ? "bg-[var(--blue)] text-white shadow-sm"
                                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            <UserPlus size={14} />
                                            <span>Host Duel</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('join')}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                                activeTab === 'join'
                                                    ? "bg-[var(--blue)] text-white shadow-sm"
                                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            <Users size={14} />
                                            <span>Join Code</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('match')}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                                activeTab === 'match'
                                                    ? "bg-[var(--blue)] text-white shadow-sm"
                                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                            )}
                                        >
                                            <Zap size={14} />
                                            <span>Quick Match</span>
                                        </button>
                                    </div>

                                    {/* TAB 1: HOST DUEL */}
                                    {activeTab === 'host' && (
                                        <div className="space-y-5 animate-in fade-in duration-200">
                                            {/* Host Mode Toggles */}
                                            <div className="flex p-1 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl">
                                                <button
                                                    onClick={() => setHostMode('notes')}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                                                        hostMode === 'notes'
                                                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                                                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                    )}
                                                >
                                                    From Notes 📚
                                                </button>
                                                <button
                                                    onClick={() => setHostMode('topic')}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                                                        hostMode === 'topic'
                                                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                                                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                    )}
                                                >
                                                    Quick Topic ⚡
                                                </button>
                                            </div>

                                            {hostMode === 'notes' ? (
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Select Study Quiz</label>
                                                    <select
                                                        value={selectedQuizId}
                                                        onChange={(e) => setSelectedQuizId(e.target.value)}
                                                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--blue)] transition-all cursor-pointer"
                                                        disabled={loadingPacks}
                                                    >
                                                        {loadingPacks ? (
                                                            <option>Loading your quizzes...</option>
                                                        ) : quizzes.length > 0 ? (
                                                            quizzes.map(q => (
                                                                <option key={q.id} value={q.id} className="bg-[var(--background)] text-[var(--foreground)]">{q.title}</option>
                                                            ))
                                                        ) : (
                                                            <option>No quizzes available</option>
                                                        )}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Topic to Study</label>
                                                    <input
                                                        type="text"
                                                        value={quickTopicInput}
                                                        onChange={(e) => setQuickTopicInput(e.target.value)}
                                                        placeholder="E.g. Photosynthesis, General Science..."
                                                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--blue)] transition-all"
                                                    />
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {["General Knowledge 🌍", "Pop Culture 🎬", "Science & Tech 🚀", "World History ⏳", "Basic Mathematics 🧮"].map(suggestion => {
                                                            const cleanVal = suggestion.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
                                                            return (
                                                                <button
                                                                    key={suggestion}
                                                                    onClick={() => setQuickTopicInput(cleanVal)}
                                                                    className="px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[9px] font-bold text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--blue)]/40 transition-all cursor-pointer"
                                                                >
                                                                    {suggestion}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Match Wager (XP)</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[50, 100, 250, 500].map(val => (
                                                        <button
                                                            key={val}
                                                            onClick={() => {
                                                                setWagerXp(val);
                                                                setWagerError(null);
                                                            }}
                                                            className={cn(
                                                                "py-2.5 rounded-xl text-xs font-black uppercase transition-all border cursor-pointer",
                                                                wagerXp === val 
                                                                    ? "bg-[var(--amber)] text-black border-[var(--amber)] shadow-md"
                                                                    : "bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)]"
                                                            )}
                                                        >
                                                            {val} XP
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {wagerError && (
                                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                                    <AlertCircle size={12} />
                                                    <span>{wagerError}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: JOIN ROOM */}
                                    {activeTab === 'join' && (
                                        <div className="space-y-6 py-4 animate-in fade-in duration-200">
                                            <div className="text-center space-y-1">
                                                <h3 className="text-base font-black uppercase text-[var(--foreground)]">Enter Room Code</h3>
                                                <p className="text-xs text-[var(--foreground-muted)]">Ask your classmate for their 6-character room invitation code.</p>
                                            </div>
                                            <div className="max-w-xs mx-auto space-y-4">
                                                <input
                                                    type="text"
                                                    value={joinCodeInput}
                                                    onChange={(e) => setJoinCodeInput(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6))}
                                                    placeholder="E.G. A1B2C3"
                                                    className="w-full bg-[var(--background-secondary)] border border-[var(--border-2)] rounded-2xl px-4 py-4 text-lg font-mono font-black text-center tracking-[0.35em] text-[var(--foreground)] outline-none focus:border-[var(--blue)] transition-all uppercase shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: QUICK MATCH */}
                                    {activeTab === 'match' && (
                                        <div className="space-y-6 py-4 animate-in fade-in duration-200 text-center">
                                            <div className="w-16 h-16 rounded-3xl bg-[var(--blue)]/10 border border-[var(--blue)]/20 flex items-center justify-center text-[var(--blue)] mx-auto shadow-inner">
                                                <Zap size={28} />
                                            </div>
                                            <div className="space-y-2 max-w-md mx-auto">
                                                <h3 className="text-base font-black uppercase text-[var(--foreground)]">Instant Matchmaking</h3>
                                                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                                                    We will automatically pair you with any classmate currently waiting in an open public study room.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ACTION BUTTON */}
                                <div className="pt-6 border-t border-[var(--border)] mt-6">
                                    {activeTab === 'host' && (
                                        <button
                                            onClick={handleCreateLobby}
                                            disabled={isQuickGenerating || (hostMode === 'notes' && quizzes.length === 0)}
                                            className={cn(
                                                "w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg",
                                                (hostMode === 'notes' && quizzes.length === 0)
                                                    ? "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)] cursor-not-allowed opacity-50"
                                                    : "btn-skeuo-blue"
                                            )}
                                        >
                                            {isQuickGenerating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                    <span>Writing Questions...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={14} fill="currentColor" />
                                                    <span>Start Study Duel</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {activeTab === 'join' && (
                                        <button
                                            onClick={handleJoinWithCode}
                                            disabled={!joinCodeInput.trim() || joinCodeInput.length < 6}
                                            className={cn(
                                                "w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg",
                                                (!joinCodeInput.trim() || joinCodeInput.length < 6)
                                                    ? "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)] cursor-not-allowed opacity-50"
                                                    : "btn-skeuo-primary text-black"
                                            )}
                                        >
                                            <ArrowRight size={16} />
                                            <span>Connect to Room</span>
                                        </button>
                                    )}

                                    {activeTab === 'match' && (
                                        <button
                                            onClick={handleQuickMatch}
                                            disabled={isSearching}
                                            className={cn(
                                                "w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg",
                                                isSearching
                                                    ? "bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)] cursor-not-allowed opacity-50 animate-pulse"
                                                    : "btn-skeuo-blue"
                                            )}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin text-[var(--blue)]" />
                                                    <span>Searching for Opponent...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap size={14} fill="currentColor" />
                                                    <span>Find Match Now</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </GlassmorphicCard>
                        </div>

                        {/* Right Column (5 Cols): Live Study Rooms & Socratic Tip */}
                        <div className="lg:col-span-5 flex flex-col gap-5">
                            {/* Live lobbies list */}
                            <GlassmorphicCard intensity="light" radius="28px" className="p-6 border border-[var(--border-2)] shadow-xl space-y-4 flex flex-col bg-[var(--surface)] min-h-[460px] justify-between">
                                <div className="space-y-4 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                                        <span className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] flex items-center gap-2">
                                            <Tv size={16} className="text-emerald-500" /> Live Study Rooms
                                        </span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[310px]">
                                        {activeLobbies.length > 0 ? (
                                            activeLobbies.map(lobby => (
                                                <div 
                                                    key={lobby.id}
                                                    className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex flex-col gap-2.5 hover:border-[var(--border-2)] transition-all"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" />
                                                            {lobby.hostName}&apos;s Room
                                                        </span>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                                                            lobby.status === 'waiting' 
                                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse" 
                                                                : "bg-[var(--background)] text-[var(--foreground-muted)] border-[var(--border)]"
                                                        )}>
                                                            {lobby.status === 'waiting' ? "Open" : "In Progress"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[var(--foreground)] font-bold uppercase truncate">{lobby.packTitle}</p>
                                                    <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] uppercase font-black pt-2 border-t border-[var(--border)] mt-1">
                                                        <span>Wager: {lobby.wagerXp} XP</span>
                                                        <span className="text-[var(--blue)]">2 Max Players</span>
                                                    </div>
                                                    {lobby.status === 'waiting' && lobby.hostId !== user?.id && (
                                                        <button 
                                                            onClick={async () => {
                                                                addToast("Joining Lobby...", "info");
                                                                const res = await fetch(`/api/arena?code=${lobby.code}`);
                                                                const data = await res.json();
                                                                if (data.success) {
                                                                     router.push(`/arena?id=${data.duel.id}`);
                                                                } else {
                                                                    addToast(data.error || "Failed to join", "error");
                                                                }
                                                            }}
                                                            className="w-full py-2.5 btn-skeuo-primary text-black rounded-xl text-[10px] font-black uppercase mt-2 transition-all cursor-pointer shadow-sm"
                                                        >
                                                            Join Duel
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[var(--background-secondary)]/50 rounded-2xl border border-dashed border-[var(--border)] my-auto">
                                                <div className="w-10 h-10 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] shadow-inner">
                                                    <Users size={18} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase text-[var(--foreground)]">No Active Rooms</p>
                                                    <p className="text-[11px] text-[var(--foreground-muted)] max-w-[220px] leading-relaxed">
                                                        Be the first to host a study duel and invite your classmates to test their recall!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Socratic Tip Inline Footer */}
                                <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--foreground-muted)] font-medium">
                                    <span className="text-[var(--amber)]">💡</span>
                                    <span><strong className="text-[var(--foreground)]">Tip:</strong> Wagered XP goes straight to the winner&apos;s rank reserve.</span>
                                </div>
                            </GlassmorphicCard>
                        </div>
                    </div>
                </div>
            </StandardContainer>
        </div>
    );
}

export default function TriviaArena() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-[var(--foreground)]">
                <Loader2 className="animate-spin text-[var(--blue)] w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Loading Arena...</p>
            </div>
        }>
            <ArenaContent />
        </Suspense>
    );
}
