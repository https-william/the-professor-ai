
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
        <div className="max-w-6xl mx-auto h-[75vh] flex flex-col justify-center items-center p-6 text-center animate-slide-up-fade relative">

            {showCreate && <DuelCreateModal onClose={() => setShowCreate(false)} onSubmit={() => { }} userXP={user.xp || 0} tier={user.subscriptionTier} />}
            {showJoin && <DuelJoinModal onClose={() => setShowJoin(false)} onJoin={() => { }} />}

            {/* Background Grid - Subtle */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="w-full h-full bg-[linear-gradient(to_right,#ffffff11_1px,transparent_1px),linear-gradient(to_bottom,#ffffff11_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>

            {/* Header Module */}
            <div className="mb-16 relative z-10 group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="inline-flex items-center gap-4 border border-white/10 bg-[#050505]/80 px-6 py-3 rounded-full backdrop-blur-md mb-6">
                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full"></div>
                    <span className="text-xs font-serif font-medium text-gray-400 uppercase tracking-widest">Active Study Network</span>
                </div>

                <h1 className="text-6xl font-cinzel text-white mb-2 tracking-wide">
                    The Arena
                </h1>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-500 to-transparent mx-auto opacity-50"></div>
                <p className="text-gray-500 text-sm font-serif italic mt-4">
                    "Iron sharpens iron, so one person sharpens another."
                </p>
            </div>

            {/* Action Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10 px-4">

                {/* HOST CARD */}
                <button
                    onClick={() => setShowCreate(true)}
                    className="relative group overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] hover:border-gray-600 transition-all duration-500 text-left min-h-[200px] flex flex-col justify-end p-8"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 transform group-hover:-translate-y-1 transition-transform duration-500">
                        <div className="mb-4 text-gray-600 group-hover:text-gray-300 transition-colors">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <h3 className="text-2xl font-serif text-gray-200 mb-2">Host Session</h3>
                        <p className="text-xs text-gray-600 font-mono uppercase tracking-widest group-hover:text-gray-400 transition-colors">
                            &gt;&gt; Configure Study Lobby
                        </p>
                    </div>
                </button>

                {/* JOIN CARD */}
                <button
                    onClick={() => setShowJoin(true)}
                    className="relative group overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] hover:border-gray-600 transition-all duration-500 text-left min-h-[200px] flex flex-col justify-end p-8"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 transform group-hover:-translate-y-1 transition-transform duration-500">
                        <div className="mb-4 text-gray-600 group-hover:text-gray-300 transition-colors">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        </div>
                        <h3 className="text-2xl font-serif text-gray-200 mb-2">Join Session</h3>
                        <p className="text-xs text-gray-600 font-mono uppercase tracking-widest group-hover:text-gray-400 transition-colors">
                            &gt;&gt; Enter Access Code
                        </p>
                    </div>
                </button>
            </div>

            <button onClick={onExit} className="mt-16 text-[10px] text-gray-600 hover:text-gray-400 uppercase font-bold tracking-[0.2em] transition-colors relative z-10">
                Return to Library
            </button>
        </div>
    );
};

export default ArenaView;
