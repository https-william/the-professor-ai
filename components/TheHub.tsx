
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HubMessage, ProfessorSection } from '../types';
import { createHubRoom, joinHubRoom, subscribeToHub, sendHubMessage } from '../services/supabase';
import { generateHubResponse, generateProfessorContent, generateMotivation } from '../services/geminiService';
import { processFile } from '../services/fileService';
import { ProfessorView } from './ProfessorView';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
    onStartCall?: (peerId: string) => void;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit, onStartCall }) => {
    const [mode, setMode] = useState<'LOBBY' | 'ROOM'>('LOBBY');
    const [roomCode, setRoomCode] = useState('');
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [hubSections, setHubSections] = useState<ProfessorSection[]>([]);
    const [isLoadingSlides, setIsLoadingSlides] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [motivation, setMotivation] = useState('Syncing Neural Network...');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const subscriptionRef = useRef<any>(null);

    useEffect(() => {
        let mounted = true;
        if (mode === 'LOBBY') {
            generateMotivation()
                .then(m => { if(mounted) setMotivation(m); })
                .catch(() => { if(mounted) setMotivation("Focus. Execute. Succeed."); });
        }
        return () => { mounted = false; };
    }, [mode]);

    useEffect(() => {
        if (mode === 'ROOM' && roomId) {
            subscriptionRef.current = subscribeToHub(
                roomId,
                user.alias || 'You',
                (msgs) => setMessages(msgs),
                (typers) => setTypingUsers(typers),
                (users) => setOnlineUsers(users)
            );
            return () => {
                if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            };
        }
    }, [mode, roomId, user.alias]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const id = await createHubRoom(user.alias || 'Host', []);
            setRoomId(id);
            setMode('ROOM');
            setRoomCode("HUB-" + Math.floor(1000 + Math.random() * 9000)); 
        } catch (e) {
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

        if (msgText.toLowerCase().includes('@professor')) {
            const context = hubSections.map(s => s.content).join('\n') || "No documents uploaded yet.";
            generateHubResponse(msgText, context).then((response) => {
                sendHubMessage(roomId, 'The Professor', response, 'text'); 
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsLoadingSlides(true);
            try {
                const file = e.target.files[0];
                const processed = await processFile(file);
                const sections = await generateProfessorContent(processed.content, { 
                    difficulty: 'Medium', questionType: 'Mixed', questionCount: 5, 
                    timerDuration: 'Limitless', personality: 'Academic', analogyDomain: 'General' 
                });
                setHubSections(sections);
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

    if (mode === 'LOBBY') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 text-center animate-fade-in relative">
                <button onClick={onExit} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xs uppercase font-bold tracking-widest">Exit</button>
                
                <div className="mb-10 w-full max-w-md">
                    <div className="w-24 h-24 bg-green-900/20 rounded-3xl border border-green-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.15)] animate-float">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">The Hub</h1>
                    <p className="text-green-400 text-sm font-mono uppercase tracking-widest mb-8 h-6">{motivation}</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={handleCreate} 
                            disabled={loading}
                            className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/50 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 group"
                        >
                            {loading ? 'Initializing...' : 'Create New Cell'}
                        </button>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="ENTER CODE" 
                                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-center font-mono uppercase text-white w-full outline-none focus:border-green-500 transition-colors" 
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
                                value={roomCode} 
                            />
                            <button 
                                onClick={handleJoin} 
                                disabled={!roomCode || loading} 
                                className="px-6 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl uppercase text-xs transition-colors disabled:opacity-50"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0c0c0c] z-50 flex flex-col animate-fade-in">
            <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-[#111]">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={handleCopy}>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Room Code</span>
                        <span className="text-xl font-mono font-bold text-green-400 tracking-wider">{roomCode || "ACTIVE"}</span>
                    </div>
                </div>
                <button onClick={onExit} className="px-4 py-2 bg-red-900/20 text-red-500 rounded-lg text-xs font-bold uppercase hover:bg-red-900/40 transition-colors border border-red-900/30">Disconnect</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-[#121212] flex flex-col relative overflow-hidden">
                    {isLoadingSlides ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-green-500">
                            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="font-mono text-xs uppercase tracking-widest animate-pulse">Generating Materials...</span>
                        </div>
                    ) : hubSections.length > 0 ? (
                        <div className="h-full overflow-y-auto p-6">
                            <ProfessorView state={{ sections: hubSections }} onExit={() => {}} timeRemaining={null} />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <div className="text-4xl mb-4 opacity-30">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                            </div>
                            <p className="text-sm mb-4">No materials loaded.</p>
                            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-bold text-xs uppercase">Upload Document</button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                        </div>
                    )}
                </div>

                <div className="w-full max-w-sm border-l border-white/10 flex flex-col bg-[#0a0a0a]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar relative">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.sender === (user.alias || 'You') ? 'items-end' : 'items-start'} animate-slide-in`}>
                                <span className="text-[10px] mb-1 ml-1 text-gray-500">{m.sender}</span>
                                <span className="px-3 py-2 rounded-xl text-sm max-w-[90%] bg-white/5 text-gray-300 border border-white/5">{m.content}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-white/10 bg-[#0f0f10]">
                        <input className="w-full bg-[#151515] rounded-lg px-4 py-3 text-white outline-none focus:ring-1 focus:ring-green-500/50 transition-all text-sm placeholder-gray-600" placeholder="Message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
