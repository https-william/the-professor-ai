
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  status: string;
  type: 'EXAM' | 'PROFESSOR';
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, type, onCancel }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/98 backdrop-blur-xl animate-fade-in p-6 font-sans">
      
      {/* Central Visual */}
      <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
         {/* Outer Rings */}
         <div className="absolute inset-0 border border-white/10 rounded-full scale-110"></div>
         <div className="absolute inset-0 border border-white/5 rounded-full scale-125"></div>
         
         {/* Spinner */}
         <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${type === 'PROFESSOR' ? 'border-amber-500' : 'border-blue-500'}`}></div>
         
         {/* Inner Pulse */}
         <div className={`w-20 h-20 rounded-full transition-all duration-1000 ${pulse ? 'opacity-80 scale-100' : 'opacity-40 scale-90'} ${type === 'PROFESSOR' ? 'bg-amber-500 blur-xl' : 'bg-blue-500 blur-xl'}`}></div>
         
         <div className="absolute inset-0 flex items-center justify-center text-white z-10">
             {type === 'PROFESSOR' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                 </svg>
             ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a16.002 16.002 0 00-4.649 4.763m0 0c-.428-.283-.873-.542-1.332-.772" />
                 </svg>
             )}
         </div>
      </div>

      <div className="text-center">
          <h2 className="text-2xl text-white font-bold mb-2 tracking-tight">
              {type === 'PROFESSOR' ? 'Preparing Lecture' : 'Constructing Exam'}
          </h2>
          <p className="text-sm text-gray-400 font-mono uppercase tracking-widest animate-pulse">
              {status}
          </p>
      </div>

      <button 
        onClick={onCancel}
        className="mt-12 text-gray-600 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors border border-white/5 hover:border-white/20 rounded-full px-6 py-2"
      >
        Cancel
      </button>
    </div>
  );
};
