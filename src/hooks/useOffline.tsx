"use client";

import { useState, useEffect, useCallback } from "react";
import { WifiOff, Signal, Download, Zap } from "lucide-react";

type NetworkStatus = "online" | "offline" | "slow";

interface UseOfflineReturn {
  isOnline: boolean;
  status: NetworkStatus;
  wasOffline: boolean;
  lastOnline: Date | null;
  checkConnection: () => void;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<NetworkStatus>("online");
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  const checkConnection = useCallback(() => {
    const online = navigator.onLine;
    setIsOnline(online);

    if (online) {
      setStatus("online");
      if (wasOffline) {
        setLastOnline(new Date());
        setWasOffline(false);
      }
    } else {
      setStatus("offline");
      setWasOffline(true);
    }
  }, [wasOffline]);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setStatus("online");
      if (!isOnline) {
        setLastOnline(new Date());
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic connection check (every 30 seconds)
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, isOnline]);

  return {
    isOnline,
    status,
    wasOffline,
    lastOnline,
    checkConnection,
  };
}

// Offline Indicator Component
export function OfflineIndicator() {
  const { isOnline, status, wasOffline, lastOnline } = useOffline();

  if (isOnline && !wasOffline) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[1000] px-4 py-2 text-center text-sm font-medium animate-slide-down"
      style={{ 
        background: status === "offline" 
          ? "linear-gradient(135deg, #ef4444, #dc2626)" 
          : "linear-gradient(135deg, #f59e0b, #d97706)",
        color: "white",
      }}
    >
      <div className="flex items-center justify-center gap-2">
        {status === "offline" ? (
          <WifiOff size={18} strokeWidth={1.5} />
        ) : (
          <Signal size={18} strokeWidth={1.5} />
        )}
        <span>
          {status === "offline" 
            ? "You're offline. Some features may be limited." 
            : "Connection restored!"
          }
          {lastOnline && lastOnline > new Date(Date.now() - 60000) && (
            <span className="ml-2 opacity-75">
              (back after {Math.floor((Date.now() - lastOnline.getTime()) / 1000)}s)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay (don't show immediately)
      setTimeout(() => setShowPrompt(true), 10000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Check if dismissed this session
  if (sessionStorage.getItem("pwa-prompt-dismissed") || isInstalled) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[90] p-4 rounded-2xl animate-slide-up"
      style={{ 
        background: "linear-gradient(135deg, #1a1a2e, #16162a)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.2)" }}>
          <Download size={18} strokeWidth={1.5} className="text-[#F59E0B]" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm mb-1">Install The Professor</h4>
          <p className="text-xs text-white/50 mb-3">
            Add to home screen for quick access and offline support
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#F59E0B] text-black hover:bg-[#fbbf24] transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cached Content Indicator
export function CachedContentIndicator() {
  const [cachedCount, setCachedCount] = useState(0);

  useEffect(() => {
    // Check if service worker is active
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // In a real app, you'd communicate with SW to get cache stats
      setCachedCount(0); // Placeholder
    }
  }, []);

  if (cachedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[90] px-3 py-1.5 rounded-full text-xs text-white/40 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <Zap size={12} strokeWidth={1.5} className="text-[#F59E0B]" />
      {cachedCount} items cached
    </div>
  );
}
