"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/ui/SiteHeader";
import CreateRoomModal from "@/components/features/lobby/CreateRoomModal";
import RoomView from "@/components/features/lobby/RoomView";
import type { AppMode } from "@/components/ui/SiteHeader";
import { useRouter } from "next/navigation";
import GlobalLeaderboard from "@/components/features/arena/GlobalLeaderboard";

const SECTIONS = [
    { id: "lobby", label: "Lobby", icon: "groups", desc: "Study together in real-time" },
    { id: "arena", label: "The Arena", icon: "swords", desc: "Competitive 1v1 duels" },
    { id: "leaderboard", label: "Rankings", icon: "emoji_events", desc: "Global scholar standings" },
];

interface PublicRoom {
    id: string;
    code: string;
    name: string;
    roomType: string;
    description?: string;
    memberCount: number;
    maxMembers: number;
    host: { id: string; name: string };
    createdAt: string;
}

interface PublicDuel {
    id: string;
    code: string;
    status: string;
    isHost: boolean;
    host: { id: string; name: string };
    challenger?: { id: string; name: string };
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    avatar?: string;
    xp: number;
    duelXp: number;
    wins: number;
    losses: number;
    winRate: number;
    socialLevel: number;
    rankTitle: string;
}

export default function HubClient() {
    const { user } = useUser();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("lobby");
    const [joinCode, setJoinCode] = useState("");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Lobby state
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [joiningRoom, setJoiningRoom] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    
    // Arena state
    const [arenaDuels, setArenaDuels] = useState<PublicDuel[]>([]);
    const [showDuelModal, setShowDuelModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
    const [myQuizzes, setMyQuizzes] = useState<any[]>([]);
    const [joinDuelCode, setJoinDuelCode] = useState("");
    const [arenaLoading, setArenaLoading] = useState(false);
    
    // Social level state
    const [socialLevel, setSocialLevel] = useState(1);
    const [rankTitle, setRankTitle] = useState("Novice");
    const [socialXp, setSocialXp] = useState(0);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const section = searchParams.get("s");
        if (section && SECTIONS.some(s => s.id === section)) {
            setActiveSection(section);
        }
    }, []);

    useEffect(() => {
        const handleToggleSidebar = () => {
            if (typeof window !== 'undefined') {
                if (window.innerWidth < 768) {
                    setMobileSidebarOpen(prev => !prev);
                } else {
                    setSidebarOpen(prev => !prev);
                }
            }
        };

        window.addEventListener('toggle-sidebar', handleToggleSidebar);
        return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    }, []);

    // Fetch public rooms when lobby section is active
    useEffect(() => {
        if (activeSection === "lobby" && !currentRoomId) {
            fetchPublicRooms();
        }
    }, [activeSection, currentRoomId]);

    // Fetch arena duels when arena section is active
    useEffect(() => {
        if (activeSection === "arena") {
            fetchArenaDuels();
            fetchMyQuizzes();
        }
    }, [activeSection]);

    // Removed legacy leaderboard fetch

    const fetchPublicRooms = async () => {
        try {
            const res = await fetch("/api/lobby?public=true");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPublicRooms(data.rooms || []);
                }
            }
        } catch (error) {
            console.error("Fetch rooms error:", error);
        }
    };

    const fetchArenaDuels = async () => {
        setArenaLoading(true);
        try {
            const res = await fetch("/api/arena?my=true");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setArenaDuels(data.duels || []);
                }
            }
        } catch (error) {
            console.error("Fetch duels error:", error);
        } finally {
            setArenaLoading(false);
        }
    };

    const fetchMyQuizzes = async () => {
        try {
            const res = await fetch("/api/library?type=quiz");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setMyQuizzes(data.generations || []);
                }
            }
        } catch (error) {
            console.error("Fetch quizzes error:", error);
        }
    };

    // Removed legacy fetchLeaderboard

    const handleJoinRoom = async () => {
        if (joinCode.length < 4) return;
        setJoiningRoom(true);
        setJoinError(null);

        try {
            const res = await fetch(`/api/lobby?code=${joinCode}`);
            const data = await res.json();

            if (data.success) {
                setCurrentRoomId(data.room.id);
                setJoinCode("");
            } else {
                setJoinError(data.error || "Failed to join room");
            }
        } catch (error) {
            setJoinError("Network error. Please try again.");
        } finally {
            setJoiningRoom(false);
        }
    };

    const handleCreateRoom = (roomId: string, code: string) => {
        setShowCreateRoom(false);
        setCurrentRoomId(roomId);
    };

    const handleJoinDuel = async () => {
        if (joinDuelCode.length < 4) return;
        setArenaLoading(true);
        setJoinError(null);

        try {
            const res = await fetch(`/api/arena?code=${joinDuelCode}`);
            const data = await res.json();

            if (data.success) {
                router.push(`/arena/${data.duel.id}`);
            } else {
                setJoinError(data.error || "Failed to join duel");
            }
        } catch (error) {
            setJoinError("Network error. Please try again.");
        } finally {
            setArenaLoading(false);
        }
    };

    const handleCreateDuel = async (quizId: string) => {
        setArenaLoading(true);
        try {
            const res = await fetch("/api/arena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ generation_id: quizId })
            });
            const data = await res.json();

            if (data.success) {
                router.push(`/arena/${data.duel.id}`);
            }
        } catch (error) {
            console.error("Create duel error:", error);
        } finally {
            setArenaLoading(false);
        }
    };

    const getLevelProgress = () => {
        const thresholds = [0, 500, 1500, 3000, 6000, 10000, 20000];
        const currentThreshold = thresholds[socialLevel - 1] || 0;
        const nextThreshold = thresholds[socialLevel] || thresholds[thresholds.length - 1];
        const progress = ((socialXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    // Room view mode
    if (currentRoomId) {
        return (
            <div className="h-[100dvh] bg-[var(--background)] overflow-hidden relative">
                <SiteHeader showLogo />
                <div className="h-full pt-24 p-6">
                    <button
                        onClick={() => setCurrentRoomId(null)}
                        className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm">Back to Lobby</span>
                    </button>
                    <RoomView roomId={currentRoomId} currentUserId={user.id || ""} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden pt-24 md:pt-16">
                <AnimatePresence>
                    {mobileSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                        />
                    )}
                </AnimatePresence>

                <aside 
                    className={`
                        fixed md:relative inset-y-0 left-0 z-[101] md:z-auto
                        ${sidebarOpen ? "md:w-[280px] md:opacity-100 md:p-4" : "md:w-0 md:opacity-0 md:p-0 md:overflow-hidden md:border-none"}
                        w-[280px] border-r border-[var(--border)] bg-[var(--card)] flex flex-col pt-24 shrink-0
                        transition-all duration-300 ease-out
                        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    `}
                >
                    <div className="flex flex-col h-full p-4 pt-24">
                        <nav className="space-y-2">
                            {SECTIONS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`w-full group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                        activeSection === s.id 
                                            ? "bg-[var(--card)] border-[var(--border)] shadow-lg" 
                                            : "bg-transparent border-transparent hover:bg-[var(--card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                        activeSection === s.id ? "bg-[var(--accent-bg)] text-[var(--accent)]" : "bg-[var(--background-tertiary)]"
                                    }`}>
                                        <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[13px] font-bold tracking-tight">{s.label}</p>
                                        <p className="text-[10px] opacity-40 leading-none mt-1">{s.desc}</p>
                                    </div>
                                    {activeSection === s.id && (
                                        <motion.div layoutId="hub-active" className="absolute left-0 w-1 h-6 bg-[var(--accent)] rounded-full" />
                                    )}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-[var(--secondary)]/10 to-transparent border border-[var(--secondary)]/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[16px] text-[var(--secondary)]">auto_awesome</span>
                                <span className="text-[11px] font-bold text-[var(--secondary)] uppercase tracking-wider">Social Level</span>
                            </div>
                            <p className="text-[20px] font-black text-[var(--foreground)] italic">{rankTitle}</p>
                            <div className="mt-3 h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--secondary)] shadow-[0_0_8px_var(--secondary-glow)] transition-all" style={{ width: `${getLevelProgress()}%` }} />
                            </div>
                            <p className="text-[9px] text-[var(--foreground-muted)] mt-2">Next rank at {socialLevel < 7 ? [500, 1500, 3000, 6000, 10000, 20000][socialLevel] : 'MAX'} XP</p>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-[var(--background)] p-8">
                    {/* Header Scroll Sentinel */}
                    <div data-header-sentinel className="absolute top-0 left-0 h-1 w-full pointer-events-none" />
                    <AnimatePresence mode="wait">
                        {/* ═══ LOBBY SECTION ═══ */}
                        {activeSection === "lobby" && (
                            <motion.div key="lobby" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl">
                                <div className="mb-10">
                                    <h1 className="text-3xl font-bold mb-2">Study Together</h1>
                                    <p className="text-[var(--foreground-muted)]">Collaborate with fellow scholars in synchronized sessions.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                    <button 
                                        onClick={() => setShowCreateRoom(true)}
                                        className="group relative p-8 text-left transition-all hover:-translate-y-1 active:scale-[0.98]" 
                                        style={{ background: "var(--card)", borderRadius: "24px", border: "1px solid var(--border)" }}
                                    >
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--success)]/10 flex items-center justify-center mb-6 border border-[var(--success)]/20 shadow-[0_0_20px_var(--success-glow)]">
                                            <span className="material-symbols-outlined text-2xl text-[var(--success)]">add_circle</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Create a Room</h3>
                                        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">Start a collaborative study session and invite others to join.</p>
                                        <div className="mt-8 flex items-center gap-2 text-[12px] font-bold text-[var(--success)] group-hover:gap-3 transition-all">
                                            Get Started
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </div>
                                    </button>

                                    <div className="p-8 group relative" style={{ background: "var(--card)", borderRadius: "24px", border: "1px solid var(--border)" }}>
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--secondary)]/10 flex items-center justify-center mb-6 transition-all group-focus-within:bg-[var(--secondary)]/20">
                                            <span className="material-symbols-outlined text-2xl text-[var(--secondary)]">login</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Join a Session</h3>
                                        <p className="text-sm text-[var(--foreground-muted)] mb-4 leading-relaxed">Enter an invite code to join a study room.</p>
                                        
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={joinCode} 
                                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                                placeholder="CODE" 
                                                maxLength={6}
                                                className="flex-1 px-5 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-center tracking-[0.3em] font-bold outline-none focus:border-[var(--accent)] transition-all" 
                                            />
                                            <button 
                                                onClick={handleJoinRoom}
                                                disabled={joinCode.length < 4 || joiningRoom} 
                                                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--background)] font-bold text-sm disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_24px_var(--accent-glow)]"
                                            >
                                                {joiningRoom ? "..." : "Join"}
                                            </button>
                                        </div>
                                        {joinError && <p className="text-[#EF4444] text-xs mt-2">{joinError}</p>}
                                    </div>
                                </div>
                                
                                <div className="p-6 rounded-3xl border border-[var(--border)] bg-gradient-to-r from-white/[0.02] to-transparent">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-[var(--secondary)]">auto_stories</span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-secondary)]">Active Public Sessions</p>
                                        </div>
                                        <button 
                                            onClick={fetchPublicRooms}
                                            className="text-[10px] text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] transition-colors"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                    
                                    {publicRooms.length > 0 ? (
                                        <div className="space-y-3">
                                            {publicRooms.map(room => (
                                                <div 
                                                    key={room.id}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-all cursor-pointer"
                                                    onClick={() => setCurrentRoomId(room.id)}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg text-[var(--success)]">groups</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-[var(--foreground)]">{room.name}</p>
                                                        <p className="text-[10px] text-[var(--foreground-muted)]">by {room.host.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-[var(--foreground-secondary)]">{room.memberCount}/{room.maxMembers}</p>
                                                        <p className="text-[10px] text-[var(--success)]">Join</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <span className="material-symbols-outlined text-4xl text-[var(--foreground)]/10 mb-3">groups</span>
                                            <p className="text-[var(--foreground-muted)] text-sm italic">No public rooms available</p>
                                            <button 
                                                onClick={() => setShowCreateRoom(true)}
                                                className="mt-4 text-[12px] font-bold text-[var(--success)] hover:underline underline-offset-4"
                                            >
                                                Create the first one!
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ ARENA SECTION ═══ */}
                        {activeSection === "arena" && (
                            <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="mb-10 flex items-start justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-2 text-[var(--error)]">The Arena</h1>
                                        <p className="text-[var(--foreground-muted)]">Challenge other scholars to 1v1 quiz duels!</p>
                                    </div>
                                    <span className="px-3 py-1 bg-[var(--error)] text-[var(--background)] text-[10px] font-black rounded-lg shadow-[0_4px_12px_var(--error-glow)]">RANKED SEASON 1</span>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <button 
                                        onClick={() => setShowDuelModal(true)}
                                        className="p-8 text-left transition-all hover:-translate-y-1 group" 
                                        style={{ background: "var(--card)", borderRadius: "24px", border: "1px solid var(--border)" }}
                                    >
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-center justify-center mb-6 shadow-[0_0_20px_var(--error-glow)]">
                                            <span className="material-symbols-outlined text-2xl text-[var(--error)]">add_circle</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Create Duel</h3>
                                        <p className="text-sm text-[var(--foreground-muted)]">Challenge a friend to a quiz duel. Select from your quizzes.</p>
                                    </button>

                                    <div className="p-8 group relative" style={{ background: "var(--card)", borderRadius: "24px", border: "1px solid var(--border)" }}>
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 flex items-center justify-center mb-6 shadow-[0_0_20px_var(--secondary-glow)]">
                                            <span className="material-symbols-outlined text-2xl text-[var(--secondary)]">login</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Join Duel</h3>
                                        <p className="text-sm text-[var(--foreground-muted)] mb-4">Enter a duel code to accept a challenge.</p>
                                        
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={joinDuelCode} 
                                                onChange={e => setJoinDuelCode(e.target.value.toUpperCase())}
                                                placeholder="CODE" 
                                                maxLength={6}
                                                className="flex-1 px-5 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-center tracking-[0.3em] font-bold outline-none focus:border-[var(--accent)] transition-all" 
                                            />
                                            <button 
                                                onClick={handleJoinDuel}
                                                disabled={joinDuelCode.length < 4 || arenaLoading} 
                                                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--background)] font-bold text-sm disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_24px_var(--accent-glow)]"
                                            >
                                                {arenaLoading ? "..." : "Join"}
                                            </button>
                                        </div>
                                        {joinError && <p className="text-[#EF4444] text-xs mt-2">{joinError}</p>}
                                    </div>
                                </div>

                                {/* My Active Duels */}
                                {arenaDuels.length > 0 && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold mb-4">Your Active Duels</h2>
                                        <div className="space-y-3">
                                            {arenaDuels.map(duel => (
                                                <Link
                                                    key={duel.id}
                                                    href={`/arena/${duel.id}`}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-all"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--error)]/10 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg text-[var(--error)]">swords</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-[var(--foreground)]">vs {duel.challenger?.name || duel.host.name}</p>
                                                        <p className="text-[10px] text-[var(--foreground-muted)]">Code: {duel.code} • {duel.status}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                                                        duel.status === 'WAITING' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                                                        duel.status === 'READY' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                                                        'bg-[var(--border)] text-[var(--foreground-muted)]'
                                                    }`}>
                                                        {duel.status}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Duel Stats */}
                                <div className="p-6 rounded-3xl border border-[var(--border)] bg-gradient-to-r from-[#EF4444]/5 to-transparent">
                                    <h2 className="text-lg font-bold mb-4">Arena Stats</h2>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                            <p className="text-2xl font-black text-[var(--secondary)]">{user.wins || 0}</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">Victories</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                            <p className="text-2xl font-black text-[var(--foreground)]">{user.winRate || 0}%</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">Win Rate</p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                            <p className="text-2xl font-black text-[var(--accent)]">{user.rank || '-'}</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">Rank</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ LEADERBOARD SECTION ═══ */}
                        {activeSection === "leaderboard" && (
                            <motion.div key="leader" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <GlobalLeaderboard currentUser={user} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={showCreateRoom}
                onClose={() => setShowCreateRoom(false)}
                onCreated={handleCreateRoom}
            />

            {/* Create Duel Modal */}
            <AnimatePresence>
                {showDuelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowDuelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-[var(--border)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--error)]/10 flex items-center justify-center border border-[var(--error)]/20 shadow-[0_0_12px_var(--error-glow)]">
                                            <span className="material-symbols-outlined text-xl text-[var(--error)]">swords</span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-[var(--foreground)]">Create Duel</h2>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">Select a quiz for the duel</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDuelModal(false)} className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-3">
                                {myQuizzes.length > 0 ? (
                                    myQuizzes.slice(0, 10).map(quiz => (
                                        <button
                                            key={quiz.id}
                                            onClick={() => {
                                                handleCreateDuel(quiz.id);
                                                setShowDuelModal(false);
                                            }}
                                            className="w-full p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--border)] text-left transition-all"
                                        >
                                            <p className="font-bold text-[var(--foreground)]">{quiz.title}</p>
                                            <p className="text-[10px] text-[var(--foreground-muted)]">{quiz.content?.questions?.length || 0} Questions</p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-[var(--foreground-muted)]">No quizzes found</p>
                                        <Link href="/create" className="text-[var(--success)] text-sm mt-2 inline-block">Create one first</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
