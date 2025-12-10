
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
          <div className="text-center">
             <div className="text-6xl mb-4 animate-bounce-subtle">
               {dormStage === 1 && "📦"}
               {dormStage === 2 && "🛏️"}
               {dormStage === 3 && "🖥️"}
               {dormStage === 4 && "🧪"}
               {dormStage === 5 && "🧠"}
             </div>
             <h3 className="text-2xl font-serif font-bold text-white">{title}</h3>
             <p className="text-gray-400 text-sm mt-2">{desc}</p>
          </div>
       </div>

       <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex justify-between items-center">
          <span className="text-xs font-mono text-gray-400">Current Level: {level}</span>
          <span className="text-xs font-mono text-amber-500">Next Upgrade: Lvl {level < 5 ? 5 : level < 10 ? 10 : level < 20 ? 20 : 50}</span>
       </div>
    </div>
  );
};
