"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { motion } from "framer-motion";
import { RotateCw, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      if (resetError.message.includes("rate limit")) {
        setError("Whoa, slow down a bit! We've sent a link recently. Check your spam folder or try again in a few minutes.");
      } else {
        setError(resetError.message);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-zinc-950 font-sans">
      {/* Cinematic Background Blur */}
      <div className="absolute inset-0 bg-[#06060B]/90 backdrop-blur-[100px] pointer-events-none z-0" />
      
      {/* Ambient background glows */}
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full mix-blend-screen opacity-20 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(229,169,60,0.15) 0%, rgba(150,115,245,0.08) 50%, transparent 70%)", filter: "blur(120px)", top: "15%", left: "10%" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <GlassmorphicCard 
        intensity="heavy"
        radius="2rem"
        className="relative z-10 w-full max-w-[420px] p-8 sm:p-10 shadow-2xl text-center"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
            Forgot password?
          </h1>
          <p className="text-white/40 text-xs font-semibold tracking-wider uppercase mt-1">
            No worries, we'll help you get back in
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl mb-5 bg-rose-500/5 border border-rose-500/20 text-rose-300 text-xs text-left font-bold shadow-[0_4px_12px_rgba(232,93,117,0.03)] leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm font-semibold leading-relaxed">
              Link sent! Check your inbox for reset instructions.
            </div>
            <Link 
              href="/login" 
              className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center font-bold text-sm text-white transition-all active:scale-98"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-email" className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="reset-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-5 py-3.5 font-bold text-white outline-none placeholder:text-white/20 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-amber-500/50 focus:bg-white/[0.05] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(229,169,60,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 border border-amber-500/30 hover:shadow-[0_8px_30px_rgba(229,169,60,0.3)] shadow-[0_4px_15px_rgba(229,169,60,0.15)] rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-98 hover:scale-[1.01] duration-300 mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RotateCw size={18} className="animate-spin" />
                  <span>Sending link...</span>
                </div>
              ) : "Send reset link"}
            </button>

            <p className="text-xs text-white/50 font-medium text-center mt-6">
              Remembered your password?{" "}
              <Link href="/login" className="text-amber-500 font-bold hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </GlassmorphicCard>
    </div>
  );
}
