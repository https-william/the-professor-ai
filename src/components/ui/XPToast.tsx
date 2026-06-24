"use client";

import React, { useEffect, useState } from "react";
import { Zap, Flame } from "lucide-react";

export interface XPToastProps {
  /** XP amount gained */
  xp: number;
  /** Optional streak count */
  streak?: number;
  /** Optional streak multiplier */
  multiplier?: number;
  /** Activity label (e.g., "Quiz Complete") */
  label?: string;
  /** Duration before auto-dismiss (ms) */
  duration?: number;
  /** Callback when toast dismisses */
  onDismiss?: () => void;
}

/**
 * Floating XP gain toast with streak multiplier indicator.
 * Appears briefly at the top of the screen when the user earns XP.
 */
export default function XPToast({
  xp,
  streak,
  multiplier = 1,
  label,
  duration = 3000,
  onDismiss,
}: XPToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const totalXp = Math.round(xp * multiplier);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss?.(), 300);
    }, duration);

    return () => clearTimeout(exitTimer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none transition-all duration-300 ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-full"
        style={{
          background: 'rgba(229, 169, 60, 0.12)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(229, 169, 60, 0.25)',
          boxShadow: '0 8px 32px rgba(229, 169, 60, 0.15), 0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Zap size={18} className="text-[#E5A93C] fill-[#E5A93C]" />

        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#F7D293] tabular-nums">
            +{totalXp} XP
            {multiplier > 1 && (
              <span className="text-xs font-normal text-[#E5A93C]/70 ml-1.5">
                ({xp} × {multiplier}x)
              </span>
            )}
          </span>
          {label && (
            <span className="text-[10px] text-white/40 font-medium">{label}</span>
          )}
        </div>

        {streak && streak > 1 && (
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <Flame size={14} className="text-[#E5A93C]" />
            <span className="text-xs font-bold text-[#E5A93C]">{streak}</span>
          </div>
        )}
      </div>
    </div>
  );
}
