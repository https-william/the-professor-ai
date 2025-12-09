
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, registerWithEmail, loginWithEmail, isConfigured } from '../../services/firebase';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Credentials required.");
      return;
    }
    
    if (!isConfigured()) {
       setError("System configuration missing. Check API keys.");
       return;
    }

    setIsLoading(true);
    setError(null);
    setDomainError(null);

    try {
      if (mode === 'LOGIN') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      handleAuthError(err);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured()) {
       setError("System configuration missing.");
       return;
    }

    setIsLoading(true);
    setError(null);
    setDomainError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      handleAuthError(err);
      setIsLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    const code = err.code || '';
    const msg = err.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      if (mode === 'LOGIN') {
        setError("Invalid credentials. If you are new, please switch to 'Enroll'.");
      } else {
        setError("Invalid credentials.");
      }
    } else if (code === 'auth/email-already-in-use') {
      setError("This email is already enrolled. Please switch to 'Log In'.");
    } else if (code === 'auth/weak-password') {
      setError("Password is too weak. It must be at least 6 characters.");
    } else if (code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      setError("Access Denied: Domain Unauthorized.");
      setDomainError(currentDomain);
    } else if (code === 'auth/popup-closed-by-user') {
      setError("Sign-in cancelled.");
    } else if (msg.includes('api-key-not-valid')) {
      setError("API Key Invalid. Please check your .env file or Firebase Console.");
    } else {
      setError(`Authentication failed (${code}). Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#111115_0%,_#000000_100%)]"></div>
      <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
      
      {/* Subtle Floating Orbs */}
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] transition-all duration-[3s] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] transition-all duration-[3s] delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}></div>

      {/* Main Content */}
      <div className={`relative z-10 w-full max-w-[380px] transition-all duration-1000 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-block relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
             <div className="relative w-16 h-16 bg-black border border-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
               <span className="text-3xl filter grayscale contrast-125">🎓</span>
             </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight mb-2">The Professor</h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-medium">Academic Intelligence System</p>
        </div>

        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
          
          {/* Top Highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>

          {/* Mode Tabs */}
          <div className="flex border-b border-white/5 mb-8">
            <button 
              onClick={() => { setMode('LOGIN'); setError(null); setDomainError(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all relative ${mode === 'LOGIN' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
              Log In
              {mode === 'LOGIN' && <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white shadow-[0_0_10px_white]"></div>}
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(null); setDomainError(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest transition-all relative ${mode === 'REGISTER' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
              Enroll
              {mode === 'REGISTER' && <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white shadow-[0_0_10px_white]"></div>}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
               <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-blue-400 transition-colors">Email Address</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all placeholder-gray-700"
                 placeholder="scholar@university.edu"
               />
            </div>

            <div className="group">
               <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-blue-400 transition-colors">Password</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all placeholder-gray-700"
                 placeholder="••••••••"
               />
            </div>

            {error && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex flex-col gap-2 animate-fade-in break-words">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-red-300 leading-relaxed max-w-full">{error}</p>
                </div>
                
                {domainError && (
                  <div className="mt-2 bg-black/40 p-2 rounded border border-white/10">
                    <p className="text-[10px] text-gray-500 mb-1">Add this to Firebase Authorized Domains:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-blue-300 font-mono break-all">{domainError}</code>
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(domainError)}
                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white text-black h-12 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                   {mode === 'LOGIN' ? 'Access System' : 'Create Record'} 
                   <span className="text-lg leading-none">→</span>
                </>
              )}
            </button>
          </form>

          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0b0b0d] px-2 text-gray-600 font-medium">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 h-11 rounded-lg font-medium text-xs flex items-center justify-center gap-3 transition-colors group"
          >
             <svg className="w-4 h-4 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
             </svg>
             Google Account
          </button>

        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 opacity-40">
           <p className="text-[10px] text-gray-500">Secure Connection • End-to-End Encrypted</p>
        </div>

      </div>
    </div>
  );
};
