
import React, { useState, useRef } from 'react';
import { SubscriptionTier } from '../types';

interface DuelCreateModalProps {
  onClose: () => void;
  onSubmit: (wager: number, file: File) => void;
  userXP: number;
  tier?: SubscriptionTier;
}

export const DuelCreateModal: React.FC<DuelCreateModalProps> = ({ onClose, onSubmit, userXP, tier = 'Fresher' }) => {
  const [wager, setWager] = useState(50);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participantLimit = tier === 'Fresher' ? 2 : tier === 'Scholar' ? 5 : 10;
  const maxWager = Math.min(userXP, 1000);

  const handleSubmit = () => {
    if (file && wager <= userXP) {
      setIsLoading(true);
      setTimeout(() => {
          onSubmit(wager, file);
          onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      {/* Ambient Void Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="relative w-full max-w-lg bg-[#0a0a0c] border border-purple-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(168,85,247,0.2)] overflow-hidden">
        
        {/* Neon Border Top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        
        <div className="text-center mb-8 relative">
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-900/30 text-purple-300 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-b-lg border-x border-b border-purple-500/30">
              Battle Limit: {participantLimit} Scholars
           </div>
           <h2 className="text-4xl font-black text-white font-serif mb-2 tracking-tighter italic mix-blend-overlay opacity-90">THE ARENA</h2>
           <p className="text-purple-400 text-xs uppercase tracking-widest font-mono">Peer-to-Peer Academic Combat</p>
        </div>

        <div className="space-y-6">
           {/* Wager Selection Slider */}
           <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stake Your XP</label>
                  <span className="text-purple-400 font-mono text-xs">Balance: {userXP} XP</span>
              </div>
              
              <div className="relative mb-2">
                  <input 
                    type="range" 
                    min="50" 
                    max="1000" 
                    step="50" 
                    value={wager} 
                    onChange={(e) => setWager(Math.min(parseInt(e.target.value), userXP))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
              </div>
              
              <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 font-mono">50 XP</span>
                  <div className="text-2xl font-black text-white text-center font-mono text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                      {wager} XP
                  </div>
                  <span className="text-xs text-gray-600 font-mono">1000 XP</span>
              </div>
              
              {userXP < 50 && (
                  <p className="text-[10px] text-red-400 text-center mt-2">Insufficient XP to duel. Study more to earn wager credits.</p>
              )}
           </div>

           {/* File Upload */}
           <div 
             onClick={() => !isLoading && fileInputRef.current?.click()}
             className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${
                 file 
                 ? 'border-purple-500 bg-purple-900/10' 
                 : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
             }`}
           >
              {file ? (
                 <div className="flex flex-col items-center animate-fade-in">
                    <span className="text-3xl mb-3 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">📜</span>
                    <span className="text-white font-bold text-sm">{file.name}</span>
                    <span className="text-purple-400 text-xs mt-1">Ready for Battle</span>
                 </div>
              ) : (
                 <div className="flex flex-col items-center">
                    <span className="text-3xl mb-3 text-gray-600 group-hover:text-purple-400 transition-colors">⚔️</span>
                    <span className="text-gray-300 text-sm font-bold group-hover:text-white transition-colors">Select Duel Material</span>
                    <span className="text-[10px] text-gray-500 mt-2">Both players will face the exact same questions.</span>
                 </div>
              )}
           </div>
           <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if(e.target.files?.[0]) setFile(e.target.files[0]) }} accept=".pdf,.docx,.txt" />
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
           <button onClick={onClose} disabled={isLoading} className="flex-1 py-4 text-gray-500 hover:text-white font-bold uppercase text-xs transition-colors">Retreat</button>
           <button 
             onClick={handleSubmit}
             disabled={!file || isLoading || wager > userXP}
             className="flex-[2] py-4 bg-white text-black hover:bg-purple-50 rounded-xl font-black uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all relative overflow-hidden"
           >
             {isLoading ? (
                 <span className="flex items-center justify-center gap-2">
                     <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                     Initializing...
                 </span>
             ) : (
                 "Initialize Arena"
             )}
           </button>
        </div>

      </div>
    </div>
  );
};
