"use client";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

interface LeaderboardUser {
    rank: number;
    name: string;
    xp: number;
    avatar: string;
    streak: number;
    isYou?: boolean;
    change?: "up" | "down" | "same";
    wins: number;
}

interface Challenge {
    id: number;
    title: string;
    players: number;
    maxPlayers: number;
    subject: string;
    difficulty: "Easy" | "Medium" | "Hard";
    reward: number;
    timeLeft: string;
    isLive?: boolean;
}

const leaderboardData: LeaderboardUser[] = [
    { rank: 1, name: "Alex", xp: 2450, avatar: "A", streak: 15, change: "same", wins: 23 },
    { rank: 2, name: "Jordan", xp: 2280, avatar: "J", streak: 12, change: "up", wins: 19 },
    { rank: 4, name: "Taylor", xp: 1980, avatar: "T", streak: 8, change: "down", wins: 14 },
    { rank: 5, name: "Morgan", xp: 1850, avatar: "M", streak: 6, change: "same", wins: 12 },
];

const challenges: Challenge[] = [
    { id: 1, title: "Biology Blitz", players: 24, maxPlayers: 30, subject: "Biology", difficulty: "Medium", reward: 100, timeLeft: "5:23", isLive: true },
    { id: 2, title: "Physics Showdown", players: 18, maxPlayers: 25, subject: "Physics", difficulty: "Hard", reward: 150, timeLeft: "12:45" },
    { id: 3, title: "Chem Battle", players: 31, maxPlayers: 40, subject: "Chemistry", difficulty: "Easy", reward: 75, timeLeft: "8:30" },
];

const subjects = ["Biology", "Physics", "Chemistry", "Mathematics", "History"];

export default function ArenaPage() {
    const { user } = useUser();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<"battles" | "leaderboard">("battles");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "join">("create");
    const [battleCode, setBattleCode] = useState("");
    const [joining, setJoining] = useState(false);
    const [newBattle, setNewBattle] = useState({
        title: "",
        subject: "Biology",
        difficulty: "Medium" as "Easy" | "Medium" | "Hard",
        maxPlayers: 10,
    });

    const leaderboard = [
        ...leaderboardData.slice(0, user.rank - 1),
        {
            rank: user.rank,
            name: user.name,
            xp: user.xp,
            avatar: user.avatar,
            streak: user.streak,
            wins: user.wins,
            isYou: true,
            change: "up" as const
        },
        ...leaderboardData.slice(user.rank - 1)
    ];

    const getDifficultyColor = (diff: string) => {
        if (diff === "Easy") return "bg-[var(--success)]/20 text-[var(--success)]";
        if (diff === "Medium") return "bg-[var(--warning)]/20 text-[var(--warning)]";
        return "bg-[var(--danger)]/20 text-[var(--danger)]";
    };

    const openCreateModal = () => {
        setModalMode("create");
        setShowModal(true);
    };

    const openJoinModal = () => {
        setModalMode("join");
        setShowModal(true);
    };

    const handleCreateBattle = () => {
        setJoining(true);
        setTimeout(() => {
            alert(`Battle "${newBattle.title}" created! Share code: ${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
            setJoining(false);
            setShowModal(false);
            setNewBattle({ title: "", subject: "Biology", difficulty: "Medium", maxPlayers: 10 });
        }, 1000);
    };

    const handleJoinBattle = (code?: string) => {
        const joinCode = code || battleCode;
        if (joinCode.length < 6) return;
        setJoining(true);
        setTimeout(() => {
            alert(`Successfully joined battle: ${joinCode}`);
            setJoining(false);
            setShowModal(false);
            setBattleCode("");
        }, 1500);
    };

    const handleCardJoin = (challengeId: number) => {
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge) {
            if (confirm(`Join ${challenge.title}? Entry fee: 50 credits.`)) {
                alert(`Joined ${challenge.title}! Waiting for match start...`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
                        {/* Modal Tabs */}
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                onClick={() => setModalMode("create")}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${modalMode === "create"
                                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--background-tertiary)]"
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    Create Battle
                                </span>
                            </button>
                            <button
                                onClick={() => setModalMode("join")}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${modalMode === "join"
                                    ? "bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30"
                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-[var(--background-tertiary)]"
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">login</span>
                                    Join Battle
                                </span>
                            </button>
                        </div>

                        {modalMode === "create" ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Battle Name</label>
                                    <input
                                        type="text"
                                        value={newBattle.title}
                                        onChange={(e) => setNewBattle({ ...newBattle, title: e.target.value })}
                                        placeholder="e.g., Friday Night Physics"
                                        className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Subject</label>
                                    <select
                                        value={newBattle.subject}
                                        onChange={(e) => setNewBattle({ ...newBattle, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                                    >
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Difficulty</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["Easy", "Medium", "Hard"] as const).map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setNewBattle({ ...newBattle, difficulty: d })}
                                                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${newBattle.difficulty === d
                                                    ? getDifficultyColor(d) + " border border-current"
                                                    : "bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-[var(--foreground-secondary)] mb-1.5 block">Max Players: {newBattle.maxPlayers}</label>
                                    <input
                                        type="range"
                                        min="2"
                                        max="50"
                                        value={newBattle.maxPlayers}
                                        onChange={(e) => setNewBattle({ ...newBattle, maxPlayers: parseInt(e.target.value) })}
                                        className="w-full accent-[var(--accent)]"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateBattle}
                                    disabled={!newBattle.title.trim() || joining}
                                    className={`w-full py-3.5 rounded-xl font-medium transition-all mt-2 ${!newBattle.title.trim() || joining
                                        ? "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                                        : "bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] shadow-md"
                                        }`}
                                >
                                    {joining ? "Creating..." : "Create & Get Share Code"}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)]/20 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-[var(--secondary)] text-3xl">vpn_key</span>
                                    </div>
                                    <p className="text-[var(--foreground-secondary)] text-sm">Enter the 6-character battle code shared by your friend</p>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        value={battleCode}
                                        onChange={(e) => setBattleCode(e.target.value.toUpperCase().slice(0, 6))}
                                        placeholder="XXXXXX"
                                        maxLength={6}
                                        className="w-full px-4 py-4 bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--secondary)] uppercase"
                                    />
                                    <p className="text-center text-[10px] text-[var(--foreground-muted)] mt-2">{battleCode.length}/6 characters</p>
                                </div>

                                <button
                                    onClick={() => handleJoinBattle()}
                                    disabled={battleCode.length !== 6 || joining}
                                    className={`w-full py-3.5 rounded-xl font-medium transition-all ${battleCode.length !== 6 || joining
                                        ? "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                                        : "bg-[var(--secondary)] text-white hover:opacity-90 shadow-md"
                                        }`}
                                >
                                    {joining ? "Joining..." : "Join Battle"}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowModal(false)}
                            disabled={joining}
                            className="absolute top-4 right-4 p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Ambient Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="blob blob-coral absolute w-[500px] h-[500px] top-[15%] left-[25%] animate-float" />
                <div className="blob blob-teal absolute w-[400px] h-[400px] bottom-[20%] right-[15%]" style={{ animationDelay: "2s" }} />
            </div>

            {/* Main */}
            <main>
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-8 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[var(--accent)] text-xl">swords</span>
                        </div>
                        <div>
                            <h1 className="text-base font-medium text-[var(--foreground)]">Arena</h1>
                            <p className="text-xs text-[var(--foreground-secondary)]">Compete & climb the ranks</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all"
                            title={resolvedTheme === "light" ? "Switch to dark" : "Switch to light"}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {resolvedTheme === "light" ? "dark_mode" : "light_mode"}
                            </span>
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20">
                            <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
                            <span className="text-xs text-[var(--success)] font-medium">73 online</span>
                        </div>
                        <button
                            onClick={openJoinModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--background-tertiary)] transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">login</span>
                            Join
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-dark)] transition-all shadow-md"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Host Battle
                        </button>
                    </div>
                </header>

                <div className="px-8 py-6">
                    {/* Your Stats Card */}
                    <div className="mb-8 p-6 rounded-2xl card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-xl font-bold">{user.avatar}</div>
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[var(--warning)] flex items-center justify-center text-xs font-bold text-white">
                                        #{user.rank}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">Your Arena Stats</h3>
                                    <div className="flex items-center gap-4 text-sm text-[var(--foreground-secondary)]">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-base text-[var(--warning)]">star</span>
                                            {user.xp.toLocaleString()} XP
                                        </span>
                                        <span>•</span>
                                        <span>{user.wins} wins</span>
                                        <span>•</span>
                                        <span>{user.winRate}% win rate</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center px-5 py-3 rounded-xl bg-[var(--background-tertiary)]">
                                    <div className="text-2xl font-bold text-[var(--accent)]">🔥 {user.streak}</div>
                                    <div className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">Day Streak</div>
                                </div>
                                <div className="text-center px-5 py-3 rounded-xl bg-[var(--background-tertiary)]">
                                    <div className="text-2xl font-bold text-[var(--warning)]">#{user.rank}</div>
                                    <div className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">This Week</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab("battles")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "battles"
                                ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent)]/20"
                                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">whatshot</span>
                            Live Battles
                        </button>
                        <button
                            onClick={() => setActiveTab("leaderboard")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "leaderboard"
                                ? "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/20"
                                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">leaderboard</span>
                            Leaderboard
                        </button>
                    </div>

                    {activeTab === "battles" ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                {challenges.map((c, index) => (
                                    <div
                                        key={c.id}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className="group relative p-6 rounded-2xl card animate-fade-in-up"
                                    >
                                        {c.isLive && (
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--accent)]/20">
                                                <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
                                                <span className="text-[10px] text-[var(--accent)] font-medium uppercase">Live</span>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getDifficultyColor(c.difficulty)}`}>
                                                <span className="material-symbols-outlined text-lg">
                                                    {c.difficulty === "Easy" ? "sentiment_satisfied" :
                                                        c.difficulty === "Medium" ? "psychology" : "local_fire_department"}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-[var(--foreground)] font-medium">{c.title}</h3>
                                                <p className="text-xs text-[var(--foreground-secondary)]">{c.subject}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-[var(--foreground-muted)] mb-1.5">
                                                <span>{c.players}/{c.maxPlayers} players</span>
                                                <span>{c.timeLeft} left</span>
                                            </div>
                                            <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--warning)] rounded-full"
                                                    style={{ width: `${(c.players / c.maxPlayers) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getDifficultyColor(c.difficulty)}`}>
                                                    {c.difficulty}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
                                                    <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                    +{c.reward} XP
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCardJoin(c.id)}
                                                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-dark)] transition-all shadow-sm"
                                            >
                                                Join Battle
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={openCreateModal}
                                    className="py-5 rounded-2xl border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Create Custom Battle
                                </button>
                                <button
                                    onClick={openJoinModal}
                                    className="py-5 rounded-2xl border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--secondary)] hover:border-[var(--secondary)]/30 hover:bg-[var(--secondary)]/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">vpn_key</span>
                                    Join with Code
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm text-[var(--foreground-secondary)]">Weekly Rankings</h2>
                                <select className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer">
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>All Time</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                {leaderboard.map((u) => (
                                    <div
                                        key={u.rank}
                                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${u.isYou
                                            ? "bg-[var(--warning)]/10 border border-[var(--warning)]/20"
                                            : "card"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${u.rank === 1 ? "bg-[var(--warning)] text-white" :
                                            u.rank === 2 ? "bg-gray-300 text-gray-800" :
                                                u.rank === 3 ? "bg-amber-700 text-white" :
                                                    "bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                                            }`}>
                                            {u.rank}
                                        </div>

                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold ${u.isYou ? "bg-[var(--accent)] text-white" : "bg-[var(--background-tertiary)] text-[var(--foreground)]"
                                            }`}>
                                            {u.avatar}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[var(--foreground)] font-medium">{u.name}</span>
                                                {u.isYou && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning)]/20 text-[var(--warning)]">YOU</span>}
                                                {u.change === "up" && <span className="material-symbols-outlined text-[var(--success)] text-sm">arrow_upward</span>}
                                                {u.change === "down" && <span className="material-symbols-outlined text-[var(--danger)] text-sm">arrow_downward</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                                                <span>🔥 {u.streak} streak</span>
                                                <span>🏆 {u.wins} wins</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[var(--foreground)] font-semibold">{u.xp.toLocaleString()}</div>
                                            <div className="text-[10px] text-[var(--foreground-muted)] uppercase">XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
