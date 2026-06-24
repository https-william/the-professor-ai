"use client";

import React, { useEffect, useState, useRef } from "react";

export interface OdometerCounterProps {
  /** Target value to count to */
  value: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix string (e.g., "$") */
  prefix?: string;
  /** Suffix string (e.g., "%", "XP") */
  suffix?: string;
  /** CSS class for the counter text */
  className?: string;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
  /** Easing function */
  easing?: 'linear' | 'easeOut' | 'easeInOut';
}

const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

/**
 * Animated counter that rolls up from 0 (or previous value) to the target.
 * Used for scores, XP, streaks, percentages, and stats throughout the app.
 */
export default function OdometerCounter({
  value,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  animateOnMount = true,
  easing = 'easeOut',
}: OdometerCounterProps) {
  const [displayValue, setDisplayValue] = useState(animateOnMount ? 0 : value);
  const previousValue = useRef(animateOnMount ? 0 : value);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    const from = previousValue.current;
    const to = value;
    if (from === to) return;

    const easeFn = easingFunctions[easing];
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(progress);

      const current = from + (to - from) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = to;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration, easing]);

  const formatted = displayValue.toFixed(decimals);

  return (
    <span className={`tabular-nums font-bold ${className}`} aria-live="polite">
      {prefix}{formatted}{suffix}
    </span>
  );
}
