
import React, { useState } from 'react';
import { UserProfile, Difficulty, AIPersonality, LearningStyle, AmbientTheme } from '../types';
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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onClearHistory, onLogout }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'DORM' | 'AMBIENCE'>('IDENTITY');

  if (!isOpen) return null;

  const avatars = ['🎓', '🚀', '⚡', '🧠', '🦁', '🦉', '🔭', '🧬', '💻', '🎨'];
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-green-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-indigo-500 to-blue-500',
    'from-gray-500 to-slate-500',
  ];

  const ambientThemes: AmbientTheme[] = ['None', 'Rainy Library', 'Cyberpunk Lab', 'Cabin', 'Deep Space'];

  const level = calculateLevel(editedProfile.xp || 0);
  const progress = calculateProgress(editedProfile.xp || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#18181b] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-4">
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                <button onClick={() => setActiveTab('IDENTITY')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'IDENTITY' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Identity</button>
                <button onClick={() => setActiveTab('DORM')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'DORM' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Dorm Room</button>
                <button onClick={() => setActiveTab('AMBIENCE')} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'AMBIENCE' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Ambience</button>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#0f0f11]">
          
          {activeTab === 'IDENTITY' && (
            <>
                <div className="flex flex-col items-center gap-6 relative">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br ${editedProfile.avatarGradient} opacity-20 blur-3xl rounded-full pointer-events-none`}></div>

                    <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${editedProfile.avatarGradient} flex items-center justify-center text-5xl shadow-2xl hover-lift cursor-pointer relative group ring-4 ring-black z-10`}>
                    {editedProfile.avatarEmoji}
                    <div className="absolute -bottom-2 bg-black px-3 py-1 rounded-full border border-gray-800 text-xs font-bold text-white shadow-lg">
                        LVL {level}
                    </div>
                    </div>
                    
                    {/* XP Bar */}
                    <div className="w-full max-w-xs z-10">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                        <span>Rank: {level < 5 ? 'Novice' : level < 10 ? 'Apprentice' : level < 20 ? 'Scholar' : 'Grandmaster'}</span>
                        <span>{progress}/100 XP</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-gray-500 font-mono">
                        🔥 {editedProfile.streak} Day Streak
                    </div>
                    </div>

                    <div className="w-full max-w-sm z-10">
                    <input 
                        type="text" 
                        value={editedProfile.alias}
                        onChange={(e) => setEditedProfile({...editedProfile, alias: e.target.value})}
                        className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-center text-white focus:border-blue-500 outline-none font-bold text-lg"
                        placeholder="Student Name"
                    />
                    </div>

                    <div className="space-y-4 w-full border-t border-gray-800 pt-6">
                    <div className="flex flex-wrap justify-center gap-2">
                        {avatars.map(emoji => (
                        <button 
                            key={emoji}
                            onClick={() => setEditedProfile({...editedProfile, avatarEmoji: emoji})}
                            className={`w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all ${editedProfile.avatarEmoji === emoji ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                        >
                            {emoji}
                        </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {gradients.map(grad => (
                        <button 
                            key={grad}
                            onClick={() => setEditedProfile({...editedProfile, avatarGradient: grad})}
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${grad} ring-offset-2 ring-offset-[#18181b] transition-all ${editedProfile.avatarGradient === grad ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                        />
                        ))}
                    </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-300 border-b border-gray-800 pb-2">Academic Preferences</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Learning Style</label>
                        <select 
                            value={editedProfile.learningStyle}
                            onChange={(e) => setEditedProfile({...editedProfile, learningStyle: e.target.value as LearningStyle})}
                            className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none transition-colors hover:bg-white/5"
                        >
                            <option value="Visual">Visual (Images & Diagrams)</option>
                            <option value="Auditory">Auditory (Speech & Discussion)</option>
                            <option value="Textual">Textual (Reading & Writing)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Professor Personality</label>
                        <select 
                            value={editedProfile.defaultPersonality}
                            onChange={(e) => setEditedProfile({...editedProfile, defaultPersonality: e.target.value as AIPersonality})}
                            className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none transition-colors hover:bg-white/5"
                        >
                            <option value="Academic">Academic (Formal)</option>
                            <option value="Buddy">Study Buddy (Casual)</option>
                            <option value="Drill Sergeant">Drill Sergeant (Strict)</option>
                            <option value="ELI5">ELI5 (Simple)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Default Difficulty</label>
                        <select 
                            value={editedProfile.defaultDifficulty}
                            onChange={(e) => setEditedProfile({...editedProfile, defaultDifficulty: e.target.value as Difficulty})}
                            className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none transition-colors hover:bg-white/5"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Nightmare">Nightmare (Danger)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weakness Focus</label>
                        <input 
                            type="text" 
                            value={editedProfile.weaknessFocus}
                            onChange={(e) => setEditedProfile({...editedProfile, weaknessFocus: e.target.value})}
                            placeholder="e.g. Organic Chemistry"
                            className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors hover:bg-white/5"
                        />
                    </div>
                    </div>
                </div>
                
                <div className="pt-4 border-t border-gray-800 space-y-3">
                    <button 
                        onClick={onLogout}
                        className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </>
          )}

          {activeTab === 'DORM' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-4">
                      <h3 className="text-xl font-serif font-bold text-white">Your Sanctuary</h3>
                      <p className="text-gray-400 text-sm">Upgrade your dorm by leveling up.</p>
                  </div>
                  <VisualDorm level={level} />
                  <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl text-sm text-gray-300">
                      <strong>Current Wager:</strong> None.
                      <p className="text-xs text-gray-500 mt-1">Visit the Bursary to wager XP on your study streak.</p>
                  </div>
              </div>
          )}

          {activeTab === 'AMBIENCE' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-6">
                      <h3 className="text-xl font-serif font-bold text-white">Ambient Flow</h3>
                      <p className="text-gray-400 text-sm">Choose your study environment.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      {ambientThemes.map((theme) => (
                          <button
                            key={theme}
                            onClick={() => setEditedProfile({...editedProfile, ambientTheme: theme})}
                            className={`p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${
                                editedProfile.ambientTheme === theme 
                                ? 'bg-white text-black border-white' 
                                : 'bg-black/40 border-gray-800 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                          >
                             <div className="text-2xl">
                                {theme === 'None' && '⚫'}
                                {theme === 'Rainy Library' && '🌧️'}
                                {theme === 'Cyberpunk Lab' && '🦾'}
                                {theme === 'Cabin' && '🔥'}
                                {theme === 'Deep Space' && '🌌'}
                             </div>
                             <div>
                                 <div className="font-bold">{theme}</div>
                                 <div className="text-xs opacity-60 uppercase tracking-wider">
                                     {theme === 'None' && 'Silent / Default'}
                                     {theme === 'Rainy Library' && 'Focus / Rainfall'}
                                     {theme === 'Cyberpunk Lab' && 'High Tech / Drone'}
                                     {theme === 'Cabin' && 'Cozy / Fireplace'}
                                     {theme === 'Deep Space' && 'Ambient / Void'}
                                 </div>
                             </div>
                          </button>
                      ))}
                  </div>
              </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-black/20 flex justify-end gap-4">
           <button onClick={onClose} className="px-6 py-2 rounded-xl text-gray-300 hover:bg-white/5 font-medium transition-colors">Cancel</button>
           <button 
             onClick={() => {
               onSave(editedProfile);
               onClose();
             }} 
             className="px-8 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg hover-lift"
           >
             Save Identity
           </button>
        </div>
      </div>
    </div>
  );
};
