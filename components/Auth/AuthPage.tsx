
import React, { useState } from 'react';
import { signInWithGoogle, registerWithEmail, loginWithEmail, isConfigured } from '../../services/firebase';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured()) return setError("System config missing.");
    try {
      if (mode === 'LOGIN') await loginWithEmail(email, password);
      else await registerWithEmail(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Back Button */}
      <a 
        href="/" 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <span className="text-gray-400 group-hover:text-white transition-colors">←</span>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Home Page</span>
      </a>

      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-slide-up-fade">
         <div className="text-center mb-8 flex flex-col items-center">
            {/* Custom Academic SVG */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
               <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="3" r="1" fill="currentColor"/>
               </svg>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white">The Professor</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Academic Access Portal</p>
         </div>

         <div className="flex border-b border-white/10 mb-6 relative">
            <button onClick={() => setMode('LOGIN')} className={`flex-1 pb-3 text-xs font-bold uppercase transition-colors ${mode === 'LOGIN' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>Log In</button>
            <button onClick={() => setMode('REGISTER')} className={`flex-1 pb-3 text-xs font-bold uppercase transition-colors ${mode === 'REGISTER' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>Enroll</button>
            
            {/* Sliding Underline */}
            <div className={`absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 w-1/2 ${mode === 'LOGIN' ? 'left-0' : 'left-1/2'}`}></div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="University Email" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:bg-white/5 transition-all placeholder-gray-600" 
              />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Passcode" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:bg-white/5 transition-all placeholder-gray-600" 
              />
            </div>
            {error && <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-xs">{error}</div>}
            
            <button 
              type="submit" 
              className="w-full bg-white text-black font-bold uppercase text-xs py-4 rounded-xl hover:bg-gray-200 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {mode === 'LOGIN' ? 'Authenticate' : 'Initialize Record'}
            </button>
         </form>

         <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Or Connect With</span>
            <div className="h-px bg-white/10 flex-1"></div>
         </div>

         <button 
           onClick={signInWithGoogle} 
           className="w-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all group hover:border-white/20"
         >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </div>
            <span>Continue with Google</span>
         </button>
      </div>
    </div>
  );
};
