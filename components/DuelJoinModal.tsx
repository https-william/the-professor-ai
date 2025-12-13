
import React, { useState } from 'react';

interface DuelJoinModalProps {
  onClose: () => void;
  onJoin: (code: string) => void;
}

export const DuelJoinModal: React.FC<DuelJoinModalProps> = ({ onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!code.trim()) return;
      setIsLoading(true);
      onJoin(code.trim());
      // The parent handles closing after logic
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative w-full max-w-md bg-[#0f0f10] border border-purple-500/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50"></div>
            
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-900/20 rounded-2xl border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                    ⚔️
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tight">ENTER THE PIT</h2>
                <p className="text-purple-400 text-xs mt-2 font-mono uppercase tracking-widest">Input Access Code</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="E.G. NEON-TIGER"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-white font-mono text-xl tracking-widest uppercase outline-none focus:border-purple-500 transition-colors placeholder-gray-700"
                    autoFocus
                />
                
                <div className="flex gap-4">
                    <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 py-3 text-gray-500 hover:text-white font-bold uppercase text-xs">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={!code || isLoading}
                        className="flex-[2] py-3 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'Join Arena'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}
