
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: any;
    isRead: boolean;
}

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
            
            // Local fallback if DB offline
            const defaultNotifs = [
                { id: '1', title: 'System Update', message: 'The Hub is now live.', timestamp: Date.now(), isRead: false },
                { id: '2', title: 'Exam Tip', message: 'Try "Explain Like I\'m 5".', timestamp: Date.now() - 86400000, isRead: false }
            ];

            const remoteNotifs = data ? data.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                timestamp: n.created_at,
                isRead: false
            })) : [];

            const allNotifs = [...remoteNotifs, ...defaultNotifs];
            
            // Check local storage for read status
            const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
            const processed = allNotifs.map(n => ({
                ...n,
                isRead: readIds.includes(n.id)
            }));

            setNotifications(processed);
            setHasUnread(processed.some(n => !n.isRead));
        };

        fetchNotifications();
    }, []);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setHasUnread(false);
            // Mark all current as read locally
            const ids = notifications.map(n => n.id);
            localStorage.setItem('read_notifications', JSON.stringify(ids));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

    return (
        <div className="relative">
            <button onClick={toggleOpen} className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                {hasUnread && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black"></div>}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-white/5 bg-black/20">
                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Updates</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${n.isRead ? 'opacity-60' : 'opacity-100 border-l-2 border-l-amber-500'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                                    <span className="text-[9px] text-gray-600">{new Date(n.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
