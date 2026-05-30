"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "./ChatPanel";
import Link from "next/link";
import { useRoomRealtime } from "@/hooks/useRealtime";
import { createClient } from "@/lib/supabase/client";
import { 
    Users, 
    MessageSquareText, 
    GraduationCap, 
    Layers, 
    FolderOpen, 
    MessageSquare,
    Trophy,
    BookOpen,
    HelpCircle,
    FileText,
    Search,
    X,
    Plus,
    Share2,
    Sparkles,
    ArrowRight
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

interface LibraryItem {
    id: string;
    title: string;
    type: 'quiz' | 'flashcards' | 'summary' | 'exam_sprint';
    metaInfo?: string;
}

export default function RoomView({ roomId, currentUserId }: RoomViewProps) {
    const router = useRouter();
    const [room, setRoom] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal & library states
    const [showShareModal, setShowShareModal] = useState(false);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sharingItem, setSharingItem] = useState<string | null>(null);

    const fetchRoom = useCallback(async () => {
        try {
            console.log("Fetching room:", roomId);
            const res = await fetch(`/api/lobby/${roomId}`);
            const data = await res.json();
            
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

    const fetchLibraryItems = async () => {
        setLibraryLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch generations & packs in parallel
            const [genRes, packRes] = await Promise.all([
                supabase
                    .from("generations")
                    .select("id, title, type, content")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("study_packs")
                    .select("id, title, phases_data")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
            ]);

            const combined: LibraryItem[] = [];

            if (genRes.data) {
                genRes.data.forEach((g: any) => {
                    let metaInfo = "";
                    if (g.type === "quiz") {
                        metaInfo = `${g.content?.questions?.length || 0} Questions`;
                    } else if (g.type === "flashcards") {
                        metaInfo = `${g.content?.flashcards?.length || 0} Cards`;
                    } else {
                        metaInfo = "Summary Text";
                    }

                    combined.push({
                        id: g.id,
                        title: g.title || "Untitled Generation",
                        type: g.type,
                        metaInfo
                    });
                });
            }

            if (packRes.data) {
                packRes.data.forEach((p: any) => {
                    const completed = Object.keys(p.phases_data || {}).filter(k => k !== '_mastered').length;
                    combined.push({
                        id: p.id,
                        title: p.title || "Untitled Exam Sprint",
                        type: 'exam_sprint',
                        metaInfo: `${completed} / 4 Study Phases`
                    });
                });
            }

            setLibraryItems(combined);
        } catch (err) {
            console.error("Failed to load user library:", err);
        } finally {
            setLibraryLoading(false);
        }
    };

    const openShareModal = () => {
        setShowShareModal(true);
        fetchLibraryItems();
    };

    const handleShareContent = async (item: LibraryItem) => {
        setSharingItem(item.id);
        try {
            const res = await fetch(`/api/lobby/${roomId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "share",
                    content: {
                        id: item.id,
                        title: item.title,
                        type: item.type,
                        questionCount: item.type === 'quiz' ? parseInt(item.metaInfo || '0') : undefined
                    }
                })
            });

            if (res.ok) {
                setShowShareModal(false);
                fetchRoom();
            }
        } catch (err) {
            console.error("Error sharing content:", err);
        } finally {
            setSharingItem(null);
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

    // Shared Content helpers
    const sharedContent = room.sharedContent;
    let contentHref = "#";
    let contentIcon = Layers;
    let contentTypeName = "Shared Material";

    if (sharedContent) {
        contentTypeName = {
            quiz: 'Quiz',
            flashcards: 'Flashcards Deck',
            summary: 'Summary Notes',
            exam_sprint: 'Exam Sprint Pack'
        }[sharedContent.type as string] || 'Material';

        contentHref = {
            quiz: `/quiz?id=${sharedContent.id}`,
            flashcards: `/flashcards?id=${sharedContent.id}`,
            summary: `/summary?id=${sharedContent.id}`,
            exam_sprint: `/library/pack/${sharedContent.id}`
        }[sharedContent.type as string] || '#';

        contentIcon = {
            quiz: HelpCircle,
            flashcards: Layers,
            summary: FileText,
            exam_sprint: BookOpen
        }[sharedContent.type as string] || Layers;
    }

    const ContentIcon = contentIcon;

    const filteredLibrary = libraryItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
                    {sharedContent ? (
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Layers size={18} strokeWidth={1.5} className="text-[#F59E0B]" />
                                        <h3 className="text-sm font-bold text-white/80">Shared Study Deck</h3>
                                    </div>
                                    <button 
                                        onClick={openShareModal}
                                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[var(--foreground)] transition-colors flex items-center gap-1.5"
                                    >
                                        <Share2 size={12} /> Share Different
                                    </button>
                                </div>
                                <Link
                                    href={contentHref}
                                    className="block p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[var(--foreground)]/30 hover:bg-white/[0.05] transition-all group shadow-sm relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                        <ContentIcon size={72} strokeWidth={1} />
                                    </div>
                                    <div className="flex items-center gap-3.5 mb-2 relative z-10">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--foreground)]/5 border border-white/10" style={{ color: '#F59E0B' }}>
                                            <ContentIcon size={16} strokeWidth={2} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--foreground)]/10 text-white/80">
                                            {contentTypeName}
                                        </span>
                                    </div>
                                    <p className="font-bold text-white text-lg tracking-tight group-hover:text-[#F59E0B] transition-colors relative z-10">
                                        {sharedContent.title}
                                    </p>
                                    {sharedContent.questionCount !== undefined && (
                                        <p className="text-sm text-white/40 mt-1 relative z-10">{sharedContent.questionCount} Questions Included</p>
                                    )}
                                    <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-all relative z-10">
                                        Open Material <ArrowRight size={12} />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                            <div className="w-16 h-16 rounded-[24px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4 shadow-inner relative">
                                <div className="absolute inset-0 rounded-[24px] bg-[#F59E0B]/5 blur-md" />
                                <FolderOpen size={32} strokeWidth={1.5} className="text-[#F59E0B] relative z-10" />
                            </div>
                            <p className="text-white/80 font-bold mb-1">No shared content yet</p>
                            <p className="text-xs text-white/40 mb-6 max-w-xs leading-relaxed">Share a quiz, flashcard deck, or exam sprint with the study room to practice together.</p>
                            
                            <button
                                onClick={openShareModal}
                                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                                style={{
                                    background: "#F59E0B",
                                    color: "#08080E",
                                    boxShadow: "0 10px 25px -8px rgba(245, 158, 11, 0.4)"
                                }}
                            >
                                <Plus size={14} strokeWidth={3} /> Share Study Material
                            </button>
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
                                onClose={() => {
                                    setShowChat(false);
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Chat Button */}
            {!showChat && (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-lg shadow-black/40 flex items-center justify-center hover-scale-lg active:scale-95 transition-all z-50"
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

            {/* Library Selector Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#12121F] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F59E0B] via-[#6366F1] to-[#F59E0B]" />
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-[#F59E0B]">
                                            <FolderOpen size={22} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white tracking-tight">Share Material</h2>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select items from your vault</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowShareModal(false)}
                                        className="p-2 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Search bar inside modal */}
                            <div className="p-5 border-b border-white/5 bg-white/[0.01]">
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder="Search your library..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#F59E0B]/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Library list */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-2.5 custom-scrollbar min-h-[300px]">
                                {libraryLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-6 h-6 border-2 border-white/20 border-t-[#F59E0B] rounded-full animate-spin" />
                                    </div>
                                ) : filteredLibrary.length > 0 ? (
                                    filteredLibrary.map(item => {
                                        const ItemIcon = {
                                            quiz: HelpCircle,
                                            flashcards: Layers,
                                            summary: FileText,
                                            exam_sprint: BookOpen
                                        }[item.type] || Layers;

                                        const itemTypeLabel = {
                                            quiz: 'Quiz',
                                            flashcards: 'Flashcards',
                                            summary: 'Summary',
                                            exam_sprint: 'Exam Sprint'
                                        }[item.type] || 'Material';

                                        const itemColor = {
                                            quiz: '#818CF8',
                                            flashcards: '#F59E0B',
                                            summary: '#6366F1',
                                            exam_sprint: '#10B981'
                                        }[item.type] || '#FFFFFF';

                                        const isSharingThis = sharingItem === item.id;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleShareContent(item)}
                                                disabled={sharingItem !== null}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[var(--foreground)]/30 hover:bg-white/[0.04] transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div 
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/5 transition-colors"
                                                        style={{ color: itemColor }}
                                                    >
                                                        <ItemIcon size={16} strokeWidth={2} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white text-sm truncate pr-2 tracking-tight">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                            <span style={{ color: itemColor }}>{itemTypeLabel}</span>
                                                            <span>•</span>
                                                            <span>{item.metaInfo}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 pl-2">
                                                    {isSharingThis ? (
                                                        <div className="w-5 h-5 border-2 border-white/20 border-t-[#F59E0B] rounded-full animate-spin" />
                                                    ) : (
                                                        <Plus size={16} className="text-white/20 group-hover:text-[#F59E0B] transition-colors" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-16 opacity-30 flex flex-col items-center">
                                        <FolderOpen size={40} strokeWidth={1} className="mb-2" />
                                        <p className="text-xs uppercase tracking-widest font-black italic">No items found</p>
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
