
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  status: string;
  type: 'EXAM' | 'PROFESSOR';
  onCancel?: () => void;
}

const TIPS = [
  "Hydrate before you ideate. Your brain is 73% water.",
  "The Feynman Technique: If you can't explain it simply, you don't understand it.",
  "Reviewing notes within 24 hours increases retention by 60%.",
  "Take a deep breath. Oxygen feeds the neurons.",
  "Spaced repetition is the key to long-term memory.",
  "Multitasking is a myth. Focus on one concept at a time.",
  "Sleep consolidates memory. Don't pull an all-nighter.",
  "Teaching someone else is the highest form of learning.",
  "Mistakes are proof that you are trying.",
  "Discipline weighs ounces, regret weighs tons."
];

const WAIT_MESSAGES = [
  "Consulting the archives...",
  "Synthesizing neural pathways...",
  "Calibrating difficulty vectors...",
  "Traffic is high. Queuing your request...",
  "Rerouting power to the core...",
  "Constructing your academic arsenal...",
  "Almost there. Stay focused."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, type, onCancel }) => {
  const isProfessor = type === 'PROFESSOR';
  const [tipIndex, setTipIndex] = useState(0);
  const [waitIndex, setWaitIndex] = useState(0);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    
    const waitInterval = setInterval(() => {
       setWaitIndex((prev) => (prev + 1) % WAIT_MESSAGES.length);
    }, 5000);

    // Increased to 45 seconds as requested
    const cancelTimer = setTimeout(() => {
        setShowCancel(true);
    }, 45000);

    return () => {
        clearInterval(tipInterval);
        clearInterval(waitInterval);
        clearTimeout(cancelTimer);
    };
  }, []);
  
  // Use the prop status initially, but if it takes too long, cycle through wait messages
  const displayStatus = waitIndex === 0 ? status : WAIT_MESSAGES[waitIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl animate-fade-in p-6">
      
      {/* Neural Core Visualization */}
      <div className="relative w-48 h-48 mb-16 flex items-center justify-center">
         
         {/* Orbit Ring 1 */}
         <div className={`absolute inset-0 rounded-full border border-dashed opacity-40 animate-orbit ${isProfessor ? 'border-amber-500/50' : 'border-blue-400/50'}`}></div>
         
         {/* Orbit Ring 2 (Reverse) */}
         <div className={`absolute inset-4 rounded-full border border-dashed opacity-30 animate-orbit-reverse ${isProfessor ? 'border-orange-500/50' : 'border-indigo-400/50'}`}></div>

         {/* Glow Layer */}
         <div className={`absolute inset-10 rounded-full blur-[40px] animate-breathe ${isProfessor ? 'bg-amber-600/30' : 'bg-blue-600/30'}`}></div>
         
         {/* Core Nucleus */}
         <div className="relative z-10 w-24 h-24 glass-panel rounded-full flex items-center justify-center shadow-2xl border-none">
            <div className={`w-16 h-16 rounded-full animate-pulse-slow ${isProfessor ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'}`}></div>
            <span className="absolute text-3xl animate-bounce-subtle drop-shadow-lg filter drop-shadow-lg text-white">
               {isProfessor ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" /></svg>
               ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" /></svg>
               )}
            </span>
         </div>
      </div>

      <div className="text-center space-y-4 max-w-lg w-full">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight mb-2 animate-pulse">
            {isProfessor ? "Designing Lesson Plan" : "Constructing Exam"}
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-400 font-mono text-xs uppercase tracking-widest opacity-60">
             <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
             <span>{displayStatus}</span>
             <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        </div>

        {/* Separator */}
        <div className="w-16 h-1 bg-white/10 rounded-full mx-auto my-6"></div>

        {/* Tips Section */}
        <div className="h-24 flex items-center justify-center px-4">
           <p key={tipIndex} className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-300 font-medium italic animate-slide-up-fade leading-relaxed">
             "{TIPS[tipIndex]}"
           </p>
        </div>

        {/* Escape Hatch */}
        {showCancel && onCancel && (
            <div className="animate-fade-in pt-8">
                <button 
                    onClick={onCancel}
                    className="px-6 py-2 rounded-full border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 hover:border-red-500 transition-all"
                >
                    Taking too long? Cancel
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
