import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LearningState {
  currentTopic: string | null
  confidenceScore: number // 0-100
  weakAreas: string[]
  setTopic: (topic: string) => void
  addWeakArea: (area: string) => void
  updateConfidence: (score: number) => void
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      currentTopic: null,
      confidenceScore: 50,
      weakAreas: [],
      setTopic: (topic) => set({ currentTopic: topic }),
      addWeakArea: (area) => set((state) => ({ weakAreas: [...state.weakAreas, area] })),
      updateConfidence: (score) => set({ confidenceScore: score }),
    }),
    {
      name: 'learning-storage',
    }
  )
)
