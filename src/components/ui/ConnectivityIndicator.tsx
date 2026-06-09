"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * ═══ ConnectivityIndicator ═══
 * A non-intrusive pill that signals network status changes.
 * Intentionally has NO action buttons — it's purely informational.
 * Hides itself when on /library/offline (that page already communicates offline state).
 */
export default function ConnectivityIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [isMobileViewport, setIsMobileViewport] = useState(true);

  useEffect(() => {
    const checkViewport = () => setIsMobileViewport(window.innerWidth < 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Don't show anything when already on the offline vault page
  // — the page itself communicates offline state clearly
  const isOnOfflinePage = pathname === "/library/offline";

  return (
    <div className="fixed bottom-20 md:bottom-auto md:top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {/* Offline pill — hidden on the offline vault page */}
        {!isOnline && !isOnOfflinePage && (
          <motion.div
            key="offline"
            initial={{ y: isMobileViewport ? 30 : -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: isMobileViewport ? 30 : -30, opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#08080E] border border-[var(--border)] shadow-2xl text-[var(--foreground)]"
          >
            <div className="p-1 px-2 rounded-full bg-red-500/10">
              <WifiOff className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-semibold tracking-tight">No internet connection</span>
          </motion.div>
        )}

        {/* Back online confirmation */}
        {isOnline && showBackOnline && (
          <motion.div
            key="online"
            initial={{ y: isMobileViewport ? 30 : -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: isMobileViewport ? 30 : -30, opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#08080E] border border-success-bg shadow-2xl text-[var(--foreground)]"
          >
            <div className="p-1 px-2 rounded-full bg-success/10">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-success">Back online</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
