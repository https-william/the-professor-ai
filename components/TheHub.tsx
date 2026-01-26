import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HubMessage, ProfessorSection } from '../types';
import { createHubRoom, joinHubRoom, subscribeToHubWithSignals, sendHubMessage } from '../services/supabase';
import { generateHubResponse, generateProfessorContent, generateMotivation } from '../services/geminiService';
import { processFile } from '../services/fileService';
import { ProfessorView } from './ProfessorView';
import { callService, CallState } from '../services/callService';
import { CallOverlay, IncomingCallModal } from './CallOverlay';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
    onStartCall?: (peerId: string) => void;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
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

    const [callState, setCallState] = useState<CallState>({ status: 'IDLE', isAudioEnabled: true, isVideoEnabled: true });
    const [incomingCaller, setIncomingCaller] = useState<{ id: string, answer: () => Promise<void> } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const subscriptionRef = useRef<any>(null);

    useEffect(() => {
        if (user.alias) {
            callService.initialize(
                user.alias,
                (state) => setCallState(state),
                (callerId, answer) => setIncomingCaller({ id: callerId, answer })
            );
        }
    }, [user.alias]);

    useEffect(() => {
        let mounted = true;
        if (mode === 'LOBBY') {
            generateMotivation()
                .then(m => { if (mounted) setMotivation(m); })
                .catch(() => { if (mounted) setMotivation("Focus. Execute. Succeed."); });
        }
        return () => { mounted = false; };
    }, [mode]);

    useEffect(() => {
        if (mode === 'ROOM' && roomId) {
            subscriptionRef.current = subscribeToHubWithSignals(
                roomId,
                user.alias || 'You',
                (msgs) => setMessages(msgs),
                (typers) => setTypingUsers(typers),
                (users) => setOnlineUsers(users),
                (signal) => { }
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
            if (!id) throw new Error("Failed to retrieve Room ID");
            setRoomId(id);
            setMode('ROOM');
            setRoomCode("NET-" + Math.floor(1000 + Math.random() * 9000));
        } catch (e: any) {
            alert("Network creation failed. Permissions error.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!roomCode.trim()) return;
        setLoading(true);
        try {
            const id = await joinHubRoom(roomCode, user.alias || 'You');
            if (!id) throw new Error("Room not found");
            setRoomId(id);
            setMode('ROOM');
        } catch (e: any) {
            alert("Could not link to node. Check code.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !roomId) return;
        const msgText = input;
        setInput('');

        try {
            await sendHubMessage(roomId, user.alias || 'You', msgText);
            subscriptionRef.current?.sendTyping();

            if (msgText.toLowerCase().includes('@professor')) {
                const context = hubSections.map(s => s.content).join('\n') || "No data stream found.";
                generateHubResponse(msgText, context).then((response) => {
                    sendHubMessage(roomId, 'The Professor', response, 'text');
                });
            }
        } catch (e) {
            console.error("Message Blocked", e);
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
                await sendHubMessage(roomId, 'System', `DATA UPLINK: ${file.name}. Analysis Complete.`);
            } catch (err: any) {
                alert("Upload Failed: " + err.message);
            } finally {
                setIsLoadingSlides(false);
            }
        }
    };

    const handleStartCall = (targetAlias: string) => {
        const cleanId = targetAlias.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        callService.startCall(cleanId);
    };

    if (mode === 'LOBBY') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 text-center animate-slide-up-fade relative font-sans">
                {/* Background Detail */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                </div>

                <div className="glass-panel-heavy p-12 rounded-2xl w-full max-w-lg relative z-10 border-blue-500/20 shadow-2xl">
                    <button onClick={onExit} className="absolute top-6 right-6 text-[10px] font-mono font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors z-20">Disconnect</button>

                    <div className="w-24 h-24 bg-[#0A0A0C] rounded-full border border-blue-500/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-[float_6s_ease-in-out_infinite] relative">
                        <div className="absolute inset-0 rounded-full border border-blue-500/10 animate-ping"></div>
                        <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>

                    <h1 className="text-4xl font-cinzel font-bold text-white mb-2">The Hub</h1>
                    <p className="text-xs text-blue-400 font-mono uppercase tracking-[0.2em] mb-10 h-4">{motivation}</p>

                    <div className="space-y-4">
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full py-4 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 hover:border-blue-500/50 rounded text-blue-400 font-bold uppercase text-xs tracking-widest transition-all"
                        >
                            {loading ? 'Initializing Node...' : 'Establish Network Node'}
                        </button>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="NODE ID"
                                className="bg-black/50 border border-white/10 rounded px-4 py-3 text-center font-mono uppercase text-white w-full outline-none focus:border-blue-500 transition-colors text-sm"
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                value={roomCode}
                            />
                            <button
                                onClick={handleJoin}
                                disabled={!roomCode || loading}
                                className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded uppercase text-[10px] tracking-widest transition-colors disabled:opacity-50 border border-white/10"
                            >
                                Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col animate-fade-in font-sans">
            {/* Call Overlay & Modals */}
            <CallOverlay
                state={callState}
                onToggleMic={() => callService.toggleAudio()}
                onToggleCam={() => callService.toggleVideo()}
                onEndCall={() => callService.endCall()}
                localStream={callService.getLocalStream()}
            />

            {incomingCaller && (
                <IncomingCallModal
                    callerId={incomingCaller.id}
                    onAccept={async () => {
                        await incomingCaller.answer();
                        setIncomingCaller(null);
                    }}
                    onReject={() => {
                        setIncomingCaller(null);
                    }}
                />
            )}

            {/* Header */}
            <div className="h-16 border-b border-white/5 flex justify-between items-center px-6 bg-[#0a0a0a]/90 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { navigator.clipboard.writeText(roomCode); alert("Copied!"); }}>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Secure Uplink</span>
                        </div>
                        <span className="text-lg font-cinzel font-bold text-white tracking-wider">{roomCode || "ACTIVE"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Active Nodes */}
                    <div className="flex -space-x-3 mr-4">
                        {onlineUsers.map((u, i) => (
                            <div key={i} title={u}
                                className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-all hover:z-10"
                                onClick={() => u !== user.alias && handleStartCall(u)}
                            >
                                {u.substring(0, 2)}
                            </div>
                        ))}
                    </div>

                    <button onClick={onExit} className="px-4 py-2 bg-red-900/10 text-red-500 rounded border border-red-900/20 text-[10px] font-bold uppercase tracking-widest hover:bg-red-900/30 transition-colors">Abort</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area (Materials) */}
                <div className="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
                    {isLoadingSlides ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400">
                            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <span className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Decrypting Data Stream...</span>
                        </div>
                    ) : hubSections.length > 0 ? (
                        <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
                            <ProfessorView state={{ sections: hubSections }} onExit={() => { }} timeRemaining={null} />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <div className="w-32 h-32 border border-white/5 rounded-full flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 border border-white/5 rounded-full animate-ping opacity-50"></div>
                                <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </div>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-8">Data Stream Passive</p>
                            <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-blue-900/20 border border-blue-500/50 hover:bg-blue-900/40 text-blue-400 font-mono text-[10px] uppercase tracking-widest rounded transition-all">Upload Intelligence</button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                        </div>
                    )}
                </div>

                {/* Chat & Controls Sidebar */}
                <div className="w-[400px] border-l border-white/5 flex flex-col bg-[#080808]">
                    <div className="p-3 border-b border-white/5 bg-[#050505]">
                        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Comms Log</h3>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-[#050505]">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.sender === (user.alias || 'You') ? 'items-end' : 'items-start'} animate-fade-in`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${m.sender === 'The Professor' ? 'text-amber-500' : 'text-cyan-600'}`}>
                                        {m.sender === 'The Professor' ? '/// SYS.AI' : `// ${m.sender}`}
                                    </span>
                                    <span className="text-[8px] text-gray-800 font-mono">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <span className={`px-4 py-3 text-xs leading-relaxed max-w-[90%] border ${m.sender === (user.alias || 'You') ? 'bg-cyan-900/10 text-cyan-400 border-cyan-500/30 rounded-l-xl rounded-tr-xl' : 'bg-[#111] text-gray-400 border-white/10 rounded-r-xl rounded-tl-xl'}`}>
                                    {m.content}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#080808] border-t border-white/5">
                        {typingUsers.length > 0 && (
                            <div className="text-[9px] text-cyan-500 font-mono uppercase tracking-widest mb-2 animate-pulse pl-1">
                                {typingUsers.join(', ')} transmitting...
                            </div>
                        )}
                        <div className="relative group">
                            <input
                                className="w-full bg-[#050505] border border-white/10 rounded-lg pl-4 pr-12 py-4 text-white outline-none focus:border-cyan-500/50 transition-all text-sm placeholder-gray-700 font-mono"
                                placeholder="> Broadcast..."
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    subscriptionRef.current?.sendTyping();
                                }}
                                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-cyan-900/20 text-cyan-500 rounded hover:bg-cyan-900/40 transition-colors disabled:opacity-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TheHub;
