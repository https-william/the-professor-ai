
import React from 'react';

interface ProfessorCharacterProps {
  onClick: () => void;
}

export const ProfessorCharacter: React.FC<ProfessorCharacterProps> = ({ onClick }) => {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 cursor-pointer group animate-float"
      onClick={onClick}
      title="Ask The Professor"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl group-hover:bg-blue-400/50 transition-all duration-500"></div>

      {/* The Construct: Neural Orb Design */}
      <div className="relative w-16 h-16 liquid-glass liquid-glass-float flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {/* Inner Grid / Data Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

        {/* The Eye / Core */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Spinning Rings - Neural Activity */}
          <div className="absolute w-full h-full border-2 border-blue-400 rounded-full animate-[spin_4s_linear_infinite] opacity-60 border-t-transparent border-l-transparent"></div>
          <div className="absolute w-[70%] h-[70%] border border-cyan-300 rounded-full animate-[spin_3s_linear_infinite_reverse] opacity-80 border-b-transparent"></div>

          {/* Central Pulse */}
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white] animate-pulse"></div>
        </div>

        {/* Speech Bubble Hint */}
        <div className="absolute -top-12 right-0 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap shadow-lg">
          I am listening...
        </div>
      </div>
    </div>
  );
};
