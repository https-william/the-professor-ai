
import React, { useState, useRef } from 'react';

interface DuelCreateModalProps {
  onClose: () => void;
  onSubmit: (wager: number, file: File) => void;
  userXP: number;
}

export const DuelCreateModal: React.FC<DuelCreateModalProps> = ({ onClose, onSubmit, userXP }) => {
  const [wager, setWager] = useState(500);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (file && wager <= userXP) {
      onSubmit(wager, file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0f0f12] border border-purple-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        
        <div className="text-center mb-8">
           <h2 className="text-3xl font-bold text-white font-serif mb-2 tracking-tight">Academic Duel</h2>
           <p className="text-purple-300 text-sm uppercase tracking-widest font-mono">Wager XP. Challenge a Peer. Winner Takes All.</p>
        </div>

        <div className="space-y-6">
           {/* Wager Selection */}
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 block">Stake Your XP</label>
              <div className="flex gap-2 justify-center">
                 {[100, 500, 1000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setWager(amt)}
                      disabled={userXP < amt}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                        wager === amt 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                        : userXP < amt ? 'opacity-30 cursor-not-allowed border-transparent bg-white/5' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {amt} XP
                    </button>
                 ))}
              </div>
              <div className="text-center mt-2 text-[10px] text-gray-500">Available Balance: {userXP} XP</div>
           </div>

           {/* File Upload */}
           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-purple-500 bg-purple-900/10' : 'border-white/10 hover:border-white/20'}`}
           >
              {file ? (
                 <div className="flex flex-col items-center">
                    <span className="text-2xl mb-2">📄</span>
                    <span className="text-white font-medium text-sm">{file.name}</span>
                 </div>
              ) : (
                 <div className="flex flex-col items-center">
                    <span className="text-2xl mb-2 text-purple-400">⚔️</span>
                    <span className="text-gray-300 text-sm font-bold">Select Duel Document</span>
                    <span className="text-[10px] text-gray-500 mt-1">Both players will be quizzed on this material.</span>
                 </div>
              )}
           </div>
           <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if(e.target.files?.[0]) setFile(e.target.files[0]) }} accept=".pdf,.docx,.txt" />
        </div>

        <div className="flex gap-4 mt-8">
           <button onClick={onClose} className="flex-1 py-3 text-gray-500 hover:text-white font-bold uppercase text-xs">Cancel</button>
           <button 
             onClick={handleSubmit}
             disabled={!file}
             className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
           >
             Create Arena
           </button>
        </div>

      </div>
    </div>
  );
};
