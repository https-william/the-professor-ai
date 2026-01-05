
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';

interface TheHubProps {
    user: UserProfile;
    onExit: () => void;
}

type HubMode = 'LOBBY' | 'ROOM';

interface HubMessage {
    id: string;
    sender: string;
    content: string; // text or blob url
    type: 'text' | 'audio';
    timestamp: number;
}

export const TheHub: React.FC<TheHubProps> = ({ user, onExit }) => {
    const [mode, setMode] = useState<HubMode>('LOBBY');
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [currentModule, setCurrentModule] = useState(0);
    const [agreed, setAgreed] = useState(false);
    
    // Chat & Voice State
    const [messages, setMessages] = useState<HubMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Mock Data for MVP
    const publicRooms = [
        { id: 'BIO-101', name: 'Biology Basics', participants: 4, topic: 'Cell Structure' },
        { id: 'CS-ALGO', name: 'Algorithm Grind', participants: 12, topic: 'Graph Theory' },
    ];

    const modules = [
        { id: 1, title: 'Introduction to Neural Networks', content: 'Neural networks are computing systems inspired by the biological neural networks...' },
        { id: 2, title: 'Backpropagation', content: 'Backpropagation is an algorithm for supervised learning of artificial neural networks...' },
        { id: 3, title: 'Gradient Descent', content: 'Gradient descent is a first-order iterative optimization algorithm...' }
    ];

    const participants = [
        { id: '1', name: user.alias || 'You', hasAgreed: agreed },
        { id: '2', name: 'Ghost_Scholar', hasAgreed: true },
        { id: '3', name: 'Academic_Weapon', hasAgreed: true }
    ];

    const allAgreed = participants.every(p => p.hasAgreed);

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
                // Stop all tracks to release mic
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
            <div className="max-w-4xl mx-auto min-h-screen p-4">
                <div className="flex justify-between items-center mb-8 border-b border-green-500/20 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">The Hub</h1>
                        <p className="text-gray-400 text-xs uppercase tracking-widest">Global Collaborative Network</p>
                    </div>
                    <button onClick={onExit} className="px-4 py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white">EXIT</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create / Join */}
                    <div className="bg-[#0f0f10] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-green-500 mb-4">Start a Session</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Enter Topic or Keywords..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-green-500" />
                            <div className="flex gap-4">
                                <button className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase rounded-xl">Create Public Room</button>
                                <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase rounded-xl border border-white/5">Create Private Key</button>
                            </div>
                        </div>
                    </div>

                    {/* Public List */}
                    <div className="bg-[#0f0f10] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Open Hubs</h3>
                        <div className="space-y-3">
                            {publicRooms.map(room => (
                                <div key={room.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-green-500/30" onClick={() => { setActiveRoom(room.name); setMode('ROOM'); }}>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-200">{room.name}</h4>
                                        <span className="text-[10px] text-green-400 font-mono">{room.topic}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{room.participants} Online</span>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>
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
        <div className="max-w-6xl mx-auto h-[90vh] flex flex-col md:flex-row gap-6 p-4">
            
            {/* Sidebar: Participants */}
            <div className="w-full md:w-64 bg-[#0f0f10] border border-white/10 rounded-2xl p-4 flex flex-col shrink-0">
                <div className="mb-4 pb-4 border-b border-white/5">
                    <h3 className="font-bold text-white truncate">{activeRoom}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Connected</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {participants.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                                    {p.name[0]}
                                </div>
                                <span className="text-xs text-gray-300 truncate max-w-[80px]">{p.name}</span>
                            </div>
                            {p.hasAgreed ? (
                                <span className="text-green-500">✓</span>
                            ) : (
                                <span className="w-4 h-4 border border-gray-600 rounded-full"></span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                    <button onClick={() => setMode('LOBBY')} className="w-full py-2 bg-red-900/20 text-red-500 text-xs font-bold uppercase rounded-lg hover:bg-red-900/30">Leave Room</button>
                </div>
            </div>

            {/* Main Content: Module */}
            <div className="flex-1 bg-[#0f0f10] border border-white/10 rounded-2xl flex flex-col relative overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white font-serif">Module {currentModule + 1}: {modules[currentModule].title}</h2>
                    <div className="text-xs font-mono text-gray-500">{currentModule + 1} / {modules.length}</div>
                </div>
                
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <p className="text-gray-300 leading-relaxed text-lg">{modules[currentModule].content}</p>
                    {/* Placeholder for more content */}
                    <div className="h-64 mt-8 bg-black/30 rounded-xl border border-white/5 flex items-center justify-center text-gray-600 text-sm">
                        [Interactive Chart / Diagram would go here]
                    </div>
                </div>

                {/* Agreement Footer */}
                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setAgreed(!agreed)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${agreed ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            {agreed ? 'Agreed' : 'I Understand'}
                        </button>
                        <span className="text-xs text-gray-500">
                            {participants.filter(p => p.hasAgreed).length} / {participants.length} Ready
                        </span>
                    </div>

                    <button 
                        disabled={!allAgreed || currentModule >= modules.length - 1}
                        onClick={() => { setCurrentModule(prev => prev + 1); setAgreed(false); }}
                        className="px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200"
                    >
                        Next Module →
                    </button>
                </div>
            </div>

            {/* Chat (Mini) */}
            <div className="w-full md:w-80 bg-[#0f0f10] border border-white/10 rounded-2xl flex flex-col shrink-0">
                <div className="p-4 border-b border-white/5 bg-black/20">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Room Chat</h4>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-600 text-xs mt-10">
                            Tag <span className="text-green-500 font-bold">@professor</span> for AI help.
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col items-start bg-white/5 p-3 rounded-xl">
                            <span className="text-[10px] text-green-500 font-bold mb-1">{msg.sender}</span>
                            {msg.type === 'text' ? (
                                <p className="text-xs text-gray-200">{msg.content}</p>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400">🎤 Voice Note</span>
                                    <audio src={msg.content} controls className="h-8 w-40" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-white/5 flex gap-2">
                    <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`p-2 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        title="Hold to Record"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                    </button>
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                        placeholder="Type..." 
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-green-500" 
                    />
                </div>
            </div>
        </div>
    );
};
