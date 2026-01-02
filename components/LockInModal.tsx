
import React, { useState } from 'react';
import { LockInConfig, LockInTechnique } from '../types';

interface LockInModalProps {
  onClose: () => void;
  onConfirm: (config: LockInConfig) => void;
}

export const LockInModal: React.FC<LockInModalProps> = ({ onClose, onConfirm }) => {
  const [technique, setTechnique] = useState<LockInTechnique>('STANDARD');
  const [usePomodoro, setUsePomodoro] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0 bg-amber-900/5 pointer-events-none"></div>
      
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-amber-500/20 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-amber-900/20 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
              🔒
           </div>
           <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter">Study Room Protocol</h2>
           <p className="text-gray-400 text-xs mt-2 font-mono uppercase tracking-widest">
              Initiate Deep Focus Sequence
           </p>
        </div>

        <div className="space-y-6">
           <div className="space-y-3">
               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Select Methodology</label>
               
               <button 
                 onClick={() => setTechnique('STANDARD')}
                 className={`w-full p-4 rounded-xl border text-left transition-all ${technique === 'STANDARD' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
               >
                   <div className="flex justify-between items-center mb-1">
                       <span className="font-bold text-sm">Standard Lecture</span>
                       {technique === 'STANDARD' && <span className="text-amber-500">✓</span>}
                   </div>
                   <p className="text-[10px] opacity-70">Read, Listen, and Review normally.</p>
               </button>

               <button 
                 onClick={() => setTechnique('SQ3R')}
                 className={`w-full p-4 rounded-xl border text-left transition-all ${technique === 'SQ3R' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
               >
                   <div className="flex justify-between items-center mb-1">
                       <span className="font-bold text-sm">The Architect (SQ3R)</span>
                       {technique === 'SQ3R' && <span className="text-amber-500">✓</span>}
                   </div>
                   <p className="text-[10px] opacity-70">Survey & Question before Reading. Proven to boost comprehension.</p>
               </button>

               <button 
                 onClick={() => setTechnique('RETRIEVAL')}
                 className={`w-full p-4 rounded-xl border text-left transition-all ${technique === 'RETRIEVAL' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
               >
                   <div className="flex justify-between items-center mb-1">
                       <span className="font-bold text-sm">Active Recall (Retrieval)</span>
                       {technique === 'RETRIEVAL' && <span className="text-amber-500">✓</span>}
                   </div>
                   <p className="text-[10px] opacity-70">Test yourself before you read. Identifies knowledge gaps instantly.</p>
               </button>
           </div>

           <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
               <div>
                   <span className="font-bold text-sm text-gray-200 block">Pomodoro Timer</span>
                   <span className="text-[10px] text-gray-500 uppercase tracking-widest">25m Focus / 5m Break</span>
               </div>
               <div 
                 onClick={() => setUsePomodoro(!usePomodoro)}
                 className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 flex ${usePomodoro ? 'bg-amber-600 justify-end' : 'bg-gray-700 justify-start'}`}
               >
                   <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
               </div>
           </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
           <button onClick={onClose} className="flex-1 py-4 text-gray-500 hover:text-white font-bold uppercase text-xs transition-colors">Cancel</button>
           <button 
             onClick={() => onConfirm({ technique, usePomodoro })}
             className="flex-[2] py-4 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
           >
             Lock In
           </button>
        </div>
      </div>
    </div>
  );
};
