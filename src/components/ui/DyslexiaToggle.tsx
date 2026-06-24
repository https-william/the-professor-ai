"use client";

import React, { useState } from "react";
import { Type, Minus, Plus } from "lucide-react";

export interface DyslexiaToggleProps {
  fontSize: number;
  lineHeight: number;
  dyslexiaMode: boolean;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onDyslexiaModeChange: (enabled: boolean) => void;
  className?: string;
}

/** Floating accessibility toolbar for font adjustments */
export default function DyslexiaToggle({
  fontSize,
  lineHeight,
  dyslexiaMode,
  onFontSizeChange,
  onLineHeightChange,
  onDyslexiaModeChange,
  className = '',
}: DyslexiaToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-2 rounded-xl transition-all duration-200 ${
          isExpanded ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
        }`}
        aria-label="Accessibility settings"
        title="Font & accessibility"
      >
        <Type size={18} />
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          className="absolute top-full right-0 mt-2 w-64 p-4 rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: 'rgba(24, 24, 27, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Font Size */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2 block">Font Size</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                aria-label="Decrease font size"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-bold text-white tabular-nums flex-1 text-center">{fontSize}px</span>
              <button
                onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                aria-label="Increase font size"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2 block">Line Spacing</label>
            <input
              type="range"
              min={1.2}
              max={2.4}
              step={0.2}
              value={lineHeight}
              onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
              className="w-full accent-[#E5A93C]"
              aria-label="Line height"
            />
            <div className="flex justify-between text-[10px] text-white/25 mt-1">
              <span>Tight</span>
              <span>{lineHeight.toFixed(1)}</span>
              <span>Loose</span>
            </div>
          </div>

          {/* Dyslexia Mode */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Dyslexia-friendly font</span>
            <button
              onClick={() => onDyslexiaModeChange(!dyslexiaMode)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                dyslexiaMode ? 'bg-[#E5A93C]' : 'bg-white/10'
              }`}
              role="switch"
              aria-checked={dyslexiaMode}
              aria-label="Toggle dyslexia-friendly font"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  dyslexiaMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
