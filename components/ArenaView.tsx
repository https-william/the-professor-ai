
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DuelCreateModal } from './DuelCreateModal';
import { DuelJoinModal } from './DuelJoinModal';

interface ArenaViewProps {
    user: UserProfile;
    onExit: () => void;
}

export const ArenaView: React.FC<ArenaViewProps> = ({ user, onExit }) => {
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);

    return (
        <div className="max-w-4xl mx-auto h-[70vh] flex flex-col justify-center items-center p-6 text-center animate-fade-in">
            {showCreate && <DuelCreateModal onClose={() => setShowCreate(false)} onSubmit={() => {}} userXP={user.xp || 0} tier={user.subscriptionTier} />}
            {showJoin && <DuelJoinModal onClose={() => setShowJoin(false)} onJoin={() => {}} />}

            <div className="mb-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-900/20 rounded-full blur-[80px] animate-pulse-slow pointer-events-none"></div>
                <div className="w-24 h-24 bg-purple-900/20 rounded-3xl border border-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(168,85,247,0.2)] relative z-10 text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="m21 3-6.5 6.5"/><path d="m5 11 6 6"/><path d="m2 19 2 2"/><path d="m9 22 2-2"/></svg>
                </div>
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tighter relative z-10">THE ARENA</h1>
                <p className="text-purple-400 text-sm font-mono uppercase tracking-widest relative z-10">Competitive Examination Protocol</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl relative z-10">
                <button 
                    onClick={() => setShowCreate(true)} 
                    className="flex-1 p-8 bg-[#0f0f10] border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-purple-900/10 transition-all group relative overflow-hidden text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-3xl mb-4 group-hover:-translate-y-1 transition-transform text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 relative z-10">Host Duel</h3>
                    <p className="text-xs text-gray-500 relative z-10">Create a lobby and challenge others.</p>
                </button>

                <button 
                    onClick={() => setShowJoin(true)} 
                    className="flex-1 p-8 bg-[#0f0f10] border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-purple-900/10 transition-all group relative overflow-hidden text-left"
                >
                    <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-3xl mb-4 group-hover:-translate-y-1 transition-transform text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 relative z-10">Join Duel</h3>
                    <p className="text-xs text-gray-500 relative z-10">Enter an arena code to fight.</p>
                </button>
            </div>
            
            <button onClick={onExit} className="mt-12 text-gray-600 hover:text-white text-xs uppercase font-bold tracking-widest transition-colors relative z-10">
                Return to Library
            </button>
        </div>
    );
};

export default ArenaView;
