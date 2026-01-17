
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState('Initializing Neural Handshake...');

  useEffect(() => {
    const handleAuth = async () => {
        try {
            // 1. PKCE Flow: Check for 'code' in query params
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code');

            if (code) {
                setStatus('Verifying Quantum Signature...');
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) throw error;
                
                if (data.session) {
                    setStatus('Identity Confirmed.');
                    // Clean URL
                    window.history.replaceState(null, '', window.location.pathname);
                    setTimeout(() => onSuccess(), 800);
                    return;
                }
            }

            // 2. Implicit Flow: Check for 'access_token' in hash (Legacy/Recovery)
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                setStatus('Decrypting Token...');
                
                const params = new URLSearchParams(hash.substring(1)); // Remove '#'
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (!accessToken) throw new Error("Invalid token format.");

                setStatus('Establishing Session...');
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || '',
                });

                if (error) throw error;

                if (data.session) {
                    setStatus('Access Granted.');
                    window.history.replaceState(null, '', window.location.pathname);
                    setTimeout(() => onSuccess(), 800);
                    return;
                }
            }

            // 3. Fallback / No Token
            // If we are here, we might have been redirected without a token or user navigated manually
            onError("No authentication token detected in stream.");

        } catch (err: any) {
            console.error("Auth Callback Error:", err);
            onError(err.message || "Authentication Failed");
        }
    };

    handleAuth();
  }, [onSuccess, onError]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-mono">
        {/* Tech Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 animate-[shimmer_2s_linear_infinite]"></div>

        <div className="z-10 flex flex-col items-center gap-8">
            <div className="relative">
                {/* Spinner */}
                <div className="w-24 h-24 border-4 border-blue-900/30 rounded-full animate-spin"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
                
                {/* Core Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
            </div>

            <div className="text-center space-y-3">
                <h2 className="text-xl font-bold text-white tracking-widest uppercase animate-pulse">
                    {status}
                </h2>
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    Secure Link Active
                </div>
            </div>
        </div>
    </div>
  );
};
