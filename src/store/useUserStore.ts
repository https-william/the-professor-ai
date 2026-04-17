import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

export interface UserState {
    id: string | null;
    name: string;
    firstName: string;
    lastName: string;
    username: string;
    age: number;
    email: string;
    avatar: string;
    streak: number;
    credits: number;
    xp: number;
    rank: number;
    wins: number;
    losses: number;
    winRate: number;
    duelXp: number;
    socialLevel: number;
    rankTitle: string;
    streakFreezeCount: number;
    lastStreak: number;
    streakResetAt: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasOnboarded: boolean;
}

export interface UserStore extends UserState {
    updateUser: (updates: Partial<UserState>) => void;
    refreshUser: () => Promise<void>;
}

export const defaultUser: UserState = {
    id: null,
    name: "Scholar",
    firstName: "",
    lastName: "",
    username: "",
    age: 0,
    email: "",
    avatar: "S",
    streak: 0,
    credits: 0,
    xp: 0,
    rank: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    duelXp: 0,
    socialLevel: 1,
    rankTitle: "Novice",
    streakFreezeCount: 0,
    lastStreak: 0,
    streakResetAt: null,
    isLoading: true,
    isAuthenticated: false,
    hasOnboarded: true,
};

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            ...defaultUser,
            updateUser: (updates) => set((state) => ({ ...state, ...updates })),
            
            refreshUser: async () => {
                const supabase = createClient();
                try {
                    const { data: { session } } = await supabase.auth.getSession();
        
                    if (!session?.user) {
                        set({ ...defaultUser, isLoading: false, isAuthenticated: false, hasOnboarded: true });
                        return;
                    }
        
                    // Fetch profile from API with retry logic
                    let retries = 2;
                    let profile = null;
                    let email = session.user.email;
        
                    while (retries > 0) {
                        try {
                            const res = await fetch("/api/user/profile", {
                                signal: AbortSignal.timeout(10000)
                            });
                            if (res.ok) {
                                const data = await res.json();
                                profile = data.profile;
                                email = data.email || email;
                                break;
                            }
                        } catch (fetchError: any) {
                            if (fetchError.name === 'AbortError') return;
                            console.warn(`Profile fetch attempt failed, ${retries - 1} retries left`);
                        }
                        retries--;
                    }
        
                    // Fetch social stats
                    let socialStats = null;
                    try {
                        const socialRes = await fetch("/api/leaderboard", {
                            signal: AbortSignal.timeout(5000)
                        });
                        if (socialRes.ok) {
                            const socialData = await socialRes.json();
                            if (socialData.userRank) {
                                socialStats = socialData.userRank;
                            }
                        }
                    } catch (err: any) {
                        if (err.name !== 'AbortError') {
                            console.warn("Social stats fetch failed");
                        }
                    }
        
                    // Use session data as fallback if profile fetch fails
                    set({
                        id: profile?.id || session.user.id,
                        name: profile?.alias || profile?.first_name || email?.split("@")[0] || "Scholar",
                        firstName: profile?.first_name || "",
                        lastName: profile?.last_name || "",
                        username: profile?.username || "",
                        age: profile?.age || 0,
                        email: email || "",
                        avatar: profile?.avatar_url || (email?.[0] || "S").toUpperCase(),
                        streak: profile?.current_streak || profile?.streak || 0,
                        credits: profile?.credits || 100,
                        xp: profile?.xp_total || profile?.xp || 0,
                        rank: socialStats?.rank || 0,
                        wins: socialStats?.wins || 0,
                        losses: socialStats?.losses || 0,
                        winRate: socialStats?.winRate || 0,
                        duelXp: socialStats?.duelXp || 0,
                        socialLevel: socialStats?.socialLevel || 1,
                        rankTitle: socialStats?.rankTitle || "Novice",
                        streakFreezeCount: profile?.streak_freeze_count || 0,
                        lastStreak: profile?.last_streak || 0,
                        streakResetAt: profile?.streak_reset_at || null,
                        isLoading: false,
                        isAuthenticated: true,
                        hasOnboarded: profile ? profile.has_onboarded : true, 
                    });
                } catch (error) {
                    console.error("Error fetching user:", error);
                    set({ ...defaultUser, isLoading: false, isAuthenticated: false, hasOnboarded: true });
                }
            }
        }),
        {
            name: "professor-user-storage",
            partialize: (state) => ({ 
                id: state.id, 
                name: state.name, 
                credits: state.credits, 
                xp: state.xp, 
                streak: state.streak,
                streakFreezeCount: state.streakFreezeCount
            }),
        }
    )
);
