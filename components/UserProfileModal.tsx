
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { calculateLevel, calculateProgress } from '../services/storageService';
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
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'DORM'>('IDENTITY');

  if (!isOpen) return null;
  const level = calculateLevel(editedProfile.xp || 0);
  const progress = calculateProgress(editedProfile.xp || 0);
  const maxXP = 10000;
  const totalProgress = Math.min((editedProfile.xp || 0) / maxXP * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#18181b] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
             <button onClick={() => setActiveTab('IDENTITY')} className={`px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'IDENTITY' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Identity</button>
             <button onClick={() => setActiveTab('DORM')} className={`px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'DORM' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}>Dormitory</button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#0f0f11]">
          {activeTab === 'IDENTITY' && (
            <div className="space-y-8">
               <div className="flex flex-col items-center gap-6">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${editedProfile.avatarGradient} flex items-center justify-center shadow-2xl ring-4 ring-black`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
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
        </div>
        <div className="p-6 border-t border-gray-800 bg-black/20 flex justify-end gap-4">
           <button onClick={() => { onSave(editedProfile); onClose(); }} className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
