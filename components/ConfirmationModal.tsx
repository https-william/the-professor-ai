
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, title = "Unsaved Progress", message = "Are you sure you want to abandon this session? All progress will be lost to the void." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#18181b] border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden transform transition-all scale-100">
         
         {/* Hazard Stripes */}
         <div className="absolute top-0 left-0 w-full h-1.5 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_10px,#000_10px,#000_20px)]"></div>

         <div className="flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             
             <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
             <p className="text-sm text-gray-400 leading-relaxed mb-6">{message}</p>
             
             <div className="flex gap-3 w-full">
                 <button 
                    onClick={onCancel}
                    className="flex-1 py-3 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200 transition-colors"
                 >
                    Resume Session
                 </button>
                 <button 
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-red-900/20 text-red-500 border border-red-500/30 font-bold uppercase text-xs rounded-xl hover:bg-red-900/40 transition-colors"
                 >
                    Abandon
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
};
