
import React, { useState } from 'react';

export const AdminBroadcast: React.FC<{ onBroadcast: (t: string, m: string, adminId: string) => Promise<boolean> }> = ({ onBroadcast }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'ERROR'>('IDLE');

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('SENDING');

        // Mock Admin ID - in real app, get from auth context
        const success = await onBroadcast(title, message, 'admin-console');

        if (success) {
            setStatus('SENT');
            setTimeout(() => {
                setTitle('');
                setMessage('');
                setStatus('IDLE');
            }, 2000);
        } else {
            setStatus('ERROR');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="glass-container p-8 relative overflow-hidden">
                {status === 'SENT' && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center z-20 backdrop-blur-sm animate-fade-in">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Broadcast Sent</h3>
                            <p className="text-green-400 font-mono">Signal Propagated Successfully</p>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h2 className="text-xl font-bold font-serif mb-2">Emergency Broadcast System</h2>
                    <p className="text-gray-400 text-sm">Send high-priority notifications to all connected user terminals. Use with caution.</p>
                </div>

                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subject Line</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                            placeholder="e.g. System Maintenance Update"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Message Payload</label>
                        <textarea
                            required
                            rows={5}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors resize-none"
                            placeholder="Enter transmission content here..."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-amber-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span>Broadcasts are immediate and irreversible.</span>
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'SENDING' || !title || !message}
                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${status === 'SENDING'
                                    ? 'bg-amber-900/30 text-amber-500 cursor-wait'
                                    : 'bg-amber-600 text-black hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                }`}
                        >
                            {status === 'SENDING' ? 'Transmitting...' : 'Send Broadcast'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
