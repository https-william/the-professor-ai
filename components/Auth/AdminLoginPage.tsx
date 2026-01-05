
import React, { useState } from 'react';
import { loginWithEmail, logout } from '../../services/firebase';

interface AdminLoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hardcoded Security Check
  // Even if someone reads this, they still need the Firebase Password for this specific email.
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
        // 1. Authenticate with Firebase
        const userCredential = await loginWithEmail(email, password);
        const user = userCredential.user;

        // 2. Authorization Check
        if (user.email && AUTHORIZED_EMAILS.includes(user.email.toLowerCase())) {
            onSuccess();
        } else {
            // Trap: Log them out immediately if they aren't on the list
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      
      {/* Red Alert Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
      </div>

      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 text-gray-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 transition-colors z-50"
      >
        <span>←</span> Return to Campus
      </button>

      <div className="w-full max-w-md relative z-10">
          <div className="bg-[#050505] border border-red-900/30 p-10 rounded-none shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden">
              
              {/* Decorative Tech Lines */}
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600"></div>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600"></div>

              <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/50 text-red-500 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                  <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em]">Restricted</h1>
                  <p className="text-red-500 text-xs mt-2 uppercase tracking-widest">Dean's Office // Admin Level 5</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Administrator ID</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-gray-800 text-white p-4 text-sm focus:border-red-600 focus:bg-red-950/10 outline-none transition-all font-mono"
                        placeholder="admin@vexis.automations"
                        autoComplete="off"
                      />
                  </div>
                  
                  <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Passcode</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-gray-800 text-white p-4 text-sm focus:border-red-600 focus:bg-red-950/10 outline-none transition-all font-mono"
                        placeholder="••••••••••••"
                      />
                  </div>

                  {error && (
                      <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-xs text-center font-bold animate-bounce-subtle">
                          {error}
                      </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? 'Verifying Clearance...' : 'Authenticate'}
                  </button>
              </form>
              
              <div className="mt-8 text-center">
                  <p className="text-[9px] text-gray-700 uppercase tracking-widest">
                      Unauthorized access attempts are logged and reported to Vexis Security.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};
