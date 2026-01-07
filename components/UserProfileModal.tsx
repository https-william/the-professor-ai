
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { queueAction } from '../services/syncService';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClearHistory: () => void;
  onLogout: () => void;
  isAdmin?: boolean; 
  onRequestAdminAccess?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onLogout, isAdmin, onRequestAdminAccess }) => {
  const { user } = useAuth();
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  // CRITICAL FIX: Sync local state when the prop changes or modal opens
  useEffect(() => {
      setEditedProfile(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
      onSave(editedProfile);
      // Use Hydra Queue
      if (user) {
          queueAction('UPDATE_PROFILE', { uid: user.uid, data: editedProfile });
      }
      onClose();
  };

  // Achievement Logic with Progress
  const achievements = [
      { 
          id: 'fresh_meat', 
          name: "Fresh Meat", 
          desc: "Complete your first exam.", 
          progress: Math.min((profile.questionsAnswered || 0), 1),
          total: 1,
          icon: "🥩",
          rarity: "Common",
          color: "bg-gray-800 border-gray-600"
      },
      { 
          id: 'academic_weapon', 
          name: "Academic Weapon", 
          desc: "Reach 1,000 XP.", 
          progress: Math.min((profile.xp || 0), 1000),
          total: 1000,
          icon: "⚔️",
          rarity: "Rare",
          color: "bg-blue-900/40 border-blue-500"
      },
      { 
          id: 'no_life', 
          name: "Touch Grass", 
          desc: "7 Day Streak.", 
          progress: Math.min((profile.streak || 0), 7),
          total: 7,
          icon: "🧟",
          rarity: "Epic",
          color: "bg-purple-900/40 border-purple-500"
      },
      { 
          id: 'veteran', 
          name: "Veteran", 
          desc: "Answer 100 Questions.", 
          progress: Math.min((profile.questionsAnswered || 0), 100),
          total: 100,
          icon: "🎖️",
          rarity: "Rare",
          color: "bg-indigo-900/40 border-indigo-500"
      },
      { 
          id: 'einstein', 
          name: "Einstein", 
          desc: "Reach 5,000 XP.", 
          progress: Math.min((profile.xp || 0), 5000),
          total: 5000,
          icon: "🧠",
          rarity: "Legendary",
          color: "bg-amber-900/40 border-amber-500"
      },
      { 
          id: 'sharpshooter', 
          name: "Sharpshooter", 
          desc: "Get 50 Correct Answers.", 
          progress: Math.min((profile.correctAnswers || 0), 50),
          total: 50,
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
              <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
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
                           <span className="text-xl text-white font-mono">{Math.floor((profile.xp || 0)/100)}</span>
                           <span className="text-[10px] text-gray-600 block mt-1">{(profile.xp || 0)} Total XP</span>
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Streak</span>
                           <span className="text-xl text-amber-500 font-mono">{profile.streak} Days</span>
                           <span className="text-[10px] text-gray-600 block mt-1">Keep it up</span>
                       </div>
                   </div>
               </div>
            </div>

            {/* Achievements - Progress Logic */}
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Service Records & Medals</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {achievements.map(ach => {
                        const isUnlocked = ach.progress >= ach.total;
                        const percent = (ach.progress / ach.total) * 100;
                        
                        return (
                            <div key={ach.id} className={`relative p-4 rounded-xl border transition-all duration-300 group overflow-hidden ${isUnlocked ? `${ach.color} bg-opacity-20` : 'bg-black border-white/5 opacity-70 grayscale'}`}>
                                {isUnlocked && <div className={`absolute -inset-1 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity ${ach.color.split(' ')[0]}`}></div>}
                                
                                <div className="relative z-10 flex flex-col items-center text-center h-full">
                                    <div className={`text-4xl mb-3 transform transition-transform group-hover:scale-110 drop-shadow-md`}>
                                        {ach.icon}
                                    </div>
                                    <h5 className={`font-bold text-xs uppercase tracking-wider mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                        {ach.name}
                                    </h5>
                                    <p className="text-[10px] text-gray-400 leading-tight mb-3">
                                        {ach.desc}
                                    </p>
                                    
                                    {/* Progress Bar */}
                                    <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/5 mt-auto">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${isUnlocked ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-500 mt-1">{ach.progress} / {ach.total}</span>
                                </div>
                            </div>
                        );
                    })}
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

        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center shrink-0">
           <button 
             onClick={onRequestAdminAccess}
             className="text-[7px] font-bold uppercase tracking-widest text-gray-800 hover:text-red-900 transition-colors"
           >
             Authorized Personnel Login
           </button>
           
           <button onClick={handleSave} className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg">Save Updates</button>
        </div>
      </div>
    </div>
  );
};
