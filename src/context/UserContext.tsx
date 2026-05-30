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

    const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = {
                ...options.headers,
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            };
            return fetch(url, { ...options, headers });
        } catch (e) {
            console.error("Auth fetch token retrieval error, falling back to standard fetch", e);
            return fetch(url, options);
        }
    };

    const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 500): Promise<Response> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = {
                ...options.headers,
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            };
            for (let i = 0; i < retries; i++) {
                try {
                    const res = await fetch(url, { ...options, headers });
                    if (res.ok) return res;
                    // Don't retry if it's a standard client-side validation error (except 429 rate limits)
                    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
                        return res;
                    }
                } catch (err) {
                    if (i === retries - 1) throw err;
                }
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        } catch (e) {
            console.error("fetchWithRetry token error", e);
        }
        throw new Error(`Request failed after ${retries} retries`);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const originalFetch = window.fetch;
        window.fetch = async function (input, init) {
            let url = "";
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.toString();
            } else if (input && typeof input === 'object' && 'url' in input) {
                url = (input as any).url;
            }
            
            const isLocalApi = url.startsWith('/api/');
            const isWebApi = url.startsWith(window.location.origin + '/api/');
            const isProductionApi = url.startsWith('https://theprofessor.xyz/api/');
            
            if (isLocalApi || isWebApi || isProductionApi) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        init = init || {};
                        if (input instanceof Request) {
                            if (!input.headers.has('Authorization')) {
                                input.headers.set('Authorization', `Bearer ${session.access_token}`);
                            }
                        } else {
                            const headers = new Headers(init.headers || {});
                            if (!headers.has('Authorization')) {
                                headers.set('Authorization', `Bearer ${session.access_token}`);
                            }
                            init.headers = headers;
                        }
                    }
                } catch (e) {
                    console.error("Fetch interceptor auth token injection failed", e);
                }
            }
            return originalFetch.call(this, input, init);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [supabase]);

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
            const res = await authenticatedFetch("/api/user/profile", {
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
            const res = await authenticatedFetch("/api/user/profile", {
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
            const res = await authenticatedFetch("/api/user/activity", {
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
            // Optimistic update of local store
            store.updateUser({ 
                name: data.alias || data.first_name, 
                firstName: data.first_name,
                lastName: data.last_name,
                username: data.username,
                age: data.age,
                hasOnboarded: true 
            });

            // Sync with backend in background (fire-and-forget)
            fetchWithRetry("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, has_onboarded: true }),
            }).catch(error => {
                console.error("completeOnboarding background sync failed:", error);
            });

            return true;
        } catch (error) {
            console.error("completeOnboarding failed:", error);
            return false;
        }
    };

    const saveOnboardingStep = async (data: any): Promise<boolean> => {
        try {
            // Optimistic update of local store
            store.updateUser(data);

            // Sync with backend in background (fire-and-forget)
            fetchWithRetry("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).catch(error => {
                console.error("saveOnboardingStep background sync failed:", error);
            });

            return true;
        } catch (error) {
            console.error("saveOnboardingStep failed:", error);
            return false;
        }
    };

    const buyStreakFreeze = async (): Promise<boolean> => {
        try {
            const res = await authenticatedFetch("/api/user/streak-freeze", {
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
            const res = await authenticatedFetch("/api/user/streak-freeze", {
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
        themePreference: store.themePreference,
        planStatus: store.planStatus,
        subscriptionEndDate: store.subscriptionEndDate
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
