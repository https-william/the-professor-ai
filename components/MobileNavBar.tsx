
import React from 'react';
import { AppMode } from '../types';

interface MobileNavBarProps {
    mode: AppMode;
    setMode: (m: AppMode) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ mode, setMode }) => {
    
    const NavItem = ({ active, onClick, icon, label }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 ${active ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <div className={`mb-1 ${active ? 'animate-bounce-subtle' : ''}`}>
                {icon}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-0'}`}>
                {label}
            </span>
            {active && <div className="w-1 h-1 bg-white rounded-full mt-1"></div>}
        </button>
    );

    return (
        <div 
            className="fixed bottom-6 left-4 right-4 z-[90] h-16 flex items-center justify-around px-2 animate-slide-up-fade md:hidden"
            style={{
                background: 'rgba(5, 0, 0, 0.72)',
                borderRadius: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(18.7px)',
                WebkitBackdropFilter: 'blur(18.7px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            <NavItem 
                active={mode === 'EXAM'} 
                onClick={() => setMode('EXAM')} 
                label="Exam"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <NavItem 
                active={mode === 'PROFESSOR'} 
                onClick={() => setMode('PROFESSOR')} 
                label="Learn"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            />
            <NavItem 
                active={mode === 'HUB'} 
                onClick={() => setMode('HUB')} 
                label="Hub"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <NavItem 
                active={mode === 'DUEL'} 
                onClick={() => setMode('DUEL')} 
                label="Arena"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
        </div>
    );
};
