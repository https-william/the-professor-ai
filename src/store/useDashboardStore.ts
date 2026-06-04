import { create } from "zustand";

export type UserStateType = 'NEW_USER' | 'RETURNING_STUDENT' | 'POWER_LEARNER';

interface DashboardState {
    userState: UserStateType;
    setUserState: (state: UserStateType) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    userState: 'RETURNING_STUDENT', // Default to returning student
    setUserState: (state) => set({ userState: state }),
}));
