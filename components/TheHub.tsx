
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HubMessage, HubMaterial } from '../types';
import { createHubRoom, joinHubRoom, subscribeToHubMessages, sendHubMessage } from '../services/supabase';
import { generateHubResponse } from '../services/geminiService';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    const [mode, setMode] = useState<'LOBBY' | 'ROOM'>('LOBBY');
    const [roomCode, setRoomCode] = useState('');
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [materials, setMaterials] = useState<HubMaterial[]>([]);
    const [participants, setParticipants] = useState<string[]>([user.alias || 'You']);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [roomId, setRoomId] = useState('');
    
    // Consensus State
    const [agreements, setAgreements] = useState<string[]>([]);
    const [hasAgreed, setHasAgreed] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mode === 'ROOM' && roomId) {
            const unsub = subscribeToHubMessages(roomId, (msgs) => {
                setMessages(msgs);
            });
            // Simulate Material Sync (Placeholder for DB)
            setMaterials([
                { id: '1', title: 'Session Brief.txt', content: 'Focus on Quantum Mechanics.', addedBy: 'Host' }
            ]);
            return () => unsub();
        }
    }, [mode, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const id = await createHubRoom(user.alias || 'Host', []);
            setRoomId(id);
            setMode('ROOM');
            setRoomCode("HUB-" + Math.floor(1000 + Math.random() * 9000)); 
        } catch (e) {
            console.error(e);
            alert("Hub creation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!roomCode.trim()) return;
        setLoading(true);
        try {
            const id = await joinHubRoom(roomCode, user.alias || 'You');
            setRoomId(id);
            setMode('ROOM');
        } catch (e) {
            console.error(e);
            alert("Could not join room. Check code.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !roomId) return;
        
        const msgText = input;
        setInput('');
        
        await sendHubMessage(roomId, user.alias || 'You', msgText);

        // AI Interception
        if (msgText.toLowerCase().includes('@professor')) {
            // Optimistic UI for "Thinking"
            const context = materials.map(m => m.content).join('\n');
            generateHubResponse(msgText, context).then((response) => {
                sendHubMessage(roomId, 'The Professor', response, 'text'); 
            });
        }
    };

    const handleToggleAgreement = () => {
        if (hasAgreed) {
            setAgreements(prev => prev.filter(p => p !== user.alias));
            setHasAgreed(false);
        } else {
            setAgreements(prev => [...prev, user.alias || 'You']);
            setHasAgreed(true);
        }
    };

    const handleAddMaterial = () => {
        const text = prompt("Paste material content:");
        if (text) {
            const newMat = { id: Date.now().toString(), title: `Note ${materials.length + 1}`, content: text, addedBy: user.alias || 'You' };
            setMaterials(prev => [...prev, newMat]);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        alert("Code Copied!");
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-green-500 font-bold uppercase text-xs tracking-widest animate-pulse">Establishing Uplink...</p>
                </div>
            </div>
        );
    }

    if (mode === 'LOBBY') {
        return (
            <div className="max-w-4xl mx-auto h-[70vh] flex flex-col justify-center items-center p-6 text-center animate-fade-in relative">
                <button onClick={onExit} className="absolute top-0 right-0 px-4 py-2 text-gray-500 hover:text-white text-xs uppercase font-bold tracking-widest">
                    Exit Hub
                </button>

                <div className="mb-10">
                    <div className="w-24 h-24 bg-green-900/20 rounded-3xl border border-green-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.15)] relative">
                        <div className="absolute inset-0 border border-green-500/10 rounded-3xl animate-pulse"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white mb-3">The Hub</h1>
                    <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                        Establish a secure link. Collaborate in real-time. Share notes, chat, and solve problems together in a synchronized workspace.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <button 
                        onClick={handleCreate} 
                        className="p-8 bg-[#0f0f10] border border-white/10 rounded-2xl hover:border-green-500/50 hover:bg-green-900/10 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">📡</div>
                        <h3 className="text-xl font-bold text-white mb-1 relative z-10">Create Cell</h3>
                        <p className="text-xs text-gray-500 relative z-10">Host a new session and invite others via code.</p>
                    </button>

                    <div className="p-8 bg-[#0f0f10] border border-white/10 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
                        <div className="text-left relative z-10">
                            <div className="text-2xl mb-2">🔗</div>
                            <h3 className="text-xl font-bold text-white mb-1">Join Cell</h3>
                            <p className="text-xs text-gray-500">Enter an existing access code.</p>
                        </div>
                        <div className="flex gap-2 relative z-10">
                            <input 
                                type="text" 
                                placeholder="CODE" 
                                className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-center font-mono uppercase text-white w-full outline-none focus:border-green-500 transition-colors"
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                value={roomCode}
                            />
                            <button onClick={handleJoin} disabled={!roomCode} className="px-4 bg-white text-black font-bold rounded-lg uppercase text-xs hover:bg-gray-200 disabled:opacity-50">Go</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const consensusPercent = Math.round((agreements.length / Math.max(1, participants.length)) * 100);

    return (
        <div className="fixed inset-0 bg-[#0c0c0c] z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-[#111]">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={handleCopy}>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Room Code</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-mono font-bold text-green-400 tracking-wider">{roomCode || "ACTIVE"}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="flex -space-x-2">
                        {participants.map((p, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-black flex items-center justify-center text-[10px] text-white font-bold cursor-default hover:z-10 transition-transform hover:scale-110" title={p}>{p.charAt(0)}</div>
                        ))}
                    </div>
                </div>
                
                {/* Consensus Bar */}
                <div className="hidden md:flex flex-col w-48 mr-4">
                    <div className="flex justify-between text-[9px] uppercase font-bold text-gray-500 mb-1">
                        <span>Group Consensus</span>
                        <span>{consensusPercent}%</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${consensusPercent}%` }}></div>
                    </div>
                </div>

                <button onClick={onExit} className="px-4 py-2 bg-red-900/20 text-red-500 rounded-lg text-xs font-bold uppercase hover:bg-red-900/40 transition-colors border border-red-900/30">Disconnect</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chat Panel */}
                <div className="w-full max-w-sm border-r border-white/10 flex flex-col bg-[#0a0a0a]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                        <div className="text-center text-gray-600 text-[10px] uppercase tracking-widest mt-4">Session Started</div>
                        {messages.map((m, i) => {
                            const isMe = m.sender === (user.alias || 'You');
                            const isProf = m.sender === 'The Professor';
                            return (
                                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-in`}>
                                    <span className={`text-[10px] mb-1 ml-1 ${isProf ? 'text-amber-500 font-bold' : 'text-gray-500'}`}>{m.sender}</span>
                                    <span className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${isProf ? 'bg-amber-900/20 border border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : isMe ? 'bg-green-900/20 text-green-100 border border-green-500/20' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                                        {m.content}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-white/10 bg-[#0f0f10]">
                        <input 
                            className="w-full bg-[#151515] rounded-lg px-4 py-3 text-white outline-none focus:ring-1 focus:ring-green-500/50 transition-all text-sm placeholder-gray-600" 
                            placeholder="Type @Professor for AI help..." 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                        />
                    </div>
                </div>
                
                {/* Main Workspace (Shared Material) */}
                <div className="flex-1 bg-[#121212] flex flex-col p-6 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">📂</span> Shared Intel
                        </h2>
                        <button onClick={handleAddMaterial} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase text-white">+ Add Text Note</button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start overflow-y-auto">
                        {materials.map(mat => (
                            <div key={mat.id} className="bg-[#1a1a1a] border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all group">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-gray-300 text-sm truncate">{mat.title}</h4>
                                    <span className="text-[10px] text-gray-600">{mat.addedBy}</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-4">{mat.content}</p>
                            </div>
                        ))}
                        {materials.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-600">
                                <div className="text-4xl mb-4 opacity-30">📁</div>
                                <p className="text-sm">No materials uploaded.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                            {agreements.length}/{participants.length} Ready to Proceed
                        </div>
                        <button 
                            onClick={handleToggleAgreement}
                            className={`px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg ${hasAgreed ? 'bg-green-600 text-white shadow-green-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {hasAgreed ? 'Confirmed ✓' : 'Click to Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
