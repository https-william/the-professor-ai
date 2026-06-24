"use client";

import React, { useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { type ShortcutConfig, formatShortcutLabel } from "@/hooks/useKeyboardShortcuts";

export interface KeyboardShortcutsModalProps {
  shortcuts: ShortcutConfig[];
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/** Modal overlay displaying page-specific keyboard shortcuts */
export default function KeyboardShortcutsModal({
  shortcuts,
  isOpen,
  onClose,
  title = 'Keyboard Shortcuts',
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose} style={{ background: 'rgba(0, 0, 0, 0.60)' }}>
      <div
        className="relative w-full max-w-md p-6 rounded-3xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(24, 24, 27, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        }}
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-white/40" />
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <span className="text-sm text-white/60">{shortcut.description}</span>
              <kbd
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white/70"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                {formatShortcutLabel(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-white/5 text-center">
          <span className="text-[10px] text-white/25">Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">?</kbd> to toggle</span>
        </div>
      </div>
    </div>
  );
}
