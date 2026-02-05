
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, registerWithEmail, loginWithEmail, resendConfirmationEmail, verifyUserOtp } from '../../services/supabase';
import { BrandLogo } from '../BrandLogo';

export const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY'>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStatusText, setAuthStatusText] = useState('CONNECTING...');
    const [showResend, setShowResend] = useState(false);

    useEffect(() => {
        if (!isAuthenticating) return;
        const stages = ['HANDSHAKING...', 'VERIFYING BIOMETRICS...', 'ESTABLISHING LINK...', 'ACCESS GRANTED...'];
        let i = 0;
        const interval = setInterval(() => {
            setAuthStatusText(stages[i % stages.length]);
            i++;
        }, 1000);
        return () => clearInterval(interval);
    }, [isAuthenticating]);

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleAuthError = (err: any) => {
        setIsAuthenticating(false);
        const msg = err.message || "Authentication failed.";
        if (msg.includes("Too many requests")) setError("Neural Overload: Please wait before retrying.");
        else if (msg.includes("User already registered")) { setError("Identity Record Found. Please Access Terminal."); setMode('LOGIN'); }
        else if (msg.includes("Email not confirmed")) { setError("Identity Unverified."); setShowResend(true); }
        else setError(msg);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAuthenticating) return;
        setError(null);
        setSuccessMsg(null);
        setShowResend(false);

        if (mode !== 'VERIFY' && !isValidEmail(email)) { setError("Invalid Neural ID (Email)."); return; }
        if (mode === 'REGISTER' && (!fullName.trim() || password.length < 8)) { setError("Incomplete Protocol: Name required, Password min 8 chars."); return; }
        if (mode === 'VERIFY' && otp.length < 6) { setError("Invalid Access Code."); return; }

        setIsAuthenticating(true);

        try {
            if (mode === 'LOGIN') {
                await loginWithEmail(email, password);
            } else if (mode === 'REGISTER') {
                const result = await registerWithEmail(email, password, fullName);
                if (result && !result.session) {
                    setIsAuthenticating(false);
                    setSuccessMsg(`Verification Signal sent to ${email}.`);
                    setMode('VERIFY');
                    return;
                }
            } else if (mode === 'VERIFY') {
                await verifyUserOtp(email, otp);
                setIsAuthenticating(false);
                await loginWithEmail(email, password);
                return;
            }
        } catch (err: any) {
            handleAuthError(err);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            await resendConfirmationEmail(email);
            setSuccessMsg("Signal Re-transmitted.");
            setShowResend(false);
            setError(null);
        } catch (e: any) {
            handleAuthError(e);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Background Matrix */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-gray-900/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Home Link */}
            <a href="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 group opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-white text-lg">‹</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Return</span>
            </a>

            {/* Main Glass Panel */}
            <div className="w-full max-w-md relative z-10 animate-slide-up-fade">

                <div className="glass-panel-heavy p-8 md:p-12 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">

                    {/* Scanner Line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-[float_4s_ease-in-out_infinite] opacity-30"></div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                            <BrandLogo className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">
                            {mode === 'REGISTER' ? 'New Account' : mode === 'VERIFY' ? 'Verify Identity' : 'Welcome Back'}
                        </h1>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            {mode === 'REGISTER' ? 'Begin Your Academic Journey' : mode === 'VERIFY' ? 'Enter Security Token' : 'Resume Your Session'}
                        </p>
                    </div>

                    {/* Mode Toggles */}
                    {mode !== 'VERIFY' && (
                        <div className="flex mb-8 bg-black/40 rounded p-1 border border-white/5">
                            <button
                                onClick={() => { setMode('LOGIN'); setError(null); }}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${mode === 'LOGIN' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => { setMode('REGISTER'); setError(null); }}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${mode === 'REGISTER' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}
                            >
                                Get Started
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'REGISTER' && (
                            <div className="group">
                                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block group-focus-within:text-white transition-colors">Full Name</label>
                                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder-gray-700 font-sans"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        {mode !== 'VERIFY' ? (
                            <>
                                <div className="group">
                                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block group-focus-within:text-white transition-colors">Email Address</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder-gray-700 font-sans"
                                        placeholder="student@university.edu"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 block group-focus-within:text-white transition-colors">Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white text-sm outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder-gray-700 font-sans"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="group text-center">
                                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4 block">Enter 6-Digit Code</label>
                                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
                                    className="w-full bg-black/50 border border-white/20 rounded px-4 py-4 text-white text-2xl font-mono text-center outline-none focus:bg-white/5 transition-all tracking-[0.5em] placeholder-gray-800"
                                    placeholder="000000"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-900/10 border border-red-500/30 rounded text-red-400 text-[10px] font-mono flex items-start gap-2 animate-pulse">
                                <span className="text-red-500">⚠</span> {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 bg-emerald-900/10 border border-emerald-500/30 rounded text-emerald-400 text-[10px] font-mono flex items-start gap-2">
                                <span>✓</span> {successMsg}
                            </div>
                        )}

                        <button type="submit" disabled={isAuthenticating}
                            className={`w-full py-4 rounded font-bold uppercase text-xs tracking-[0.2em] transition-all relative overflow-hidden group ${isAuthenticating ? 'bg-white/10 text-gray-400 border border-white/10 cursor-wait' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isAuthenticating && <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>}
                                {isAuthenticating ? 'Processing...' : (mode === 'LOGIN' ? 'Log In' : mode === 'REGISTER' ? 'Create Account' : 'Verify Identity')}
                            </span>
                        </button>

                        {(showResend || mode === 'VERIFY') && (
                            <button type="button" onClick={handleResend} className="w-full text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                                Resend Code
                            </button>
                        )}
                    </form>

                    {/* Social Login */}
                    {mode !== 'VERIFY' && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <button onClick={signInWithGoogle} disabled={isAuthenticating} className="w-full py-3 border border-white/10 hover:border-white/30 rounded flex items-center justify-center gap-3 transition-colors group bg-black/20 hover:bg-white/5">
                                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Continue with Google</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
