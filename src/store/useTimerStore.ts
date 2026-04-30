import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerMode = "focus" | "break";

interface TimerState {
    timeLeft: number;
    isActive: boolean;
    mode: TimerMode;
    lastTickTime: number | null; // Used for "catching up" after hydration/backgrounding
}

interface TimerActions {
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tickTimer: () => void;
    setMode: (mode: TimerMode) => void;
    setTimeLeft: (time: number) => void;
    syncHydration: () => void;
}

const DEFAULT_FOCUS_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;

export const useTimerStore = create<TimerState & TimerActions>()(
    persist(
        (set, get) => ({
            timeLeft: DEFAULT_FOCUS_TIME,
            isActive: false,
            mode: "focus",
            lastTickTime: null,

            startTimer: () => set({ isActive: true, lastTickTime: Date.now() }),
            
            pauseTimer: () => set({ isActive: false, lastTickTime: null }),
            
            resetTimer: () => set({ 
                isActive: false, 
                timeLeft: get().mode === "focus" ? DEFAULT_FOCUS_TIME : DEFAULT_BREAK_TIME,
                lastTickTime: null 
            }),
            
            tickTimer: () => {
                const state = get();
                if (!state.isActive || state.timeLeft <= 0) return;
                
                const now = Date.now();
                // We typically just decrement by 1 if ticking every second, 
                // but doing it explicitly based on time delta adds precision.
                // However, for standard UX, decrementing by 1 per tick is fine,
                // as `syncHydration` handles large gaps.
                set({ 
                    timeLeft: Math.max(0, state.timeLeft - 1),
                    lastTickTime: now 
                });
            },
            
            setMode: (mode: TimerMode) => set({ 
                mode, 
                timeLeft: mode === "focus" ? DEFAULT_FOCUS_TIME : DEFAULT_BREAK_TIME,
                isActive: false,
                lastTickTime: null
            }),
            
            setTimeLeft: (time: number) => set({ timeLeft: time }),
            
            syncHydration: () => {
                const state = get();
                if (state.isActive && state.lastTickTime) {
                    const now = Date.now();
                    const diffMs = now - state.lastTickTime;
                    const diffSeconds = Math.floor(diffMs / 1000);
                    
                    if (diffSeconds > 0) {
                        set({ 
                            timeLeft: Math.max(0, state.timeLeft - diffSeconds),
                            lastTickTime: now
                        });
                    }
                }
            }
        }),
        {
            name: "professor-timer-storage",
        }
    )
);
