
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

type HubMode = 'LOBBY' | 'ROOM';
type SidebarTab = 'CHAT' | 'PEOPLE';

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
    const [sidebarOpen, setSidebarOpen] = useState(true); // Default open
    const [activeTab, setActiveTab] = useState<SidebarTab>('CHAT');
    
    // Confirmation State
    const [showExitModal, setShowExitModal] = useState(false);

    // Chat & Voice State
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleRoomEnter = (roomName: string) => {
        // Simplified Join Logic
        setActiveRoom(roomName);
        setMode('ROOM');
        // Add a system message
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'System',
            content: `Welcome to the ${roomName} library. Silence is optional.`,
            type: 'text',
            timestamp: Date.now()
        }]);
    };

    const handleRoomExit = () => {
        setShowExitModal(true);
    };

    const confirmExitRoom = () => {
        setMode('LOBBY');
        setActiveRoom(null);
        setShowExitModal(false);
        setMessages([]); // Clear chat on exit
    };

    // Voice Note Logic
    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone not supported.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                sendVoiceMessage(audioUrl);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendVoiceMessage = (url: string) => {
        const msg: HubMessage = {
            id: Date.now().toString(),
            sender: user.alias || 'You',
            content: url,
            type: 'audio',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
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
        setChatInput('');
    };

    if (mode === 'LOBBY') {
        return (
            <div className="max-w-6xl mx-auto min-h-screen p-6 animate-fade-in text-white font-sans bg-[#050505]">
                {/* Lobby Header */}
                <div className="flex justify-between items-center mb-10 border-b border-green-800/30 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-950/40 rounded-xl flex items-center justify-center border border-green-700/30 text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-normal text-gray-200">The Archives</h1>
                            <p className="text-green-600 text-xs uppercase tracking-widest font-bold">Collaborative Study Network</p>
                        </div>
                    </div>
                    <button onClick={onExit} className="px-6 py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all uppercase tracking-wider">Return to Campus</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create Room Panel */}
                    <div className="bg-[#0a1f0a] border border-green-900/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-700"></div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-6">Private Study</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Subject (e.g. Advanced Calculus)" className="w-full bg-black/40 border border-green-900/40 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-green-600 transition-colors" />
                            <div className="flex gap-4">
                                <button className="flex-1 py-4 bg-green-800 hover:bg-green-700 text-white font-bold text-xs uppercase rounded-xl tracking-widest shadow-lg transition-all">Initialize Room</button>
                            </div>
                        </div>
                    </div>

                    {/* Public Rooms Panel */}
                    <div className="bg-[#0a1f0a] border border-green-900/30 rounded-2xl p-8 shadow-2xl">
                        <h3 className="text-2xl font-serif font-bold text-white mb-6">Public Libraries</h3>
                        <div className="space-y-3">
                            {['STEM Common Room', 'Literature Hall', 'The Quiet Zone'].map(room => (
                                <div key={room} className="flex justify-between items-center p-4 bg-green-900/10 rounded-xl hover:bg-green-900/20 cursor-pointer transition-colors border border-green-900/10 hover:border-green-700/30 group" onClick={() => handleRoomEnter(room)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                        <h4 className="font-bold text-sm text-gray-300 group-hover:text-white">{room}</h4>
                                    </div>
                                    <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider group-hover:text-green-500">Enter</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ROOM MODE
    return (
        <div className="relative h-[calc(100vh-100px)] flex bg-[#050505] overflow-hidden rounded-2xl border border-green-900/20 shadow-2xl">
            <ConfirmationModal 
                isOpen={showExitModal} 
                title="Leave Library?" 
                message="You are about to exit the study session." 
                onConfirm={confirmExitRoom} 
                onCancel={() => setShowExitModal(false)} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative bg-[#080a08]">
                {/* Wood Texture Overlay for Library Feel */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
                
                {/* Room Header */}
                <div className="p-5 border-b border-green-900/30 flex justify-between items-center bg-[#0c100c]/90 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-xl font-display font-normal text-white tracking-wide">{activeRoom}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Silence Optional</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)} 
                            className={`p-3 rounded-xl text-gray-400 hover:text-green-400 transition-colors border ${sidebarOpen ? 'bg-green-900/20 border-green-800/50 text-green-500' : 'bg-white/5 border-transparent'}`}
                            title="Toggle Sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <button onClick={handleRoomExit} className="px-4 py-2 bg-red-900/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase hover:bg-red-900/20 transition-colors">Exit</button>
                    </div>
                </div>

                {/* Study Material / Placeholder */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative z-0 flex items-center justify-center">
                    <div className="text-center text-gray-600 max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-900/10 rounded-full flex items-center justify-center border border-green-800/30 text-green-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h3 className="text-lg font-serif text-gray-400 mb-2">The Table is Empty</h3>
                        <p className="text-xs text-gray-600 uppercase tracking-widest">Share documents from the sidebar to begin collaborative study.</p>
                    </div>
                </div>
            </div>

            {/* Collapsible Sidebar Drawer */}
            <div className={`w-80 bg-[#0c100c] border-l border-green-900/20 shadow-2xl transition-all duration-300 z-20 flex flex-col ${sidebarOpen ? 'mr-0' : '-mr-80 hidden'}`}>
                
                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-black/20">
                    <button 
                        onClick={() => setActiveTab('CHAT')}
                        className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'CHAT' ? 'text-green-500 border-green-600 bg-green-900/10' : 'text-gray-600 border-transparent hover:text-gray-300'}`}
                    >
                        <span>💬</span> Chat
                    </button>
                    <button 
                        onClick={() => setActiveTab('PEOPLE')}
                        className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'PEOPLE' ? 'text-green-500 border-green-600 bg-green-900/10' : 'text-gray-600 border-transparent hover:text-gray-300'}`}
                    >
                        <span>👥</span> Members
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0a0a0a]">
                    
                    {/* CHAT TAB */}
                    {activeTab === 'CHAT' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 space-y-4 mb-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex flex-col items-start bg-white/5 p-3 rounded-lg border border-white/5">
                                        <span className="text-[9px] text-green-600 font-bold mb-1 uppercase tracking-wider">{msg.sender}</span>
                                        {msg.type === 'text' ? (
                                            <p className="text-xs text-gray-300 leading-relaxed font-sans">{msg.content}</p>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-400">🎤 Voice Note</span>
                                                <audio src={msg.content} controls className="h-8 w-40" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Input */}
                            <div className="pt-3 border-t border-white/5">
                                <div className="flex gap-2">
                                    <button 
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                        title="Hold to Speak"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                                    </button>
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                                        placeholder="Whisper..." 
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-green-600 transition-colors" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PEOPLE TAB */}
                    {activeTab === 'PEOPLE' && (
                        <div className="space-y-2">
                            {/* Mock Participants */}
                            {['You', 'Ghost_Scholar', 'Neural_Net'].map((name, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                            {name[0]}
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">{name}</span>
                                    </div>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
