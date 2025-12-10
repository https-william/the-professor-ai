import React, { useState, useRef } from 'react';

interface DuelCreateModalProps {
  onClose: () => void;
  onSubmit: (wager: number, file: File) => void;
  userXP: number;
}

export const DuelCreateModal: React.FC<DuelCreateModalProps> = ({ onClose, onSubmit, userXP }) => {
  const [wager, setWager] = useState(500);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (file && wager <= userXP) {
      setIsLoading(true);
      // Simulate slight delay for effect before passing up
      setTimeout(() => {
          onSubmit(wager, file);
          // Don't close here, App.tsx will handle transition or we close after submit
          // Actually, App.tsx handles the processing status, so we can just close
          // But to show "Initializing", we might want to wait. 
          // For now, let's trigger it.
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
              Scholar Clearance Only
           </div>
           <h2 className="text-4xl font-black text-white font-serif mb-2 tracking-tighter italic mix-blend-overlay opacity-90">THE ARENA</h2>
           <p className="text-purple-400 text-xs uppercase tracking-widest font-mono">Peer-to-Peer Academic Combat</p>
        </div>

        <div className="space-y-6">
           {/* Wager Selection */}
           <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 block flex justify-between">
                  <span>Stake Your XP</span>
                  <span className="text-purple-400">Balance: {userXP}</span>
              </label>
              <div className="flex gap-3 justify-center">
                 {[100, 500, 1000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setWager(amt)}
                      disabled={userXP < amt || isLoading}
                      className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all border relative overflow-hidden group ${
                        wager === amt 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' 
                        : userXP < amt ? 'opacity-30 cursor-not-allowed border-transparent bg-white/5' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="relative z-10">{amt}</span>
                      {wager === amt && <div className="absolute inset-0 bg-gradient-to-t from-purple-800 to-transparent opacity-50"></div>}
                    </button>
                 ))}
              </div>
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
             disabled={!file || isLoading}
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