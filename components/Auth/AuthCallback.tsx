
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState('Initializing Secure Handshake...');

  useEffect(() => {
    const handleAuth = async () => {
        try {
            // 1. Grab the token from the URL hash manually
            const hash = window.location.hash;
            if (!hash || !hash.includes('access_token')) {
                onError("No security token found.");
                return;
            }

            setStatus('Decrypting Token...');
            
            // 2. Parse the parameters
            const params = new URLSearchParams(hash.substring(1)); // remove the '#'
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (!accessToken) {
                onError("Invalid token format.");
                return;
            }

            setStatus('Verifying Identity...');

            // 3. Force Supabase to use this session
            const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
            });

            if (error) throw error;

            if (data.session) {
                setStatus('Access Granted.');
                // 4. Clean the URL so we don't loop
                try {
                    window.history.replaceState(null, '', window.location.pathname);
                } catch(e) {
                    console.warn("Could not clear hash from URL (likely due to sandbox environment).", e);
                }
                
                // 5. Trigger success (App will reload user state)
                setTimeout(() => onSuccess(), 500);
            } else {
                throw new Error("Session creation failed.");
            }

        } catch (err: any) {
            console.error("Auth Callback Error:", err);
            onError(err.message || "Authentication Failed");
        }
    };

    handleAuth();
  }, [onSuccess, onError]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Tech Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 animate-[shimmer_2s_infinite]"></div>

        <div className="z-10 flex flex-col items-center gap-8">
            <div className="relative">
                {/* Spinner */}
                <div className="w-20 h-20 border-4 border-blue-900/30 rounded-full animate-spin"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
                
                {/* Core Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-xl font-display font-bold text-white tracking-wider animate-pulse">
                    {status}
                </h2>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-[0.2em]">
                    Do not close this window
                </p>
            </div>
        </div>
    </div>
  );
};
