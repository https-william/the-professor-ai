"use client";

import { useRouter } from "next/navigation";
import { Key } from "lucide-react";

interface AuthInterceptorProps {
    message?: string;
}

export default function AuthInterceptor({ message = "You need to be logged in to generate and save your AI study materials. Join for free!" }: AuthInterceptorProps) {
    const router = useRouter();
    
    return (
        <div className="mb-8 p-8 mx-auto max-w-md w-full rounded-[2rem] bg-[var(--background-secondary)] border border-[var(--border)] text-center shadow-2xl backdrop-blur-3xl relative overflow-hidden">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706]" />
            
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                <Key size={30} strokeWidth={1.5} className="text-[#F59E0B]" />
            </div>
            
            <h2 className="text-xl font-black text-[var(--foreground)] mb-3 tracking-tight">Authentication Required</h2>
            
            <p className="text-[13px] text-[var(--foreground-muted)] mb-8 leading-relaxed px-4">
                {message}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                    onClick={() => router.push('/signup')} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#08080E] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#F59E0B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Create Free Account
                </button>
                <button 
                    onClick={() => router.push('/login')} 
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] text-[var(--foreground)] text-[11px] font-bold tracking-wider hover:bg-[var(--accent-bg)] hover:border-[#F59E0B]/30 hover:text-[#F59E0B] transition-all active:scale-[0.98]"
                >
                    Log In
                </button>
            </div>
        </div>
    );
}
