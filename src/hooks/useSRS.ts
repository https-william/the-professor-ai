"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { sm2, type SM2Card } from "@/lib/spaced-repetition";

interface SRSItem {
  id: string;
  item_id: string;
  item_type: string;
  pack_id: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string | null;
  status: string;
}

/** Hook for managing spaced repetition queue with Supabase persistence */
export function useSRS() {
  const [dueItems, setDueItems] = useState<SRSItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDueItems = useCallback(async (options?: { packId?: string; itemType?: string }) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('srs_queue')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true });

      if (options?.packId) query = query.eq('pack_id', options.packId);
      if (options?.itemType) query = query.eq('item_type', options.itemType);

      const { data } = await query;
      if (data) setDueItems(data);
    } catch (err) {
      console.warn('Failed to fetch SRS items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleItem = useCallback(async (itemId: string, itemType: string, packId?: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('srs_queue')
        .upsert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          pack_id: packId || null,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          next_review_at: new Date().toISOString(),
          status: 'new',
        }, { onConflict: 'user_id,item_id,item_type' });
    } catch (err) {
      console.warn('Failed to schedule SRS item:', err);
    }
  }, []);

  const reviewItem = useCallback(async (itemId: string, itemType: string, quality: number) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current card state
      const { data: current } = await supabase
        .from('srs_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();

      if (!current) return;

      const card: SM2Card = {
        id: current.item_id,
        easeFactor: current.ease_factor,
        interval: current.interval_days,
        repetitions: current.repetitions,
        nextReview: current.next_review_at,
        lastReview: current.last_review_at || new Date().toISOString(),
        status: current.status as SM2Card['status'],
      };

      const result = sm2(card, quality);

      await supabase
        .from('srs_queue')
        .update({
          ease_factor: result.easeFactor,
          interval_days: result.interval,
          repetitions: result.repetitions,
          next_review_at: result.nextReview,
          last_review_at: new Date().toISOString(),
          status: result.status,
        })
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);
    } catch (err) {
      console.warn('Failed to review SRS item:', err);
    }
  }, []);

  return { dueItems, isLoading, fetchDueItems, scheduleItem, reviewItem };
}
