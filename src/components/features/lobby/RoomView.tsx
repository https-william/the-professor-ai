"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "./ChatPanel";
import Link from "next/link";
import { useRoomRealtime } from "@/hooks/useRealtime";
import { 
    Users, 
    MessageSquareText, 
    GraduationCap, 
    Layers, 
    FolderOpen, 
    MessageSquare,
    Trophy
} from "lucide-react";

interface RoomViewProps {
    roomId: string;
    currentUserId: string;
}

interface RoomData {
    id: string;
    code: string;
    name: string;
    roomType: string;
    description?: string;
    isPublic: boolean;
    maxMembers: number;
    members: Array<{
        user_id: string;
        name: string;
        avatar?: string;
        is_host: boolean;
        joined_at: string;
    }>;
    sharedContent?: any;
    isHost: boolean;
    isMember: boolean;
    host: {
        id: string;
        name: string;
    };
}

export default function RoomView({ roomId, currentUserId }: RoomViewProps) {
    const router = useRouter();
    const [room, setRoom] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

    const fetchRoom = useCallback(async () => {
        try {
            console.log("Fetching room:", roomId);
            const res = await fetch(`/api/lobby/${roomId}`);
            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Response data:", data);
            
            if (data.success) {
                setRoom(data.room);
                setError(null);
            } else {
                setError(data.error || "Failed to load room");
            }
        } catch (err) {
            console.error("Fetch room error:", err);
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    // Initial fetch when roomId changes
    useEffect(() => {
        console.log("RoomView mounted with roomId:", roomId);
        fetchRoom();
    }, [roomId, fetchRoom]);

    // Realtime subscription for room updates
    useRoomRealtime(roomId, {
        onRoomUpdate: useCallback(() => {
            fetchRoom();
        }, [fetchRoom])
    });

    const handleCopyCode = async () => {
        if (room?.code) {
            await navigator.clipboard.writeText(room.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLeave = async () => {
        try {
            await fetch(`/api/lobby/${roomId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "leave" })
            });
            router.push("/hub?s=lobby");
        } catch (error) {
            console.error("Leave error:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="text-center py-12">
                <p className="text-white/40 mb-2">Room not found</p>
                {error && <p className="text-[#EF4444] text-xs mb-4">{error}</p>}
                <button 
                    onClick={() => router.push("/hub?s=lobby")}
                    className="text-[var(--foreground)] font-bold text-sm mt-2 hover:underline underline-offset-4"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    const roomTypeIcon = {
        study_group: Users,
        review: MessageSquareText,
        office_hours: GraduationCap
    }[room.roomType] || Users;

    const IconComponent = roomTypeIcon;

    const roomTypeLabel = {
        study_group: 'Study Group',
        review: 'Review Session',
        office_hours: 'Office Hours'
    }[room.roomType] || 'Room';

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Room Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 mb-4"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[var(--foreground)]/5 border border-[var(--border)] flex items-center justify-center">
                                <IconComponent size={20} strokeWidth={2} className="text-[var(--foreground)]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{room.name}</h2>
                                <p className="text-sm text-white/40">{roomTypeLabel} • Hosted by {room.host.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                        >
                            {copied ? "Copied!" : `Invite: ${room.code}`}
                        </button>
                    </div>

                    {room.description && (
                        <p className="text-sm text-white/60 mb-4">{room.description}</p>
                    )}

                    {/* Members */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                            Members ({room.members.length}/{room.maxMembers})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {room.members.map((member, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5"
                                >
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            member.name[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <span className="text-sm text-white/80">{member.name}</span>
                                    {member.is_host && <Trophy size={10} className="text-[var(--foreground)]" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Shared Content / Actions */}
                <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/5 p-6">
                    {room.sharedContent ? (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Layers size={18} strokeWidth={1.5} className="text-[#F59E0B]" />
                                <h3 className="text-sm font-bold text-white/80">Shared Content</h3>
                            </div>
                            {room.sharedContent.type === 'quiz' && (
                                <Link
                                    href={`/quiz?id=${room.sharedContent.id}`}
                                    className="block p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all"
                                >
                                    <p className="font-bold text-white">{room.sharedContent.title}</p>
                                    <p className="text-sm text-white/40 mt-1">{room.sharedContent.questionCount} Questions</p>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <FolderOpen size={48} strokeWidth={1.5} className="text-white/10 mb-4" />
                            <p className="text-white/40 mb-2">No shared content yet</p>
                            <p className="text-[10px] text-white/20">Share a quiz, flashcards, or notes with the room</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Panel */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="w-full lg:w-80 shrink-0"
                    >
                        <div className="h-full lg:max-h-[calc(100vh-200px)]">
                            <ChatPanel
                                roomId={roomId}
                                currentUserId={currentUserId}
                                onClose={() => setShowChat(false)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Chat Button */}
            {!showChat && (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30 flex items-center justify-center hover:scale-105 transition-all z-50"
                >
                    <MessageSquare size={24} strokeWidth={1.5} />
                </button>
            )}

            {/* Leave Button */}
            <div className="lg:hidden mt-4">
                <button
                    onClick={handleLeave}
                    className="w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                    Leave Room
                </button>
            </div>
        </div>
    );
}
