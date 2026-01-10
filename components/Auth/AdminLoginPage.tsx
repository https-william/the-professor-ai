
import React, { useState } from 'react';
import { loginWithEmail, logout } from '../../services/supabase';

interface AdminLoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const AUTHORIZED_EMAILS = [
      'vexis.automations@gmail.com',
      'popoolaariseoluwa@gmail.com',
      'professoradmin@gmail.com'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        const { user } = await loginWithEmail(email, password);

        if (user && user.email && AUTHORIZED_EMAILS.includes(user.email.toLowerCase())) {
            onSuccess();
        } else {
            await logout();
            setError("ACCESS DENIED: Credentials valid but unauthorized for this terminal.");
        }
    } catch (err: any) {
        console.error(err);
        setError("Authentication Failed: Invalid credentials or network error.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono text-white">
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-900/50"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-red-900/10 to-transparent"></div>
      </div>

      <div className="w-full max-w-lg z-10">
          <div className="text-center mb-12">
              <h1 className="text-4xl font-serif font-bold tracking-tight text-white mb-2">The Dean's Office</h1>
              <p className="text-xs text-red-500 font-bold uppercase tracking-[0.3em]">Restricted Access Area</p>
          </div>

          <div className="bg-[#0a0a0c] border border-white/10 p-8 md:p-12 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500"></div>

              <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Administrator ID</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black border-b border-white/20 py-3 text-white text-lg focus:border-red-500 outline-none transition-colors placeholder-gray-700" placeholder="Authorized Email" autoComplete="off" />
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Security Clearance</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border-b border-white/20 py-3 text-white text-lg focus:border-red-500 outline-none transition-colors placeholder-gray-700" placeholder="Passcode" />
                  </div>

                  {error && <div className="py-3 px-4 bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-mono">&gt; ERROR: {error}</div>}

                  <button type="submit" disabled={loading || !email || !password} className={`w-full py-5 font-bold uppercase text-xs tracking-[0.2em] transition-all relative overflow-hidden ${loading ? 'bg-red-950/30 text-red-500 border border-red-500/30' : 'bg-white text-black hover:bg-gray-200 disabled:opacity-50'}`}>
                      {loading ? (
                          <>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full animate-[shimmer_1s_infinite]"></div>
                              <span className="relative z-10 flex items-center justify-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>OVERRIDING SECURITY...</span>
                          </>
                      ) : 'Access Terminal'}
                  </button>
              </form>
          </div>
          
          <div className="mt-8 text-center">
              <button onClick={onBack} className="text-gray-600 hover:text-white text-xs uppercase tracking-widest transition-colors">Return to Campus</button>
          </div>
      </div>
    </div>
  );
};
