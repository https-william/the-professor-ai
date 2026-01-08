
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

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
        if (!db) return; // Silent fail for offline/demo

        const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"), limit(5));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lastReadTime = parseInt(localStorage.getItem('last_read_notification_time') || '0');
            const fetched: Notification[] = [];
            let unreadFound = false;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const time = data.timestamp?.seconds ? data.timestamp.seconds * 1000 : Date.now();
                const isRead = time <= lastReadTime;
                
                if (!isRead) unreadFound = true;

                fetched.push({
                    id: doc.id,
                    title: data.title,
                    message: data.message,
                    timestamp: time,
                    isRead: isRead
                });
            });

            // Demo Notifications if empty
            if (fetched.length === 0) {
                fetched.push(
                    { id: '1', title: 'System Update', message: 'The Hub is now live.', timestamp: Date.now() - 100000, isRead: true },
                    { id: '2', title: 'Exam Tip', message: 'Try "Nightmare" mode for extra XP.', timestamp: Date.now() - 200000, isRead: true }
                );
            }

            setNotifications(fetched);
            setHasUnread(unreadFound);
        });

        return () => unsubscribe();
    }, []);

    const toggleOpen = () => {
        if (!isOpen) {
            // Mark all as read locally
            localStorage.setItem('last_read_notification_time', Date.now().toString());
            setHasUnread(false);
            setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button onClick={toggleOpen} className="p-2 text-gray-400 hover:text-white transition-colors relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                {hasUnread && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></div>}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Updates</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-600 text-xs">No new updates</div>
                        ) : notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${n.isRead ? 'opacity-60' : 'opacity-100 bg-blue-900/10'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-xs font-bold ${n.isRead ? 'text-gray-300' : 'text-white'}`}>{n.title}</h4>
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
