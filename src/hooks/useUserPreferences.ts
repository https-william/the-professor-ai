"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemePreset } from "@/lib/design-tokens";

export interface UserPreferences {
  theme_preset: ThemePreset;
  font_size: number;
  line_height: number;
  dyslexia_mode: boolean;
  bionic_reading: boolean;
  audio_speed: number;
  reduced_motion: boolean;
  language: string;
  study_goal_hours_weekly: number;
  notification_prefs: {
    email_reminders: boolean;
    streak_alerts: boolean;
    weekly_wrapped: boolean;
    study_breaks: boolean;
  };
  low_bandwidth_mode: boolean;
  zen_focus_mode: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme_preset: 'midnight-scholar',
  font_size: 16,
  line_height: 1.6,
  dyslexia_mode: false,
  bionic_reading: false,
  audio_speed: 1.0,
  reduced_motion: false,
  language: 'en',
  study_goal_hours_weekly: 10,
  notification_prefs: {
    email_reminders: true,
    streak_alerts: true,
    weekly_wrapped: true,
    study_breaks: true,
  },
  low_bandwidth_mode: false,
  zen_focus_mode: false,
};

const STORAGE_KEY = 'professor-user-preferences';

/** Hook for managing user preferences with Supabase sync + localStorage fallback */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage first, then sync with Supabase
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(cached) });
      } catch { /* ignore parse errors */ }
    }

    const loadFromSupabase = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoading(false); return; }

        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          const prefs: UserPreferences = {
            theme_preset: data.theme_preset || DEFAULT_PREFERENCES.theme_preset,
            font_size: data.font_size ?? DEFAULT_PREFERENCES.font_size,
            line_height: data.line_height ?? DEFAULT_PREFERENCES.line_height,
            dyslexia_mode: data.dyslexia_mode ?? DEFAULT_PREFERENCES.dyslexia_mode,
            bionic_reading: data.bionic_reading ?? DEFAULT_PREFERENCES.bionic_reading,
            audio_speed: data.audio_speed ?? DEFAULT_PREFERENCES.audio_speed,
            reduced_motion: data.reduced_motion ?? DEFAULT_PREFERENCES.reduced_motion,
            language: data.language || DEFAULT_PREFERENCES.language,
            study_goal_hours_weekly: data.study_goal_hours_weekly ?? DEFAULT_PREFERENCES.study_goal_hours_weekly,
            notification_prefs: data.notification_prefs || DEFAULT_PREFERENCES.notification_prefs,
            low_bandwidth_mode: data.low_bandwidth_mode ?? DEFAULT_PREFERENCES.low_bandwidth_mode,
            zen_focus_mode: data.zen_focus_mode ?? DEFAULT_PREFERENCES.zen_focus_mode,
          };
          setPreferences(prefs);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        }
      } catch (err) {
        console.warn('Failed to load preferences from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromSupabase();
  }, []);

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          [key]: value,
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Failed to save preference:', err);
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  const updateMultiple = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  return { preferences, isLoading, isSaving, updatePreference, updateMultiple };
}
