"use client";

import React from "react";

export interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Glass intensity: light, medium, or heavy */
  intensity?: 'light' | 'medium' | 'heavy';
  /** Optional accent glow color (CSS color string) */
  glowColor?: string;
  /** Whether to show a subtle inner shadow for depth */
  innerShadow?: boolean;
  /** Custom border radius */
  radius?: string;
  /** Hover elevation effect */
  hoverLift?: boolean;
  children: React.ReactNode;
}

const GLASS_PRESETS = {
  light: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px) saturate(120%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(24px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  heavy: {
    background: 'rgba(9, 9, 11, 0.70)',
    backdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
  },
};

/**
 * A reusable volcanic glassmorphic container following the Midnight Scholar design system.
 * Provides consistent backdrop blur, border glow, and depth effects across all surfaces.
 */
export default function GlassmorphicCard({
  children,
  className = '',
  intensity = 'medium',
  glowColor,
  innerShadow = true,
  radius = '24px',
  hoverLift = false,
  style = {},
  ...props
}: GlassmorphicCardProps) {
  const preset = GLASS_PRESETS[intensity];

  return (
    <div
      className={`relative transition-all duration-300 ease-out ${
        hoverLift ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''
      } ${className}`}
      style={{
        ...style,
        background: preset.background,
        backdropFilter: preset.backdropFilter,
        WebkitBackdropFilter: preset.backdropFilter,
        border: preset.border,
        borderRadius: radius,
        boxShadow: [
          innerShadow ? 'inset 0 1px 1px rgba(255, 255, 255, 0.03)' : '',
          glowColor ? `0 0 30px ${glowColor}` : '',
          '0 4px 12px rgba(0, 0, 0, 0.3)',
        ].filter(Boolean).join(', '),
      }}
      {...props}
    >
      {children}
    </div>
  );
}
