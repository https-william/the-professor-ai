"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

/* ═══ Claymorphic Helpers ═══ */
const clay = {
    card: {
        background: "rgba(255,255,255,0.025)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    pill: {
        background: "rgba(255,255,255,0.04)",
        borderRadius: "14px",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.15)",
    } as React.CSSProperties,
};

const MODES = [
    {
        id: "duel", icon: "swords", label: "Duel Mode", tag: "COMPETITIVE",
        desc: "1v1 quiz battle. Same questions, same timer. Fastest correct answer wins.",
        color: "#EF4444", gradient: "from-[#EF4444]/8 to-transparent",
    },
    {
        id: "group", icon: "groups", label: "Group Study", tag: "SOCIAL",
        desc: "Collaborative session. Everyone studies the same material together.",
        color: "#10B981", gradient: "from-[#10B981]/8 to-transparent",
    },
    {
        id: "arena", icon: "emoji_events", label: "Arena", tag: "RANKED",
        desc: "Climb the leaderboard. Weekly resets. Top scholars earn badges.",
        color: "#F59E0B", gradient: "from-[#F59E0B]/8 to-transparent",
    },
];

export default function HubPage() {
    const { user } = useUser();
    const [joinCode, setJoinCode] = useState("");
    const [showJoinInput, setShowJoinInput] = useState(false);

    return (
        <div className="min-h-[100dvh] bg-[#06060B] text-white/90 pb-28 relative overflow-hidden">

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse"
                    style={{ top: "-25%", left: "-20%", background: "radial-gradient(circle, rgba(16,185,129,0.05), transparent 60%)", filter: "blur(100px)", animationDuration: "7s" }} />
                <div className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
                    style={{ bottom: "-15%", right: "-15%", background: "radial-gradient(circle, rgba(99,102,241,0.04), transparent 60%)", filter: "blur(80px)", animationDuration: "9s" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-12">

                {/* Header with claymorphic icon */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                            style={{
                                background: "linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                                boxShadow: "inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 16px rgba(16,185,129,0.1)",
                                border: "1px solid rgba(16,185,129,0.1)",
                            }}>
                            <span className="material-symbols-outlined text-xl text-[#10B981]">groups</span>
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/15">The Hub</span>
                    </div>
                    <h1 className="font-heading text-3xl sm:text-[40px] font-bold text-white/95 tracking-tight mb-2 leading-tight">
                        Study Together
                    </h1>
                    <p className="text-sm text-white/25 max-w-md">
                        Create a room, invite your classmates, and learn as a team.
                    </p>
                </div>

                {/* ═══ Bento Grid — Create / Join ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-12">

                    {/* Create Room — spans 3 cols */}
                    <Link href="/hub/create"
                        className="sm:col-span-3 group relative overflow-hidden transition-all duration-300 active:scale-[0.995] cursor-pointer"
                        style={{ ...clay.card, minHeight: "220px" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                    >
                        {/* Corner glow */}
                        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)", filter: "blur(40px)" }} />
                        {/* Top edge */}
                        <div className="absolute top-0 left-0 right-0 h-px"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)" }} />

                        <div className="relative z-10 p-7 sm:p-8 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                                    style={{
                                        background: "linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                                        boxShadow: "inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(16,185,129,0.1)",
                                        border: "1px solid rgba(16,185,129,0.08)",
                                    }}>
                                    <span className="material-symbols-outlined text-2xl text-[#10B981]">add_circle</span>
                                </div>
                                <h2 className="font-heading text-xl font-bold text-white/90 mb-2">Create Room</h2>
                                <p className="text-[13px] text-white/25 leading-relaxed max-w-xs">
                                    Upload a document, set the rules, and generate a unique room code to share with anyone.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-6 text-[13px] font-semibold text-[#10B981] group-hover:gap-3 transition-all">
                                Initialize
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </div>
                        </div>
                    </Link>

                    {/* Join Room — spans 2 cols */}
                    <div className="sm:col-span-2 group relative overflow-hidden transition-all duration-300"
                        style={{ ...clay.card, minHeight: "220px" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                    >
                        <div className="absolute bottom-0 left-0 w-[180px] h-[180px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)", filter: "blur(40px)" }} />
                        <div className="absolute top-0 left-0 right-0 h-px"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }} />

                        <div className="relative z-10 p-7 sm:p-8 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                                    style={{
                                        background: "linear-gradient(145deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))",
                                        boxShadow: "inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(99,102,241,0.08)",
                                        border: "1px solid rgba(99,102,241,0.08)",
                                    }}>
                                    <span className="material-symbols-outlined text-2xl text-[#818CF8]">login</span>
                                </div>
                                <h2 className="font-heading text-xl font-bold text-white/90 mb-2">Join Room</h2>
                                <p className="text-[13px] text-white/25 leading-relaxed">
                                    Enter a code and sync into a session.
                                </p>
                            </div>

                            {!showJoinInput ? (
                                <button onClick={() => setShowJoinInput(true)}
                                    className="flex items-center gap-2 mt-6 text-[13px] font-semibold text-[#818CF8] hover:gap-3 transition-all">
                                    Enter Code <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </button>
                            ) : (
                                <div className="mt-5 flex gap-2">
                                    <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="CODE" maxLength={6} autoFocus
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono font-bold tracking-[0.25em] text-center text-white/80 placeholder:text-white/10 outline-none transition-all"
                                        style={{ ...clay.pill, background: "rgba(0,0,0,0.2)" }}
                                        onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = "inset 0 1px 1px rgba(99,102,241,0.1), 0 0 0 2px rgba(99,102,241,0.15)"; }}
                                        onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = clay.pill.boxShadow as string; }}
                                    />
                                    <button disabled={joinCode.length < 4}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-20"
                                        style={{
                                            background: joinCode.length >= 4 ? "linear-gradient(135deg, #818CF8, #6366F1)" : "rgba(255,255,255,0.04)",
                                            color: joinCode.length >= 4 ? "#fff" : "rgba(255,255,255,0.2)",
                                            boxShadow: joinCode.length >= 4 ? "0 3px 12px rgba(99,102,241,0.3), inset 0 1px 2px rgba(255,255,255,0.15)" : "none",
                                        }}>
                                        Join
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ Modes — Bento Row ═══ */}
                <div className="mb-10">
                    <h2 className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/15 mb-5 px-1">Study Modes</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {MODES.map((mode) => (
                            <div key={mode.id}
                                className="group relative overflow-hidden transition-all duration-300"
                                style={clay.card}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                            >
                                {/* Color glow on hover */}
                                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: `linear-gradient(90deg, transparent, ${mode.color}40, transparent)` }} />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{ background: `radial-gradient(ellipse 70% 70% at 30% 100%, ${mode.color}06, transparent 70%)` }} />

                                <div className="relative z-10 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{
                                                background: `${mode.color}10`,
                                                boxShadow: `inset 0 1px 2px ${mode.color}15, 0 2px 6px rgba(0,0,0,0.15)`,
                                            }}>
                                            <span className="material-symbols-outlined text-xl" style={{ color: `${mode.color}BB` }}>{mode.icon}</span>
                                        </div>
                                        <span className="text-[8px] font-extrabold tracking-[0.2em] px-2.5 py-1 rounded-full"
                                            style={{ background: `${mode.color}10`, color: `${mode.color}AA` }}>
                                            {mode.tag}
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-[15px] font-bold text-white/80 mb-1.5">{mode.label}</h3>
                                    <p className="text-[12px] text-white/20 leading-relaxed">{mode.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Professor's Guidance — Claymorphic quote */}
                <div className="overflow-hidden" style={{
                    ...clay.card,
                    background: "linear-gradient(145deg, rgba(245,158,11,0.04), rgba(245,158,11,0.01))",
                    border: "1px solid rgba(245,158,11,0.08)",
                }}>
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-base text-[#F59E0B]">auto_awesome</span>
                            <span className="text-[9px] font-extrabold tracking-[0.2em] uppercase text-[#F59E0B]/40">
                                The Professor&apos;s Guidance
                            </span>
                        </div>
                        <p className="text-[13px] text-white/35 leading-[1.7] italic">
                            &ldquo;Two heads are better than one — but only if both are actually studying.
                            Group sessions work best when everyone brings something to the table.
                            Upload your notes, challenge each other, and watch the material click.&rdquo;
                        </p>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-8 text-center">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold text-white/15"
                        style={clay.pill}>
                        <span className="material-symbols-outlined text-[13px]">construction</span>
                        Rooms launching soon
                    </span>
                </div>
            </div>
        </div>
    );
}
