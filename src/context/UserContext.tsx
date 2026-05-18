"use client";

import React, { createContext, useContext, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore, UserState } from "@/store/useUserStore";

interface UserContextType {
    user: UserState;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<UserState>) => void;
    addCredits: (amount: number) => Promise<boolean>;
    spendCredits: (amount: number) => Promise<boolean>;
    incrementStreak: () => Promise<void>;
    completeOnboarding: (data: { 
        alias?: string, 
        first_name?: string, 
        last_name?: string, 
        username?: string, 
        age?: number,
        education_level: string, 
        study_goal: string,
        study_style?: string,
        preferred_subjects?: string[],
        time_commitment?: string,
        main_challenge?: string,
        ai_persona?: string
    }) => Promise<boolean>;
    saveOnboardingStep: (data: any) => Promise<boolean>;
    buyStreakFreeze: () => Promise<boolean>;
    recoverStreak: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const store = useUserStore();
    const refreshUser = useUserStore((state) => state.refreshUser);
    const updateUser = useUserStore((state) => state.updateUser);
    const supabase = React.useMemo(() => createClient(), []);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;
        
        // Use a local flag to prevent redundant initial refresh if auth listener fires immediately
        let initialRefreshDone = false;
        
        const performInitialLoad = async () => {
            if (!initialRefreshDone) {
                initialRefreshDone = true;
                await refreshUser();
            }
        };

        performInitialLoad();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
            // refreshUser is locked internally by isRefreshing, but we can avoid the call if session is null and we aren't auth'd
            if (event === 'SIGNED_OUT') {
                updateUser({ isAuthenticated: false, id: null });
            } else {
                refreshUser();
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, refreshUser, updateUser]);

    const addCredits = async (amount: number): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credits: store.credits + amount }),
            });
            if (res.ok) {
                store.updateUser({ credits: store.credits + amount });
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const spendCredits = async (amount: number): Promise<boolean> => {
        if (store.credits < amount) return false;
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credits: store.credits - amount }),
            });
            if (res.ok) {
                store.updateUser({ credits: store.credits - amount });
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const incrementStreak = async () => {
        try {
            // Trigger server-side streak logic via activity API
            const res = await fetch("/api/user/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "daily_challenge" }),
            });
            if (res.ok) {
                await store.refreshUser();
            }
        } catch (error) {
            console.error("Error incrementing streak:", error);
        }
    };

    const completeOnboarding = async (data: any): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, has_onboarded: true }),
            });
            if (res.ok) {
                store.updateUser({ 
                    name: data.alias || data.first_name, 
                    firstName: data.first_name,
                    lastName: data.last_name,
                    username: data.username,
                    age: data.age,
                    hasOnboarded: true 
                });
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    const saveOnboardingStep = async (data: any): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                store.updateUser(data);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    const buyStreakFreeze = async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/streak-freeze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "buy" }),
            });
            if (res.ok) {
                await store.refreshUser();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const recoverStreak = async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/streak-freeze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "recover" }),
            });
            if (res.ok) {
                await store.refreshUser();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    // Pack the flat state back into the `user` object expected by existing components
    const userState: UserState = {
        id: store.id,
        name: store.name,
        firstName: store.firstName,
        lastName: store.lastName,
        username: store.username,
        age: store.age,
        email: store.email,
        avatar: store.avatar,
        streak: store.streak,
        credits: store.credits,
        xp: store.xp,
        rank: store.rank,
        wins: store.wins,
        losses: store.losses,
        winRate: store.winRate,
        duelXp: store.duelXp,
        socialLevel: store.socialLevel,
        rankTitle: store.rankTitle,
        streakFreezeCount: store.streakFreezeCount,
        lastStreak: store.lastStreak,
        streakResetAt: store.streakResetAt,
        isLoading: store.isLoading,
        isAuthenticated: store.isAuthenticated,
        hasOnboarded: store.hasOnboarded,
        syncError: store.syncError,
        createdAt: store.createdAt,
        notificationEmail: store.notificationEmail,
        notificationPush: store.notificationPush,
        dailyGoalMinutes: store.dailyGoalMinutes,
        difficultyPreference: store.difficultyPreference,
        themePreference: store.themePreference
    };

    return (
        <UserContext.Provider value={{ 
            user: userState, 
            refreshUser: store.refreshUser, 
            updateUser: store.updateUser, 
            addCredits, 
            spendCredits, 
            incrementStreak, 
            completeOnboarding, 
            saveOnboardingStep, 
            buyStreakFreeze, 
            recoverStreak 
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
