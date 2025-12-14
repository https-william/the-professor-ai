
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { calculateLevel, calculateProgress, buyItem } from '../services/storageService';
import { VisualDorm } from './VisualDorm';

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
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'DORM' | 'BURSARY' | 'ACHIEVEMENTS' | 'CALENDAR'>('IDENTITY');

  if (!isOpen) return null;
  const level = calculateLevel(editedProfile.xp || 0);
  const progress = calculateProgress(editedProfile.xp || 0);
  const maxXP = 10000;
  const totalProgress = Math.min((editedProfile.xp || 0) / maxXP * 100, 100);

  const handlePurchase = (cost: number, type: 'FREEZE' | 'THEME', value?: string) => {
      try {
          const updated = buyItem(editedProfile, cost, type);
          if (type === 'THEME' && value) {
              // Apply theme logic here (mocked for now)
              alert(`Theme "${value}" unlocked! (Visual update pending)`);
          }
          setEditedProfile(updated);
          onSave(updated); 
      } catch (e: any) {
          alert(e.message);
      }
  };

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

  // Creative & Humorous Achievements
  const achievements = [
      { 
          id: 'fresh_meat', 
          name: "Fresh Meat", 
          desc: "Complete your first exam. Welcome to the thunderdome.", 
          unlocked: (editedProfile.questionsAnswered || 0) > 0, 
          icon: "🥩" 
      },
      { 
          id: 'academic_weapon', 
          name: "Academic Weapon", 
          desc: "Reach 1,000 XP. You are now legally dangerous.", 
          unlocked: (editedProfile.xp || 0) >= 1000, 
          icon: "⚔️" 
      },
      { 
          id: 'touch_grass', 
          name: "Touch Grass", 
          desc: "Answer 500 Questions. Please, go outside.", 
          unlocked: (editedProfile.questionsAnswered || 0) >= 500, 
          icon: "🌱" 
      },
      { 
          id: 'god_mode', 
          name: "God Mode", 
          desc: "Reach 5,000 XP. You can now levitate.", 
          unlocked: (editedProfile.xp || 0) >= 5000, 
          icon: "👑" 
      },
      { 
          id: 'no_life', 
          name: "No Life", 
          desc: "14 Day Streak. The simulation is impressed.", 
          unlocked: (editedProfile.streak || 0) >= 14, 
          icon: "🧟" 
      },
      { 
          id: 'big_brain', 
          name: "Big Brain", 
          desc: "500 Correct Answers. Your scalp must hurt.", 
          unlocked: (editedProfile.correctAnswers || 0) >= 500, 
          icon: "🧠" 
      },
      { 
          id: 'tenure', 
          name: "Tenure Track", 
          desc: "10,000 XP. You practically own the university.", 
          unlocked: (editedProfile.xp || 0) >= 10000, 
          icon: "🏛️" 
      },
      {
          id: 'caffeine',
          name: "Caffeine IV",
          desc: "Study after 2 AM. Sleep is for the weak.",
          unlocked: false, // Requires timestamp logic
          icon: "☕"
      }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#18181b] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex flex-wrap gap-2 justify-between items-center bg-black/20">
          <div className="flex flex-wrap bg-black/40 rounded-lg p-1 border border-white/5 gap-1">
             <button onClick={() => setActiveTab('IDENTITY')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'IDENTITY' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Identity</button>
             <button onClick={() => setActiveTab('DORM')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'DORM' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Dorm</button>
             <button onClick={() => setActiveTab('CALENDAR')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'CALENDAR' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Streak</button>
             <button onClick={() => setActiveTab('ACHIEVEMENTS')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ACHIEVEMENTS' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Badges</button>
             <button onClick={() => setActiveTab('BURSARY')} className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'BURSARY' ? 'bg-amber-500 text-black' : 'text-amber-500 hover:text-amber-300'}`}>Store</button>
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
                      <h3 className="text-2xl font-bold text-white">{editedProfile.alias}</h3>
                      <p className="text-xs text-blue-500 font-mono uppercase mt-1 tracking-widest">{editedProfile.subscriptionTier}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Institution</label>
                      <div className="text-white font-medium">{editedProfile.school || 'Unspecified'}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Level</label>
                      <div className="text-white font-medium">{editedProfile.academicLevel || 'Unspecified'}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Country</label>
                      <div className="text-white font-medium">{editedProfile.country || 'Global'}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Age</label>
                      <div className="text-white font-medium">{editedProfile.age || '?'}</div>
                  </div>
               </div>

               <button onClick={onLogout} className="w-full py-4 bg-red-900/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-all">Terminate Session</button>
            </div>
          )}

          {activeTab === 'DORM' && (
             <div className="space-y-8">
                <VisualDorm level={level} />
                
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tenure Progress</h4>
                            <p className="text-[10px] text-gray-500 mt-1">Earn 10,000 XP to achieve Academic Immortality.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-mono font-bold text-amber-500">{editedProfile.xp || 0}</div>
                            <div className="text-[10px] text-gray-600 uppercase">/ {maxXP} XP</div>
                        </div>
                    </div>
                    <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span>⏰</span> Study Call
                        </h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={editedProfile.studyReminders} onChange={(e) => setEditedProfile({...editedProfile, studyReminders: e.target.checked})} />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    {editedProfile.studyReminders && (
                        <div className="animate-fade-in">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Daily Reminder Time</label>
                            <input 
                                type="time" 
                                value={editedProfile.reminderTime || "20:00"}
                                onChange={(e) => setEditedProfile({...editedProfile, reminderTime: e.target.value})}
                                className="bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 w-full"
                            />
                            <p className="text-[10px] text-gray-500 mt-2">
                                * The Professor will summon you at this time. Do not be late.
                            </p>
                        </div>
                    )}
                </div>
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
                  
                  <p className="text-center text-xs text-gray-500">Consistency is the only algorithm that matters.</p>
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

          {activeTab === 'BURSARY' && (
              <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-900/30 to-black p-6 rounded-2xl border border-amber-500/20 flex justify-between items-center shadow-lg">
                      <div>
                          <h4 className="text-xl font-bold text-amber-500 font-mono">{editedProfile.xp || 0} XP</h4>
                          <p className="text-[10px] text-amber-200 uppercase tracking-widest">Available Credits</p>
                      </div>
                      <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">🪙</div>
                  </div>

                  <div className="space-y-4">
                      {/* Streak Freeze */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-xl border border-cyan-500/20">🧊</div>
                              <div>
                                  <h5 className="font-bold text-white text-sm">Time Dilation (Streak Freeze)</h5>
                                  <p className="text-xs text-gray-500">Protect your streak for one day.</p>
                              </div>
                          </div>
                          <button 
                            disabled={editedProfile.hasStreakFreeze || (editedProfile.xp || 0) < 500}
                            onClick={() => handlePurchase(500, 'FREEZE')}
                            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              {editedProfile.hasStreakFreeze ? 'OWNED' : '500 XP'}
                          </button>
                      </div>
                      
                      {/* Themes */}
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-xl border border-purple-500/20">🌌</div>
                              <div>
                                  <h5 className="font-bold text-white text-sm">Void Theme</h5>
                                  <p className="text-xs text-gray-500">Deep OLED Black Interface.</p>
                              </div>
                          </div>
                          <button 
                             disabled={(editedProfile.xp || 0) < 2000}
                             onClick={() => handlePurchase(2000, 'THEME', 'OLED')}
                             className="px-4 py-2 bg-purple-600 text-white text-xs font-bold uppercase rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              2000 XP
                          </button>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-xl border border-green-500/20">📟</div>
                              <div>
                                  <h5 className="font-bold text-white text-sm">Matrix Theme</h5>
                                  <p className="text-xs text-gray-500">Retro Terminal Interface.</p>
                              </div>
                          </div>
                          <button 
                             disabled={(editedProfile.xp || 0) < 2000}
                             onClick={() => handlePurchase(2000, 'THEME', 'Matrix')}
                             className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              2000 XP
                          </button>
                      </div>
                  </div>
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
