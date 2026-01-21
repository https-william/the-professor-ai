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

    // Call State
    const [callState, setCallState] = useState<CallState>({ status: 'IDLE', isAudioEnabled: true, isVideoEnabled: true });
    const [incomingCaller, setIncomingCaller] = useState<{ id: string, answer: () => Promise<void> } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const subscriptionRef = useRef<any>(null);

    // Initialize Peer Service
    useEffect(() => {
        if (user.alias) {
            callService.initialize(
                user.alias,
                (state) => setCallState(state),
                (callerId, answer) => setIncomingCaller({ id: callerId, answer })
            );
        }
        return () => {
            // We don't necessarily destroy peer on unmount to allow navigating while calling? 
            // Ideally yes, but for now let's clean up
            // callService.endCall(); 
        };
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
                (signal) => {
                    // Handle WebRTC signals if needed, but PeerJS usually handles this via its own server/socket
                    // If we were doing manual signaling we'd use this.
                    // PeerJS uses its own cloud, so we strictly use this for "Intent" if needed or supplementary data.
                    // For now, PeerJS handles the handshake. 
                    // Wait, PeerJS needs the remote Peer ID.
                    // We can use this channel to broadcast "I am PeerID X" if IDs are random.
                    // But we used `user.alias` as PeerJS ID (cleaned).
                    // So we know who to call if we know who is online.
                }
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
            setRoomCode("HUB-" + Math.floor(1000 + Math.random() * 9000));
        } catch (e: any) {
            console.error("Hub Create Error:", e);
            alert("Hub creation failed. Permissions error.");
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
            console.error("Hub Join Error:", e);
            alert("Could not join room. Check code.");
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
            subscriptionRef.current?.sendTyping(); // Clear typing status? No, typing is whilst typing.

            if (msgText.toLowerCase().includes('@professor')) {
                const context = hubSections.map(s => s.content).join('\n') || "No documents uploaded yet.";
                generateHubResponse(msgText, context).then((response) => {
                    sendHubMessage(roomId, 'The Professor', response, 'text');
                });
            }
        } catch (e) {
            console.error("Message Send Failed", e);
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

    const handleStartCall = (targetAlias: string) => {
        const cleanId = targetAlias.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        callService.startCall(cleanId);
    };

    if (mode === 'LOBBY') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 text-center animate-fade-in relative">
                <button onClick={onExit} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xs uppercase font-bold tracking-widest">Exit</button>

                <div className="mb-10 w-full max-w-md relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                    <div className="w-24 h-24 bg-gradient-to-br from-blue-900/50 to-black rounded-3xl border border-blue-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] animate-float backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 font-display">The Hub</h1>
                    <p className="text-blue-400 text-sm font-mono uppercase tracking-widest mb-8 h-6">{motivation}</p>

                    <div className="grid grid-cols-1 gap-4 z-10 relative">
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 group"
                        >
                            {loading ? 'Initializing...' : 'Create New Cell'}
                        </button>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ENTER CODE"
                                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-center font-mono uppercase text-white w-full outline-none focus:border-blue-500 transition-colors"
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                value={roomCode}
                            />
                            <button
                                onClick={handleJoin}
                                disabled={!roomCode || loading}
                                className="px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl uppercase text-xs transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col animate-fade-in font-sans">
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
            <div className="h-16 border-b border-white/5 flex justify-between items-center px-4 md:px-6 bg-[#0a0a0a]/90 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { navigator.clipboard.writeText(roomCode); alert("Copied!"); }}>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Secure Link</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-mono font-bold text-blue-400 tracking-wider">{roomCode || "ACTIVE"}</span>
                            <div className={`w-2 h-2 rounded-full ${onlineUsers.length > 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Active Users Helper */}
                    <div className="hidden md:flex -space-x-2 mr-4">
                        {onlineUsers.map((u, i) => (
                            <div key={i} title={u} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-[10px] text-white font-bold uppercase cursor-pointer hover:scale-110 transition-transform hover:z-10" onClick={() => u !== user.alias && handleStartCall(u)}>
                                {u.substring(0, 2)}
                            </div>
                        ))}
                    </div>

                    <button onClick={onExit} className="px-4 py-2 bg-red-900/10 text-red-500 rounded-full text-xs font-bold uppercase hover:bg-red-900/30 transition-colors border border-red-900/20">Disconnect</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area (Materials) */}
                <div className="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
                    {isLoadingSlides ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <span className="font-mono text-xs uppercase tracking-widest animate-pulse">Decrypting Materials...</span>
                        </div>
                    ) : hubSections.length > 0 ? (
                        <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
                            <ProfessorView state={{ sections: hubSections }} onExit={() => { }} timeRemaining={null} />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Drop Zone Empty</p>
                            <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-lg hover:shadow-blue-500/20">Upload Intelligence</button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                        </div>
                    )}
                </div>

                {/* Chat & Controls Sidebar */}
                <div className="w-full max-w-sm border-l border-white/5 flex flex-col bg-[#080808]">
                    {/* Participant List (Mobile Visible? Maybe hidden on mobile initially, simplified here) */}

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar relative">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.sender === (user.alias || 'You') ? 'items-end' : 'items-start'} animate-slide-in`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${m.sender === 'The Professor' ? 'text-amber-500' : 'text-gray-500'}`}>{m.sender}</span>
                                    <span className="text-[8px] text-gray-700">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <span className={`px-4 py-3 rounded-2xl text-sm max-w-[90%] leading-relaxed ${m.sender === (user.alias || 'You') ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#151515] text-gray-300 border border-white/5 rounded-tl-sm'}`}>
                                    {m.content}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
                        {typingUsers.length > 0 && (
                            <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-2 animate-pulse pl-1">
                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} transmitting...
                            </div>
                        )}
                        <div className="relative">
                            <input
                                className="w-full bg-[#111] rounded-xl pl-4 pr-12 py-3 text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-gray-600 font-medium"
                                placeholder="Broadcast message..."
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TheHub;
