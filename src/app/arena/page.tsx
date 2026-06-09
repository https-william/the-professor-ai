"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
    TrendingUp,
    Shield,
    Zap,
    Trophy,
    X,
    Play,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Lock,
    Sparkles
} from "lucide-react";

interface StudyPack {
    id: string;
    title: string;
    source_text?: string;
}

interface Lobby {
    id: string;
    hostName: string;
    packTitle: string;
    wagerXp: number;
    spectators: number;
    status: "waiting" | "in_progress";
}

export default function TriviaArena() {
    const router = useRouter();
    const { user, refreshUser } = useUser();
    const { addToast } = useToasts();
    const supabase = createClient();

    // Navigation & State
    const [gameState, setGameState] = useState<'lobby' | 'creating' | 'dueling' | 'results'>('lobby');
    const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
    const [loadingPacks, setLoadingPacks] = useState(false);

    // Duel Creation Settings
    const [selectedPackId, setSelectedPackId] = useState<string>("");
    const [wagerXp, setWagerXp] = useState<number>(50);
    const [joinCodeInput, setJoinCodeInput] = useState<string>("");
    const [generatedCode, setGeneratedCode] = useState<string>("");
    const [wagerError, setWagerError] = useState<string | null>(null);

    // Dueling Simulator States
    const [opponentName, setOpponentName] = useState<string>("Bolu");
    const [opponentAvatar, setOpponentAvatar] = useState<string>("B");
    const [quizTitle, setQuizTitle] = useState<string>("Cell Division");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userScore, setUserScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timer, setTimer] = useState(15);
    const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);

    // Simulated Questions
    const questions = useMemo(() => [
        {
            question: "Which phase of mitosis involves the alignment of chromosomes along the equatorial plate?",
            options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
            correctIndex: 1,
            explanation: "Metaphase is characterized by chromosomes lining up at the cell's equator."
        },
        {
            question: "What structure separates sister chromatids during Anaphase?",
            options: ["Nuclear envelope", "Spindle fibers", "Cell wall", "Chloroplast"],
            correctIndex: 1,
            explanation: "Spindle fibers contract and pull chromatids to opposite poles."
        },
        {
            question: "Which of the following is NOT an essential element of a legally binding contract?",
            options: ["Offer", "Acceptance", "Consideration", "Written signatures"],
            correctIndex: 3,
            explanation: "Many contracts can be oral; written signatures are not globally required for validity unless specified by law."
        },
        {
            question: "In contract law, what does 'consideration' refer to?",
            options: ["Politeness", "The price paid for a promise", "Time given to review", "Mental capacity"],
            correctIndex: 1,
            explanation: "Consideration represents something of value exchanged between the parties."
        },
        {
            question: "What is the primary function of the nuclear envelope reconstruction during Telophase?",
            options: ["To digest nutrients", "To house the new identical sets of chromosomes", "To divide the cytoplasm", "To create energy"],
            correctIndex: 1,
            explanation: "During Telophase, new nuclear envelopes form around each set of separated chromosomes."
        }
    ], []);

    // Simulated Lobbies
    const [activeLobbies, setActiveLobbies] = useState<Lobby[]>([
        { id: "1", hostName: "Amaka", packTitle: "Intro to Contract Law", wagerXp: 100, spectators: 5, status: "waiting" },
        { id: "2", hostName: "Ifeanyi", packTitle: "Mitosis Prep 100L", wagerXp: 50, spectators: 2, status: "in_progress" },
        { id: "3", hostName: "Tunde", packTitle: "Organic Chem Basics", wagerXp: 150, spectators: 12, status: "waiting" }
    ]);

    // Fetch user study packs for creation selection
    useEffect(() => {
        const fetchPacks = async () => {
            setLoadingPacks(true);
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const { data } = await supabase
                        .from("study_packs")
                        .select("id, title")
                        .eq("user_id", authUser.id)
                        .order("created_at", { ascending: false });
                    if (data) {
                        setStudyPacks(data);
                        if (data.length > 0) setSelectedPackId(data[0].id);
                    }
                }
            } catch (e) {
                console.error("Failed to load packs", e);
            } finally {
                setLoadingPacks(false);
            }
        };
        fetchPacks();
    }, [supabase]);

    // Duel Simulator Timer
    useEffect(() => {
        if (gameState !== 'dueling') return;

        if (timer <= 0) {
            handleAnswerSelect(-1); // Count as incorrect/timed out
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer, gameState]);

    // Simulated opponent answer behavior
    useEffect(() => {
        if (gameState !== 'dueling' || selectedAnswer !== null) return;

        // Opponent answers randomly between 2 and 7 seconds
        const delay = Math.random() * 5000 + 2000;
        const timeout = setTimeout(() => {
            const isCorrect = Math.random() > 0.3; // 70% chance to be correct
            if (isCorrect) {
                setOpponentScore(prev => prev + 1);
            }
        }, delay);

        return () => clearTimeout(timeout);
    }, [currentQuestionIndex, gameState, selectedAnswer]);

    const handleCreateLobby = () => {
        if (user.xp < wagerXp) {
            setWagerError(`You need at least ${wagerXp} XP to wager this match.`);
            return;
        }
        setWagerError(null);
        setGameState('creating');
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);

        // Simulate waiting for classmate
        setTimeout(() => {
            addToast("Classmate joined! Preparing Trivia Arena...", "success");
            startDuelSimulation("Ifeanyi", "I", studyPacks.find(p => p.id === selectedPackId)?.title || "Study Pack");
        }, 3500);
    };

    const handleJoinWithCode = () => {
        if (!joinCodeInput || joinCodeInput.length < 6) {
            addToast("Please enter a valid 6-digit room code", "error");
            return;
        }
        addToast("Connecting to room...", "info");
        setTimeout(() => {
            startDuelSimulation("Amaka", "A", "Contract Law 101");
        }, 1500);
    };

    const handleQuickMatch = () => {
        addToast("Searching for online classmates...", "info");
        setTimeout(() => {
            startDuelSimulation("Tunde", "T", "Mitosis Prep 100L");
        }, 2000);
    };

    const startDuelSimulation = (name: string, avatar: string, title: string) => {
        setOpponentName(name);
        setOpponentAvatar(avatar);
        setQuizTitle(title);
        setUserScore(0);
        setOpponentScore(0);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setTimer(15);
        setAnsweredQuestions([]);
        setGameState('dueling');
    };

    const handleAnswerSelect = (index: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(index);

        const currentQ = questions[currentQuestionIndex];
        const isCorrect = index === currentQ.correctIndex;

        if (isCorrect) {
            setUserScore(prev => prev + 1);
            addToast("Correct! +10 Points", "success");
        } else {
            addToast(index === -1 ? "Time's up!" : "Incorrect!", "error");
        }

        // Proceed after 2 seconds
        setTimeout(() => {
            if (currentQuestionIndex < 4) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setTimer(15);
            } else {
                setGameState('results');
                awardWinnerXp();
            }
        }, 2000);
    };

    const awardWinnerXp = () => {
        const isUserWinner = userScore > opponentScore;
        const isDraw = userScore === opponentScore;

        let xpGained = 0;
        if (isUserWinner) {
            xpGained = wagerXp;
            addToast(`VICTORY! You won the duel and earned ${wagerXp} XP!`, "success");
        } else if (isDraw) {
            xpGained = 0;
            addToast("It's a draw! XP wager returned.", "info");
        } else {
            xpGained = -wagerXp;
            addToast(`DEFEAT! You lost the duel and lost ${wagerXp} XP.`, "error");
        }

        // Send XP transaction to database
        supabase.auth.getSession().then(({ data: { session } }: any) => {
            fetch("/api/user/activity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({ type: "trivia_duel", customXp: xpGained })
            }).then(() => refreshUser()).catch(e => console.error("XP error", e));
        });
    };

    return (
        <div className="bg-[var(--bg)] text-[var(--foreground)] pb-28 pt-20 relative min-h-screen flex flex-col flex-1 overflow-x-hidden">
            {/* Ambient Background Grid & Radial Halos */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#6366F1]/5 via-[#EF4444]/5 to-transparent rounded-full blur-[110px] pointer-events-none z-0" />

            <StandardContainer className="relative z-10">
                <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header Block */}
                    {gameState === 'lobby' && (
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
                    )}

                    {/* Main Panels */}
                    <AnimatePresence mode="wait">
                        {gameState === 'lobby' && (
                            <motion.div 
                                key="lobby"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                {/* Left Column: Actions */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Action Box: Host a Duel */}
                                    <div className="p-8 rounded-[2rem] bg-zinc-950/45 backdrop-blur-2xl border border-white/5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400 shadow-md">
                                                    <UserPlus size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Create a Custom Duel</h3>
                                                    <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase mt-0.5">Invite a classmate using a room code</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex flex-col space-y-2.5">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Select Study Pack</label>
                                                    <select
                                                        value={selectedPackId}
                                                        onChange={(e) => setSelectedPackId(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-xs font-bold text-white outline-none focus:border-white/20 transition-all cursor-pointer"
                                                        disabled={loadingPacks}
                                                    >
                                                        {loadingPacks ? (
                                                            <option>Loading your packs...</option>
                                                        ) : studyPacks.length > 0 ? (
                                                            studyPacks.map(p => (
                                                                <option key={p.id} value={p.id} className="bg-zinc-950 text-white">{p.title}</option>
                                                            ))
                                                        ) : (
                                                            <option>No study packs available</option>
                                                        )}
                                                    </select>
                                                </div>

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
                                                                    "py-2.5 rounded-lg text-xs font-black uppercase transition-all border",
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
                                            disabled={studyPacks.length === 0}
                                            className={cn(
                                                "w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider mt-6 transition-all flex items-center justify-center gap-2",
                                                studyPacks.length === 0
                                                    ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                                                    : "bg-white text-black hover:bg-white/90 active:scale-98"
                                            )}
                                        >
                                            <Play size={12} fill="currentColor" />
                                            <span>Generate Lobby Code</span>
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
                                                    onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
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

                                        <div className="space-y-3">
                                            {activeLobbies.map(lobby => (
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
                                                        <span className="flex items-center gap-1">
                                                            <Users size={10} /> {lobby.spectators} watching
                                                        </span>
                                                    </div>
                                                    {lobby.status === 'in_progress' && (
                                                        <button 
                                                            onClick={() => {
                                                                addToast("Connecting as Spectator...", "info");
                                                                startDuelSimulation(lobby.hostName, lobby.hostName[0], lobby.packTitle);
                                                            }}
                                                            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-white mt-2 transition-all"
                                                        >
                                                            Spectate Match
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'creating' && (
                            <motion.div 
                                key="creating"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-md mx-auto p-8 rounded-[2.5rem] bg-zinc-950/45 border border-white/5 shadow-2xl text-center space-y-6"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                                    <Loader2 size={32} className="animate-spin" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-white">Lobby Created</h3>
                                    <p className="text-xs text-[var(--foreground-muted)] font-bold uppercase leading-relaxed">Waiting for a classmate to join this dueling ring...</p>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Room Join Code</span>
                                    <h2 className="text-4xl font-mono font-black tracking-[0.2em] text-white pl-2">{generatedCode}</h2>
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase">Send this 6-digit code to your classmate</p>
                                </div>

                                <button
                                    onClick={() => setGameState('lobby')}
                                    className="px-6 py-3 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all w-full cursor-pointer"
                                >
                                    Cancel Lobby
                                </button>
                            </motion.div>
                        )}

                        {gameState === 'dueling' && (
                            <motion.div 
                                key="dueling"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-3xl mx-auto space-y-6"
                            >
                                {/* Dueling scoreboard */}
                                <div className="p-6 rounded-[2rem] bg-zinc-950/45 border border-white/5 shadow-2xl flex items-center justify-between gap-4 relative overflow-hidden">
                                    {/* Left Player */}
                                    <div className="flex items-center gap-3 w-1/3">
                                        <div className="w-10 h-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm shadow-lg">
                                            {user.firstName ? user.firstName[0].toUpperCase() : "S"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{user.firstName || "You"}</p>
                                            <p className="text-sm font-black text-indigo-400 mt-0.5">{userScore * 10} pts</p>
                                        </div>
                                    </div>

                                    {/* Score meter / vs */}
                                    <div className="flex flex-col items-center justify-center w-1/3">
                                        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase text-rose-400 tracking-widest flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                            <span>Live Duel</span>
                                        </div>
                                        <div className="text-xs font-black font-mono tracking-widest mt-2 text-white">
                                            {currentQuestionIndex + 1} / 5
                                        </div>
                                    </div>

                                    {/* Right Player */}
                                    <div className="flex items-center gap-3 w-1/3 justify-end text-right">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{opponentName}</p>
                                            <p className="text-sm font-black text-rose-400 mt-0.5">{opponentScore * 10} pts</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-rose-500 text-white font-black flex items-center justify-center text-sm shadow-lg">
                                            {opponentAvatar}
                                        </div>
                                    </div>

                                    {/* Duel loading indicator bars */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                                        <div 
                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                            style={{ width: `${(timer / 15) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Active Question Card */}
                                <div className="p-8 rounded-[2.5rem] bg-zinc-950/45 border border-white/5 shadow-2xl relative overflow-hidden space-y-6 min-h-[300px]">
                                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
                                            {quizTitle}
                                        </span>
                                        <span className="text-[10px] font-mono font-black text-rose-400">
                                            {timer}s remaining
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black leading-relaxed text-white">
                                        {questions[currentQuestionIndex].question}
                                    </h3>

                                    <div className="grid gap-3">
                                        {questions[currentQuestionIndex].options.map((opt, i) => {
                                            const isCorrect = i === questions[currentQuestionIndex].correctIndex;
                                            const isChosen = selectedAnswer === i;
                                            const showFeedback = selectedAnswer !== null;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAnswerSelect(i)}
                                                    disabled={selectedAnswer !== null}
                                                    className={cn(
                                                        "w-full p-5 text-left text-xs font-semibold rounded-2xl transition-all border flex items-center justify-between",
                                                        showFeedback
                                                            ? isCorrect
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold shadow-[0_8px_32px_rgba(16,185,129,0.1)]"
                                                                : isChosen
                                                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                                                    : "bg-white/5 border-white/5 opacity-30"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                                    )}
                                                >
                                                    <span>{opt}</span>
                                                    {showFeedback && isCorrect && <CheckCircle2 size={16} className="text-emerald-500" />}
                                                    {showFeedback && !isCorrect && isChosen && <span className="text-red-500 font-bold text-xs">✗</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'results' && (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-md mx-auto p-8 rounded-[2.5rem] bg-zinc-950/45 border border-white/5 shadow-2xl text-center space-y-6"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-[#F59E0B] shadow-xl">
                                    <Trophy size={32} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-wider italic text-white">
                                        {userScore > opponentScore ? "Victory Conquered!" : userScore === opponentScore ? "Draw Match" : "Defeat Conquered"}
                                    </h3>
                                    <p className="text-[10px] text-[var(--foreground-muted)] font-black uppercase tracking-widest">
                                        {userScore > opponentScore ? `You beat ${opponentName}` : userScore === opponentScore ? "Points are tied" : `${opponentName} beat you`}
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Your Score</span>
                                        <h4 className="text-2xl font-black text-white mt-1">{userScore * 10} pts</h4>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">{opponentName}'s Score</span>
                                        <h4 className="text-2xl font-black text-white mt-1">{opponentScore * 10} pts</h4>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-center gap-2 text-xs font-semibold text-white">
                                    <Zap size={14} className="text-[#F59E0B]" />
                                    <span>
                                        {userScore > opponentScore 
                                            ? `Received +${wagerXp} XP bonus!` 
                                            : userScore === opponentScore 
                                                ? "Wager returned." 
                                                : `Lost -${wagerXp} XP.`}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setGameState('lobby')}
                                    className="px-6 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-wider w-full hover:bg-white/90 active:scale-98 transition-all cursor-pointer shadow-xl shadow-amber-500/10"
                                >
                                    Back to Arena Lobby
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </StandardContainer>
        </div>
    );
}
