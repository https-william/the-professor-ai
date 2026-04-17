import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type RealtimeCallback<T> = (payload: T) => void;

export function useDuelRealtime(duelId: string | null, callbacks: {
  onDuelUpdate?: RealtimeCallback<any>;
  onSessionUpdate?: RealtimeCallback<any>;
  onChallengerJoin?: RealtimeCallback<any>;
}) {
  useEffect(() => {
    if (!duelId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`duel:${duelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'duels',
          filter: `id=eq.${duelId}`
        },
        (payload) => {
          callbacks.onDuelUpdate?.(payload);
          
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            if (newData.challenger_id && !payload.old?.challenger_id) {
              callbacks.onChallengerJoin?.(payload);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'duel_sessions',
          filter: `duel_id=eq.${duelId}`
        },
        (payload) => {
          callbacks.onSessionUpdate?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duelId]);
}

export function useRoomRealtime(roomId: string | null, callbacks: {
  onRoomUpdate?: RealtimeCallback<any>;
  onNewMessage?: RealtimeCallback<any>;
}) {
  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          callbacks.onRoomUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          callbacks.onNewMessage?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);
}

export function usePublicRoomsRealtime(onRoomsUpdate: RealtimeCallback<any[]>) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('public-rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_rooms',
          filter: 'is_public=eq.true'
        },
        async () => {
          const res = await fetch('/api/lobby?public=true');
          if (res.ok) {
            const data = await res.json();
            onRoomsUpdate(data.rooms || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRoomsUpdate]);
}
