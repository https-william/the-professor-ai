
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

  const locations = [
      { name: "University Library", minLevel: 1, type: 'OPEN' },
      { name: "Research Lab", minLevel: 10, type: 'LOCKED' },
      { name: "Deep Archive", minLevel: 25, type: 'LOCKED' },
      { name: "Orbital Station", minLevel: 50, type: 'LOCKED' }
  ];

  return (
    <div className="space-y-6">
        <div className={`w-full aspect-video rounded-2xl ${color} relative overflow-hidden border border-white/10 shadow-2xl transition-colors duration-1000 group`}>
           <div className="absolute inset-0 bg-noise opacity-10"></div>
           
           {/* Visual Representations */}
           <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-700">
              <div className="text-center text-white/20">
                 {/* Abstract Shapes Instead of Emojis */}
                 {dormStage === 1 && <svg className="w-32 h-32 mx-auto" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18v-2h-2v-2h-2v2h-2v-2h-2v2H2v2h18Z"/><path d="M22 6h-6l-2-2H4L2 6v10h20V6Z"/></svg>}
                 {dormStage === 2 && <svg className="w-32 h-32 mx-auto" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4z" opacity="0.3"/><path d="M2 2h20v20H2z"/></svg>}
                 {dormStage >= 3 && <svg className="w-32 h-32 mx-auto" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
                 <h3 className="text-2xl font-serif font-bold text-white mt-4">{title}</h3>
                 <p className="text-gray-400 text-sm mt-2">{desc}</p>
              </div>
           </div>
           
           <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400">Current Level: {level}</span>
              <span className="text-xs font-mono text-amber-500">Next Upgrade: Lvl {level < 5 ? 5 : (level < 10 ? 10 : (level < 20 ? 20 : 50))}</span>
           </div>
        </div>

        <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Campus Locations</h4>
            <div className="grid grid-cols-2 gap-3">
                {locations.map((loc) => {
                    const isUnlocked = level >= loc.minLevel;
                    return (
                        <div key={loc.name} className={`p-4 rounded-xl border transition-all ${isUnlocked ? 'bg-white/5 border-white/10 hover:border-white/20 cursor-pointer' : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'}`}>
                            <div className="flex justify-between items-start">
                                <span className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>{loc.name}</span>
                                {!isUnlocked && <span className="text-[10px] text-red-500 font-mono">Lvl {loc.minLevel}</span>}
                            </div>
                            <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-wider">{isUnlocked ? 'Accessible' : 'Restricted'}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
