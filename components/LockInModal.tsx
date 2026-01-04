
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-xl animate-fade-in">
      {/* HUD Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
      
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-amber-500/20 rounded-none p-10 shadow-2xl overflow-hidden flex flex-col">
        {/* Corner Decals */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>

        <div className="text-center mb-10">
           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] font-mono glitch-effect" style={{ textShadow: "0 0 10px rgba(245,158,11,0.5)" }}>
               WAR ROOM
           </h2>
           <p className="text-amber-500 text-xs mt-3 font-mono uppercase tracking-widest border-t border-b border-amber-500/20 inline-block py-1 px-4">
              Authorized Personnel Only
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <button 
             onClick={() => setTechnique('STANDARD')}
             className={`p-6 border transition-all relative group overflow-hidden ${technique === 'STANDARD' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
           >
               {technique === 'STANDARD' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>}
               <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">📄</div>
               <span className="font-bold text-xs uppercase tracking-widest block mb-1">Standard</span>
               <span className="text-[9px] opacity-60">Linear Consumption</span>
           </button>

           <button 
             onClick={() => setTechnique('SQ3R')}
             className={`p-6 border transition-all relative group overflow-hidden ${technique === 'SQ3R' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
           >
               {technique === 'SQ3R' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>}
               <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">📐</div>
               <span className="font-bold text-xs uppercase tracking-widest block mb-1">Architect</span>
               <span className="text-[9px] opacity-60">Survey. Question. Read.</span>
           </button>

           <button 
             onClick={() => setTechnique('RETRIEVAL')}
             className={`p-6 border transition-all relative group overflow-hidden ${technique === 'RETRIEVAL' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
           >
               {technique === 'RETRIEVAL' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>}
               <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🧠</div>
               <span className="font-bold text-xs uppercase tracking-widest block mb-1">Recall</span>
               <span className="text-[9px] opacity-60">Active Testing Protocol</span>
           </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 mb-8">
           <div>
               <span className="font-bold text-sm text-gray-200 block uppercase tracking-wide">Focus Timer</span>
               <span className="text-[10px] text-gray-500 uppercase tracking-widest">25m Work / 5m Rest Cycle</span>
           </div>
           <div 
             onClick={() => setUsePomodoro(!usePomodoro)}
             className={`w-12 h-6 cursor-pointer transition-colors p-1 flex border ${usePomodoro ? 'bg-amber-900/40 border-amber-500 justify-end' : 'bg-black border-gray-700 justify-start'}`}
           >
               <div className={`w-3.5 h-3.5 bg-white shadow-md transition-all ${usePomodoro ? 'bg-amber-500' : 'bg-gray-500'}`}></div>
           </div>
        </div>

        <div className="flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 text-gray-500 hover:text-white font-bold uppercase text-xs transition-colors border border-transparent hover:border-white/10 bg-black">Abort</button>
           <button 
             onClick={() => onConfirm({ technique, usePomodoro })}
             className="flex-[2] py-4 bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-amber-500 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] relative overflow-hidden group"
           >
             <span className="relative z-10 group-hover:scale-105 inline-block transition-transform">Initiate Protocol</span>
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
           </button>
        </div>
      </div>
    </div>
  );
};
