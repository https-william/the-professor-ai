import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  status: string;
  type: 'EXAM' | 'PROFESSOR';
}

const TIPS = [
  "Hydrate before you ideate. Your brain is 73% water.",
  "The Feynman Technique: If you can't explain it simply, you don't understand it.",
  "Reviewing notes within 24 hours increases retention by 60%.",
  "Take a deep breath. Oxygen feeds the neurons.",
  "Spaced repetition is the key to long-term memory.",
  "Multitasking is a myth. Focus on one concept at a time.",
  "Sleep consolidates memory. Don't pull an all-nighter.",
  "Teaching someone else is the highest form of learning."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, type }) => {
  const isProfessor = type === 'PROFESSOR';
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center p-12 animate-fade-in py-32 relative z-50">
      
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
            <span className="absolute text-3xl animate-bounce-subtle drop-shadow-lg filter drop-shadow-lg">
               {isProfessor ? '👨‍🏫' : '🧠'}
            </span>
         </div>
      </div>

      <div className="text-center space-y-4 max-w-lg">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight mb-2 animate-pulse">
            {isProfessor ? "Designing Lesson Plan" : "Constructing Exam"}
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-400 font-mono text-xs uppercase tracking-widest opacity-60">
             <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
             <span>{status}</span>
             <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        </div>

        {/* Separator */}
        <div className="w-16 h-1 bg-white/10 rounded-full mx-auto my-6"></div>

        {/* Tips Section */}
        <div className="h-24 flex items-center justify-center">
           <p key={tipIndex} className="text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-300 font-medium italic animate-slide-up-fade leading-relaxed">
             "{TIPS[tipIndex]}"
           </p>
        </div>
      </div>
    </div>
  );
};