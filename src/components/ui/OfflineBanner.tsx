"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, Database } from "lucide-react";

/** Network status banner with auto-recovery detection */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRecovery(true);
        setTimeout(() => setShowRecovery(false), 4000);
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showRecovery) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[300] px-4 py-2.5 text-center text-xs font-medium transition-all duration-300 ${
        !isOnline ? 'translate-y-0' : showRecovery ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        background: !isOnline
          ? 'linear-gradient(135deg, rgba(232, 93, 117, 0.90), rgba(184, 52, 75, 0.90))'
          : 'linear-gradient(135deg, rgba(43, 178, 136, 0.90), rgba(30, 130, 100, 0.90))',
        backdropFilter: 'blur(12px)',
        color: 'white',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={14} />
            <span>You&apos;re offline. Your study progress is saved locally.</span>
            <Database size={12} className="opacity-60" />
          </>
        ) : (
          <>
            <Wifi size={14} />
            <span>Back online! Syncing your progress...</span>
          </>
        )}
      </div>
    </div>
  );
}
