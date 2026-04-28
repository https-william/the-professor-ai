"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    Swords, 
    Trophy, 
    Sparkles, 
    PlusCircle, 
    LogIn, 
    ArrowLeft, 
    BookOpen,
    ArrowRight,
    Search,
    X
} from "lucide-react";

import CreateRoomModal from "@/components/features/lobby/CreateRoomModal";
import RoomView from "@/components/features/lobby/RoomView";

import { useRouter } from "next/navigation";
import GlobalLeaderboard from "@/components/features/arena/GlobalLeaderboard";
import { Button } from "@/components/ui/button";
import { safeFetch } from "@/lib/api";

const SECTIONS = [
    { id: "lobby", label: "Lobby", icon: Users as any, desc: "Study together in real-time" },
    { id: "arena", label: "The Arena", icon: Swords as any, desc: "Competitive 1v1 duels" },
    { id: "leaderboard", label: "Rankings", icon: Trophy as any, desc: "Global scholar standings" },
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

    useEffect(() => {
        if (activeSection === "lobby" && !currentRoomId) {
            fetchPublicRooms();
        }
    }, [activeSection, currentRoomId]);

    useEffect(() => {
        if (activeSection === "arena") {
            fetchArenaDuels();
            fetchMyQuizzes();
        }
    }, [activeSection]);

    const fetchPublicRooms = async () => {
        const { success, data, error } = await safeFetch<any>("/api/lobby?public=true");
        if (success && data?.success) {
            setPublicRooms(data.rooms || []);
        } else if (error) {
            console.error("Fetch rooms error:", error);
        }
    };

    const fetchArenaDuels = async () => {
        setArenaLoading(true);
        const { success, data, error } = await safeFetch<any>("/api/arena?my=true");
        if (success && data?.success) {
            setArenaDuels(data.duels || []);
        } else if (error) {
            console.error("Fetch duels error:", error);
        }
        setArenaLoading(false);
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

    const handleJoinRoom = async () => {
        if (joinCode.length < 4) return;
        setJoiningRoom(true);
        setJoinError(null);

        const { success, data, error } = await safeFetch<any>(`/api/lobby?code=${joinCode}`);
        
        if (success && data?.success) {
            setCurrentRoomId(data.room.id);
            setJoinCode("");
        } else {
            setJoinError(error || data?.error || "Scholarly synchronization failed.");
        }
        setJoiningRoom(false);
    };

    const handleCreateRoom = (roomId: string) => {
        setShowCreateRoom(false);
        setCurrentRoomId(roomId);
    };

    const handleJoinDuel = async () => {
        if (joinDuelCode.length < 4) return;
        setArenaLoading(true);
        setJoinError(null);

        const { success, data, error } = await safeFetch<any>(`/api/arena?code=${joinDuelCode}`);

        if (success && data?.success) {
            router.push(`/arena?id=${data.duel.id}`);
        } else {
            setJoinError(error || data?.error || "Arena synchronization failed.");
        }
        setArenaLoading(false);
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
                router.push(`/arena?id=${data.duel.id}`);
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

    if (currentRoomId) {
        return (
            <div className="h-[100dvh] bg-[var(--background)] overflow-hidden relative">
                <div className="h-full p-6">
                    <button
                        onClick={() => setCurrentRoomId(null)}
                        className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-bold">Back to Lobby</span>
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
                        w-[280px] border-r border-[var(--border)] bg-[var(--card)] flex flex-col shrink-0
                        transition-all duration-300 ease-out
                        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    `}
                >
                    <div className="flex flex-col h-full p-4 pt-16">
                        <nav className="space-y-2">
                            {SECTIONS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                        activeSection === s.id 
                                            ? "bg-[var(--card)] border-[var(--border)] shadow-lg" 
                                            : "bg-transparent border-transparent hover:bg-[var(--card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                        activeSection === s.id ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--background-tertiary)]"
                                    }`}>
                                        <s.icon size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[13px] font-bold tracking-tight">{s.label}</p>
                                        <p className="text-[10px] opacity-40 leading-none mt-1">{s.desc}</p>
                                    </div>
                                    {activeSection === s.id && (
                                        <motion.div layoutId="hub-active" className="absolute left-0 w-1 h-6 bg-[var(--foreground)] rounded-full" />
                                    )}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto p-4 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--border)]">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={16} className="text-[var(--foreground)] opacity-40" />
                                <span className="text-[11px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.2em]">Social Level</span>
                            </div>
                            <p className="text-xl font-black text-[var(--foreground)] italic tracking-tighter">{rankTitle}</p>
                            <div className="mt-3 h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--foreground)] transition-all" style={{ width: `${getLevelProgress()}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mt-2">Next rank at {socialLevel < 7 ? [500, 1500, 3000, 6000, 10000, 20000][socialLevel] : 'MAX'} XP</p>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-[var(--background)] p-8">
                    <AnimatePresence mode="wait">
                        {activeSection === "lobby" && (
                            <motion.div key="lobby" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                                <div className="mb-10 text-center md:text-left">
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">Study Together</h1>
                                    <p className="text-[var(--foreground-muted)] font-medium">Collaborate with fellow scholars in synchronized sessions.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                    <button 
                                        onClick={() => setShowCreateRoom(true)}
                                        className="group relative p-8 text-left transition-all bg-[var(--card)] border border-[var(--border)] rounded-[32px] overflow-hidden"
                                    >
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--foreground)]/[0.03] flex items-center justify-center mb-6 border border-[var(--border)] shadow-sm">
                                            <PlusCircle size={24} strokeWidth={2} className="text-[var(--foreground)]" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight mb-2">Create Room</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed font-medium">Start a private or public study session.</p>
                                        <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-all">
                                            Start Session
                                            <ArrowRight size={14} />
                                        </div>
                                    </button>

                                    <div className="p-8 group relative bg-[var(--card)] border border-[var(--border)] rounded-[32px]">
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--foreground)]/[0.03] flex items-center justify-center mb-6 border border-[var(--border)] shadow-sm">
                                            <LogIn size={24} strokeWidth={2} className="text-[var(--foreground)]" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight mb-2">Join Session</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-6 font-medium leading-relaxed">Enter an invite code to join a room.</p>
                                        
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={joinCode} 
                                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                                placeholder="CODE" 
                                                maxLength={6}
                                                className="flex-1 px-5 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-center tracking-[0.3em] font-black outline-none focus:border-[var(--foreground)] transition-all" 
                                            />
                                            <Button 
                                                onClick={handleJoinRoom}
                                                loading={joiningRoom}
                                                disabled={joinCode.length < 4} 
                                                className="px-6 py-3 shadow-xl"
                                                variant="skeuo-primary"
                                            >
                                                Join
                                            </Button>
                                        </div>
                                        {joinError && <p className="text-red-500 text-[10px] font-black uppercase mt-2 tracking-tight px-1">{joinError}</p>}
                                    </div>
                                </div>
                                
                                <div className="p-8 rounded-[40px] border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={16} className="text-[var(--foreground)] opacity-40" />
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--foreground-muted)]">Active Public Sessions</h2>
                                        </div>
                                        <button 
                                            onClick={fetchPublicRooms}
                                            className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                    
                                    {publicRooms.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {publicRooms.map(room => (
                                                <div 
                                                    key={room.id}
                                                    className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--foreground)]/30 transition-all cursor-pointer group"
                                                    onClick={() => setCurrentRoomId(room.id)}
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/[0.03] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--foreground)]/10 transition-colors">
                                                        <Users size={20} className="text-[var(--foreground)]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-[var(--foreground)] tracking-tight">{room.name}</p>
                                                        <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest">by {room.host.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-[var(--foreground)] mb-1">{room.memberCount}/{room.maxMembers}</p>
                                                        <p className="text-[9px] font-black text-[var(--foreground)] opacity-20 uppercase tracking-widest group-hover:opacity-100 transition-opacity">Join Room</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-16 h-16 rounded-3xl bg-[var(--foreground)]/[0.03] flex items-center justify-center mb-4">
                                                <Users size={32} strokeWidth={1} className="text-[var(--foreground-muted)] opacity-30" />
                                            </div>
                                            <p className="text-[var(--foreground-muted)] text-xs font-bold uppercase tracking-widest opacity-60">No public sessions currently active</p>
                                            <button 
                                                onClick={() => setShowCreateRoom(true)}
                                                className="mt-6 px-6 py-2 rounded-full border border-[var(--foreground)]/20 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--foreground)] opacity-60 hover:opacity-100 transition-all"
                                            >
                                                Initialize Study Session
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "arena" && (
                            <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div className="text-center md:text-left">
                                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">The Arena</h1>
                                        <p className="text-[var(--foreground-muted)] font-medium">Challenge other scholars to real-time 1v1 duels.</p>
                                    </div>
                                    <div className="flex justify-center">
                                         <span className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] text-[10px] font-black rounded-lg shadow-lg tracking-widest uppercase">RANKED SEASON 1</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                    <button 
                                        onClick={() => setShowDuelModal(true)}
                                        className="p-8 text-left transition-all bg-[var(--card)] border border-[var(--border)] rounded-[32px]"
                                    >
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
                                            <PlusCircle size={24} strokeWidth={2} className="text-[var(--foreground)]" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight mb-2">Initiate Duel</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] font-medium leading-relaxed">Challenge a peer using your custom quiz library.</p>
                                        <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] transition-colors">
                                            Select Quiz
                                            <ArrowRight size={14} />
                                        </div>
                                    </button>

                                    <div className="p-8 group relative bg-[var(--card)] border border-[var(--border)] rounded-[32px]">
                                        <div className="w-14 h-14 rounded-[20px] bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
                                            <LogIn size={24} strokeWidth={2} className="text-[var(--foreground)]" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight mb-2">Join Duel</h3>
                                        <p className="text-xs text-[var(--foreground-muted)] mb-6 font-medium leading-relaxed">Enter a unique duel code to accept a challenge.</p>
                                        
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={joinDuelCode} 
                                                onChange={e => setJoinDuelCode(e.target.value.toUpperCase())}
                                                placeholder="CODE" 
                                                maxLength={6}
                                                className="flex-1 px-5 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-center tracking-[0.3em] font-black outline-none focus:border-[var(--foreground)] transition-all" 
                                            />
                                            <Button 
                                                onClick={handleJoinDuel}
                                                loading={arenaLoading}
                                                disabled={joinDuelCode.length < 4} 
                                                className="px-6 py-3 shadow-xl"
                                                variant="skeuo-primary"
                                            >
                                                Join
                                            </Button>
                                        </div>
                                        {joinError && <p className="text-red-500 text-[10px] font-black uppercase mt-2 tracking-tight px-1">{joinError}</p>}
                                    </div>
                                </div>

                                {arenaDuels.length > 0 && (
                                    <div className="mb-12">
                                        <h2 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.3em] mb-4 px-2">Your Active Duels</h2>
                                        <div className="grid grid-cols-1 gap-3">
                                            {arenaDuels.map(duel => (
                                                <Link
                                                    key={duel.id}
                                                    href={`/arena?id=${duel.id}`}
                                                    className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--foreground)]/30 transition-all group"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/[0.03] flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--foreground)]/10 transition-colors">
                                                        <Swords size={20} className="text-[var(--foreground)]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-[var(--foreground)] tracking-tight">vs {duel.challenger?.name || duel.host.name}</p>
                                                        <p className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-widest">Code: {duel.code} • {duel.status}</p>
                                                    </div>
                                                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                        duel.status === 'WAITING' ? 'bg-[var(--foreground)]/5 text-[var(--foreground)]' :
                                                        duel.status === 'READY' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-lg' :
                                                        'bg-[var(--border)] text-[var(--foreground-muted)]'
                                                    }`}>
                                                        {duel.status}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 rounded-[40px] border border-[var(--border)] bg-[var(--foreground)]/[0.01]">
                                    <h2 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.3em] mb-8">Competitive Standing</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
                                            <p className="text-4xl font-black text-[var(--foreground)] leading-none mb-2">{user.wins || 0}</p>
                                            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Duel Victories</p>
                                        </div>
                                        <div className="text-center p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
                                            <p className="text-4xl font-black text-[var(--foreground)] leading-none mb-2">{user.winRate || 0}%</p>
                                            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Win Probability</p>
                                        </div>
                                        <div className="text-center p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
                                            <p className="text-4xl font-black text-[var(--foreground)] opacity-40 leading-none mb-2">{user.rank || '-'}</p>
                                            <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest opacity-60">Arena Rank</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

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
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setShowDuelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-[var(--background)] rounded-[40px] border border-[var(--border)] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-[var(--border)]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[var(--foreground)]/[0.03] flex items-center justify-center border border-[var(--border)] shadow-xl">
                                            <Swords size={28} strokeWidth={2} className="text-[var(--foreground)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">Initiate Duel</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Select your curriculum</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDuelModal(false)} className="p-3 rounded-full hover:bg-[var(--foreground)]/5 transition-colors">
                                        <X size={24} className="text-[var(--foreground-muted)]" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-3">
                                {myQuizzes.length > 0 ? (
                                    myQuizzes.slice(0, 10).map(quiz => (
                                        <button
                                            key={quiz.id}
                                            onClick={() => {
                                                handleCreateDuel(quiz.id);
                                                setShowDuelModal(false);
                                            }}
                                            className="w-full p-6 rounded-3xl bg-[var(--foreground)]/[0.03] border border-[var(--border)] hover:border-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.01] text-left transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                 <p className="font-black text-[var(--foreground)] text-lg tracking-tight group-hover:opacity-40 transition-opacity">{quiz.title}</p>
                                                 <ArrowRight size={18} className="text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                                            </div>
                                            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.2em] mt-1">{quiz.content?.questions?.length || 0} Critical Concepts Included</p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <BookOpen size={48} strokeWidth={1} className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-20" />
                                        <p className="text-[var(--foreground-muted)] font-black uppercase tracking-widest text-xs italic">No scholarly content identified</p>
                                        <Link href="/create" className="text-[var(--foreground)] text-[10px] font-black uppercase tracking-widest mt-4 inline-block hover:underline">Generate Content Now</Link>
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
