"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already made a choice
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay so it doesn't instantly block the screen on first load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-[420px] z-[100]"
        >
          <div className="bg-[var(--background-secondary)]/95 backdrop-blur-xl border border-[var(--border)] p-5 rounded-2xl shadow-2xl flex flex-col gap-4 relative">
            <button 
              onClick={handleReject} 
              className="absolute top-4 right-4 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-bg)] flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">Your Privacy Matters</h3>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  We use cookies to analyze performance and improve your academic experience. We do not sell your personal data. 
                  <Link href="/legal/privacy" className="text-[var(--accent)] hover:underline ml-1">Learn more</Link>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[var(--foreground-secondary)] bg-[var(--background-tertiary)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                Reject All
              </button>
              <button 
                onClick={handleAccept}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[var(--background)] bg-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)] hover:brightness-110 transition-all"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
