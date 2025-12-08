
import React, { useState, useRef } from 'react';
import { UserProfile, Difficulty } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClearHistory: () => void;
  onLogout: () => void;
}

// Helper to determine rank based on stats
const getRank = (profile: UserProfile) => {
  const q = profile.questionsAnswered;
  const mastery = profile.questionsAnswered > 0 ? (profile.correctAnswers / profile.questionsAnswered) : 0;
  
  if (q < 10) return { title: "Novice", color: "text-gray-400", icon: "🌱", bg: "bg-gray-500/10 border-gray-500/30" };
  if (q < 50) return { title: "Apprentice", color: "text-blue-400", icon: "📘", bg: "bg-blue-500/10 border-blue-500/30" };
  if (q < 100) return { title: "Scholar", color: "text-purple-400", icon: "📚", bg: "bg-purple-500/10 border-purple-500/30" };
  if (q < 500) return { title: "Researcher", color: "text-amber-400", icon: "🔬", bg: "bg-amber-500/10 border-amber-500/30" };
  if (mastery > 0.8) return { title: "Grandmaster", color: "text-red-500", icon: "👑", bg: "bg-red-500/10 border-red-500/30" };
  return { title: "Professor", color: "text-white", icon: "🎓", bg: "bg-white/10 border-white/30" };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onClearHistory, onLogout }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  const rank = getRank(editedProfile);

  const handleResetStats = () => {
    if (window.confirm("Reset your academic stats (streak, questions, accuracy)? This won't delete your history.")) {
      setEditedProfile({
        ...editedProfile,
        streak: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        lastStudyDate: Date.now()
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (typeof data !== 'object') throw new Error("Invalid JSON structure");
        Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
        setImportStatus("Success! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setImportStatus("Failed: Invalid File");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#18181b] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-white">Student Identity</h2>
             <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${rank.bg} ${rank.color}`}>
               {rank.icon} {rank.title}
             </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6">
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${editedProfile.avatarGradient} flex items-center justify-center text-5xl shadow-2xl hover-lift cursor-pointer relative group ring-4 ring-black`}>
              {editedProfile.avatarEmoji}
            </div>
            
            <div className="space-y-4 w-full">
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

            <div className="w-full max-w-sm">
              <input 
                type="text" 
                value={editedProfile.alias}
                onChange={(e) => setEditedProfile({...editedProfile, alias: e.target.value})}
                className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-center text-white focus:border-blue-500 outline-none font-bold text-lg"
                placeholder="Student Name"
              />
            </div>
          </div>

          {/* Theme Engine */}
          <div className="bg-black/20 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Visual Interface</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'System', label: 'System', color: 'bg-gray-600' },
                { id: 'Light', label: 'Manuscript', color: 'bg-[#f4f1ea] border-2 border-gray-300' },
                { id: 'Dark', label: 'Slate', color: 'bg-[#18181b] border-2 border-gray-600' },
                { id: 'OLED', label: 'Void', color: 'bg-black border border-gray-800' }
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setEditedProfile({...editedProfile, theme: theme.id as any})}
                  className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group ${
                    editedProfile.theme === theme.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full shadow-lg ${theme.color}`}></div>
                  <span className={`text-xs font-bold ${editedProfile.theme === theme.id ? 'text-blue-400' : 'text-gray-400'}`}>{theme.label}</span>
                  {editedProfile.theme === theme.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-300 border-b border-gray-800 pb-2">Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Default Difficulty</label>
                  <select 
                    value={editedProfile.defaultDifficulty}
                    onChange={(e) => setEditedProfile({...editedProfile, defaultDifficulty: e.target.value as Difficulty})}
                    className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 appearance-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Nightmare">Nightmare (Danger)</option>
                  </select>
               </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="pt-4 border-t border-gray-800 space-y-3">
             <button 
                onClick={onLogout}
                className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
             >
                Sign Out
             </button>
          </div>
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
             Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};
