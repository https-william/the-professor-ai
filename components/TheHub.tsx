
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

type HubMode = 'LOBBY' | 'ROOM';
type SidebarTab = 'CHAT' | 'PEOPLE' | 'FILES';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>('CHAT');
    
    // Confirmation State
    const [showExitModal, setShowExitModal] = useState(false);

    // Chat & Voice State
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Mock Data (Static for now, but no fake loading delays)
    const participants = [
        { id: '1', name: user.alias || 'You', role: 'Host' }
        // No fake ghost users unless user joins a public room
    ];

    const currentModuleContent = `
        <h1 class="text-3xl font-serif font-bold text-amber-100 mb-4">Focus Session: Neural Networks</h1>
        <p class="text-gray-300 leading-relaxed mb-4">
            Artificial neural networks (ANNs) are computing systems inspired by the biological neural networks that constitute animal brains. An ANN is based on a collection of connected units or nodes called artificial neurons, which loosely model the neurons in a biological brain.
        </p>
        <p class="text-gray-300 leading-relaxed">
            Each connection, like the synapses in a biological brain, can transmit a signal to other neurons. An artificial neuron that receives a signal then processes it and can signal neurons connected to it.
        </p>
    `;

    const handleRoomEnter = (roomName: string) => {
        if (confirm(`Enter ${roomName}?`)) {
            setActiveRoom(roomName);
            setMode('ROOM');
        }
    };

    const handleRoomExit = () => {
        setShowExitModal(true);
    };

    const confirmExitRoom = () => {
        setMode('LOBBY');
        setActiveRoom(null);
        setShowExitModal(false);
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
            <div className="max-w-6xl mx-auto min-h-screen p-6 animate-fade-in text-white">
                <div className="flex justify-between items-center mb-10 border-b border-amber-500/20 pb-6">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-amber-500 mb-2">The Hub</h1>
                        <p className="text-gray-400 text-xs uppercase tracking-widest">Global Study Lounge</p>
                    </div>
                    <button onClick={onExit} className="px-6 py-2 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">EXIT TO CAMPUS</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create Room */}
                    <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-all shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-6">Start Private Session</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Topic (e.g. Adv. Calculus)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-amber-500 transition-colors" />
                            <div className="flex gap-4">
                                <button className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase rounded-xl tracking-widest shadow-lg">Create Room</button>
                            </div>
                        </div>
                    </div>

                    {/* Public Rooms */}
                    <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-2xl font-serif font-bold text-white mb-6">Open Lounges</h3>
                        <div className="space-y-3">
                            {['General Science', 'Literature Club', 'Coding Bootcamp'].map(room => (
                                <div key={room} className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-amber-500/30 group" onClick={() => handleRoomEnter(room)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></div>
                                        <h4 className="font-bold text-sm text-gray-200 group-hover:text-white">{room}</h4>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider group-hover:text-amber-500">Join</span>
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
        <div className="relative h-[calc(100vh-100px)] flex bg-[#0a0a0c] overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
            <ConfirmationModal 
                isOpen={showExitModal} 
                title="Leave Lounge?" 
                message="You will be disconnected from the session." 
                onConfirm={confirmExitRoom} 
                onCancel={() => setShowExitModal(false)} 
            />

            {/* Main Content Area - "The Table" */}
            <div className="flex-1 flex flex-col relative bg-[#0f0f11]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-[#0f0f11] to-[#0f0f11] pointer-events-none"></div>
                
                {/* Room Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-xl font-display font-bold text-white tracking-wide">{activeRoom}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Live Session</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-amber-500 transition-colors border border-white/5 relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            {/* Notification dot if needed */}
                        </button>
                        <button onClick={handleRoomExit} className="px-4 py-2 bg-red-900/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase hover:bg-red-900/20 transition-colors">Leave</button>
                    </div>
                </div>

                {/* Study Material - Centered and Cozy */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative z-0">
                    <div className="max-w-3xl mx-auto bg-[#18181b] border border-amber-500/10 p-10 rounded-2xl shadow-2xl relative">
                        {/* Decorative Lamp Light Effect */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        
                        <div dangerouslySetInnerHTML={{ __html: currentModuleContent }} />
                        
                        <div className="mt-12 pt-8 border-t border-white/5 text-center text-gray-500 text-xs italic">
                            Reading time: 5 mins
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Drawer */}
            <div className={`absolute right-0 top-0 bottom-0 w-80 bg-[#121214] border-l border-white/10 shadow-2xl transform transition-transform duration-300 z-20 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-black/20">
                    {[
                        { id: 'CHAT', icon: '💬', label: 'Chat' },
                        { id: 'PEOPLE', icon: '👥', label: 'People' },
                        { id: 'FILES', icon: '📁', label: 'Files' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SidebarTab)}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab.id ? 'text-amber-500 border-amber-500 bg-white/5' : 'text-gray-600 border-transparent hover:text-gray-300'}`}
                        >
                            {tab.icon}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0a0a0a]">
                    
                    {/* CHAT TAB */}
                    {activeTab === 'CHAT' && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 space-y-4 mb-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-600 text-xs mt-10 italic">
                                        Quiet in the lounge...
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex flex-col items-start bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-amber-500 font-bold mb-1">{msg.sender}</span>
                                        {msg.type === 'text' ? (
                                            <p className="text-xs text-gray-300 leading-relaxed">{msg.content}</p>
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
                            <div className="pt-2 border-t border-white/5">
                                <div className="flex gap-2">
                                    <button 
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                                    </button>
                                    <input 
                                        type="text" 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                                        placeholder="Type..." 
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PEOPLE TAB */}
                    {activeTab === 'PEOPLE' && (
                        <div className="space-y-2">
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                            {p.name[0]}
                                        </div>
                                        <span className="text-sm text-gray-200 font-medium">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{p.role}</span>
                                </div>
                            ))}
                            <div className="text-xs text-gray-600 text-center mt-4">
                                {participants.length} Active in Lounge
                            </div>
                        </div>
                    )}

                    {/* FILES TAB */}
                    {activeTab === 'FILES' && (
                        <div className="text-center text-gray-500 text-xs mt-10">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl">
                                📁
                            </div>
                            <p>No shared materials yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
