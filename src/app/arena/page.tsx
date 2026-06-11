"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { createClient } from "@/lib/supabase/client";
import StandardContainer from "@/components/ui/StandardContainer";
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
    const [quickTopicInput, setQuickTopicInput] = useState("");
    const [isQuickGenerating, setIsQuickGenerating] = useState(false);

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
            if (data.success) {
                setDuel(data.duel);
                // Redirect if in other states
                if (data.duel.status === "IN_PROGRESS") {
                    router.push(`/arena/play?id=${duelId}`);
                } else if (data.duel.status === "COMPLETED") {
                    router.push(`/arena/results?id=${duelId}`);
                }
            } else {
                addToast(data.error || "Failed to load duel lobby.", "error");
                router.push("/arena");
            }
        } catch (err) {
            console.error(err);
            addToast("Failed to fetch duel details.", "error");
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

    // Fetch open duels & quizzes for dashboard
    const fetchActiveLobbies = async () => {
        try {
            const res = await fetch("/api/arena");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setActiveLobbies(data.duels || []);
                }
            }
        } catch (e) {
            console.error("Failed to fetch active duels", e);
        }
    };

    useEffect(() => {
        if (duelId) return; // Don't run this when in a lobby

        fetchActiveLobbies();
        
        // Live real-time updates for open lobbies list
        const channel = supabase
            .channel("public-arena-lobbies")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "duels"
                },
                () => {
                    fetchActiveLobbies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [duelId, supabase]);

    useEffect(() => {
        if (duelId) return;

        const fetchQuizzes = async () => {
            setLoadingPacks(true);
            try {
                const res = await fetch("/api/library?type=quiz");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setQuizzes(data.generations || []);
                        if (data.generations.length > 0) {
                            setSelectedQuizId(data.generations[0].id);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to load quizzes", e);
            } finally {
                setLoadingPacks(false);
            }
        };
        fetchQuizzes();
    }, [duelId]);

    const handleCreateLobby = async () => {
        if (user.xp < wagerXp) {
            setWagerError(`You need at least ${wagerXp} XP to wager this match.`);
            return;
        }
        setWagerError(null);

        let finalQuizId = selectedQuizId;

        if (hostMode === 'topic') {
            if (!quickTopicInput || quickTopicInput.trim().length < 2) {
                addToast("Please enter a topic for the quiz", "error");
                return;
            }
            setIsQuickGenerating(true);
            try {
                const genRes = await fetch("/api/arena/quick-generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic: quickTopicInput.trim() })
                });
                const genData = await genRes.json();
                if (!genRes.ok || !genData.success) {
                    addToast(genData.error || "Failed to generate quick quiz questions.", "error");
                    setIsQuickGenerating(false);
                    return;
                }
                finalQuizId = genData.generation_id;
            } catch (err) {
                console.error(err);
                addToast("Error generating quick quiz", "error");
                setIsQuickGenerating(false);
                return;
            }
        } else {
            if (!finalQuizId) {
                addToast("Please select a quiz to host", "error");
                return;
            }
        }
        
        try {
            const res = await fetch("/api/arena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generation_id: finalQuizId,
                    wager_xp: wagerXp
                })
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/arena?id=${data.duel.id}`);
            } else {
                addToast(data.error || "Failed to host duel", "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Error hosting duel", "error");
        } finally {
            setIsQuickGenerating(false);
        }
    };

    const handleJoinWithCode = async () => {
        if (!joinCodeInput || joinCodeInput.length < 6) {
            addToast("Please enter a valid 6-digit room code", "error");
            return;
        }
        addToast("Connecting to room...", "info");
        try {
            const res = await fetch(`/api/arena?code=${joinCodeInput}`);
            const data = await res.json();
            if (data.success) {
                addToast("Connected! Entering Arena...", "success");
                router.push(`/arena?id=${data.duel.id}`);
            } else {
                addToast(data.error || "Lobby not found or unavailable.", "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Failed to join duel.", "error");
        }
    };

    const handleQuickMatch = async () => {
        addToast("Searching for online classmates...", "info");
        try {
            const res = await fetch("/api/arena");
            const data = await res.json();
            if (data.success && data.duels && data.duels.length > 0) {
                const joinable = data.duels.find((d: any) => d.hostId !== user.id);
                if (joinable) {
                    addToast("Match found! Joining room...", "success");
                    const joinRes = await fetch(`/api/arena?code=${joinable.code}`);
                    const joinData = await joinRes.json();
                    if (joinData.success) {
                        router.push(`/arena?id=${joinData.duel.id}`);
                        return;
                    }
                }
            }

            if (quizzes.length === 0) {
                addToast("You don't have any generated quizzes yet. Create one first!", "error");
                return;
            }

            addToast("No open duels found. Creating a matchmaking lobby...", "info");
            const hostRes = await fetch("/api/arena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    generation_id: quizzes[0].id,
                    wager_xp: wagerXp
                })
            });
            const hostData = await hostRes.json();
            if (hostData.success) {
                router.push(`/arena?id=${hostData.duel.id}`);
            } else {
                addToast(hostData.error || "Failed to create matchmaking lobby.", "error");
            }
        } catch (err) {
            console.error("Matchmaking error:", err);
            addToast("Matchmaking failed.", "error");
        }
    };

    if (duelId) {
        if (loadingDuel || !duel) {
            return (
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin text-white w-10 h-10 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Synchronizing Pit...</p>
                </div>
            );
        }

        const isHost = user?.id === duel.host.id;

        return (
            <DuelLobby
                duelId={duel.id}
                code={duel.code}
                status={duel.status}
                isHost={isHost}
                host={duel.host}
                challenger={duel.challenger}
                generation={duel.generation}
                timeLimit={duel.timeLimit}
                onOpponentJoin={fetchDuelDetails}
            />
        );
    }

    return (
        <div className="bg-transparent text-[var(--foreground)] pb-28 pt-20 relative min-h-screen flex flex-col flex-1 overflow-x-hidden">
            {/* Ambient Background Grid & Radial Halos */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#6366F1]/5 via-[#EF4444]/5 to-transparent rounded-full blur-[110px] pointer-events-none z-0" />

            <StandardContainer className="relative z-10">
                <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header Block */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
                            <Sword size={12} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">
                                Classmate Trivia Arena
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.03em] leading-[0.9] uppercase italic">
                            Trivia <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">Arena</span>
                        </h1>
                        <p className="text-sm text-[var(--foreground-muted)] max-w-xl mx-auto font-medium opacity-80 leading-relaxed">
                            Join a lobby, wager XP, and duel your classmates in real-time speed battles generated from your class notes.
                        </p>
                    </div>
 
                    {/* Main Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Actions */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Action Box: Host a Duel */}
                            <div className="p-8 rounded-[2rem] bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md">
                                            <UserPlus size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-wider text-white">Create a Custom Duel</h3>
                                            <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase mt-0.5">Invite a classmate using a room code</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Host Mode Toggles */}
                                        <div className="flex p-1 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <button
                                                onClick={() => setHostMode('notes')}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                                    hostMode === 'notes'
                                                        ? "bg-white text-black font-black"
                                                        : "text-[var(--foreground-muted)] hover:text-white"
                                                )}
                                            >
                                                From Notes 📚
                                            </button>
                                            <button
                                                onClick={() => setHostMode('topic')}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                                    hostMode === 'topic'
                                                        ? "bg-white text-black font-black"
                                                        : "text-[var(--foreground-muted)] hover:text-white"
                                                )}
                                            >
                                                Quick Play Topic ⚡
                                            </button>
                                        </div>

                                        {hostMode === 'notes' ? (
                                            <div className="flex flex-col space-y-2.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Select Study Quiz</label>
                                                <select
                                                    value={selectedQuizId}
                                                    onChange={(e) => setSelectedQuizId(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none focus:border-white/20 transition-all cursor-pointer"
                                                    disabled={loadingPacks}
                                                >
                                                    {loadingPacks ? (
                                                        <option>Loading your quizzes...</option>
                                                    ) : quizzes.length > 0 ? (
                                                        quizzes.map(q => (
                                                            <option key={q.id} value={q.id} className="bg-zinc-950 text-white">{q.title}</option>
                                                        ))
                                                    ) : (
                                                        <option>No quizzes available</option>
                                                    )}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col space-y-2.5">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Topic to Study</label>
                                                <input
                                                    type="text"
                                                    value={quickTopicInput}
                                                    onChange={(e) => setQuickTopicInput(e.target.value)}
                                                    placeholder="E.g. Photosynthesis, General Science, World War II..."
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
                                                />
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {["General Knowledge 🌍", "Pop Culture 🎬", "Science & Tech 🚀", "World History ⏳", "Basic Mathematics 🧮"].map(suggestion => {
                                                        const cleanVal = suggestion.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
                                                        return (
                                                            <button
                                                                key={suggestion}
                                                                onClick={() => setQuickTopicInput(cleanVal)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-bold text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col space-y-2.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Match Wager (XP)</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[50, 100, 250, 500].map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => {
                                                            setWagerXp(val);
                                                            setWagerError(null);
                                                        }}
                                                        className={cn(
                                                            "py-2.5 rounded-lg text-xs font-black uppercase transition-all border cursor-pointer",
                                                            wagerXp === val 
                                                                ? "bg-white text-black border-white"
                                                                : "bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:bg-white/10"
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
                                </div>

                                <button
                                    onClick={handleCreateLobby}
                                    disabled={isQuickGenerating || (hostMode === 'notes' && quizzes.length === 0)}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider mt-6 transition-all flex items-center justify-center gap-2 cursor-pointer",
                                        (hostMode === 'notes' && quizzes.length === 0)
                                            ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                                            : "bg-white text-black hover:bg-white/90 active:scale-98"
                                    )}
                                >
                                    {isQuickGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                                            <span>Writing Questions...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={12} fill="currentColor" />
                                            <span>Generate Lobby Code</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Action Box: Join / Quick Match */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-zinc-950/45 border border-white/5 shadow-xl flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Join Active Lobby</h4>
                                        <input
                                            type="text"
                                            value={joinCodeInput}
                                            onChange={(e) => setJoinCodeInput(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6))}
                                            placeholder="Enter 6-digit Code"
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono font-bold text-center tracking-[0.2em] text-white outline-none focus:border-white/20 transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleJoinWithCode}
                                        className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider border border-white/5 mt-4 transition-all"
                                    >
                                        Connect Room
                                    </button>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-950/45 border border-white/5 shadow-xl flex flex-col justify-between relative overflow-hidden">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Matchmaking Match</h4>
                                        <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase leading-relaxed">Auto-pair with any classmate currently active online.</p>
                                    </div>
                                    <button 
                                        onClick={handleQuickMatch}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-black text-xs uppercase tracking-wider mt-4 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.2)] hover:opacity-95 active:scale-98"
                                    >
                                        Find Match
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Active Lobbies & Stats */}
                        <div className="space-y-6">
                            {/* Stats panel */}
                            <div className="p-6 rounded-[2rem] bg-zinc-950/45 border border-white/5 shadow-xl flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Your Wager Reserves</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Trophy size={14} className="text-[#F59E0B]" />
                                        <span className="text-xl font-black italic text-white">{user.xp?.toLocaleString() || "0"} XP</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#F59E0B]">
                                    <Shield size={18} />
                                </div>
                            </div>

                            {/* Live lobbies list */}
                            <div className="p-6 rounded-[2rem] bg-zinc-950/45 border border-white/5 shadow-xl space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                                        <Tv size={12} className="text-emerald-400" /> Live Rooms
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                    {activeLobbies.length > 0 ? (
                                        activeLobbies.map(lobby => (
                                            <div 
                                                key={lobby.id}
                                                className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-2 hover:border-white/10 transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-white">{lobby.hostName}</span>
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                        lobby.status === 'waiting' 
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" 
                                                            : "bg-zinc-800 text-zinc-500 border-zinc-700/50"
                                                    )}>
                                                        {lobby.status === 'waiting' ? "Open" : "Dueling"}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[var(--foreground-muted)] truncate font-semibold uppercase">{lobby.packTitle}</p>
                                                <div className="flex items-center justify-between text-[9px] text-[var(--foreground-muted)] uppercase font-black pt-1 border-t border-white/[0.02] mt-1">
                                                    <span>Wager: {lobby.wagerXp} XP</span>
                                                </div>
                                                {lobby.status === 'waiting' && lobby.hostId !== user.id && (
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
                                                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-white mt-2 transition-all"
                                                    >
                                                        Join Duel
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-zinc-500 italic text-center py-4 uppercase font-bold">No active public lobbies</p>
                                    )}
                                </div>
                            </div>
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
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-white w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Arena...</p>
            </div>
        }>
            <ArenaContent />
        </Suspense>
    );
}
