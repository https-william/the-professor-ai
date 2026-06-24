"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OFFLINE } from "@/lib/design-tokens";

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'upsert';
  data: Record<string, unknown>;
  timestamp: number;
}

/** Open or create the IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE.DB_NAME, OFFLINE.DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Hook for IndexedDB caching with background Supabase sync */
export function useOfflineSync() {
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageUsedMB, setStorageUsedMB] = useState(0);
  const dbRef = useRef<IDBDatabase | null>(null);

  // Initialize DB
  useEffect(() => {
    openDB().then(db => {
      dbRef.current = db;
      refreshQueueSize();
      estimateStorage();
    }).catch(err => console.warn('IndexedDB init failed:', err));

    return () => { dbRef.current?.close(); };
  }, []);

  const refreshQueueSize = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const count = store.count();
    count.onsuccess = () => setQueueSize(count.result);
  }, []);

  const estimateStorage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage || 0) / (1024 * 1024);
      setStorageUsedMB(Math.round(usedMB * 10) / 10);
    }
  }, []);

  /** Add an item to the sync queue (for offline persistence) */
  const enqueue = useCallback(async (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    const db = dbRef.current;
    if (!db) return;

    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');

    // Enforce rolling limit
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result >= OFFLINE.MAX_SYNC_QUEUE) {
        // Remove oldest item
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          if (cursor.result) cursor.result.delete();
        };
      }
    };

    store.put({
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    tx.oncomplete = () => refreshQueueSize();
  }, [refreshQueueSize]);

  /** Cache arbitrary data locally */
  const cacheData = useCallback(async (key: string, data: unknown) => {
    const db = dbRef.current;
    if (!db) return;
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ key, data, timestamp: Date.now() });
  }, []);

  /** Retrieve cached data */
  const getCachedData = useCallback(async <T>(key: string): Promise<T | null> => {
    const db = dbRef.current;
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction('cache', 'readonly');
      const req = tx.objectStore('cache').get(key);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror = () => resolve(null);
    });
  }, []);

  const isStorageWarning = storageUsedMB >= OFFLINE.STORAGE_WARNING_MB;

  return { queueSize, isSyncing, storageUsedMB, isStorageWarning, enqueue, cacheData, getCachedData, estimateStorage };
}
