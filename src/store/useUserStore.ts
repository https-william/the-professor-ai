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
    createdAt: string | null;
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
    hasOnboarded: false,
    createdAt: null,
};

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            ...defaultUser,
            updateUser: (updates) => set((state) => ({ ...state, ...updates })),
            
            refreshUser: async () => {
                // Prevent concurrent refreshes which cause AbortErrors and race conditions
                if (get().isLoading) return;
                
                const supabase = createClient();
                set({ isLoading: true });

                try {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
                    if (sessionError || !session?.user) {
                        // Only clear if we're sure there's no session
                        set({ ...defaultUser, isLoading: false, isAuthenticated: false, hasOnboarded: false });
                        return;
                    }
                    
                    if (get().id && get().id !== session.user.id) {
                        set({ ...defaultUser });
                    }
        
                    // Fetch profile from API with strict timeout
                    let profile = null;
                    let email = session.user.email;
        
                    try {
                        const controller = new AbortController();
                        const id = setTimeout(() => controller.abort(), 6000); 

                        const res = await fetch("/api/user/profile", {
                            signal: controller.signal
                        });
                        clearTimeout(id);

                        if (res.ok) {
                            const data = await res.json();
                            profile = data.profile;
                            email = data.email || email;
                        }
                    } catch (fetchError: any) {
                        if (fetchError.name === 'AbortError') {
                            console.warn("[UserStore] Profile fetch timed out or was aborted, using session data.");
                        } else {
                            console.warn("[UserStore] Profile fetch failed:", fetchError);
                        }
                    }
        
                    // Apply state with session data as baseline to prevent "logout on fail"
                    set({
                        id: session.user.id,
                        email: email || session.user.email || "",
                        name: profile?.alias || profile?.first_name || session.user.email?.split("@")[0] || get().name || "Scholar",
                        firstName: profile?.first_name || get().firstName || "",
                        lastName: profile?.last_name || get().lastName || "",
                        username: profile?.username || get().username || "",
                        age: profile?.age || get().age || 0,
                        avatar: profile?.avatar_url || (session.user.email?.[0] || "S").toUpperCase(),
                        streak: profile?.current_streak ?? profile?.streak ?? get().streak ?? 0,
                        credits: profile?.credits ?? get().credits ?? 100,
                        xp: profile?.xp_total ?? profile?.xp ?? get().xp ?? 0,
                        isLoading: false,
                        isAuthenticated: true,
                        hasOnboarded: profile ? !!profile.has_onboarded : get().hasOnboarded,
                        createdAt: session.user.created_at || get().createdAt || null,
                        // Maintain existing stats if new ones are missing
                        streakFreezeCount: profile?.streak_freeze_count ?? get().streakFreezeCount ?? 0,
                        lastStreak: profile?.last_streak ?? get().lastStreak ?? 0,
                        streakResetAt: profile?.streak_reset_at ?? get().streakResetAt ?? null,
                    });

                } catch (error: any) {
                    // Log the error but DON'T log out the user if it's just a network/signal issue
                    console.error("Non-critical error in refreshUser:", error);
                    
                    // If we get an AbortError here, it means getSession() was aborted.
                    // We should just stop loading but keep the current state (which is persisted)
                    if (error.name === 'AbortError') {
                        set({ isLoading: false });
                    } else {
                        // For other critical errors, we still keep the current state if it's already authenticated
                        if (!get().isAuthenticated) {
                            set({ ...defaultUser, isLoading: false, isAuthenticated: false });
                        } else {
                            set({ isLoading: false });
                        }
                    }
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
