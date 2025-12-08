import React, { useState } from 'react';

interface WelcomeModalProps {
  onComplete: (alias: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [alias, setAlias] = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
        
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none -ml-32 -mb-32"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-serif font-bold text-white mb-3">The Professor</h1>
          <p className="text-gray-400 mb-8 font-light text-sm tracking-wide leading-relaxed">
            Welcome to your new academic advantage. <br/>
            Identify yourself to begin the acceleration.
          </p>

          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-white text-lg focus:border-blue-500 outline-none mb-8 transition-all focus:bg-black/60 placeholder-gray-600"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && alias.trim() && onComplete(alias)}
          />

          <button
            onClick={() => alias.trim() && onComplete(alias)}
            disabled={!alias.trim()}
            className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
              alias.trim() 
                ? 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] shadow-lg' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            Enter System
          </button>
        </div>
      </div>
    </div>
  );
};