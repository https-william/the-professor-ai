"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface StudySessionData {
  pack_id?: string;
  surface: string;
  questions_answered?: number;
  correct_count?: number;
  cards_flipped?: number;
  chapters_read?: number;
  metadata?: Record<string, unknown>;
}

/** Hook for tracking and persisting study session analytics */
export function useStudySession(surface: string, packId?: string) {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const startSession = useCallback(async () => {
    setIsActive(true);
    startTimeRef.current = new Date();
    setElapsedSeconds(0);

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          pack_id: packId || null,
          surface,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (data) sessionIdRef.current = data.id;
    } catch (err) {
      console.warn('Failed to start study session:', err);
    }
  }, [surface, packId]);

  const endSession = useCallback(async (data?: Partial<StudySessionData>) => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!sessionIdRef.current) return;

    try {
      const supabase = createClient();
      await supabase
        .from('study_sessions')
        .update({
          ended_at: new Date().toISOString(),
          time_spent_seconds: elapsedSeconds,
          ...data,
        })
        .eq('id', sessionIdRef.current);
    } catch (err) {
      console.warn('Failed to end study session:', err);
    }

    sessionIdRef.current = null;
  }, [elapsedSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isActive, elapsedSeconds, startSession, endSession };
}
