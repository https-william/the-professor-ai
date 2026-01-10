
import React, { useState } from 'react';
import { UserProfile } from '../../types';

interface WelcomeModalProps {
  onComplete: (data: Partial<UserProfile>) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [alias, setAlias] = useState('');

  const handleStart = () => {
      if (alias.trim()) {
          onComplete({ alias });
      } else {
          // Allow anonymous
          onComplete({ alias: 'Guest Student' });
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center">
        <div className="mb-6">
            <h2 className="text-3xl font-serif font-bold text-white mb-2">Welcome, Scholar.</h2>
            <p className="text-gray-400 text-sm">I am The Professor. I do not care about your grades, I care about your results.</p>
        </div>

        <div className="space-y-6">
            <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Codename (Optional)</label>
                <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="e.g. The Architect"
                    className="w-full bg-black/40 border border-blue-500/50 rounded-xl px-4 py-4 text-white focus:bg-white/5 outline-none font-bold text-xl text-center placeholder-gray-700"
                    autoFocus
                />
            </div>

            <button
                onClick={handleStart}
                className="w-full px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-transform hover:scale-[1.02] shadow-lg"
            >
                Initialize System
            </button>
            
            <p className="text-[10px] text-gray-600">You can update your profile later.</p>
        </div>
      </div>
    </div>
  );
};
