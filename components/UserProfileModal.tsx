
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { calculateLevel } from '../services/storageService';

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
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'ACHIEVEMENTS' | 'CALENDAR'>('IDENTITY');

  if (!isOpen) return null;

  const getCalendarDays = () => {
      const days = [];
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const isActive = (editedProfile.streak || 0) > i; 
          days.push({ date: d, active: isActive });
      }
      return days;
  };

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
          name: "No Life", 
          desc: "14 Day Streak.", 
          unlocked: (editedProfile.streak || 0) >= 14, 
          icon: "🧟" 
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#18181b] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex flex-wrap gap-2 justify-between items-center bg-black/20">
          <div className="flex flex-wrap bg-black/40 rounded-lg p-1 border border-white/5 gap-1">
             <button onClick={() => setActiveTab('IDENTITY')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'IDENTITY' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Identity</button>
             <button onClick={() => setActiveTab('CALENDAR')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'CALENDAR' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Streak</button>
             <button onClick={() => setActiveTab('ACHIEVEMENTS')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ACHIEVEMENTS' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Badges</button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#0f0f11]">
          {activeTab === 'IDENTITY' && (
            <div className="space-y-8">
               <div className="flex flex-col items-center gap-6">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${editedProfile.avatarGradient} flex items-center justify-center shadow-2xl ring-4 ring-black`}>
                      <span className="text-4xl">{editedProfile.avatarEmoji}</span>
                  </div>
                  <div className="text-center">
                      <h3 className="text-2xl font-bold text-white">{editedProfile.alias || 'Anonymous'}</h3>
                      <p className="text-xs text-blue-500 font-mono uppercase mt-1 tracking-widest">{editedProfile.subscriptionTier}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Institution</label>
                      <div className="text-white font-medium">{getValue(editedProfile.school)}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Level</label>
                      <div className="text-white font-medium">{getValue(editedProfile.academicLevel)}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Country</label>
                      <div className="text-white font-medium">{getValue(editedProfile.country)}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Age</label>
                      <div className="text-white font-medium">{getValue(editedProfile.age)}</div>
                  </div>
               </div>

               <button onClick={onLogout} className="w-full py-4 bg-red-900/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-all">Log Out</button>
            </div>
          )}

          {activeTab === 'CALENDAR' && (
              <div className="space-y-6">
                  <div className="text-center">
                      <h4 className="text-4xl font-black text-white mb-2">{editedProfile.streak || 0}</h4>
                      <p className="text-xs uppercase tracking-widest text-amber-500 font-bold">Day Streak</p>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                      {getCalendarDays().map((d, i) => (
                          <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${d.active ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                              <span className="text-[10px] font-bold">{d.date.getDate()}</span>
                              {d.active && <span className="text-xs animate-bounce">🔥</span>}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'ACHIEVEMENTS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {achievements.map(ach => (
                      <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${ach.unlocked ? 'bg-gradient-to-r from-gray-900 to-black border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-black/40 border-white/5 opacity-50 grayscale'}`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${ach.unlocked ? 'bg-amber-500/20' : 'bg-gray-800'}`}>
                              {ach.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h5 className={`font-bold text-sm truncate ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</h5>
                              <p className="text-[10px] text-gray-400 leading-tight mt-1">{ach.desc}</p>
                          </div>
                          {ach.unlocked && <div className="ml-auto text-amber-500 text-xs font-bold">✓</div>}
                      </div>
                  ))}
              </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-800 bg-black/20 flex justify-end gap-4">
           <button onClick={() => { onSave(editedProfile); onClose(); }} className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
