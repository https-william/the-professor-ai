
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClearHistory: () => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onLogout }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  if (!isOpen) return null;

  const achievements = [
      { 
          id: 'fresh_meat', 
          name: "Fresh Meat", 
          desc: "Complete your first exam.", 
          unlocked: (editedProfile.questionsAnswered || 0) > 0, 
          icon: "🥩"
      },
      { 
          id: 'academic_weapon', 
          name: "Academic Weapon", 
          desc: "Reach 1,000 XP.", 
          unlocked: (editedProfile.xp || 0) >= 1000, 
          icon: "⚔️"
      },
      { 
          id: 'no_life', 
          name: "Zero Social Life", 
          desc: "14 Day Streak.", 
          unlocked: (editedProfile.streak || 0) >= 14, 
          icon: "🧟"
      },
      { 
          id: 'einstein', 
          name: "Actually Einstein", 
          desc: "Score 100% on a Nightmare Exam.", 
          unlocked: (editedProfile.correctAnswers > 500 && (editedProfile.xp || 0) > 5000), // Approximate logic
          icon: "🧠"
      },
      { 
          id: 'night_owl', 
          name: "Vampire Scholar", 
          desc: "Study between 2 AM and 5 AM.", 
          unlocked: false, // Logic handled elsewhere
          icon: "🧛"
      },
      { 
          id: 'tenure', 
          name: "Tenure Track", 
          desc: "10,000 XP.", 
          unlocked: (editedProfile.xp || 0) >= 10000, 
          icon: "🏛️"
      }
  ];

  const getValue = (val: string | undefined) => val && val !== 'undefined' ? val : 'Not Set';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0a0a0c] w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-fade">
        
        {/* Header - Dossier Style */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <div>
                  <h3 className="font-bold text-white text-lg tracking-tight">Student Dossier</h3>
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
                       <h2 className="text-3xl font-bold text-white">{editedProfile.alias || 'Anonymous'}</h2>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${editedProfile.subscriptionTier === 'Excellentia' ? 'bg-amber-900/20 text-amber-500 border-amber-500/20' : 'bg-blue-900/20 text-blue-400 border-blue-500/20'}`}>
                           {editedProfile.subscriptionTier}
                       </span>
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

            {/* Achievements */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Service Records</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {achievements.map(ach => (
                        <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 ${ach.unlocked ? 'bg-white/5 border-white/10' : 'bg-black border-white/5 opacity-40'}`}>
                            <span className="text-2xl">{ach.icon}</span>
                            <div className="flex-1 min-w-0">
                                <h5 className={`font-bold text-xs ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</h5>
                                <p className="text-[10px] text-gray-500 truncate">{ach.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-white/5">
                <button onClick={onLogout} className="w-full py-4 bg-red-900/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-all">
                    Terminals Logout
                </button>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4">
           <button onClick={() => { onSave(editedProfile); onClose(); }} className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg">Save Updates</button>
        </div>
      </div>
    </div>
  );
};
