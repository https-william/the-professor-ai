"use client";

import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from "@/lib/supabase/client";
import { useEffect } from 'react';
import { 
    CheckCircle2, 
    AlertCircle, 
    Zap, 
    Info, 
    Trophy, 
    Flag, 
    Megaphone, 
    X, 
    BellOff, 
    ArrowRight 
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'xp' | 'info' | 'achievement' | 'challenge' | 'broadcast';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    icon?: any;
    timestamp: Date;
    read: boolean;
    link?: string;
}

interface ToastStore {
    toasts: Toast[];
    isOpen: boolean;
    fetchNotifications: () => Promise<void>;
    addToast: (message: string, type: ToastType, icon?: any, link?: string, saveToDb?: boolean, idOverride?: string) => Promise<void>;
    removeToast: (id: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    toggleCenter: () => void;
    setIsOpen: (open: boolean) => void;
}

export const useToasts = create<ToastStore>((set, get) => ({
    toasts: [],
    isOpen: false,
    
    fetchNotifications: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data && !error) {
            const fetchedToasts: Toast[] = data.map((n: any) => ({
                id: n.id,
                message: n.message,
                type: n.type as ToastType,
                icon: n.icon,
                timestamp: new Date(n.created_at),
                read: n.read,
                link: n.link
            }));
            set({ toasts: fetchedToasts });
        }
    },

    addToast: async (message, type, icon, link, saveToDb = false, idOverride) => {
        const id = idOverride || (Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
        const newToast: Toast = { 
            id, 
            message, 
            type, 
            icon, 
            timestamp: new Date(),
            read: false,
            link 
        };

        set((state) => ({ 
            toasts: [newToast, ...state.toasts].slice(0, 50) 
        }));

        if (saveToDb) {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data, error } = await supabase.from('notifications').insert({
                    user_id: session.user.id,
                    message,
                    type,
                    icon: typeof icon === 'string' ? icon : undefined,
                    link,
                    read: false
                }).select('id').single();

                if (data?.id) {
                    // Update the local toast ID to match the DB ID
                    set((state) => ({
                        toasts: state.toasts.map((t) => t.id === id ? { ...t, id: data.id } : t)
                    }));
                }
            }
        }

        // Auto-dismiss after 8 seconds for non-important toasts
        setTimeout(() => {
            // Only remove if it was just a transient toast (not from DB or already read)
            // Actually, keep it in history but remove from "active" view
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id || t.read) }));
        }, type === 'broadcast' ? 15000 : 8000);
    },
    
    removeToast: async (id) => {
        const supabase = createClient();
        await supabase.from('notifications').delete().eq('id', id);
        set((state) => ({ 
            toasts: state.toasts.filter((t) => t.id !== id) 
        }));
    },
    
    markAsRead: async (id) => {
        const supabase = createClient();
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        set((state) => ({
            toasts: state.toasts.map((t) => 
                t.id === id ? { ...t, read: true } : t
            )
        }));
    },
    
    markAllAsRead: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id);
        }
        set((state) => ({
            toasts: state.toasts.map((t) => ({ ...t, read: true }))
        }));
    },
    
    clearAll: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('notifications').delete().eq('user_id', session.user.id);
        }
        set({ toasts: [] });
    },
    
    toggleCenter: () => set((state) => ({ isOpen: !state.isOpen })),
    setIsOpen: (open) => set({ isOpen: open }),
}));

const typeStyles: Record<ToastType, { bg: string, iconColor: string, border: string, glow: string }> = {
    success: { bg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' },
    error: { bg: 'bg-rose-500/10', iconColor: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
    xp: { bg: 'bg-amber-500/10', iconColor: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
    info: { bg: 'bg-indigo-500/10', iconColor: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]' },
    achievement: { bg: 'bg-purple-500/10', iconColor: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]' },
    challenge: { bg: 'bg-cyan-500/10', iconColor: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]' },
    broadcast: { bg: 'bg-blue-500/10', iconColor: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
};

const defaultIcons: Record<ToastType, any> = {
    success: CheckCircle2,
    error: AlertCircle,
    xp: Zap,
    info: Info,
    achievement: Trophy,
    challenge: Flag,
    broadcast: Megaphone,
};

export function ToastContainer() {
    const { toasts, removeToast, isOpen, setIsOpen, markAsRead } = useToasts();

    const unreadCount = toasts.filter(t => !t.read).length;

    // Initial Fetch & Listen for Realtime Broadcasts
    useEffect(() => {
        const supabase = createClient();
        
        // Fetch initial
        useToasts.getState().fetchNotifications();

        const sub = supabase.channel('toast_updates')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications' 
            }, async (payload: any) => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session && payload.new.user_id === session.user.id) {
                    const b = payload.new;
                    // Check if we already have this toast (to avoid duplicates from local add + realtime echo)
                    const currentToasts = useToasts.getState().toasts;
                    if (!currentToasts.some(t => t.id === b.id)) {
                        useToasts.getState().addToast(b.message, b.type || 'broadcast', b.icon, b.link, false, b.id);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sub);
        };
    }, []);

    return (
        <>
            {/* Notification Center Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md z-[101] bg-[#0C0C16]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 p-6 border-b border-white/10" style={{ background: "linear-gradient(to bottom, #0C0C16, #0C0C16/95)" }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white">Notifications</h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                                    >
                                        <X size={20} strokeWidth={1.5} className="text-white/60" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/50">{unreadCount} unread</span>
                                    <button 
                                        onClick={() => useToasts.getState().markAllAsRead()}
                                        className="text-xs text-[#F59E0B] hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-3">
                                {toasts.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="flex justify-center mb-4">
                                            <BellOff size={48} strokeWidth={1.5} className="text-white/20" />
                                        </div>
                                        <p className="text-white/40 text-sm">No notifications yet</p>
                                        <p className="text-white/20 text-xs mt-2">We'll notify you when something happens!</p>
                                    </div>
                                ) : (
                                    toasts.map((toast) => (
                                        <motion.div
                                            key={toast.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className={`
                                                relative p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]
                                                ${typeStyles[toast.type].bg}
                                                ${typeStyles[toast.type].border}
                                                ${typeStyles[toast.type].glow}
                                                ${toast.read ? 'opacity-60' : ''}
                                            `}
                                            onClick={() => markAsRead(toast.id)}
                                        >
                                            {/* Unread indicator */}
                                            {!toast.read && (
                                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#F59E0B]" />
                                            )}
                                            
                                            <div className="flex items-start gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                                    ${typeStyles[toast.type].bg.replace('/10', '/20')}
                                                `}>
                                                    {(() => {
                                                        const IconComp = toast.icon || defaultIcons[toast.type];
                                                        if (typeof IconComp === 'string') {
                                                            return <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{IconComp}</span>;
                                                        }
                                                        return <IconComp size={18} strokeWidth={1.5} className={typeStyles[toast.type].iconColor} />;
                                                    })()}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white/90 line-clamp-2">
                                                        {toast.message}
                                                    </p>
                                                    <p className="text-xs text-white/40 mt-1">
                                                        {formatTimeAgo(toast.timestamp)}
                                                    </p>
                                                </div>
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeToast(toast.id);
                                                    }}
                                                    className="text-white/20 hover:text-white/40 transition-colors"
                                                >
                                                    <X size={16} strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            {/* Link if present */}
                                            {toast.link && (
                                                <Link 
                                                    href={toast.link}
                                                    className="mt-3 inline-flex items-center gap-1 text-xs text-[#F59E0B] hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span>View</span>
                                                    <ArrowRight size={12} strokeWidth={1.5} />
                                                </Link>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {toasts.length > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10" style={{ background: "linear-gradient(to top, #0C0C16, #0C0C16/95)" }}>
                                    <button 
                                        onClick={() => useToasts.getState().clearAll()}
                                        className="w-full py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors"
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Keep backward compatibility - also render inline toasts
export default function GlobalToasts() {
    const { toasts, removeToast, isOpen, setIsOpen } = useToasts();
    const activeToasts = toasts.slice(0, 3);

    return (
        <>
            {/* Inline Toasts (for immediate feedback) */}
            <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
                <AnimatePresence>
                    {activeToasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.95 }}
                            className={`pointer-events-auto relative overflow-hidden p-4 rounded-2xl backdrop-blur-xl border ${typeStyles[toast.type].border} ${typeStyles[toast.type].bg} shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-4 group`}
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full ${typeStyles[toast.type].iconColor.replace('text-', 'bg-')}`} />
                            
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 border border-white/5 ${typeStyles[toast.type].iconColor}`}>
                                {(() => {
                                    const IconComp = toast.icon || defaultIcons[toast.type];
                                    if (typeof IconComp === 'string') {
                                        return <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{IconComp}</span>;
                                    }
                                    return <IconComp size={20} strokeWidth={1.5} />;
                                })()}
                            </div>
                            
                            <div className="flex-1 pr-4">
                                <p className="text-[13px] font-bold text-white/90 leading-tight">{toast.message}</p>
                            </div>

                            <button 
                                onClick={() => removeToast(toast.id)}
                                className="text-white/10 hover:text-white/40 transition-colors"
                            >
                                <X size={18} strokeWidth={1.5} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Notification Center */}
            <ToastContainer />
        </>
    );
}
