"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserState {
    id: string | null;
    name: string;
    email: string;
    avatar: string;
    streak: number;
    credits: number;
    xp: number;
    rank: number;
    wins: number;
    winRate: number;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasOnboarded: boolean;
}

interface UserContextType {
    user: UserState;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<UserState>) => void;
    addCredits: (amount: number) => Promise<boolean>;
    spendCredits: (amount: number) => Promise<boolean>;
    incrementStreak: () => Promise<void>;
    completeOnboarding: (data: { alias: string, education_level: string, study_goal: string }) => Promise<boolean>;
}

const defaultUser: UserState = {
    id: null,
    name: "Scholar",
    email: "",
    avatar: "S",
    streak: 0,
    credits: 0,
    xp: 0,
    rank: 0,
    wins: 0,
    winRate: 0,
    isLoading: true,
    isAuthenticated: false,
    hasOnboarded: true, // Default true to prevent flash, changes to false if DB fetch says so
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserState>(defaultUser);
    const supabase = createClient();

    const refreshUser = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                setUser({ ...defaultUser, isLoading: false, isAuthenticated: false, hasOnboarded: true });
                return;
            }

            // Fetch profile from API with retry logic
            let retries = 2;
            let profile = null;
            let email = session.user.email;

            while (retries > 0) {
                try {
                    const res = await fetch("/api/user/profile", {
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                    });
                    if (res.ok) {
                        const data = await res.json();
                        profile = data.profile;
                        email = data.email || email;
                        break;
                    }
                } catch (fetchError) {
                    console.warn(`Profile fetch attempt failed, ${retries - 1} retries left`);
                }
                retries--;
            }

            // Use session data as fallback if profile fetch fails
            setUser({
                id: profile?.id || session.user.id,
                name: profile?.alias || email?.split("@")[0] || "Scholar",
                email: email || "",
                avatar: profile?.avatar_url || (email?.[0] || "S").toUpperCase(),
                streak: profile?.streak || 0,
                credits: profile?.credits || 100, // Default credits for new users
                xp: profile?.xp || 0,
                rank: 0,
                wins: 0,
                winRate: 0,
                isLoading: false,
                isAuthenticated: true, // Still authenticated even if profile fetch failed
                hasOnboarded: profile ? profile.has_onboarded : true, 
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser({ ...defaultUser, isLoading: false, isAuthenticated: false, hasOnboarded: true });
        }
    }, [supabase]);

    useEffect(() => {
        refreshUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                refreshUser();
            } else {
                setUser({ ...defaultUser, isLoading: false, isAuthenticated: false, hasOnboarded: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [refreshUser, supabase]);

    const updateUser = (updates: Partial<UserState>) => {
        setUser((prev) => ({ ...prev, ...updates }));
    };

    const addCredits = async (amount: number): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credits: user.credits + amount }),
            });
            if (res.ok) {
                setUser((prev) => ({ ...prev, credits: prev.credits + amount }));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const spendCredits = async (amount: number): Promise<boolean> => {
        if (user.credits < amount) return false;
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credits: user.credits - amount }),
            });
            if (res.ok) {
                setUser((prev) => ({ ...prev, credits: prev.credits - amount }));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const incrementStreak = async () => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ streak: user.streak + 1 }),
            });
            if (res.ok) {
                setUser((prev) => ({ ...prev, streak: prev.streak + 1 }));
            }
        } catch (error) {
            console.error("Error incrementing streak:", error);
        }
    };

    const completeOnboarding = async (data: { alias: string, education_level: string, study_goal: string }): Promise<boolean> => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, has_onboarded: true }),
            });
            if (res.ok) {
                setUser((prev) => ({ ...prev, name: data.alias, hasOnboarded: true }));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error completing onboarding:", error);
            return false;
        }
    };

    return (
        <UserContext.Provider value={{ user, refreshUser, updateUser, addCredits, spendCredits, incrementStreak, completeOnboarding }}>
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
