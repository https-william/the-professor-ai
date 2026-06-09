// Persistent process-level queue coordinator for Free Tier generations
const globalQueue = global as any;

if (!globalQueue.activeGenerations) {
    globalQueue.activeGenerations = 0;
}
if (!globalQueue.waitingUsers) {
    globalQueue.waitingUsers = [];
}

export function addToQueue(userId: string) {
    const list = globalQueue.waitingUsers as string[];
    if (!list.includes(userId)) {
        list.push(userId);
    }
}

export function getQueueIndex(userId: string): number {
    const list = globalQueue.waitingUsers as string[];
    return list.indexOf(userId);
}

export function startGenerating(userId: string) {
    const list = globalQueue.waitingUsers as string[];
    globalQueue.waitingUsers = list.filter((id: string) => id !== userId);
    globalQueue.activeGenerations++;
}

export function finishGenerating() {
    globalQueue.activeGenerations = Math.max(0, globalQueue.activeGenerations - 1);
}

export function getActiveCount(): number {
    return globalQueue.activeGenerations;
}
