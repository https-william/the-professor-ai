"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { Suspense } from "react";
import { motion } from "framer-motion";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your inbox";

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
        className="relative z-10 w-full max-w-[460px] p-8 sm:p-10 shadow-2xl text-center flex flex-col items-center"
      >
        {/* Logo */}
        <div className="inline-flex items-center justify-center mb-6">
          <BrandLogo size="md" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight uppercase italic mb-4">
          Check your inbox! ✉️
        </h1>

        <p className="text-white/60 font-medium text-sm leading-relaxed mb-8">
          We just sent a magic confirmation link to <strong className="text-white">{email}</strong>. 
          Click the link in that email so we can verify it's really you, and we'll get you started on the good stuff.
        </p>

        <div className="w-full flex flex-col gap-4">
          <Link 
            href="/login" 
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 border border-amber-500/30 hover:shadow-[0_8px_30px_rgba(229,169,60,0.3)] shadow-[0_4px_15px_rgba(229,169,60,0.15)] rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center transition-all active:scale-98 hover:scale-[1.01] duration-300"
          >
            Got it, go to login
          </Link>
          
          <Link 
            href="/signup" 
            className="text-xs font-black uppercase tracking-wider text-white/40 hover:text-white transition-colors py-2"
          >
            Entered the wrong email? Sign up again
          </Link>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
