"use client";

import { useRouter } from "next/navigation";
import { Key } from "lucide-react";

interface AuthInterceptorProps {
    message?: string;
}

export default function AuthInterceptor({ message = "You need to be logged in to generate and save your AI study materials. Join for free!" }: AuthInterceptorProps) {
    const router = useRouter();
    
    return (
        <div className="mb-8 p-8 mx-auto max-w-md w-full rounded-[2rem] bg-[var(--bg-2)] border border-[var(--border)] text-center shadow-2xl backdrop-blur-3xl relative overflow-hidden">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--blue)] to-[var(--cyan)]" />
            
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center">
                <Key size={30} strokeWidth={1.5} className="text-[var(--blue)]" />
            </div>
            
            <h2 className="text-xl font-black text-[var(--text)] mb-3 tracking-tight">Authentication Required</h2>
            
            <p className="text-[13px] text-[var(--text-2)] mb-8 leading-relaxed px-4">
                {message}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                    onClick={() => router.push('/signup')} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--blue-active)] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[var(--blue-glow)] hover-scale-md active:scale-[0.98] transition-all"
                >
                    Create Free Account
                </button>
                <button 
                    onClick={() => router.push('/login')} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-3)] text-[var(--text)] text-[11px] font-bold tracking-wider hover:bg-[var(--blue-dim)] hover:border-[var(--blue-border)] hover:text-[var(--blue)] transition-all active:scale-[0.98]"
                >
                    Log In
                </button>
            </div>
        </div>
    );
}
