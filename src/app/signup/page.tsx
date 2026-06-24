"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Mail, Lock, Eye, EyeOff, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  { quote: "Finally got 8 hours of sleep before my exam. My bed actually remembers what I look like now.", author: "Amaka O. · University of Ibadan", },
  { quote: "Turned 40 pages of slides into 15 smart flashcards. Now I have more time to ignore my group chats.", author: "Tunde A. · UNILAG", },
  { quote: "I passed my finals without drinking a single cup of unsweetened coffee. Pure magic.", author: "Bolu W. · Covenant University", },
];

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testiIndex, setTestiIndex] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [pendingUpload, setPendingUpload] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPendingUpload(localStorage.getItem("pending_upload_name"));
    }
  }, []);

  // Auto-cycle testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestiIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleSignup = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      await fetch('/api/auth/signout', { method: 'POST' });
    }
    const redirectBase = `${window.location.origin}/auth/callback`;
    const redirectUrl = `${redirectBase}${redirectBase.includes("?") ? "&" : "?"}next=${encodeURIComponent(nextUrl)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("A bit too short! Let's make that password at least 6 characters so it's nice and secure."); return; }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      await fetch('/api/auth/signout', { method: 'POST' });
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
    });

    const isExistingConfirmed = !signUpError && signUpData?.user?.identities?.length === 0;

    if (signUpError || isExistingConfirmed) {
      const msg = signUpError?.message ?? '';
      const isExisting =
        isExistingConfirmed ||
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('already in use') ||
        (signUpError as any)?.code === 'user_exists';
      if (isExisting) {
        setError(
          <span>
            Looks like you're already in our books! Try{" "}
            <Link 
              href={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="underline text-amber-500 hover:text-amber-400 font-bold"
            >
              signing in
            </Link>{" "}
            or resetting your password via{" "}
            <Link 
              href="/forgot-password"
              className="underline text-amber-500 hover:text-amber-400 font-bold"
            >
              Forgot Password
            </Link>?
          </span>
        );
      } else if (msg.toLowerCase().includes("rate limit")) {
        setError("Whoa, slow down a bit! You've tried signing up too many times recently. Take a breath and try again in a minute.");
      } else {
        setError(msg);
      }
      setLoading(false);
    }
    else {
      router.push(`/verify-email?email=${encodeURIComponent(email)}${nextUrl && nextUrl !== "/dashboard" ? `&next=${encodeURIComponent(nextUrl)}` : ""}`);
      router.refresh();
    }
  };

  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 9) return 2;
    return 3;
  };
  const strength = getStrength();
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "#E85D75", "#E5A93C", "#2BB288"][strength];

  return (
    <div className="min-h-screen w-full flex bg-zinc-950 relative overflow-hidden font-sans">
      {/* Cinematic Background Blur */}
      <div className="absolute inset-0 bg-[#06060B]/95 backdrop-blur-[100px] pointer-events-none z-0" />
      
      {/* Ambient background glows */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen opacity-15 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(229,169,60,0.15) 0%, rgba(150,115,245,0.08) 50%, transparent 70%)", filter: "blur(120px)", top: "10%", left: "30%" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Left Panel — Desktop only */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-between p-12 lg:p-16 border-r border-white/5 bg-white/[0.01] backdrop-blur-xl relative z-10 min-h-screen">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-decoration-none group">
          <BrandLogo size="xs" />
          <span className="font-sans text-xs font-black uppercase tracking-[0.25em] text-white/50 group-hover:text-white transition-colors">
            The Professor
          </span>
        </Link>

        {/* Branding text & Testimonial Carousel */}
        <div className="flex flex-col gap-8 my-auto max-w-[400px]">
          <h2 className="text-3xl font-black text-white leading-tight uppercase italic tracking-tight">
            The last study tool you'll ever need before an exam.
          </h2>

          <GlassmorphicCard intensity="medium" radius="20px" className="p-6 relative overflow-hidden">
            <div className="flex gap-1 mb-4 text-amber-500">
              {[...Array(5)].map((_, j) => (
                <Star key={j} size={12} fill="currentColor" />
              ))}
            </div>
            <div className="h-[96px] relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testiIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-between h-full"
                >
                  <p className="text-white/80 font-medium text-sm leading-relaxed italic">
                    &ldquo;{TESTIMONIALS[testiIndex].quote}&rdquo;
                  </p>
                  <p className="text-white/40 font-bold text-[10px] uppercase tracking-wider mt-3">
                    {TESTIMONIALS[testiIndex].author}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </GlassmorphicCard>
        </div>

        {/* Feature pills */}
        <div className="flex gap-2">
          {["Study Guides", "Quizzes", "Match Games"].map(f => (
            <span key={f} className="text-[10px] font-black uppercase tracking-wider text-white/40 px-3.5 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative z-10 min-h-screen">
        <GlassmorphicCard 
          intensity="heavy"
          radius="2rem"
          className="w-full max-w-[420px] p-8 sm:p-10 shadow-2xl"
        >
          <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
            {pendingUpload ? "Save study pack" : "Create Account"}
          </h1>
          <p className="text-white/40 text-xs font-semibold tracking-wider uppercase mt-1 mb-6">
            {pendingUpload ? "Create an account to keep your progress" : "Takes 30 seconds · No credit card required"}
          </p>

          {/* Pending upload banner */}
          {pendingUpload && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-6 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1 flex items-center gap-1.5">
                <Sparkles size={12} />
                Progress Saved
              </p>
              <p className="text-white/85 text-xs font-bold leading-relaxed">
                Analysis of &ldquo;{pendingUpload}&rdquo; is ready.
              </p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl py-3.5 flex items-center justify-center gap-3 transition-all duration-150 active:scale-98 font-bold text-sm text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="font-bold text-[10px] tracking-widest text-white/20 uppercase">or</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-2xl mb-5 bg-rose-500/5 border border-rose-500/20 text-rose-300 text-xs text-left font-bold shadow-[0_4px_12px_rgba(232,93,117,0.03)] leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-email" className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  id="s-email" 
                  type="email" 
                  placeholder="you@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  autoComplete="email"
                  className="w-full pl-11 pr-5 py-3.5 font-bold text-white outline-none placeholder:text-white/20 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-amber-500/50 focus:bg-white/[0.05] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(229,169,60,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="s-pass" className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  id="s-pass" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="At least 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  autoComplete="new-password"
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
              {/* Strength bars */}
              {password.length > 0 && (
                <div className="flex gap-2 mt-2 items-center">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => {
                      const active = i <= strength;
                      const colorClass = strength === 1 ? "bg-rose-500" : strength === 2 ? "bg-amber-500" : "bg-emerald-500";
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1 rounded-full flex-1 transition-all duration-300", 
                            active ? colorClass : "bg-white/10"
                          )} 
                        />
                      );
                    })}
                  </div>
                  <span 
                    className="text-[10px] font-black uppercase tracking-wider pl-1 font-mono" 
                    style={{ color: strengthColor }}
                  >
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 border border-amber-500/30 hover:shadow-[0_8px_30px_rgba(229,169,60,0.3)] shadow-[0_4px_15px_rgba(229,169,60,0.15)] rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-98 hover:scale-[1.01] duration-300 mt-4"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RotateCw size={18} className="animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : "Create free account"}
            </button>
          </form>

          {/* Legal text */}
          <p className="text-[10px] text-white/30 text-center mt-6 leading-relaxed font-semibold">
            By signing up, you agree to our{" "}
            <Link href="/legal/terms" className="text-amber-500/80 hover:text-amber-400 underline">Terms of Use</Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-amber-500/80 hover:text-amber-400 underline">Privacy Policy</Link>.
          </p>

          {/* Sign in link */}
          <p className="text-xs text-white/50 font-medium text-center mt-6">
            Already have an account?{" "}
            <Link 
              href={`/login${nextUrl && nextUrl !== "/dashboard" ? `?next=${encodeURIComponent(nextUrl)}` : ""}`} 
              className="text-amber-500 font-bold hover:underline transition-all"
            >
              Sign in
            </Link>
          </p>
        </GlassmorphicCard>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
