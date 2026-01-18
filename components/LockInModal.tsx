
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
               <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
               </div>
               <span className="font-bold text-xs uppercase tracking-widest block mb-1">Standard</span>
               <span className="text-[9px] opacity-60">Linear Consumption</span>
           </button>

           <button 
             onClick={() => setTechnique('SQ3R')}
             className={`p-6 border transition-all relative group overflow-hidden ${technique === 'SQ3R' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
           >
               {technique === 'SQ3R' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>}
               <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>
               </div>
               <span className="font-bold text-xs uppercase tracking-widest block mb-1">Architect</span>
               <span className="text-[9px] opacity-60">Survey. Question. Read.</span>
           </button>

           <button 
             onClick={() => setTechnique('RETRIEVAL')}
             className={`p-6 border transition-all relative group overflow-hidden ${technique === 'RETRIEVAL' ? 'bg-amber-900/20 border-amber-500 text-amber-100' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
           >
               {technique === 'RETRIEVAL' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>}
               <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
               </div>
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
