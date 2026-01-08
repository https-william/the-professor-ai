
import { updateUserProfile } from './supabase';
import { submitDuelScore } from './firebase'; // Legacy stub if needed, or implement in Supabase
import { UserProfile, HistoryItem } from '../types';
import { saveUserProfile, loadUserProfile, saveToHistory } from './storageService';

// The Queue
const SYNC_QUEUE_KEY = 'hydra_sync_queue';

interface SyncTask {
    id: string;
    type: 'UPDATE_PROFILE' | 'SAVE_HISTORY' | 'DUEL_SCORE';
    payload: any;
    timestamp: number;
    retryCount: number;
}

const loadQueue = (): SyncTask[] => {
    try {
        return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch (e) {
        return [];
    }
};

const saveQueue = (queue: SyncTask[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

export const queueAction = (type: SyncTask['type'], payload: any) => {
    const queue = loadQueue();
    const task: SyncTask = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0
    };
    
    // OPTIMISTIC UPDATE (Local First)
    if (type === 'UPDATE_PROFILE') {
        const current = loadUserProfile();
        if (current) {
            const updated = { ...current, ...payload.data }; // payload is { uid, data }
            saveUserProfile(updated);
        }
    } else if (type === 'SAVE_HISTORY') {
        saveToHistory(payload as HistoryItem);
    }

    queue.push(task);
    saveQueue(queue);
    
    // Attempt immediate sync if online
    if (navigator.onLine) {
        processQueue();
    }
};

const processTask = async (task: SyncTask) => {
    switch (task.type) {
        case 'UPDATE_PROFILE':
            // Payload is { uid, data }
            await updateUserProfile(task.payload.uid, task.payload.data);
            break;
        case 'DUEL_SCORE':
            await submitDuelScore(task.payload.duelId, task.payload.userId, task.payload.score);
            break;
        case 'SAVE_HISTORY':
            // History is typically local-only in this architecture, 
            // but if we had cloud history, we'd push it here.
            await new Promise(resolve => setTimeout(resolve, 100));
            break;
    }
};

export const processQueue = async () => {
    if (!navigator.onLine) return;

    const queue = loadQueue();
    if (queue.length === 0) return;

    const remainingTasks: SyncTask[] = [];

    for (const task of queue) {
        try {
            await processTask(task);
        } catch (e) {
            console.error(`Hydra Sync Failed [${task.type}]:`, e);
            task.retryCount++;
            if (task.retryCount < 5) { // Drop after 5 fails
                remainingTasks.push(task);
            }
        }
    }

    saveQueue(remainingTasks);
};

// The Heartbeat
let heartbeatInterval: any;

export const startHydraEngine = () => {
    if (heartbeatInterval) return;
    
    console.log("🐍 Hydra Engine: Online");
    
    // Check every 3 seconds
    heartbeatInterval = setInterval(() => {
        processQueue();
    }, 3000);

    // Listen for online status
    window.addEventListener('online', processQueue);
};