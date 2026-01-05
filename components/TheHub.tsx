
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ProcessedFile, ProfessorSection } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { processFile } from '../services/fileService';
import { generateProfessorContent } from '../services/geminiService';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

type HubMode = 'LOBBY' | 'CREATE_FLOW' | 'JOIN_FLOW' | 'ROOM';
type SidebarTab = 'CHAT' | 'MODULES' | 'PEOPLE';

interface HubMessage {
    id: string;
    sender: string;
    content: string;
    type: 'text' | 'audio';
    timestamp: number;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    const [mode, setMode] = useState<HubMode>('LOBBY');
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<SidebarTab>('CHAT');
    
    // Creation State
    const [uploading, setUploading] = useState(false);
    const [modules, setModules] = useState<ProfessorSection[]>([]);
    const [generatedCode, setGeneratedCode] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Join State
    const [joinCode, setJoinCode] = useState('');

    // Chat State
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    
    const [showExitModal, setShowExitModal] = useState(false);

    // Participants (Simulated)
    const [participants, setParticipants] = useState(['You', 'Professor AI']);

    const handleCreateClick = () => {
        setMode('CREATE_FLOW');
    };

    const handleJoinClick = () => {
        setMode('JOIN_FLOW');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const processed = await processFile(file);
            
            // Generate Modules via Gemini
            const sections = await generateProfessorContent(processed.content, { 
                personality: 'Academic', 
                analogyDomain: 'General', 
                difficulty: 'Medium', 
                questionType: 'Mixed', 
                questionCount: 5, 
                timerDuration: 'Limitless' 
            });
            
            setModules(sections);
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setGeneratedCode(code);
            setActiveRoom(code);
            setMode('ROOM');
            
            // Init Chat
            setMessages([{
                id: 'sys-1',
                sender: 'System',
                content: `Room Created. Share Code: ${code}. Modules generated from ${file.name}.`,
                type: 'text',
                timestamp: Date.now()
            }]);

        } catch (err) {
            alert("Failed to create room.");
        } finally {
            setUploading(false);
        }
    };

    const handleJoinSubmit = () => {
        if (!joinCode) return;
        setActiveRoom(joinCode.toUpperCase());
        setMode('ROOM');
        setMessages([{
            id: 'sys-1',
            sender: 'System',
            content: `Connected to Room ${joinCode.toUpperCase()}.`,
            type: 'text',
            timestamp: Date.now()
        }]);
    };

    const handleChatInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setChatInput(val);
        if (val.endsWith('@')) {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (name: string) => {
        setChatInput(prev => prev.slice(0, -1) + `@${name} `); // Replace last @ with name
        setShowMentions(false);
        document.getElementById('chat-input')?.focus();
    };

    const sendTextMessage = () => {
        if (!chatInput.trim()) return;
        const msg: HubMessage = {
            id: Date.now().toString(),
            sender: user.alias || 'You',
            content: chatInput,
            type: 'text',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
        
        // AI Response Logic
        if (chatInput.includes('@Professor AI')) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'Professor AI',
                    content: "I am observing the study session. How can I clarify the current material?",
                    type: 'text',
                    timestamp: Date.now()
                }]);
            }, 1000);
        }

        setChatInput('');
    };

    if (mode === 'LOBBY') {
        return (
            <div className="max-w-4xl mx-auto min-h-screen p-6 animate-fade-in text-white font-sans bg-[#050505] flex flex-col justify-center items-center">
                <h1 className="text-4xl font-display font-bold mb-2">The Hub</h1>
                <p className="text-gray-500 mb-12 uppercase tracking-widest text-xs">Collaborative Neural Network</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <button 
                        onClick={handleCreateClick}
                        className="group p-8 bg-green-900/10 border border-green-500/20 rounded-3xl hover:bg-green-900/20 transition-all flex flex-col items-center gap-4 hover:scale-105 duration-300"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-3xl group-hover:bg-green-500 group-hover:text-black transition-colors">
                            +
                        </div>
                        <h3 className="text-xl font-bold">Create Hub</h3>
                        <p className="text-xs text-gray-500 text-center">Upload a document. Generate a study room.</p>
                    </button>

                    <button 
                        onClick={handleJoinClick}
                        className="group p-8 bg-blue-900/10 border border-blue-500/20 rounded-3xl hover:bg-blue-900/20 transition-all flex flex-col items-center gap-4 hover:scale-105 duration-300"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-3xl group-hover:bg-blue-500 group-hover:text-black transition-colors">
                            →
                        </div>
                        <h3 className="text-xl font-bold">Join Hub</h3>
                        <p className="text-xs text-gray-500 text-center">Enter a code. Sync with peers.</p>
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
                    <p className="text-gray-500 text-xs mt-2">Upload source material to generate modules.</p>
                </div>
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors gap-4"
                >
                    {uploading ? (
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <span className="text-4xl text-gray-600">📄</span>
                    )}
                    <span className="text-sm font-bold text-gray-300">{uploading ? 'Analyzing...' : 'Select Document'}</span>
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
                
                <input 
                    type="text" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-white text-xl font-mono tracking-widest outline-none focus:border-blue-500"
                />
                
                <button 
                    onClick={handleJoinSubmit}
                    className="mt-4 w-full py-4 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200"
                >
                    Connect
                </button>
                <button onClick={() => setMode('LOBBY')} className="mt-6 text-gray-500 text-xs uppercase tracking-widest text-center hover:text-white">Cancel</button>
            </div>
        );
    }

    // ROOM INTERFACE
    return (
        <div className="relative h-[calc(100vh-100px)] flex bg-[#050505] overflow-hidden rounded-2xl border border-green-900/20 shadow-2xl">
            <ConfirmationModal 
                isOpen={showExitModal} 
                title="Leave Hub?" 
                message="Session data is not saved permanently." 
                onConfirm={() => { setShowExitModal(false); setMode('LOBBY'); setMessages([]); setModules([]); }} 
                onCancel={() => setShowExitModal(false)} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative bg-[#080a08]">
                {/* Header */}
                <div className="p-5 border-b border-green-900/30 flex justify-between items-center bg-[#0c100c]/90 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-xl font-display font-bold text-white tracking-wide">ROOM: {activeRoom}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Live Session</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-xl text-gray-400 hover:text-white border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <button onClick={() => setShowExitModal(true)} className="px-4 py-2 bg-red-900/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase hover:bg-red-900/20">Exit</button>
                    </div>
                </div>

                {/* Modules Display (If modules exist) or Placeholder */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {modules.length > 0 ? (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <h3 className="text-2xl font-bold text-white mb-4">Course Modules</h3>
                            {modules.map((mod, i) => (
                                <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <h4 className="text-lg font-bold text-green-400 mb-2">{mod.title}</h4>
                                    <p className="text-gray-300 leading-relaxed text-sm">{mod.content}</p>
                                    <div className="mt-4 bg-black/20 p-3 rounded-lg text-xs text-gray-400 italic border-l-2 border-green-500">
                                        Analogy: {mod.analogy}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            <p>No modules loaded. Use the Create flow to generate content.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className={`w-80 bg-[#0c100c] border-l border-green-900/20 shadow-2xl transition-all duration-300 z-20 flex flex-col ${sidebarOpen ? 'mr-0' : '-mr-80 hidden'}`}>
                <div className="flex border-b border-white/5 bg-black/20">
                    <button onClick={() => setActiveTab('CHAT')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'CHAT' ? 'text-green-500 bg-green-900/10' : 'text-gray-600'}`}>Chat</button>
                    <button onClick={() => setActiveTab('PEOPLE')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'PEOPLE' ? 'text-green-500 bg-green-900/10' : 'text-gray-600'}`}>People</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0a0a0a] relative">
                    {activeTab === 'CHAT' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 space-y-4 mb-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex flex-col items-start bg-white/5 p-3 rounded-lg border border-white/5">
                                        <span className="text-[9px] text-green-600 font-bold mb-1 uppercase tracking-wider">{msg.sender}</span>
                                        <p className="text-xs text-gray-300 leading-relaxed font-sans">{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Mentions Popover */}
                            {showMentions && (
                                <div className="absolute bottom-16 left-4 right-4 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                                    {participants.map(p => (
                                        <button key={p} onClick={() => insertMention(p)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green-900/20 hover:text-white border-b border-white/5 last:border-0">
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="pt-3 border-t border-white/5">
                                <div className="flex gap-2">
                                    <input 
                                        id="chat-input"
                                        type="text" 
                                        value={chatInput}
                                        onChange={handleChatInput}
                                        onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                                        placeholder="Type @ to mention..." 
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-green-600 transition-colors" 
                                    />
                                    <button onClick={sendTextMessage} className="p-2 bg-green-900/20 text-green-500 rounded-xl hover:bg-green-900/40">
                                        ➤
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PEOPLE' && (
                        <div className="space-y-2">
                            {participants.map((name, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-400">
                                        {name[0]}
                                    </div>
                                    <span className="text-sm text-gray-300">{name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
