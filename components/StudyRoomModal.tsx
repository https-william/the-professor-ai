
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface StudyRoomModalProps {
  onClose: () => void;
  user: UserProfile;
}

export const StudyRoomModal: React.FC<StudyRoomModalProps> = ({ onClose, user }) => {
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'JOIN' | 'CREATE'>('CREATE');
  const [participants, setParticipants] = useState<string[]>([user.alias || 'You']);
  const [isWaiting, setIsWaiting] = useState(false);

  // Mock Logic for MVP (No real backend websocket yet)
  const handleCreate = () => {
      const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newId);
      setIsWaiting(true);
      // Simulating users joining
      setTimeout(() => setParticipants(prev => [...prev, 'Ghost_Scholar_42']), 3000);
      setTimeout(() => setParticipants(prev => [...prev, 'Neural_Net_User']), 6000);
  };

  const handleJoin = () => {
      if (!roomId) return;
      setIsWaiting(true);
      // Simulate join
      setTimeout(() => setParticipants(['Host_User', user.alias || 'You']), 1000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#0f0f11] border border-green-500/20 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden">
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
         
         <div className="text-center mb-8">
             <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             </div>
             <h2 className="text-2xl font-serif font-bold text-white">The Syndicate</h2>
             <p className="text-xs text-green-500 uppercase tracking-widest mt-1">Collaborative Study Cell</p>
         </div>

         {!isWaiting ? (
             <div className="space-y-6">
                 <div className="flex bg-white/5 rounded-xl p-1">
                     <button onClick={() => setMode('CREATE')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'CREATE' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>Create Cell</button>
                     <button onClick={() => setMode('JOIN')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${mode === 'JOIN' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>Join Cell</button>
                 </div>

                 {mode === 'JOIN' && (
                     <input 
                        type="text" 
                        placeholder="Enter Room ID" 
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono tracking-widest uppercase outline-none focus:border-green-500"
                     />
                 )}

                 <button 
                    onClick={mode === 'CREATE' ? handleCreate : handleJoin}
                    className="w-full py-4 bg-white text-black font-bold uppercase text-xs rounded-xl hover:scale-105 transition-transform"
                 >
                    {mode === 'CREATE' ? 'Initialize Lobby' : 'Connect'}
                 </button>
             </div>
         ) : (
             <div className="text-center space-y-6">
                 {mode === 'CREATE' && (
                     <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl">
                         <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Room ID</p>
                         <p className="text-2xl font-mono font-bold text-green-400 tracking-[0.2em]">{roomId}</p>
                     </div>
                 )}
                 
                 <div className="space-y-2">
                     <p className="text-xs text-gray-400">Agents in Cell:</p>
                     {participants.map((p, i) => (
                         <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg animate-fade-in">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <span className="text-sm text-white font-mono">{p}</span>
                         </div>
                     ))}
                     {participants.length < 4 && (
                         <div className="text-xs text-gray-600 animate-pulse mt-4">Waiting for connection...</div>
                     )}
                 </div>

                 {mode === 'CREATE' && (
                     <button disabled className="w-full py-3 bg-green-900/20 text-green-500 border border-green-500/20 rounded-xl font-bold uppercase text-xs cursor-not-allowed">
                         Start Session (Waiting for Upload)
                     </button>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};
