
import React, { useState, useEffect, useRef } from 'react';

interface AdminVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminVerifyModal: React.FC<AdminVerifyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'DENIED' | 'GRANTED'>('IDLE');
  const inputRef = useRef<HTMLInputElement>(null);

  // HYDRA SECURITY PROTOCOL
  // Password is now stored securely in Vercel environment variables
  // VITE_ADMIN_SECRET should contain the base64-encoded password
  const getSecureKey = (): string => {
    // @ts-ignore
    return import.meta.env.VITE_ADMIN_SECRET || '';
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const verifyHydraHash = (key: string) => {
    try {
      const encodedInput = btoa(key);
      const secureKey = getSecureKey();

      if (!secureKey) {
        console.error('VITE_ADMIN_SECRET not configured');
        return false;
      }

      return encodedInput === secureKey;
    } catch (e) {
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    setStatus('CHECKING');

    // Artificial delay to simulate heavy encryption processing
    setTimeout(() => {
      if (verifyHydraHash(input)) {
        setStatus('GRANTED');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setStatus('DENIED');
        setTimeout(() => {
          setInput('');
          setStatus('IDLE');
        }, 1500);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className={`relative w-full max-w-sm bg-[#050505] border rounded-2xl p-8 shadow-2xl overflow-hidden transition-all duration-500 ${status === 'DENIED' ? 'border-red-600 shadow-[0_0_50px_red]' : status === 'GRANTED' ? 'border-green-500 shadow-[0_0_50px_lime]' : 'border-white/10'}`}>

        {/* Visual Noise Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div className="text-center mb-8 relative z-10">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${status === 'DENIED' ? 'bg-red-900/20 border-red-500 text-red-500' : status === 'GRANTED' ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-white'}`}>
            {status === 'CHECKING' ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : status === 'DENIED' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            ) : status === 'GRANTED' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            )}
          </div>
          <h2 className="text-xl font-mono font-bold tracking-widest uppercase mb-1 text-white">
            {status === 'DENIED' ? 'ACCESS DENIED' : status === 'GRANTED' ? 'ACCESS GRANTED' : 'HYDRA SECURITY'}
          </h2>
          <p className="text-[10px] text-gray-500 font-mono uppercase">Level 5 Clearance Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center font-mono tracking-[0.5em] text-white outline-none focus:border-blue-500 transition-all placeholder-gray-800"
              placeholder="••••••••"
              disabled={status !== 'IDLE'}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 hover:text-white font-mono text-xs uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status !== 'IDLE' || !input}
              className="flex-[2] py-3 bg-white text-black rounded-xl font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Authenticate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
