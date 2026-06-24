"use client";

import { useEffect, useRef, useCallback } from "react";

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  /** If true, prevents default browser behavior */
  preventDefault?: boolean;
}

/** Hook for page-specific keyboard shortcut registration */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

/** Get a human-readable label for a shortcut */
export function formatShortcutLabel(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');

  const keyLabel = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key === ' ' ? 'Space'
    : shortcut.key === 'ArrowLeft' ? '←'
    : shortcut.key === 'ArrowRight' ? '→'
    : shortcut.key === 'ArrowUp' ? '↑'
    : shortcut.key === 'ArrowDown' ? '↓'
    : shortcut.key === 'Escape' ? 'Esc'
    : shortcut.key === 'Enter' ? '↵'
    : shortcut.key;

  parts.push(keyLabel);
  return parts.join(' + ');
}
