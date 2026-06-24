"use client";

import React from "react";
import { Coffee, Timer, X } from "lucide-react";

export interface CognitiveFatigueAlertProps {
  /** Minutes the user has been studying */
  minutesStudied: number;
  /** User's first name for personalized message */
  userName?: string;
  /** Callback to dismiss the alert */
  onDismiss: () => void;
  /** Callback to take a break (pause timer) */
  onTakeBreak: () => void;
}

/**
 * Gentle overlay prompting the user to take a study break.
 * Triggers after sustained reading/quiz sessions to prevent cognitive burnout.
 */
export default function CognitiveFatigueAlert({
  minutesStudied,
  userName = 'there',
  onDismiss,
  onTakeBreak,
}: CognitiveFatigueAlertProps) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.60)' }}>
      <div
        className="relative w-full max-w-sm p-6 rounded-3xl animate-in zoom-in-95 duration-300"
        style={{
          background: 'rgba(24, 24, 27, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(229, 169, 60, 0.15)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 40px rgba(229, 169, 60, 0.08)',
        }}
        role="alertdialog"
        aria-label="Study break reminder"
      >
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(229, 169, 60, 0.10)' }}
          >
            <Coffee size={28} className="text-[#E5A93C]" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-center text-lg font-bold text-white mb-1">
          Hey {userName}, quick break?
        </h3>
        <p className="text-center text-sm text-white/50 mb-5">
          You&apos;ve been studying for <span className="font-semibold text-[#E5A93C]">{minutesStudied} minutes</span> straight.
          Your brain absorbs more after a short rest.
        </p>

        {/* Timer suggestion */}
        <div className="flex items-center justify-center gap-2 mb-5 py-2 px-4 rounded-xl mx-auto w-fit" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
          <Timer size={14} className="text-white/40" />
          <span className="text-xs text-white/40">5-minute break recommended</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Keep studying
          </button>
          <button
            onClick={onTakeBreak}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-colors"
            style={{ background: '#E5A93C' }}
          >
            Take a break
          </button>
        </div>
      </div>
    </div>
  );
}
