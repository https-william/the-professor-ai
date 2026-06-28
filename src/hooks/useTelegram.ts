"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/useUserStore";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function useTelegram() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const refreshUser = useUserStore((state) => state.refreshUser);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Expose physical haptic feedback trigger
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;

    try {
      if (['light', 'medium', 'heavy'].includes(type)) {
        tg.HapticFeedback.impactOccurred(type);
      } else if (['success', 'warning', 'error'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type);
      }
    } catch (e) {
      console.warn("Telegram Haptic feedback failed or unsupported:", e);
    }
  }, []);

  // Sync Telegram theme values with Tailwind/CSS vars
  const syncTelegramTheme = useCallback((tg: any) => {
    if (!tg) return;
    const html = document.documentElement;
    html.classList.add("telegram-app");

    // Map Telegram SDK theme parameters directly to CSS variables
    const params = tg.themeParams;
    if (params) {
      if (params.bg_color) html.style.setProperty("--bg", params.bg_color);
      if (params.secondary_bg_color) html.style.setProperty("--bg-2", params.secondary_bg_color);
      if (params.section_bg_color) html.style.setProperty("--bg-3", params.section_bg_color);
      
      if (params.text_color) html.style.setProperty("--text", params.text_color);
      if (params.subtitle_text_color) html.style.setProperty("--text-2", params.subtitle_text_color);
      if (params.hint_color) html.style.setProperty("--text-3", params.hint_color);

      if (params.button_color) html.style.setProperty("--blue", params.button_color);
      if (params.accent_text_color) html.style.setProperty("--blue-text", params.accent_text_color);
      if (params.section_separator_color) html.style.setProperty("--border", params.section_separator_color);
    }

    // Set header/status bar colors to match the app
    if (tg.setHeaderColor) {
      tg.setHeaderColor("bg_color");
    }
  }, []);

  // Run auto-login bypass using initData
  const performTelegramAuthBypass = useCallback(async (rawInitData: string) => {
    if (!rawInitData || isAuthenticated || isAuthLoading) return;
    
    setIsAuthLoading(true);
    const supabase = createClient();

    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: rawInitData }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed Telegram verification");
      }

      const { email, password } = await res.json();
      
      // Perform Supabase Login client-side so cookies are set correctly
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Refresh store state to fetch user profile details
      await refreshUser();
      console.log("Telegram Auth Bypass Successful!");
    } catch (e) {
      console.error("Telegram Auto-Login bypass failed:", e);
    } finally {
      setIsAuthLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, refreshUser]);

  // Main WebApp initialization
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = (window as any).Telegram?.WebApp;
    
    if (tg && tg.initData) {
      setIsTelegram(true);
      setInitData(tg.initData);
      
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }

      // 1. Sync theme colors
      syncTelegramTheme(tg);
      
      // Listen to theme changes from Telegram in real-time
      if (tg.onEvent) {
        tg.onEvent("themeChanged", () => syncTelegramTheme(tg));
      }

      // 2. Expand application height
      if (tg.expand) {
        tg.expand();
      }

      // 3. Mark app as ready to hide placeholder
      if (tg.ready) {
        tg.ready();
      }

      // 4. Trigger authentication bypass
      performTelegramAuthBypass(tg.initData);
    }
  }, [syncTelegramTheme, performTelegramAuthBypass]);

  // BackButton Navigation Syncing
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg || !tg.BackButton) return;

    const handleBackClick = () => {
      try {
        router.back();
      } catch (e) {
        console.error("Telegram BackButton router.back() navigation failed:", e);
      }
    };

    // Only show BackButton on non-home dashboard paths
    const isHomePath = pathname === "/" || pathname === "/dashboard" || pathname === "/login" || pathname === "/signup";
    
    if (!isHomePath && isTelegram) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackClick);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBackClick);
      tg.BackButton.hide();
    };
  }, [pathname, router, isTelegram]);

  return {
    isTelegram,
    tgUser,
    initData,
    isAuthLoading,
    triggerHaptic,
  };
}
