
import React, { useState, useRef } from 'react';
import { SubscriptionTier } from '../types';

interface DuelCreateModalProps {
   onClose: () => void;
   onSubmit: (wager: number, file: File) => void;
   userXP: number;
   tier?: SubscriptionTier;
}

export const DuelCreateModal: React.FC<DuelCreateModalProps> = ({ onClose, onSubmit, userXP, tier = 'Fresher' }) => {
   const [file, setFile] = useState<File | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const participantLimit = 30;

   const handleSubmit = () => {
      if (file) {
         setIsLoading(true);
         onSubmit(0, file);
      }
   };

   return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">

         <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden">

            <div className="text-center mb-8 relative">
               <div className="inline-block bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 border border-white/5">
                  Capacity: {participantLimit}
               </div>
               <h2 className="text-3xl font-serif text-white mb-2">Host Session</h2>
               <p className="text-gray-500 text-xs uppercase tracking-widest font-mono">Collaborative Study Group</p>
            </div>

            <div className="space-y-6">
               {/* Info Block */}
               <div className="bg-white/5 p-5 rounded-xl border border-white/5 text-center">
                  <p className="text-gray-300 text-sm leading-relaxed serif">
                     Upload query material. The system will generate a rigorous assessment.
                     Share the access code with peers to begin.
                  </p>
               </div>

               {/* File Upload */}
               <div
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group ${file
                        ? 'border-gray-500 bg-white/5'
                        : 'border-white/10 hover:border-gray-500 hover:bg-white/5'
                     }`}
               >
                  {file ? (
                     <div className="flex flex-col items-center animate-fade-in">
                        <div className="mb-3 text-white">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>
                        </div>
                        <span className="text-white font-medium text-sm">{file.name}</span>
                        <span className="text-gray-500 text-xs mt-1">Material Mounted</span>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center">
                        <div className="mb-3 text-gray-600 group-hover:text-gray-400 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        </div>
                        <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">Select Source Material</span>
                        <span className="text-[10px] text-gray-500 mt-2">PDF, DOCX, TXT</span>
                     </div>
                  )}
               </div>
               <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} accept=".pdf,.docx,.txt" />
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
               <button onClick={onClose} disabled={isLoading} className="flex-1 py-4 text-gray-500 hover:text-white font-bold uppercase text-xs transition-colors tracking-widest">Cancel</button>
               <button
                  onClick={handleSubmit}
                  disabled={!file || isLoading}
                  className="flex-[2] py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                  {isLoading ? 'Initalizing...' : 'Initialize Session'}
               </button>
            </div>

         </div>
      </div>
   );
};
