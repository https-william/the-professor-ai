
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HubMessage, ProfessorSection } from '../types';
import { createHubRoom, joinHubRoom, subscribeToHubMessages, sendHubMessage } from '../services/supabase';
import { generateHubResponse, generateProfessorContent } from '../services/geminiService';
import { processFile } from '../services/fileService';
import { ProfessorView } from './ProfessorView';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    const [mode, setMode] = useState<'LOBBY' | 'ROOM'>('LOBBY');
    const [roomCode, setRoomCode] = useState('');
    const [messages, setMessages] = useState<HubMessage[]>([]);
    
    // Core State for the "Slides"
    const [hubSections, setHubSections] = useState<ProfessorSection[]>([]);
    const [isLoadingSlides, setIsLoadingSlides] = useState(false);
    
    const [participants, setParticipants] = useState<string[]>([user.alias || 'You', 'The Professor']);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode === 'ROOM' && roomId) {
            const unsub = subscribeToHubMessages(roomId, (msgs) => {
                setMessages(msgs);
            });
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
        setShowMentions(false);
        
        await sendHubMessage(roomId, user.alias || 'You', msgText);

        // AI Interception
        if (msgText.toLowerCase().includes('@professor')) {
            const context = hubSections.map(s => s.content).join('\n') || "No documents uploaded yet.";
            generateHubResponse(msgText, context).then((response) => {
                sendHubMessage(roomId, 'The Professor', response, 'text'); 
            });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        if (val.endsWith('@')) {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionClick = (name: string) => {
        setInput(prev => prev + name + ' ');
        setShowMentions(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsLoadingSlides(true);
            try {
                const file = e.target.files[0];
                const processed = await processFile(file);
                
                // Generate Slides
                const sections = await generateProfessorContent(processed.content, { 
                    difficulty: 'Medium', 
                    questionType: 'Mixed', 
                    questionCount: 5, 
                    timerDuration: 'Limitless', 
                    personality: 'Academic', 
                    analogyDomain: 'General' 
                });
                
                setHubSections(sections);
                
                // Announce upload
                await sendHubMessage(roomId, 'System', `${user.alias} uploaded ${file.name}. Materials generated.`);

            } catch (err: any) {
                alert("Failed to process file: " + err.message);
            } finally {
                setIsLoadingSlides(false);
            }
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
                </div>
                
                <button onClick={onExit} className="px-4 py-2 bg-red-900/20 text-red-500 rounded-lg text-xs font-bold uppercase hover:bg-red-900/40 transition-colors border border-red-900/30">Disconnect</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* Main Workspace (Slides) - LEFT/CENTER */}
                <div className="flex-1 bg-[#121212] flex flex-col relative overflow-hidden">
                    {isLoadingSlides ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-green-500">
                            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="font-mono text-xs uppercase tracking-widest animate-pulse">Generating Study Material...</span>
                        </div>
                    ) : hubSections.length > 0 ? (
                        <div className="h-full overflow-y-auto p-6">
                            <ProfessorView 
                                state={{ sections: hubSections }} 
                                onExit={() => {}} 
                                timeRemaining={null} 
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <div className="text-4xl mb-4 opacity-30">📂</div>
                            <p className="text-sm mb-4">No materials loaded.</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-bold text-xs uppercase"
                            >
                                Upload Document
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                        </div>
                    )}
                </div>

                {/* Chat Panel - RIGHT SIDE */}
                <div className="w-full max-w-sm border-l border-white/10 flex flex-col bg-[#0a0a0a]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar relative">
                        {messages.map((m, i) => {
                            const isMe = m.sender === (user.alias || 'You');
                            const isProf = m.sender === 'The Professor';
                            const isSystem = m.sender === 'System';
                            
                            if (isSystem) {
                                return (
                                    <div key={i} className="flex justify-center my-2">
                                        <span className="text-[10px] text-gray-500 font-mono uppercase bg-white/5 px-2 py-1 rounded">{m.content}</span>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-in`}>
                                    <span className={`text-[10px] mb-1 ml-1 ${isProf ? 'text-amber-500 font-bold' : 'text-gray-500'}`}>{m.sender}</span>
                                    <span className={`px-3 py-2 rounded-xl text-sm max-w-[90%] ${isProf ? 'bg-amber-900/20 border border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : isMe ? 'bg-green-900/20 text-green-100 border border-green-500/20' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                                        {m.content}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Mentions Popover */}
                    {showMentions && (
                        <div className="bg-[#1a1a1a] border-t border-white/10 p-2 max-h-32 overflow-y-auto">
                            {participants.map(p => (
                                <button 
                                    key={p} 
                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded flex items-center gap-2"
                                    onClick={() => handleMentionClick(p)}
                                >
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-3 border-t border-white/10 bg-[#0f0f10]">
                        <input 
                            className="w-full bg-[#151515] rounded-lg px-4 py-3 text-white outline-none focus:ring-1 focus:ring-green-500/50 transition-all text-sm placeholder-gray-600" 
                            placeholder="Type @..." 
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TheHub;
