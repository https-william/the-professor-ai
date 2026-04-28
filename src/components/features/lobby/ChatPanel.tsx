"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, 
    X, 
    MessageCircle, 
    SendHorizontal 
} from "lucide-react";
import { useRoomRealtime } from "@/hooks/useRealtime";

interface Message {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    } | null;
}

interface ChatPanelProps {
    roomId: string;
    currentUserId: string;
    onClose?: () => void;
}

export default function ChatPanel({ roomId, currentUserId, onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasLoadedRef = useRef(false);

    // Fetch initial messages
    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/lobby/${roomId}/messages`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setMessages(data.messages || []);
                }
            }
        } catch (error) {
            console.error("Fetch messages error:", error);
        } finally {
            setIsLoading(false);
            hasLoadedRef.current = true;
        }
    };

    // Initial load
    useEffect(() => {
        fetchMessages();
    }, [roomId]);

    // Realtime subscription for new messages
    useRoomRealtime(roomId, {
        onNewMessage: (payload: any) => {
            const newMsg = payload.new;
            if (!newMsg) return;

            // Add new message to list if not already there
            setMessages(prev => {
                const exists = prev.some(m => m.id === newMsg.id);
                if (exists) return prev;
                
                const msg: Message = {
                    id: newMsg.id,
                    content: newMsg.content,
                    type: newMsg.message_type,
                    createdAt: newMsg.created_at,
                    user: {
                        id: newMsg.user_id,
                        name: 'Member'
                    }
                };
                return [...prev, msg];
            });
        }
    });

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (hasLoadedRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const content = newMessage.trim();
        setNewMessage("");

        try {
            const res = await fetch(`/api/lobby/${roomId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });

            if (!res.ok) {
                setNewMessage(content);
            }
        } catch (error) {
            console.error("Send error:", error);
            setNewMessage(content);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0A0F] rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} strokeWidth={2} className="text-[var(--foreground)]" />
                    <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest">Room Chat</h3>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-1 px-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={18} strokeWidth={1.5} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-6">
                        <MessageCircle size={40} strokeWidth={1.5} className="text-white mb-2" />
                        <p className="text-xs font-medium">No messages yet</p>
                        <p className="text-[10px] mt-1 italic">Say hello to the room!</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isOwn = msg.user?.id === currentUserId;
                        const isSystem = msg.type === 'system';

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="text-center py-2">
                                    <span className="text-[10px] text-white/30 italic">{msg.content}</span>
                                </div>
                            );
                        }

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                    {!isOwn && msg.user && (
                                        <p className="text-[10px] text-white/40 mb-1 ml-1">{msg.user.name}</p>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl ${
                                        isOwn
                                            ? 'bg-[var(--foreground)] text-[var(--background)] rounded-br-md shadow-md'
                                            : 'bg-[var(--foreground)]/[0.03] text-[var(--foreground)] rounded-bl-md border border-[var(--border)]'
                                    }`}>
                                        <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                    </div>
                                    <p className={`text-[9px] text-white/20 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                                {!isOwn && (
                                    <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 mr-2 shrink-0 ${isOwn ? 'order-1' : 'order-2'}`}>
                                        {msg.user?.avatar ? (
                                            <img src={msg.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            msg.user?.name?.[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 shrink-0">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        maxLength={500}
                        className="flex-1 px-4 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none focus:border-[var(--foreground)]/20 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending}
                        className="px-4 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] disabled:opacity-30 hover:opacity-90 transition-all shadow-md"
                    >
                        <SendHorizontal size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
}
