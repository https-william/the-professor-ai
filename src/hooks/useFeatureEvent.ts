"use client";

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventType } from "@/lib/design-tokens";

/** Fire-and-forget PLG analytics event logger (medium granularity) */
export function useFeatureEvent() {
  const queueRef = useRef<Array<{ event_type: string; surface?: string; pack_id?: string; metadata?: Record<string, unknown> }>>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const events = [...queueRef.current];
    queueRef.current = [];

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rows = events.map(e => ({
        user_id: user.id,
        event_type: e.event_type,
        surface: e.surface || null,
        pack_id: e.pack_id || null,
        metadata: e.metadata || {},
      }));

      await supabase.from('feature_usage_events').insert(rows);
    } catch (err) {
      // Non-critical — swallow errors silently
      console.warn('Analytics flush failed:', err);
    }
  }, []);

  const trackEvent = useCallback((eventType: EventType, options?: {
    surface?: string;
    packId?: string;
    metadata?: Record<string, unknown>;
  }) => {
    queueRef.current.push({
      event_type: eventType,
      surface: options?.surface,
      pack_id: options?.packId,
      metadata: options?.metadata,
    });

    // Debounce flush to batch rapid events
    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    flushTimeoutRef.current = setTimeout(flush, 2000);
  }, [flush]);

  return { trackEvent, flush };
}
