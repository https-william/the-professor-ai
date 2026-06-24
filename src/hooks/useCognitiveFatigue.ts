"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FATIGUE } from "@/lib/design-tokens";

/** Hook for timer-based study break reminders */
export function useCognitiveFatigue() {
  const [minutesStudied, setMinutesStudied] = useState(0);
  const [shouldBreak, setShouldBreak] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setMinutesStudied(prev => {
          const next = prev + 1;
          if (next >= FATIGUE.BREAK_AFTER_MINUTES && !shouldBreak) {
            setShouldBreak(true);
          }
          return next;
        });
      }
    }, 60000); // Every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, shouldBreak]);

  const dismissBreak = useCallback(() => {
    setShouldBreak(false);
  }, []);

  const takeBreak = useCallback(() => {
    setIsPaused(true);
    setShouldBreak(false);
    // Auto-resume after 5 minutes
    setTimeout(() => {
      setIsPaused(false);
      setMinutesStudied(0);
    }, 5 * 60 * 1000);
  }, []);

  const resetTimer = useCallback(() => {
    setMinutesStudied(0);
    setShouldBreak(false);
    setIsPaused(false);
  }, []);

  return { minutesStudied, shouldBreak, isPaused, dismissBreak, takeBreak, resetTimer };
}
