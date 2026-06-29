"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { motion } from "framer-motion";
import { RotateCw, Lock, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("A bit too short! Let's make that password at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match. Double check your typing!");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[var(--background)] font-sans">
      {/* Cinematic Background Blur */}
      <div className="absolute inset-0 bg-[var(--background)]/90 backdrop-blur-[100px] pointer-events-none z-0" />
      
      {/* Ambient background glows */}
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full mix-blend-screen opacity-20 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, var(--blue-dim) 0%, var(--blue-glow) 50%, transparent 70%)", filter: "blur(120px)", top: "15%", left: "10%" }}
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
            Set new password
          </h1>
          <p className="text-white/40 text-xs font-semibold tracking-wider uppercase mt-1">
            Choose a strong password to secure your account
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl mb-5 bg-rose-500/5 border border-rose-500/20 text-rose-300 text-xs text-left font-bold shadow-[0_4px_12px_rgba(232,93,117,0.03)] leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm font-semibold leading-relaxed">
            Password updated successfully! Redirecting you to login...
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3.5 font-bold text-white outline-none placeholder:text-white/20 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-amber-500/50 focus:bg-white/[0.05] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(229,169,60,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3.5 font-bold text-white outline-none placeholder:text-white/20 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-amber-500/50 focus:bg-white/[0.05] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(229,169,60,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                  <span>Updating password...</span>
                </div>
              ) : "Reset password"}
            </button>
          </form>
        )}
      </GlassmorphicCard>
    </div>
  );
}
