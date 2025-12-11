
import React, { useState } from 'react';

interface DuelReadyModalProps {
  duelId: string;
  onEnter: () => void;
}

export const DuelReadyModal: React.FC<DuelReadyModalProps> = ({ duelId, onEnter }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(duelId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
       {/* Ambient Background */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow"></div>
       </div>

       <div className="relative bg-[#0f0f10] border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center overflow-hidden">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          
          <div className="mb-8">
             <div className="w-16 h-16 bg-purple-900/20 rounded-2xl border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                ⚔️
             </div>
             <h2 className="text-3xl font-black text-white italic tracking-tight">ARENA INITIALIZED</h2>
             <p className="text-gray-400 text-xs mt-2 font-mono uppercase tracking-wider">Share this code with your opponent</p>
          </div>
          
          <button 
             onClick={handleCopy}
             className="w-full bg-black/40 border border-purple-500/20 rounded-xl p-6 mb-8 relative group hover:bg-white/5 transition-colors text-left"
          >
             <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-2 font-bold">Access ID</p>
             <div className="flex justify-between items-center">
                 <p className="text-2xl font-mono font-bold text-white tracking-wider">{duelId}</p>
                 <div className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                    {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    )}
                 </div>
             </div>
             <p className="absolute bottom-2 right-1/2 translate-x-1/2 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all text-[9px] text-purple-400 font-bold uppercase mt-2">Click to Copy</p>
          </button>

          <button 
             onClick={onEnter} 
             className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
             Enter The Arena
          </button>
       </div>
    </div>
  );
};
