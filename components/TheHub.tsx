
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ProfessorSection } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { processFile } from '../services/fileService';
import { generateProfessorContent, simplifyExplanation } from '../services/geminiService';
import { createHubRoom, joinHubRoom, subscribeToHubRoom, sendHubMessage, subscribeToHubMessages } from '../services/firebase';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

type HubMode = 'LOBBY' | 'CREATE_FLOW' | 'JOIN_FLOW' | 'ROOM';

interface HubMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: any;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    const [mode, setMode] = useState<HubMode>('LOBBY');
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Creation State
    const [uploading, setUploading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Join State
    const [joinCode, setJoinCode] = useState('');

    // Room State
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [showExitModal, setShowExitModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscriptions
    useEffect(() => {
        if (!activeRoomId) return;

        // 1. Subscribe to Room Data (Modules, Participants)
        const unsubRoom = subscribeToHubRoom(activeRoomId, (data) => {
            setRoomData(data);
        });

        // 2. Subscribe to Messages
        const unsubMsgs = subscribeToHubMessages(activeRoomId, (msgs) => {
            setMessages(msgs);
        });

        return () => {
            unsubRoom();
            unsubMsgs();
        };
    }, [activeRoomId]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            // Generate Modules via Gemini
            const sections = await generateProfessorContent(processed.content, { 
                personality: 'Academic', 
                analogyDomain: 'General', 
                difficulty: 'Medium', 
                questionType: 'Mixed', 
                questionCount: 5, 
                timerDuration: 'Limitless' 
            });

            // Enhance sections with AI Discussion Questions
            setStatusText("Synthesizing Discussion Prompts...");
            const enhancedSections = await Promise.all(sections.map(async (s) => {
                const prompt = await simplifyExplanation(s.content, 'ELA', "Generate a provocative 1-sentence discussion question about this topic.");
                return { ...s, discussionQuestion: prompt.replace(/"/g, '') };
            }));
            
            setStatusText("Establishing Uplink...");
            const roomId = await createHubRoom(user.alias || 'Host', enhancedSections);
            setActiveRoomId(roomId);
            setMode('ROOM');
            
        } catch (err) {
            console.error(err);
            alert("Failed to create room. Ensure you are online.");
        } finally {
            setUploading(false);
            setStatusText("");
        }
    };

    const handleJoinSubmit = async () => {
        if (!joinCode) return;
        setUploading(true); // Reuse uploading spinner
        try {
            const roomId = await joinHubRoom(joinCode, user.alias || 'Guest');
            setActiveRoomId(roomId);
            setMode('ROOM');
        } catch (e: any) {
            alert(e.message || "Room not found.");
        } finally {
            setUploading(false);
        }
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
        try {
            await sendHubMessage(activeRoomId, user.alias || 'You', chatInput);
            setChatInput('');
        } catch (e) {
            console.error("Msg failed", e);
        }
    };

    const modules = roomData?.modules || [];
    const participants = roomData?.participants || [];
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
                <button onClick={handleJoinSubmit} disabled={uploading} className="mt-4 w-full py-4 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200 disabled:opacity-50">
                    {uploading ? 'Connecting...' : 'Connect'}
                </button>
                <button onClick={() => setMode('LOBBY')} className="mt-6 text-gray-500 text-xs uppercase tracking-widest text-center hover:text-white">Cancel</button>
            </div>
        );
    }

    // --- MAIN ROOM INTERFACE ---
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
                        <span className="text-lg font-mono font-bold text-green-400 tracking-widest">{roomData?.code || '...'}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold group-hover:text-white">{copySuccess ? 'COPIED' : 'COPY CODE'}</span>
                    </button>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Online:</span>
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

            {/* Content Body */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left: Slides (Responsive: Full width on mobile, split on desktop) */}
                <div className="flex-1 flex flex-col bg-[#080808] relative overflow-hidden">
                    {modules.length > 0 ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col">
                            {/* Slide Content */}
                            <div className="max-w-3xl mx-auto w-full">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Module {currentSlideIndex + 1} / {modules.length}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                                            disabled={currentSlideIndex === 0}
                                            className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold hover:bg-white/10 disabled:opacity-30"
                                        >
                                            ← Prev
                                        </button>
                                        <button 
                                            onClick={() => setCurrentSlideIndex(Math.min(modules.length - 1, currentSlideIndex + 1))}
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

                                {/* AI Discussion Prompt */}
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
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">Waiting for host data sync...</div>
                    )}
                </div>

                {/* Right: Chat (Collapsible on mobile?) - Fixed width on Desktop */}
                <div className={`w-80 md:w-96 bg-[#0f0f10] border-l border-white/5 flex flex-col z-20 absolute md:static right-0 h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/5 bg-[#121212]">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Live Comm-Link</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender === user.alias;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[90%] px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'}`}>
                                        <p>{msg.content}</p>
                                    </div>
                                    <span className="text-[9px] text-gray-600 mt-1 uppercase font-bold">{msg.sender}</span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-[#121212] border-t border-white/5">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                                placeholder="Type a message..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                            />
                            <button onClick={sendTextMessage} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
