
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

type HubMode = 'LOBBY' | 'CREATE_FLOW' | 'JOIN_FLOW' | 'ROOM';

interface HubMessage {
    id: string;
    sender: string;
    content: string;
    type?: 'text' | 'audio';
    timestamp: any;
}

const SkeletonMessage = () => (
    <div className="flex flex-col items-start gap-1 w-full animate-pulse">
        <div className="h-2 w-16 bg-white/10 rounded ml-1"></div>
        <div className="h-10 w-[70%] bg-white/5 rounded-2xl rounded-tl-none"></div>
    </div>
);

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    const [mode, setMode] = useState<HubMode>('LOBBY');
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Connection Status
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    const [uploading, setUploading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [joinCode, setJoinCode] = useState('');

    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [showExitModal, setShowExitModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activeRoomId) return;

        // 1. Fetch History (Efficiently - Limit 20)
        const fetchHistory = async () => {
            setIsLoadingMessages(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('room_id', activeRoomId)
                .order('created_at', { ascending: false }) // Get newest first
                .limit(20);
            
            if (data) {
                const history = data.reverse().map(d => ({
                    id: d.id,
                    sender: d.sender,
                    content: d.content,
                    type: d.type,
                    timestamp: d.created_at
                }));
                setMessages(history);
            }
            setIsLoadingMessages(false);
        };
        fetchHistory();

        // 2. Realtime Subscription
        const channel = supabase.channel(`room:${activeRoomId}`, {
            config: {
                presence: {
                    key: user.alias || 'Guest'
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = Object.keys(newState);
                setParticipants(users);
            })
            .on('broadcast', { event: 'message' }, ({ payload }) => {
                setMessages((prev) => [...prev, payload]);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoomId}` }, (payload) => {
                const newMsg = payload.new;
                // Only add if we haven't added it via optimistic UI/broadcast
                setMessages((prev) => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [...prev, {
                        id: newMsg.id,
                        sender: newMsg.sender,
                        content: newMsg.content,
                        type: newMsg.type,
                        timestamp: newMsg.created_at
                    }];
                });
            })
            .on('broadcast', { event: 'slide_update' }, ({ payload }) => {
                if (payload.index !== undefined) {
                    setCurrentSlideIndex(payload.index);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    channel.track({ online_at: new Date().toISOString() });
                } else {
                    setIsConnected(false);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeRoomId, user.alias]);

    useEffect(() => {
        if (!isLoadingMessages) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoadingMessages]);

    const handleCreateClick = () => setMode('CREATE_FLOW');
    const handleJoinClick = () => setMode('JOIN_FLOW');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        setStatusText("Scanning Document...");
        
        try {
            const file = e.target.files[0];
            const processed = await processFile(file);
            
            setStatusText("Generating Course Modules...");
            const sections = await generateProfessorContent(processed.content, { 
                personality: 'Academic', 
                analogyDomain: 'General', 
                difficulty: 'Medium', 
                questionType: 'Mixed', 
                questionCount: 5, 
                timerDuration: 'Limitless' 
            });

            setStatusText("Synthesizing Discussion Prompts...");
            const enhancedSections = await Promise.all(sections.map(async (s) => {
                const prompt = await simplifyExplanation(s.content, 'ELA', "Generate a provocative 1-sentence discussion question about this topic.");
                return { ...s, discussionQuestion: prompt.replace(/"/g, '') };
            }));
            
            setStatusText("Establishing Uplink...");
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            setRoomData({ code: roomId, modules: enhancedSections });
            setActiveRoomId(roomId);
            setMode('ROOM');
            
        } catch (err) {
            console.error(err);
            alert("Failed to create room.");
        } finally {
            setUploading(false);
            setStatusText("");
        }
    };

    const handleJoinSubmit = async () => {
        if (!joinCode) return;
        setActiveRoomId(joinCode);
        setMode('ROOM');
        setRoomData({ code: joinCode, modules: [] }); 
    };

    const handleCopyCode = () => {
        if (roomData?.code) {
            navigator.clipboard.writeText(roomData.code);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const sendTextMessage = async () => {
        if (!chatInput.trim() || !activeRoomId) return;
        
        const tempId = Date.now().toString();
        const payload: HubMessage = {
            id: tempId,
            sender: user.alias || 'You',
            content: chatInput,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        // 1. Send via Broadcast for Immediate UI (optional but fast)
        const channel = supabase.channel(`room:${activeRoomId}`);
        await channel.send({
            type: 'broadcast',
            event: 'message',
            payload
        });

        // 2. Persist to Supabase
        // Note: 'messages' table must exist in Supabase with columns: room_id, sender, content, type
        supabase.from('messages').insert({
            room_id: activeRoomId,
            sender: user.alias || 'You',
            content: chatInput,
            type: 'text'
        }).then(({ error }) => {
            if (error) console.error("Message Persistence Error:", error);
        });

        // Optimistic Update
        setMessages(prev => [...prev, payload]);
        setChatInput('');
    };

    const updateSlide = async (newIndex: number) => {
        setCurrentSlideIndex(newIndex);
        if (!activeRoomId) return;
        const channel = supabase.channel(`room:${activeRoomId}`);
        await channel.send({
            type: 'broadcast',
            event: 'slide_update',
            payload: { index: newIndex }
        });
    };

    const modules = roomData?.modules || [];
    const currentSlide = modules[currentSlideIndex];

    if (mode === 'LOBBY') {
        return (
            <div className="max-w-4xl mx-auto min-h-screen p-6 animate-fade-in text-white font-sans bg-[#050505] flex flex-col justify-center items-center">
                <h1 className="text-4xl font-display font-bold mb-2">The Hub</h1>
                <p className="text-gray-500 mb-12 uppercase tracking-widest text-xs">Collaborative Neural Network</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <button onClick={handleCreateClick} className="group p-8 bg-green-900/10 border border-green-500/20 rounded-3xl hover:bg-green-900/20 transition-all flex flex-col items-center gap-4 hover:scale-105 duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-3xl group-hover:bg-green-500 group-hover:text-black transition-colors">+</div>
                        <h3 className="text-xl font-bold">Create Hub</h3>
                        <p className="text-xs text-gray-500 text-center">Upload a document. Generate a live study room.</p>
                    </button>

                    <button onClick={handleJoinClick} className="group p-8 bg-blue-900/10 border border-blue-500/20 rounded-3xl hover:bg-blue-900/20 transition-all flex flex-col items-center gap-4 hover:scale-105 duration-300">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-3xl group-hover:bg-blue-500 group-hover:text-black transition-colors">→</div>
                        <h3 className="text-xl font-bold">Join Hub</h3>
                        <p className="text-xs text-gray-500 text-center">Enter a code. Sync with peers instantly.</p>
                    </button>
                </div>
                <button onClick={onExit} className="mt-12 text-gray-600 hover:text-white text-xs uppercase tracking-widest">Back to Campus</button>
            </div>
        );
    }

    if (mode === 'CREATE_FLOW') {
        return (
            <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Initialize Room</h2>
                    <p className="text-gray-500 text-xs mt-2">Upload source material to generate sync-slides.</p>
                </div>
                <div onClick={() => !uploading && fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors gap-4 h-64">
                    {uploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-green-500 uppercase tracking-widest animate-pulse">{statusText}</span>
                        </div>
                    ) : (
                        <>
                            <span className="text-4xl text-gray-600">📄</span>
                            <span className="text-sm font-bold text-gray-300">Select Document</span>
                        </>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                <button onClick={() => setMode('LOBBY')} className="mt-6 text-gray-500 text-xs uppercase tracking-widest text-center hover:text-white">Cancel</button>
            </div>
        );
    }

    if (mode === 'JOIN_FLOW') {
        return (
            <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Join Frequency</h2>
                    <p className="text-gray-500 text-xs mt-2">Enter the room access code.</p>
                </div>
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ROOM CODE" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-white text-xl font-mono tracking-widest uppercase outline-none focus:border-blue-500" />
                <button onClick={handleJoinSubmit} className="mt-4 w-full py-4 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200">
                    Connect
                </button>
                <button onClick={() => setMode('LOBBY')} className="mt-6 text-gray-500 text-xs uppercase tracking-widest text-center hover:text-white">Cancel</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col z-[50]">
            <ConfirmationModal 
                isOpen={showExitModal} 
                title="Disconnect?" 
                message="You will leave the room." 
                onConfirm={() => { setShowExitModal(false); onExit(); }} 
                onCancel={() => setShowExitModal(false)} 
            />

            {/* Header */}
            <div className="h-16 border-b border-white/5 bg-[#0c0c0c] flex justify-between items-center px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={handleCopyCode} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all group">
                        <span className="text-lg font-mono font-bold text-green-400 tracking-widest">{roomData?.code || joinCode}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold group-hover:text-white">{copySuccess ? 'COPIED' : 'COPY CODE'}</span>
                    </button>
                    
                    {/* LIVE STATUS INDICATOR */}
                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_lime] animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                            {isConnected ? 'LIVE UPLINK' : 'OFFLINE'}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {participants.map((p: string, i: number) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-black flex items-center justify-center text-[8px] font-bold text-gray-300" title={p}>
                                    {p.charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={() => setShowExitModal(true)} className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest">Leave</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col bg-[#080808] relative overflow-hidden">
                    {modules.length > 0 ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col">
                            {currentSlide && (
                                <div className="max-w-3xl mx-auto w-full">
                                    <div className="flex justify-between items-center mb-8">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Module {currentSlideIndex + 1} / {modules.length}</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => updateSlide(Math.max(0, currentSlideIndex - 1))}
                                                disabled={currentSlideIndex === 0}
                                                className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-30"
                                            >
                                                ← Prev
                                            </button>
                                            <button 
                                                onClick={() => updateSlide(Math.min(modules.length - 1, currentSlideIndex + 1))}
                                                disabled={currentSlideIndex === modules.length - 1}
                                                className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 disabled:opacity-30"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 leading-tight animate-slide-in">{currentSlide.title}</h2>
                                    <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed mb-8 animate-fade-in">
                                        {currentSlide.content}
                                    </div>

                                    <div className="bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-r-xl mb-8">
                                        <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Feynman Analogy</h4>
                                        <p className="text-amber-100 italic">"{currentSlide.analogy}"</p>
                                    </div>
                                    
                                    {currentSlide.discussionQuestion && (
                                        <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-4 animate-slide-up-fade">
                                            <div className="text-2xl">💬</div>
                                            <div>
                                                <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Group Discussion</h4>
                                                <p className="text-blue-100 font-medium">{currentSlide.discussionQuestion}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm flex-col gap-4">
                            <p>Waiting for host data sync...</p>
                            <p className="text-xs opacity-50">Join via code to chat.</p>
                        </div>
                    )}
                </div>

                <div className={`w-80 md:w-96 bg-[#0f0f10] border-l border-white/5 flex flex-col z-20 absolute md:static right-0 h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    <div className="p-4 border-b border-white/5 bg-[#121212]">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Live Comm-Link</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {isLoadingMessages ? (
                            <>
                                <SkeletonMessage />
                                <SkeletonMessage />
                                <SkeletonMessage />
                            </>
                        ) : messages.map((msg, idx) => {
                            const isMe = msg.sender === (user.alias || 'You');
                            return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed max-w-[90%] ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'}`}>
                                        <p>{msg.content}</p>
                                    </div>
                                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                        <span className="text-[9px] text-gray-600 font-bold uppercase">{msg.sender}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-[#121212] border-t border-white/5">
                        <div className="flex gap-2 items-center">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                                placeholder="Type a message..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                            />
                            <button 
                                onClick={sendTextMessage} 
                                disabled={!chatInput.trim()}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
