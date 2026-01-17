
import React from 'react';
import { AppMode } from '../types';

interface FloatingDockProps {
    mode: AppMode;
    setMode: (m: AppMode) => void;
    onHub: () => void;
    isDuelActive: boolean;
    onDuel: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({ mode, setMode, onHub, isDuelActive, onDuel }) => {
    const DockItem = ({ active, onClick, icon, label, colorClass }: any) => (
        <button 
            onClick={onClick}
            className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${active ? `${colorClass} -translate-y-4 scale-110 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white ring-2 ring-white/20` : 'bg-white/5 hover:bg-white/10 hover:-translate-y-2 text-gray-400'}`}
        >
            <div className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {icon}
            </div>
            {/* Label - Hover/Tap Reveal Only */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="bg-black/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10 shadow-xl tracking-wider uppercase">
                    {label}
                </span>
                <div className="w-2 h-2 bg-black/90 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/10"></div>
            </div>
            
            {active && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>}
        </button>
    );

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] hidden md:flex items-end gap-4 px-6 pb-4 pt-4 bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:bg-white/20 dark:hover:bg-black/60 ring-1 ring-white/10">
            <DockItem active={mode === 'EXAM'} onClick={() => setMode('EXAM')} label="Exam Mode" colorClass="bg-blue-600 shadow-blue-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>} />
            <DockItem active={mode === 'PROFESSOR'} onClick={() => setMode('PROFESSOR')} label="Lectures" colorClass="bg-amber-600 shadow-amber-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>} />
            <DockItem active={mode === 'FLASHCARDS'} onClick={() => setMode('FLASHCARDS')} label="Flashcards" colorClass="bg-pink-600 shadow-pink-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} />
            <DockItem active={mode === 'HUB'} onClick={() => { setMode('HUB'); onHub(); }} label="The Hub" colorClass="bg-green-600 shadow-green-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>} />
            <DockItem active={mode === 'DUEL'} onClick={() => { if(isDuelActive) setMode('DUEL'); else onDuel(); }} label="The Arena" colorClass="bg-purple-600 shadow-purple-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} />
        </div>
    );
};
