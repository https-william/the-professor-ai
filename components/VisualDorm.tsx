
import React from 'react';

interface VisualDormProps {
  level: number;
}

export const VisualDorm: React.FC<VisualDormProps> = ({ level }) => {
  let dormStage = 1;
  let title = "The Closet";
  let desc = "A mattress on the floor. It's a start.";
  let color = "bg-gray-800";

  if (level >= 5) { dormStage = 2; title = "Shared Dorm"; desc = "A desk and a chair. Luxury."; color = "bg-blue-900"; }
  if (level >= 10) { dormStage = 3; title = "Private Study"; desc = "Dual monitors and silence."; color = "bg-indigo-900"; }
  if (level >= 20) { dormStage = 4; title = "The Lab"; desc = "Holographic displays and espresso."; color = "bg-purple-900"; }
  if (level >= 50) { dormStage = 5; title = "Neural Sanctum"; desc = "Direct interface with the machine."; color = "bg-amber-900"; }

  return (
    <div className={`w-full aspect-video rounded-2xl ${color} relative overflow-hidden border border-white/10 shadow-2xl transition-colors duration-1000`}>
       <div className="absolute inset-0 bg-noise opacity-10"></div>
       <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/20">
             {/* Abstract Shapes Instead of Emojis */}
             {dormStage === 1 && <svg className="w-32 h-32 mx-auto" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18v-2h-2v-2h-2v2h-2v-2h-2v2H2v2h18Z"/><path d="M22 6h-6l-2-2H4L2 6v10h20V6Z"/></svg>}
             {dormStage > 1 && <svg className="w-32 h-32 mx-auto" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
             <h3 className="text-2xl font-serif font-bold text-white mt-4">{title}</h3>
             <p className="text-gray-400 text-sm mt-2">{desc}</p>
          </div>
       </div>
       <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex justify-between items-center">
          <span className="text-xs font-mono text-gray-400">Level: {level}</span>
          <span className="text-xs font-mono text-amber-500">Next: Lvl {level < 5 ? 5 : 50}</span>
       </div>
    </div>
  );
};
