"use client";

import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

type ToastType = 'success' | 'error' | 'xp' | 'info' | 'achievement' | 'challenge' | 'broadcast' | 'warn';

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
    activeToastIds: string[];
    isOpen: boolean;
    fetchNotifications: () => Promise<void>;
    addToast: (message: string, type: ToastType, icon?: any, link?: string, saveToDb?: boolean, idOverride?: string, transient?: boolean) => Promise<void>;
    removeToast: (id: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    toggleCenter: () => void;
    setIsOpen: (open: boolean) => void;
}

export const useToasts = create<ToastStore>((set, get) => ({
    toasts: [],
    activeToastIds: [],
    isOpen: false,
    
    fetchNotifications: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            if (typeof window !== 'undefined') {
                const local = JSON.parse(localStorage.getItem('local_notifications') || '[]');
                const parsed = local.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
                set({ toasts: parsed });
            }
            return;
        }

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

            let localOnly: Toast[] = [];
            if (typeof window !== 'undefined') {
                const local = JSON.parse(localStorage.getItem('local_notifications') || '[]');
                const parsedLocal = local.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
                localOnly = parsedLocal.filter((n: Toast) => !fetchedToasts.some(ft => ft.id === n.id));
            }

            const merged = [...localOnly, ...fetchedToasts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);

            set({ toasts: merged });
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_notifications', JSON.stringify(merged));
            }
        } else if (typeof window !== 'undefined') {
            const local = JSON.parse(localStorage.getItem('local_notifications') || '[]');
            const parsed = local.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
            set({ toasts: parsed });
        }
    },

    addToast: async (message, type, icon, link, saveToDb = false, idOverride, transient = false) => {
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

        set((state) => {
            const updatedActive = [id, ...state.activeToastIds].slice(0, 3);
            if (transient) {
                return {
                    activeToastIds: updatedActive
                };
            }
            const updated = [newToast, ...state.toasts].slice(0, 50);
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_notifications', JSON.stringify(updated));
            }
            return { 
                toasts: updated,
                activeToastIds: updatedActive
            };
        });

        if (saveToDb && !transient) {
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
                    set((state) => {
                        const updated = state.toasts.map((t) => t.id === id ? { ...t, id: data.id } : t);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('local_notifications', JSON.stringify(updated));
                        }
                        return { toasts: updated };
                    });
                }
            }
        }

        // Auto-dismiss inline popup
        setTimeout(() => {
            set((state) => ({ activeToastIds: state.activeToastIds.filter((activeId) => activeId !== id) }));
        }, transient ? 4000 : (type === 'broadcast' ? 15000 : 8000));
    },
    
    removeToast: async (id) => {
        const supabase = createClient();
        await supabase.from('notifications').delete().eq('id', id);
        set((state) => {
            const updated = state.toasts.filter((t) => t.id !== id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_notifications', JSON.stringify(updated));
            }
            return { toasts: updated, activeToastIds: state.activeToastIds.filter((activeId) => activeId !== id) };
        });
    },
    
    markAsRead: async (id) => {
        const supabase = createClient();
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        set((state) => {
            const updated = state.toasts.map((t) => t.id === id ? { ...t, read: true } : t);
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_notifications', JSON.stringify(updated));
            }
            return { toasts: updated };
        });
    },
    
    markAllAsRead: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id);
        }
        set((state) => {
            const updated = state.toasts.map((t) => ({ ...t, read: true }));
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_notifications', JSON.stringify(updated));
            }
            return { toasts: updated };
        });
    },
    
    clearAll: async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('notifications').delete().eq('user_id', session.user.id);
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('local_notifications', JSON.stringify([]));
        }
        set({ toasts: [], activeToastIds: [] });
    },
    
    toggleCenter: () => set((state) => ({ isOpen: !state.isOpen })),
    setIsOpen: (open) => set({ isOpen: open }),
}));

const typeStyles: Record<ToastType, { bg: string, iconColor: string, border: string, glow: string }> = {
    success: { bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5', iconColor: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-[0_12px_40px_rgba(16,185,129,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
    error: { bg: 'bg-gradient-to-br from-rose-500/10 to-rose-600/5', iconColor: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-[0_12px_40px_rgba(244,63,94,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
    warn: { bg: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5', iconColor: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-[0_12px_40px_rgba(234,179,8,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
    xp: { bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5', iconColor: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-[0_12px_40px_rgba(245,158,11,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
    info: { bg: 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/5', iconColor: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-[0_12px_40px_rgba(99,102,241,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
    achievement: { bg: 'bg-gradient-to-br from-purple-500/10 to-indigo-500/5', iconColor: 'text-purple-300', border: 'border-purple-500/35', glow: 'shadow-[0_16px_48px_rgba(168,85,247,0.22),_inset_0_1px_1px_rgba(255,255,255,0.08)]' },
    challenge: { bg: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5', iconColor: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-[0_12px_40px_rgba(6,182,212,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
    broadcast: { bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-[0_12px_40px_rgba(59,130,246,0.15),_inset_0_1px_1px_rgba(255,255,255,0.05)]' },
};

const defaultIcons: Record<ToastType, any> = {
    success: CheckCircle2,
    error: AlertCircle,
    warn: AlertCircle,
    xp: Zap,
    info: Info,
    achievement: Trophy,
    challenge: Flag,
    broadcast: Megaphone,
};

export function ToastContainer() {
    const { toasts, removeToast, isOpen, setIsOpen, markAsRead } = useToasts();
    const router = useRouter();

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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100010]"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-[calc(100%-2.5rem)] sm:w-full max-w-md z-[100011] bg-[var(--bg-2)]/90 backdrop-blur-[40px] border-l border-[var(--border)] shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 p-6 border-b border-[var(--border)] bg-[var(--bg-2)]/50 backdrop-blur-xl flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-[var(--blue)]/10 border border-[var(--blue)]/30 flex items-center justify-center text-[var(--blue)] shadow-[0_0_20px_var(--blue-glow)]">
                                            <Megaphone size={20} />
                                        </div>
                                        <h2 className="text-xl font-black tracking-tight text-[var(--foreground)]">Notifications</h2>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 rounded-2xl bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        <X size={20} strokeWidth={1.5} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-[var(--foreground-muted)]">{unreadCount} unread</span>
                                    {toasts.length > 0 && (
                                        <button 
                                            onClick={() => useToasts.getState().markAllAsRead()}
                                            className="text-xs font-black text-[var(--amber)] hover:underline tracking-wider uppercase"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
                                {toasts.length === 0 ? (
                                    <div className="text-center py-24 px-6 flex flex-col items-center justify-center my-auto h-full">
                                        <div className="w-20 h-20 rounded-3xl bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-inner text-[var(--foreground)]/20">
                                            <BellOff size={36} strokeWidth={1.5} />
                                        </div>
                                        <p className="text-[var(--foreground)]/60 font-black text-base tracking-tight mb-2">No notifications yet</p>
                                        <p className="text-[var(--foreground-muted)] text-xs max-w-xs leading-relaxed mx-auto">We'll notify you when you unlock achievements, earn XP, or conquer study milestones!</p>
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
                                                relative p-5 rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:brightness-[1.03] transition-all duration-300 border backdrop-blur-xl
                                                ${typeStyles[toast.type].border}
                                                ${typeStyles[toast.type].bg}
                                                ${typeStyles[toast.type].glow}
                                                ${toast.read ? 'opacity-50 grayscale-[40%]' : ''}
                                            `}
                                            onClick={() => {
                                                markAsRead(toast.id);
                                                if (toast.link) {
                                                    router.push(toast.link);
                                                    setIsOpen(false);
                                                }
                                            }}
                                        >
                                            {/* Unread indicator */}
                                            {!toast.read && (
                                                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[var(--amber)] shadow-[0_0_10px_var(--amber)] animate-pulse" />
                                            )}
                                            
                                            <div className="flex items-start gap-4">
                                                <div className={`
                                                    w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/5
                                                    ${typeStyles[toast.type].bg.replace('/10', '/20')}
                                                `}>
                                                    {(() => {
                                                        const IconComp = toast.icon || defaultIcons[toast.type];
                                                        if (typeof IconComp === 'string') {
                                                            return <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{IconComp}</span>;
                                                        }
                                                        return <IconComp size={22} strokeWidth={1.5} className={typeStyles[toast.type].iconColor} />;
                                                    })()}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="text-sm font-bold text-[var(--foreground)] leading-snug line-clamp-3 mb-1.5">
                                                        {toast.message}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-[var(--foreground-muted)] flex items-center gap-1.5">
                                                        <span>{formatTimeAgo(toast.timestamp)}</span>
                                                        <span>•</span>
                                                        <span className="capitalize text-[var(--blue-text)]">{toast.type}</span>
                                                    </p>
                                                </div>
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeToast(toast.id);
                                                    }}
                                                    className="text-[var(--foreground)]/20 hover:text-[var(--foreground)]/60 transition-colors p-1 rounded-lg hover:bg-white/5"
                                                >
                                                    <X size={18} strokeWidth={1.5} />
                                                </button>
                                            </div>

                                            {/* Link if present */}
                                            {toast.link && (
                                                <button 
                                                    className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[var(--amber)] hover:underline uppercase tracking-wider bg-[var(--amber)]/10 px-3 py-1.5 rounded-xl border border-[var(--amber)]/20"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(toast.id);
                                                        if (toast.link) {
                                                            router.push(toast.link);
                                                        }
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <span>View Details</span>
                                                    <ArrowRight size={14} strokeWidth={1.5} />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {toasts.length > 0 && (
                                <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-2)]/50 backdrop-blur-xl mt-auto">
                                    <button 
                                        onClick={() => useToasts.getState().clearAll()}
                                        className="w-full h-14 rounded-2xl bg-[var(--bg-3)] border border-[var(--border)] text-xs font-black text-[var(--foreground)]/50 hover:text-[var(--foreground)] hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm"
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
    const { toasts, activeToastIds, removeToast, isOpen, setIsOpen } = useToasts();
    const activeToasts = toasts.filter(t => activeToastIds.includes(t.id)).slice(0, 3);

    return (
        <>
            {/* Inline Toasts (for immediate feedback) */}
            <div className="fixed top-20 right-6 z-[100012] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
                <AnimatePresence>
                    {activeToasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.95 }}
                            className={`pointer-events-auto relative overflow-hidden p-4 rounded-2xl border backdrop-blur-xl bg-[#09090E]/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ${typeStyles[toast.type].border} ${typeStyles[toast.type].bg} ${typeStyles[toast.type].glow} flex items-center gap-4 group`}
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
                                <p className="text-[13px] font-bold text-[var(--foreground)] leading-tight">{toast.message}</p>
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
