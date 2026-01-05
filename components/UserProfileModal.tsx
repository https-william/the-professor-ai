
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClearHistory: () => void;
  onLogout: () => void;
  isAdmin?: boolean; 
  onTriggerAdmin?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onLogout, isAdmin, onTriggerAdmin }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  
  // --- ROBUST LONG PRESS LOGIC ---
  const [holdProgress, setHoldProgress] = useState(0);
  const animationFrame = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isHolding = useRef<boolean>(false); // Ref for immediate synchronous access
  const isReady = holdProgress >= 100;

  useEffect(() => {
      // Cleanup on unmount
      return () => cancelAnimationFrame(animationFrame.current);
  }, []);

  const startHold = (e: React.SyntheticEvent) => {
      // Prevent phantom clicks if possible, but keep selection enabling
      if (e.type === 'touchstart') {
          // e.preventDefault(); // Optional: might block scrolling
      }
      
      isHolding.current = true;
      startTime.current = Date.now();
      setHoldProgress(0);
      
      const animate = () => {
          if (!isHolding.current) return;

          const elapsed = Date.now() - startTime.current;
          // Duration: 3 seconds
          const progress = Math.min((elapsed / 3000) * 100, 100);
          setHoldProgress(progress);
          
          if (progress < 100) {
              animationFrame.current = requestAnimationFrame(animate);
          } else {
              // Haptic feedback when ready (Visuals handled by state)
              if (navigator.vibrate) navigator.vibrate(50);
          }
      };
      
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(animate);
  };

  const endHold = (e: React.SyntheticEvent) => {
      e.preventDefault(); // Stop event propagation
      isHolding.current = false;
      cancelAnimationFrame(animationFrame.current);
      
      // CRITICAL FIX: Calculate raw elapsed time. 
      // Do not rely on 'holdProgress' state which might be stale in this closure.
      const elapsed = Date.now() - startTime.current;
      
      // Allow a tiny buffer (2900ms) for human reaction time
      if (elapsed >= 2900) {
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
          
          // Force Trigger
          if (onTriggerAdmin) {
              console.log("Admin Trigger Activated via Long Press");
              onTriggerAdmin();
          } else {
              console.error("onTriggerAdmin prop is missing");
          }
      }
      
      // Reset immediately
      setHoldProgress(0);
  };

  const getProgressColor = () => {
      if (isReady) return '#22c55e'; // Green-500
      if (holdProgress > 60) return '#eab308'; // Yellow-500
      return '#ef4444'; // Red-500
  };

  if (!isOpen) return null;

  const achievements = [
      { 
          id: 'fresh_meat', 
          name: "Fresh Meat", 
          desc: "Completed your first exam. Welcome to the grinder.", 
          unlocked: (editedProfile.questionsAnswered || 0) > 0, 
          icon: "🥩",
          rarity: "Common",
          color: "bg-gray-800 border-gray-600"
      },
      { 
          id: 'academic_weapon', 
          name: "Academic Weapon", 
          desc: "Reached 1,000 XP. You are now a threat to the grading curve.", 
          unlocked: (editedProfile.xp || 0) >= 1000, 
          icon: "⚔️",
          rarity: "Rare",
          color: "bg-blue-900/40 border-blue-500"
      },
      { 
          id: 'no_life', 
          name: "Touch Grass", 
          desc: "14 Day Streak. The outside world misses you.", 
          unlocked: (editedProfile.streak || 0) >= 14, 
          icon: "🧟",
          rarity: "Epic",
          color: "bg-purple-900/40 border-purple-500"
      },
      { 
          id: 'night_owl', 
          name: "Vampire Scholar", 
          desc: "Studied between 2 AM and 5 AM. The sun burns, doesn't it?", 
          unlocked: false, // Logic would check timestamps in real implementation
          icon: "🧛",
          rarity: "Rare",
          color: "bg-indigo-900/40 border-indigo-500"
      },
      { 
          id: 'einstein', 
          name: "Actually Einstein", 
          desc: "100% Score on Nightmare Mode. Are you cheating?", 
          unlocked: (editedProfile.correctAnswers > 100 && (editedProfile.xp || 0) > 5000), 
          icon: "🧠",
          rarity: "Legendary",
          color: "bg-amber-900/40 border-amber-500"
      },
      { 
          id: 'sharpshooter', 
          name: "Sharpshooter", 
          desc: "Maintained a 100% accuracy streak for 10 questions.", 
          unlocked: false,
          icon: "🎯",
          rarity: "Epic",
          color: "bg-red-900/40 border-red-500"
      }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0a0a0c] w-full max-w-3xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-fade">
        
        {/* Header - Dossier Style */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
              {/* LONG PRESS TRIGGER */}
              <div 
                className="relative w-12 h-12 select-none touch-none cursor-pointer flex items-center justify-center group"
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                onTouchCancel={endHold}
                onContextMenu={(e) => e.preventDefault()}
              >
                  {/* Background Icon */}
                  <div className={`absolute inset-1 bg-blue-900/20 rounded-lg flex items-center justify-center border transition-all duration-200 z-10 
                      ${isReady ? 'border-green-500/50 bg-green-900/20 text-green-400 scale-110 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'border-blue-500/20 text-blue-400'} 
                      ${holdProgress > 0 && !isReady ? 'scale-95' : ''}`}
                  >
                      {isReady ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                      )}
                  </div>

                  {/* Progress Ring Overlay */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 transform -rotate-90">
                      <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke={getProgressColor()}
                          strokeWidth="3"
                          strokeDasharray="126" // 2 * PI * 20
                          strokeDashoffset={126 - (holdProgress / 100) * 126}
                          strokeLinecap="round"
                          className="transition-all duration-75 ease-linear"
                          style={{ opacity: holdProgress > 0 ? 1 : 0 }}
                      />
                  </svg>
                  
                  {/* Tooltip for instructions */}
                  {holdProgress > 0 && holdProgress < 100 && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[9px] text-white font-mono uppercase tracking-widest pointer-events-none">
                          Hold to Access
                      </div>
                  )}
                  {isReady && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-900/90 border border-green-500/50 px-2 py-1 rounded text-[9px] text-green-300 font-bold uppercase tracking-widest pointer-events-none animate-bounce">
                          Release Now
                      </div>
                  )}
              </div>

              <div>
                  <h3 className="font-bold text-white text-lg tracking-tight font-serif">Student Dossier</h3>
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">ID: {editedProfile.alias || 'UNKNOWN'}</p>
              </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[#0a0a0c]">
            
            {/* Identity Block */}
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
               <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${editedProfile.avatarGradient} flex items-center justify-center shadow-2xl ring-4 ring-black/50 border border-white/10 shrink-0`}>
                   <span className="text-5xl drop-shadow-lg">{editedProfile.avatarEmoji}</span>
               </div>
               <div className="text-center sm:text-left flex-1 w-full">
                   <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                       <h2 className="text-3xl font-bold text-white font-serif">{editedProfile.alias || 'Anonymous'}</h2>
                       <div className="flex gap-2">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${editedProfile.subscriptionTier === 'Excellentia' ? 'bg-amber-900/20 text-amber-500 border-amber-500/20' : 'bg-blue-900/20 text-blue-400 border-blue-500/20'}`}>
                               {editedProfile.subscriptionTier}
                           </span>
                           {isAdmin && (
                               <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-red-900/20 text-red-500 border-red-500/20 animate-pulse">
                                   DEAN
                               </span>
                           )}
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-6">
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">XP Level</span>
                           <span className="text-xl text-white font-mono">{Math.floor((editedProfile.xp || 0)/100)}</span>
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Streak</span>
                           <span className="text-xl text-amber-500 font-mono">{editedProfile.streak} Days</span>
                       </div>
                   </div>
               </div>
            </div>

            {/* Achievements - Redesigned */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Service Records & Medals</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {achievements.map(ach => (
                        <div key={ach.id} className={`relative p-4 rounded-xl border transition-all duration-300 group overflow-hidden ${ach.unlocked ? `${ach.color} bg-opacity-20` : 'bg-black border-white/5 opacity-50 grayscale'}`}>
                            {/* Unlock Glow */}
                            {ach.unlocked && <div className={`absolute -inset-1 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity ${ach.color.split(' ')[0]}`}></div>}
                            
                            <div className="relative z-10 flex flex-col items-center text-center h-full">
                                <div className={`text-4xl mb-3 transform transition-transform group-hover:scale-110 drop-shadow-md ${!ach.unlocked && 'opacity-50'}`}>
                                    {ach.icon}
                                </div>
                                <h5 className={`font-bold text-xs uppercase tracking-wider mb-1 ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>
                                    {ach.name}
                                </h5>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mb-2 ${
                                    ach.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-400' : 
                                    ach.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                                    ach.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400' : 
                                    'bg-gray-500/20 text-gray-400'
                                }`}>
                                    {ach.rarity}
                                </span>
                                <p className="text-[10px] text-gray-400 leading-tight">
                                    {ach.unlocked ? ach.desc : '???????????'}
                                </p>
                            </div>

                            {/* Lock Icon Overlay */}
                            {!ach.unlocked && (
                                <div className="absolute top-2 right-2 text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Editable Fields */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Academic Data</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Institution</label>
                        <input type="text" value={editedProfile.school} onChange={e => setEditedProfile({...editedProfile, school: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" placeholder="University..." />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Level</label>
                        <input type="text" value={editedProfile.academicLevel} onChange={e => setEditedProfile({...editedProfile, academicLevel: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" placeholder="Year 2..." />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Country</label>
                        <input type="text" value={editedProfile.country} onChange={e => setEditedProfile({...editedProfile, country: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" placeholder="Country..." />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Focus Weakness</label>
                        <input type="text" value={editedProfile.weaknessFocus} onChange={e => setEditedProfile({...editedProfile, weaknessFocus: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors" placeholder="e.g. Calculus Integration" />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-white/5">
                <button onClick={onLogout} className="w-full py-4 bg-red-900/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-all">
                    Terminals Logout
                </button>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4 shrink-0">
           <button onClick={() => { onSave(editedProfile); onClose(); }} className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg">Save Updates</button>
        </div>
      </div>
    </div>
  );
};
