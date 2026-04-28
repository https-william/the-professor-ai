"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, CheckCircle2 } from "lucide-react";

/**
 * ═══ ConnectivityIndicator ═══
 * High-fidelity, YouTube-style monitoring pill for network status.
 * Establish resilience and immediate user feedback.
 */
export default function ConnectivityIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      // Auto-hide the "Back online" message after 3 seconds
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {/* State: Offline */}
        {!isOnline && (
          <motion.div
            key="offline"
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#08080E] border border-[var(--border)] shadow-2xl text-[var(--foreground)]"
          >
            <div className="p-1 px-2 rounded-full bg-red-500/10">
              <WifiOff className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-semibold tracking-tight">No internet connection</span>
          </motion.div>
        )}

        {/* State: Back Online */}
        {isOnline && showBackOnline && (
          <motion.div
            key="online"
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.8 }}
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
