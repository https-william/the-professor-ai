
import React, { useState, useEffect } from 'react';
import { subscribeToDuel } from '../services/firebase';
import { DuelState } from '../types';

interface DuelReadyModalProps {
  duelId: string;
  initialCode?: string;
  onEnter: () => void;
  isHost: boolean;
  statusText?: string;
}

export const DuelReadyModal: React.FC<DuelReadyModalProps> = ({ duelId, initialCode, onEnter, isHost, statusText }) => {
  const [copied, setCopied] = useState(false);
  const [duelData, setDuelData] = useState<DuelState | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates for participants
    const unsubscribe = subscribeToDuel(duelId, (data) => {
        setDuelData(data);
    });
    return () => unsubscribe();
  }, [duelId]);

  const codeDisplay = duelData?.code || initialCode || 'LOADING...';
  const participants = duelData?.participants || [];
  const isReady = duelData?.status === 'WAITING' || duelData?.status === 'ACTIVE';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
       {/* Ambient Background */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow"></div>
       </div>

       <div className="relative bg-[#0f0f10] border border-purple-500/30 rounded-3xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          
          <div className="mb-6 shrink-0">
             <div className="w-16 h-16 bg-purple-900/20 rounded-2xl border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                ⚔️
             </div>
             <h2 className="text-3xl font-black text-white italic tracking-tight">THE PIT</h2>
             <p className="text-purple-400 text-xs mt-2 font-mono uppercase tracking-widest animate-pulse">
                {statusText || (isReady ? "ARENA READY" : "SYNTHESIZING EXAM MATERIALS...")}
             </p>
          </div>
          
          <button 
             onClick={handleCopy}
             className="w-full bg-black/40 border border-purple-500/20 rounded-xl p-6 mb-6 relative group hover:bg-white/5 transition-colors text-left shrink-0"
          >
             <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Access Code</p>
             <div className="flex justify-between items-center">
                 <p className="text-3xl font-mono font-black text-white tracking-wider">{codeDisplay}</p>
                 <div className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                    {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    )}
                 </div>
             </div>
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-left">Gladiators ({participants.length})</h3>
              <div className="space-y-2">
                  {participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></div>
                              <span className="font-bold text-sm text-gray-200">{p.name} {p.id === duelData?.hostId && '👑'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-600">READY</span>
                      </div>
                  ))}
                  {participants.length === 0 && <div className="text-xs text-gray-600 italic">Waiting for connection...</div>}
              </div>
          </div>

          <button 
             onClick={onEnter} 
             disabled={!isReady}
             className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isReady ? 'Enter The Arena' : 'Preparing Battlefield...'}
          </button>
       </div>
    </div>
  );
};
