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
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      await fetch('/api/auth/signout', { method: 'POST' });
    }

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        captchaToken: captchaToken || undefined,
      }
    });
    if (error) { setError(error.message); setLoading(false); }
    else {
      router.push("/onboarding");
      router.refresh();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-[40px] shadow-2xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--blue)]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[var(--emerald)]/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 p-8">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <X size={18} />
              </button>

              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--blue)]/10 border border-[var(--blue)]/20 shadow-lg">
                  <BrandLogo size="sm" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-tight mb-2">
                  {packTitle ? (
                    <>Like <span className="text-[var(--blue)]">this</span> study pack?</>
                  ) : (
                    <>Ready to build your <span className="text-[var(--blue)]">own</span>?</>
                  )}
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] font-medium leading-relaxed">
                  {packTitle
                    ? `Create a free account to save "${packTitle}" and build your own study packs, quizzes, and flashcards.`
                    : "Create a free account to build your own study packs, quizzes, and flashcards. It takes 30 seconds."
                  }
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex justify-center gap-2 mb-8">
                {[
                  { icon: BookOpen, label: "Study Packs" },
                  { icon: Zap, label: "Quizzes" },
                  { icon: GraduationCap, label: "Flashcards" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider"
                  >
                    <f.icon size={12} />
                    {f.label}
                  </div>
                ))}
              </div>

              {/* Google signup */}
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] font-bold text-sm flex items-center justify-center gap-3 hover:bg-[var(--border)] transition-all active:scale-[0.98] mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[11px] text-[var(--foreground-muted)] font-bold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-[var(--crimson)]/10 border border-[var(--crimson)]/20 text-[var(--crimson)] text-xs font-bold mb-4">
                  {error}
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleEmailSignup} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 outline-none focus:border-[var(--blue)]/40 transition-all font-medium"
                />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/40 outline-none focus:border-[var(--blue)]/40 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest hover-scale-md active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create free account"}
                </button>
                <Turnstile onVerify={setCaptchaToken} />
              </form>

              {/* Login link */}
              <p className="text-center mt-6 text-xs text-[var(--foreground-muted)] font-medium">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    onClose();
                    router.push("/login");
                  }}
                  className="text-[var(--blue)] font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>

              {/* Legal */}
              <p className="text-center mt-4 text-[10px] text-[var(--foreground-muted)]/50 font-medium leading-relaxed">
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
