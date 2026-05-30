import { create } from "zustand";

export type MascotState = 
  | "idle" 
  | "working" 
  | "success" 
  | "fail" 
  | "sleepy" 
  | "streak"
  | "pointing-left"
  | "pointing-right";

interface MascotStoreState {
  mascotState: MascotState;
  bubbleText: string | null;
  previousState: MascotState;
  timeoutId: NodeJS.Timeout | null;
}

interface MascotStoreActions {
  setMascotState: (state: MascotState) => void;
  setBubbleText: (text: string | null) => void;
  triggerReaction: (text: string, state?: MascotState, durationMs?: number) => void;
  clearSpeech: () => void;
}

export const useMascotStore = create<MascotStoreState & MascotStoreActions>((set, get) => ({
  mascotState: "idle",
  bubbleText: null,
  previousState: "idle",
  timeoutId: null,

  setMascotState: (state) => set({ mascotState: state }),

  setBubbleText: (text) => set({ bubbleText: text }),

  triggerReaction: (text, state, durationMs = 4000) => {
    const store = get();
    
    // Clear any existing timeouts to prevent state overrides
    if (store.timeoutId) {
      clearTimeout(store.timeoutId);
    }

    const currentMascotState = store.mascotState;
    const targetState = state || currentMascotState;

    set({
      bubbleText: text,
      mascotState: targetState,
      // If we are already in a temporary reaction, preserve the original pre-reaction state
      previousState: currentMascotState === "success" || currentMascotState === "fail" 
        ? store.previousState 
        : currentMascotState
    });

    const timeout = setTimeout(() => {
      const updatedStore = get();
      set({
        bubbleText: null,
        mascotState: updatedStore.previousState,
        timeoutId: null
      });
    }, durationMs);

    set({ timeoutId: timeout });
  },

  clearSpeech: () => {
    const store = get();
    if (store.timeoutId) {
      clearTimeout(store.timeoutId);
    }
    set({
      bubbleText: null,
      timeoutId: null
    });
  }
}));
