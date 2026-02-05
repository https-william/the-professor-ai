
import React, { useState, useEffect, useRef } from 'react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simplified Direct Check for Stability
  // (Client-side hashing fails in non-HTTPS environments)
  const TARGET_PASS = "Admin01$";

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    setChecking(true);
    setError(false);

    // Artificial delay for UX
    setTimeout(() => {
        if (input === TARGET_PASS) {
            onSuccess();
            onClose();
            setInput('');
        } else {
            setError(true);
            setInput(''); 
        }
        setChecking(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#050505] border border-red-900/50 rounded-2xl p-8 shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden">
        
        {/* Scanning Line Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50 shadow-[0_0_20px_red] animate-[slideIn_2s_linear_infinite]"></div>

        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-500 text-3xl">
              🔒
           </div>
           <h2 className="text-xl font-mono font-bold text-red-500 tracking-widest uppercase mb-1">Restricted Access</h2>
           <p className="text-[10px] text-gray-500 font-mono uppercase">Dean's Office // Admin Level 5</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="relative">
               <input 
                 ref={inputRef}
                 type="password" 
                 value={input}
                 onChange={(e) => { setInput(e.target.value); setError(false); }}
                 className={`w-full bg-black border rounded-lg px-4 py-3 text-center font-mono tracking-widest text-white outline-none focus:border-red-500 transition-all ${error ? 'border-red-500 animate-shake' : 'border-white/10'}`}
                 placeholder="ENTER PASSCODE"
                 disabled={checking}
                 autoComplete="off"
               />
               {error && (
                   <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-red-500 font-bold uppercase tracking-widest animate-pulse">
                       Access Denied: Invalid Credentials
                   </div>
               )}
           </div>

           <div className="flex gap-3 pt-2">
               <button 
                 type="button" 
                 onClick={onClose} 
                 className="flex-1 py-3 text-gray-500 hover:text-white font-mono text-xs uppercase tracking-widest border border-transparent hover:border-white/10 rounded-lg transition-all"
               >
                   Abort
               </button>
               <button 
                 type="submit" 
                 disabled={checking || !input}
                 className="flex-[2] py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
               >
                   {checking ? 'Decrypting...' : 'Unlock'}
               </button>
           </div>
        </form>
      </div>
    </div>
  );
};
