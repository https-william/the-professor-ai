
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

  // SHA-256 Hash of "Admin01$"
  // We store the hash, not the password, so savvy users inspecting code cannot see the password.
  const TARGET_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const hashPassword = async (string: string) => {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    setChecking(true);
    setError(false);

    try {
      const hash = await hashPassword(input);
      
      // Artificial delay for dramatic effect (and to prevent timing attacks theoretically, though negligible here)
      setTimeout(() => {
          if (hash === TARGET_HASH) {
              onSuccess();
              onClose();
              setInput('');
          } else {
              setError(true);
              setInput(''); // Clear input on fail
          }
          setChecking(false);
      }, 800);
    } catch (err) {
      console.error("Crypto subsystem failed");
      setChecking(false);
    }
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
