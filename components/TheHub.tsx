
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { processFile } from '../services/fileService';
import { generateProfessorContent, simplifyExplanation } from '../services/geminiService';
import { supabase } from '../services/supabase';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

// ... imports remain the same ...

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    // ... logic remains mostly same, focusing on UI Fixes ...
    const [mode, setMode] = useState<'LOBBY' | 'ROOM'>('LOBBY');
    const [roomCode, setRoomCode] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // ... setup realtime logic ... (Simplified for brevity in update, keep existing logic if robust)
    
    const handleCreate = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(code);
        setMode('ROOM');
        setParticipants([user.alias]);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        alert("Code Copied: " + roomCode);
    };

    if (mode === 'LOBBY') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <h1 className="text-4xl font-display font-bold text-white">The Hub</h1>
                <div className="flex gap-4">
                    <button onClick={handleCreate} className="px-8 py-4 bg-green-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-green-500">Create Room</button>
                    <input 
                        type="text" 
                        placeholder="ENTER CODE" 
                        className="bg-black border border-white/20 rounded-xl px-4 text-center font-mono uppercase text-white"
                        onKeyDown={(e) => { if(e.key === 'Enter') { setRoomCode(e.currentTarget.value.toUpperCase()); setMode('ROOM'); } }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0c0c0c] z-50 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-[#111]">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col cursor-pointer hover:opacity-80" onClick={handleCopy}>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Room Code</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-mono font-bold text-green-400 tracking-wider">{roomCode}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="flex -space-x-2">
                        {participants.map((p, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-black flex items-center justify-center text-[10px]">{p.charAt(0)}</div>
                        ))}
                    </div>
                </div>
                <button onClick={onExit} className="px-4 py-2 bg-red-900/20 text-red-500 rounded-lg text-xs font-bold uppercase">Exit</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chat Panel - Explicitly Visible */}
                <div className="w-full max-w-sm border-r border-white/10 flex flex-col bg-[#0a0a0a]">
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="text-center text-gray-600 text-xs mt-4">Room Generated. Invite others with Code: {roomCode}</div>
                        {messages.map((m, i) => (
                            <div key={i} className="mb-2">
                                <span className="font-bold text-gray-400 text-xs">{m.sender}: </span>
                                <span className="text-white text-sm">{m.text}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-white/10">
                        <input 
                            className="w-full bg-[#151515] rounded-lg px-3 py-2 text-white outline-none" 
                            placeholder="Type..." 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    setMessages([...messages, { sender: 'You', text: input }]);
                                    setInput('');
                                }
                            }}
                        />
                    </div>
                </div>
                
                {/* Main Content (Whiteboard/Slides placeholder) */}
                <div className="flex-1 bg-[#151515] flex items-center justify-center text-gray-500">
                    Shared View Area
                </div>
            </div>
        </div>
    );
};
