
import React, { useState, useRef } from 'react';
import { SubscriptionTier } from '../types';

interface DuelCreateModalProps {
  onClose: () => void;
  onSubmit: (wager: number, file: File) => void;
  userXP: number;
  tier?: SubscriptionTier;
}

export const DuelCreateModal: React.FC<DuelCreateModalProps> = ({ onClose, onSubmit, userXP, tier = 'Fresher' }) => {
  // Wager defaults to 0 (Friendly match) to remove confusion between XP and Credits
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participantLimit = 30;
  
  const handleSubmit = () => {
    if (file) {
      setIsLoading(true);
      // Sending 0 as wager for now
      onSubmit(0, file);
      // Do not close immediately, wait for parent to handle success/fail
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="relative w-full max-w-lg bg-[#0a0a0c] border border-purple-500/40 rounded-3xl p-8 shadow-[0_0_80px_rgba(168,85,247,0.2)] overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        
        <div className="text-center mb-8 relative">
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-900/30 text-purple-300 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-b-lg border-x border-b border-purple-500/30">
              Capacity: 2 - {participantLimit}
           </div>
           <h2 className="text-4xl font-black text-white font-display mb-2 tracking-tighter italic mix-blend-overlay opacity-90">THE ARENA</h2>
           <p className="text-purple-400 text-xs uppercase tracking-widest font-mono">Multiplayer Academic Combat</p>
        </div>

        <div className="space-y-6">
           {/* Info Block */}
           <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center">
              <p className="text-gray-300 text-sm leading-relaxed">
                  Upload a document. We will generate a <span className="text-purple-400 font-bold">Hard Mode</span> exam.
                  Share the code. Whoever scores highest wins the glory.
              </p>
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
                    <div className="mb-3 text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>
                    </div>
                    <span className="text-white font-bold text-sm">{file.name}</span>
                    <span className="text-purple-400 text-xs mt-1">Ready for Battle</span>
                 </div>
              ) : (
                 <div className="flex flex-col items-center">
                    <div className="mb-3 text-gray-600 group-hover:text-purple-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    </div>
                    <span className="text-gray-300 text-sm font-bold group-hover:text-white transition-colors">Select Arena Material</span>
                    <span className="text-[10px] text-gray-500 mt-2">PDF, DOCX, TXT supported.</span>
                 </div>
              )}
           </div>
           <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if(e.target.files?.[0]) setFile(e.target.files[0]) }} accept=".pdf,.docx,.txt" />
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
           <button onClick={onClose} disabled={isLoading} className="flex-1 py-4 text-gray-500 hover:text-white font-bold uppercase text-xs transition-colors">Cancel</button>
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
