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
        setIsSearching(true);
        addToast("Searching for online classmates...", "info");
        
        // Add artificial delay to make matchmaking search feel responsive
        await new Promise(r => setTimeout(r, 1500));
        
        try {
            const res = await fetch("/api/arena");
            const data = await res.json();
            if (data.success && data.duels && data.duels.length > 0) {
                const joinable = data.duels.find((d: any) => d.hostId !== user.id && d.status === 'waiting');
                if (joinable) {
                    addToast("Match found! Joining room...", "success");
                    const joinRes = await fetch(`/api/arena?code=${joinable.code}`);
                    const joinData = await joinRes.json();
                    if (joinData.success) {
                        router.push(`/arena?id=${joinData.duel.id}`);
                        setIsSearching(false);
                        return;
                    }
                }
            }

            if (quizzes.length === 0) {
                addToast("You don't have any generated quizzes yet. Create one first!", "error");
                setIsSearching(false);
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
        } finally {
            setIsSearching(false);
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

    const currentStudentName = user?.firstName || user?.name || "Scholar";

    return (
        <div className="bg-transparent text-[var(--foreground)] pt-[84px] pb-3 md:pb-4 relative flex flex-col flex-1 h-[calc(100vh-68px)] overflow-hidden">
            {/* Ambient Background Grid & Radial Halos */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#9673F5]/5 via-[#E5A93C]/5 to-transparent rounded-full blur-[110px] pointer-events-none z-0" />

            <StandardContainer className="relative z-10 flex-1 flex flex-col min-h-0 py-0 h-full">
                <div className="w-full max-w-4xl mx-auto flex flex-col justify-between gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 min-h-0">
                    
                    {/* Header Block */}
                    <div className="text-center space-y-1.5 shrink-0 mb-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
                            <Sword size={9} className="text-[var(--accent)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)]">
                                Classmate Trivia Arena
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase italic leading-none">
                            Trivia <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Arena</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] max-w-xl mx-auto font-medium opacity-80">
                            Join a lobby, wager XP, and duel your classmates in real-time speed battles.
                        </p>
                    </div>
 
                    {/* Main Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 flex-1 min-h-0 h-full">
                        {/* Left Column: Actions */}
                        <div className="md:col-span-2 flex flex-col gap-3 md:gap-4 min-h-0 h-full">
                            {/* Action Box: Host a Duel */}
                            <GlassmorphicCard 
                                intensity="medium" 
                                radius="28px" 
                                className="p-4 md:p-5 flex flex-col justify-between relative overflow-hidden flex-1 min-h-0 border border-white/5 shadow-2xl"
                            >
                                <div className="space-y-3 md:space-y-4 flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] shadow-md">
                                            <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-white">Create a Custom Duel</h3>
                                            <p className="text-[8px] sm:text-[9px] text-[var(--foreground-muted)] font-bold uppercase mt-0.5">Invite a classmate using a room code</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                                        {/* Host Mode Toggles */}
                                        <div className="flex p-0.5 bg-white/[0.02] border border-white/5 rounded-xl shrink-0">
                                            <button
                                                onClick={() => setHostMode('notes')}
                                                className={cn(
                                                    "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
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
                                                    "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                                    hostMode === 'topic'
                                                        ? "bg-white text-black font-black"
                                                        : "text-[var(--foreground-muted)] hover:text-white"
                                                )}
                                            >
                                                Quick Play Topic ⚡
                                            </button>
                                        </div>

                                        {hostMode === 'notes' ? (
                                            <div className="flex flex-col space-y-1.5 shrink-0">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Select Study Quiz</label>
                                                <select
                                                    value={selectedQuizId}
                                                    onChange={(e) => setSelectedQuizId(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 sm:py-2.5 text-xs font-bold text-white outline-none focus:border-white/20 transition-all cursor-pointer"
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
                                            <div className="flex flex-col space-y-1.5 shrink-0">
                                                <label className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Topic to Study</label>
                                                <input
                                                    type="text"
                                                    value={quickTopicInput}
                                                    onChange={(e) => setQuickTopicInput(e.target.value)}
                                                    placeholder="E.g. Photosynthesis, General Science..."
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 sm:py-2.5 text-base sm:text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
                                                />
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {["General Knowledge 🌍", "Pop Culture 🎬", "Science & Tech 🚀", "World History ⏳", "Basic Mathematics 🧮"].map(suggestion => {
                                                        const cleanVal = suggestion.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
                                                        return (
                                                            <button
                                                                key={suggestion}
                                                                onClick={() => setQuickTopicInput(cleanVal)}
                                                                className="px-2 py-1 sm:py-0.5 rounded-lg bg-white/[0.02] border border-white/5 text-[8px] font-bold text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col space-y-1.5 shrink-0">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Match Wager (XP)</label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {[50, 100, 250, 500].map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => {
                                                            setWagerXp(val);
                                                            setWagerError(null);
                                                        }}
                                                        className={cn(
                                                            "py-2 rounded-lg text-[10px] font-black uppercase transition-all border cursor-pointer",
                                                            wagerXp === val 
                                                                ? "bg-white text-black border-white"
                                                                : "bg-white/5 border-white/5 text-[var(--foreground-muted)] hover:bg-white/10"
                                                        )}
                                                        style={{
                                                            boxShadow: wagerXp === val ? "0 0 12px rgba(229, 169, 60, 0.25)" : undefined,
                                                            borderColor: wagerXp === val ? "var(--accent)" : "rgba(255,255,255,0.05)"
                                                        }}
                                                    >
                                                        {val} XP
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {wagerError && (
                                            <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse shrink-0">
                                                <AlertCircle size={10} />
                                                <span>{wagerError}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateLobby}
                                    disabled={isQuickGenerating || (hostMode === 'notes' && quizzes.length === 0)}
                                    className={cn(
                                        "w-full py-3.5 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider mt-3 md:mt-4 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg",
                                        (hostMode === 'notes' && quizzes.length === 0)
                                            ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                                            : "bg-[var(--accent)] text-zinc-950 hover:opacity-95 active:scale-98"
                                    )}
                                >
                                    {isQuickGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                                            <span>Writing Questions...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={10} fill="currentColor" />
                                            <span>Generate Lobby Code</span>
                                        </>
                                    )}
                                </button>
                            </GlassmorphicCard>

                            {/* Action Box: Join / Quick Match */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0 mb-1">
                                <GlassmorphicCard intensity="light" radius="24px" className="p-3.5 border border-white/5 shadow-xl flex flex-col justify-between h-[115px] sm:h-[120px]">
                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Join Active Lobby</h4>
                                        <input
                                            type="text"
                                            value={joinCodeInput}
                                            onChange={(e) => setJoinCodeInput(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6))}
                                            placeholder="6-digit Code"
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-1.5 text-base sm:text-xs font-mono font-bold text-center tracking-[0.25em] text-white outline-none focus:border-white/20 transition-all uppercase"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleJoinWithCode}
                                        className="w-full py-2.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-xs sm:text-[10px] uppercase tracking-wider border border-white/5 transition-all cursor-pointer"
                                    >
                                        Connect Room
                                    </button>
                                </GlassmorphicCard>

                                <GlassmorphicCard intensity="light" radius="24px" className={cn(
                                    "p-3.5 border border-white/5 shadow-xl flex flex-col justify-between h-[115px] sm:h-[120px] relative overflow-hidden",
                                    isSearching && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-zinc-950"
                                )}>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Matchmaking Match</h4>
                                        <p className="text-[8px] sm:text-[9px] text-[var(--foreground-muted)] font-bold uppercase leading-none mt-0.5">Auto-pair with any classmate active online.</p>
                                    </div>
                                    <button 
                                        onClick={handleQuickMatch}
                                        disabled={isSearching}
                                        className={cn(
                                            "w-full py-2.5 sm:py-2 rounded-xl text-white font-black text-xs sm:text-[10px] uppercase tracking-wider transition-all shadow-lg cursor-pointer",
                                            isSearching 
                                                ? "bg-zinc-800 animate-pulse text-zinc-500"
                                                : "bg-gradient-to-r from-indigo-500 to-rose-500 hover:opacity-95 active:scale-98"
                                        )}
                                        style={{
                                            boxShadow: isSearching ? "0 0 15px rgba(99,102,241,0.4)" : "0 4px 15px rgba(99,102,241,0.25)"
                                        }}
                                    >
                                        {isSearching ? "Searching..." : "Find Match"}
                                    </button>
                                </GlassmorphicCard>
                            </div>
                        </div>

                        {/* Right Column: Active Lobbies & Stats */}
                        <div className="flex flex-col gap-4 min-h-0 h-full">
                            {/* Stats panel */}
                            <GlassmorphicCard intensity="light" radius="24px" className="p-4 border border-white/5 shadow-xl flex items-center justify-between shrink-0">
                                <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Your Wager Reserves</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Trophy size={14} className="text-[#F59E0B]" />
                                        <span className="text-xl font-black italic text-white">{user.xp?.toLocaleString() || "0"} XP</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#F59E0B]">
                                    <Shield size={18} />
                                </div>
                            </GlassmorphicCard>

                            {/* Socratic XP Explainer card */}
                            <GlassmorphicCard intensity="light" radius="24px" className="p-4 border border-white/5 shadow-xl flex flex-col gap-1.5 relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-white pointer-events-none">
                                    <Zap size={60} />
                                </div>
                                <div className="flex items-center gap-1.5 text-[#E5A93C]">
                                    <Zap size={11} fill="currentColor" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Professor's Advice</span>
                                </div>
                                <p className="text-[10px] text-zinc-300 leading-relaxed font-medium font-serif italic">
                                    "Look sha, XP is just your study sweat equity. You review notes, run flashcard drills, you secure XP. In the Arena, you wager that XP on speed duels. You win the speed battle, you take the pot. Keep it burning, or the rank is lost."
                                </p>
                            </GlassmorphicCard>

                            {/* Live lobbies list */}
                            <GlassmorphicCard intensity="light" radius="24px" className="p-4 border border-white/5 shadow-xl space-y-3 flex-1 min-h-0 flex flex-col">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                                        <Tv size={12} className="text-emerald-400" /> Live Rooms
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                                    {activeLobbies.length > 0 ? (
                                        activeLobbies.map(lobby => (
                                            <div 
                                                key={lobby.id}
                                                className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-2 hover:border-white/10 transition-all"
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
                                                        className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-white mt-1 transition-all cursor-pointer"
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
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-white w-10 h-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Arena...</p>
            </div>
        }>
            <ArenaContent />
        </Suspense>
    );
}
