
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { signInUser, signUpUser, sendPasswordReset, signInWithGoogle } from '../../services/supabase';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RECOVERY'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alias, setAlias] = useState(''); 
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Loading State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatusText, setAuthStatusText] = useState('CONNECTING...');

  const location = useLocation();

  useEffect(() => {
      // Check for errors returned in the URL (e.g. from OAuth redirects)
      const params = new URLSearchParams(location.hash.substring(1)); // Supabase uses hash fragments often
      const errorDescription = params.get('error_description');
      const errorMsg = params.get('error');

      if (errorDescription) {
          setError(decodeURIComponent(errorDescription).replace(/\+/g, ' '));
      } else if (errorMsg) {
          setError("Authentication Error: " + errorMsg);
      }
  }, [location]);

  useEffect(() => {
      if (!isAuthenticating) return;
      const stages = ['ENCRYPTING...', 'VERIFYING...', 'HANDSHAKING...', 'ACCESSING...'];
      let i = 0;
      const interval = setInterval(() => {
          setAuthStatusText(stages[i % stages.length]);
          i++;
      }, 600);
      return () => clearInterval(interval);
  }, [isAuthenticating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;
    setError(null);
    setSuccessMsg(null);
    
    setIsAuthenticating(true);

    try {
      if (mode === 'LOGIN') {
          await signInUser(email, password);
      } else if (mode === 'REGISTER') {
          if (!alias.trim()) throw new Error("Codename required.");
          await signUpUser(email, password, alias);
      } else if (mode === 'RECOVERY') {
          if (!email) throw new Error("Email required.");
          await sendPasswordReset(email);
          setSuccessMsg("Recovery link sent. Check your inbox.");
          setIsAuthenticating(false);
          return;
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setError(err.message || "Authentication Failed");
    }
  };

  const handleGoogleLogin = async () => {
      try {
          await signInWithGoogle();
      } catch (error: any) {
          setError(error.message);
      }
  };

  return (
    <div className="min-h-screen bg-core flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-900/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md bg-panel border border-border-main rounded-3xl p-8 shadow-2xl relative z-10 animate-slide-up-fade">
         <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
               <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 2v4" strokeLinecap="round"/><circle cx="12" cy="3" r="1" fill="currentColor"/></svg>
            </div>
            <h1 className="text-2xl font-serif font-bold text-text-pri">The Professor</h1>
            <p className="text-xs text-text-sec uppercase tracking-widest mt-2">Supabase Secure Node</p>
         </div>

         <div className="flex border-b border-border-main mb-6 relative">
            <button onClick={() => setMode('LOGIN')} className={`flex-1 pb-3 text-xs font-bold uppercase transition-colors ${mode === 'LOGIN' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>Log In</button>
            <button onClick={() => setMode('REGISTER')} className={`flex-1 pb-3 text-xs font-bold uppercase transition-colors ${mode === 'REGISTER' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>Enroll</button>
            <div className={`absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 w-1/2 ${mode === 'LOGIN' ? 'left-0' : mode === 'REGISTER' ? 'left-1/2' : 'hidden'}`}></div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {mode === 'RECOVERY' && (
                  <div className="text-center text-sm text-gray-400 mb-4 bg-blue-900/10 p-3 rounded-lg border border-blue-500/20">
                      Enter your email. We will send a secure link to reset your access codes.
                  </div>
              )}

              {mode === 'REGISTER' && (
                  <input 
                    type="text" 
                    value={alias} 
                    onChange={e => setAlias(e.target.value)} 
                    placeholder="Codename / Alias" 
                    className="w-full bg-black/40 border border-border-main rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:bg-white/5 transition-all" 
                  />
              )}
              
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Email Address" 
                className="w-full bg-black/40 border border-border-main rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:bg-white/5 transition-all" 
              />
              
              {mode !== 'RECOVERY' && (
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Passcode" 
                    className="w-full bg-black/40 border border-border-main rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:bg-white/5 transition-all" 
                  />
              )}
            </div>

            {mode === 'LOGIN' && (
                <div className="flex justify-end">
                    <button type="button" onClick={() => setMode('RECOVERY')} className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest font-bold">
                        Forgot Password?
                    </button>
                </div>
            )}

            {mode === 'RECOVERY' && (
                <div className="flex justify-end">
                    <button type="button" onClick={() => setMode('LOGIN')} className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-bold">
                        Back to Login
                    </button>
                </div>
            )}

            {error && <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-xs text-center break-words">{error}</div>}
            {successMsg && <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg text-green-400 text-xs text-center">{successMsg}</div>}
            
            <button 
              type="submit" 
              disabled={isAuthenticating}
              className={`w-full py-4 rounded-xl font-bold uppercase text-xs transition-all relative overflow-hidden ${
                  isAuthenticating 
                  ? 'bg-gray-900 text-blue-400 border border-blue-500/30 cursor-wait' 
                  : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              }`}
            >
              {isAuthenticating ? authStatusText : (mode === 'LOGIN' ? 'Authenticate' : mode === 'REGISTER' ? 'Initialize Record' : 'Send Recovery Link')}
            </button>

            {mode === 'LOGIN' && (
                <>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-[#0a0a0c] px-3 text-gray-500">Or Access With</span></div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-[#18181b] border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#252529] transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        <span className="text-xs uppercase tracking-wider">Google</span>
                    </button>
                </>
            )}
         </form>
      </div>
    </div>
  );
};
