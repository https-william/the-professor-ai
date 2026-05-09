import { create } from 'zustand';

interface IngestFile {
  id: string;
  name: string;
  status: 'reading' | 'learning' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
  file?: File; // Store the actual file object
  text?: string; // Store the parsed text
}

interface IngestState {
  isModalOpen: boolean;
  isProcessing: boolean;
  queue: IngestFile[];
  openModal: () => void;
  closeModal: () => void;
  addFiles: (files: File[], explicitIds?: string[]) => void;
  updateFileStatus: (id: string, status: IngestFile['status'], progress?: number, error?: string) => void;
  clearQueue: () => void;
}

export const useIngestStore = create<IngestState>((set) => ({
  isModalOpen: false,
  isProcessing: false,
  queue: [],
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  
  addFiles: (files, explicitIds) => set((state) => ({
    queue: [
      ...state.queue,
      ...files.map((f, i) => ({
        id: explicitIds ? explicitIds[i] : Math.random().toString(36).substring(7),
        name: f.name,
        status: 'reading' as const,
        progress: 0,
        file: f,
      }))
    ],
    isProcessing: true,
  })),

  updateFileStatus: (id, status, progress, error) => set((state) => {
    const newQueue = state.queue.map(f => 
      f.id === id ? { ...f, status, progress: progress ?? f.progress, errorMessage: error } : f
    );
    const stillProcessing = newQueue.some(f => f.status === 'reading' || f.status === 'learning');
    
    return {
      queue: newQueue,
      isProcessing: stillProcessing
    };
  }),

  clearQueue: () => set({ queue: [], isProcessing: false }),
}));
