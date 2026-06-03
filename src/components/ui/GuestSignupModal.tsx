"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, BookOpen, Zap, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import Turnstile from "@/components/ui/Turnstile";

interface GuestSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  packTitle?: string;
}

export default function GuestSignupModal({ isOpen, onClose, packTitle }: GuestSignupModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const getReturnUrl = () => {
    if (typeof window !== "undefined") {
      return encodeURIComponent(window.location.pathname + window.location.search);
    }
    return "";
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${getReturnUrl()}` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("A bit too short! Let's make that password at least 6 characters so it's nice and secure."); return; }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      await fetch('/api/auth/signout', { method: 'POST' });
    }

    const { error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        captchaToken: captchaToken || undefined,
      }
    });
    if (signUpError) {
      const msg = signUpError.message;
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("already in use")) {
        setError(
          <span>
            Looks like you're already in our books! Try{" "}
            <button 
              type="button" 
              onClick={() => {
                onClose();
                router.push(`/login?next=${getReturnUrl()}`);
              }}
              className="underline text-[var(--blue)] font-bold bg-transparent border-none p-0 inline cursor-pointer"
            >
              signing in
            </button>{" "}
            or resetting your password via{" "}
            <Link 
              href="/forgot-password" 
              onClick={onClose}
              className="underline text-[var(--blue)] font-bold"
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
      onClose();
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      router.refresh();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] shadow-2xl my-auto"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--blue)]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[var(--emerald)]/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-xl hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <X size={18} />
              </button>

              {/* Logo */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--blue)]/10 border border-[var(--blue)]/20 shadow-lg">
                  <BrandLogo size="xs" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight leading-tight mb-1">
                  {packTitle ? (
                    <>Like <span className="text-[var(--blue)]">this</span> study pack?</>
                  ) : (
                    <>Ready to build your <span className="text-[var(--blue)]">own</span>?</>
                  )}
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] font-medium leading-relaxed px-4">
                  {packTitle
                    ? `Create a free account to save "${packTitle}" and build your own study packs, quizzes, and flashcards.`
                    : "Create a free account to build your own study packs, quizzes, and flashcards. It takes 30 seconds."
                  }
                </p>
              </div>

              {/* Google signup */}
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-xs flex items-center justify-center gap-3 hover:bg-[var(--border)] transition-all active:scale-[0.98] mb-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[10px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold mb-3 leading-normal">
                  {error}
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleEmailSignup} className="space-y-2.5">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 outline-none focus:border-[var(--blue)]/40 transition-all font-medium"
                />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 outline-none focus:border-[var(--blue)]/40 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest hover-scale-md active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create free account"}
                </button>
                <Turnstile onVerify={setCaptchaToken} />
              </form>

              {/* Login link */}
              <p className="text-center mt-4 text-xs text-[var(--foreground-muted)] font-medium">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/login?next=${getReturnUrl()}`);
                  }}
                  className="text-[var(--blue)] font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>

              {/* Legal */}
              <p className="text-center mt-3 text-[9px] text-[var(--foreground-muted)]/40 font-medium leading-relaxed">
                By signing up, you agree to our{" "}
                <Link href="/legal/terms" onClick={onClose} className="text-[var(--blue)] hover:underline">Terms of Use</Link>{" "}
                and{" "}
                <Link href="/legal/privacy" onClick={onClose} className="text-[var(--blue)] hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
