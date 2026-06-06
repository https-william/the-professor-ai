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
    syncError: boolean;
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    createdAt: string | null;
    notificationEmail: boolean;
    notificationPush: boolean;
    dailyGoalMinutes: number;
    difficultyPreference: string;
    themePreference: string;
    planStatus: 'free' | 'plus' | 'unlimited';
    subscriptionEndDate: string | null;
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
    syncError: false,
    isAuthenticated: false,
    hasOnboarded: false,
    createdAt: null,
    notificationEmail: true,
    notificationPush: true,
    dailyGoalMinutes: 30,
    difficultyPreference: "medium",
    themePreference: "dark",
    planStatus: "free",
    subscriptionEndDate: null,
};

let isRefreshing = false;

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            ...defaultUser,
            updateUser: (updates) => set((state) => ({ ...state, ...updates })),
            
            refreshUser: async () => {
                // Prevent concurrent refreshes which cause AbortErrors and race conditions
                if (isRefreshing) return;
                isRefreshing = true;
                
                const supabase = createClient();
                // Only show global loading on the first ever load, otherwise sync in background
                if (!get().id) {
                    set({ isLoading: true });
                }

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
                        const id = setTimeout(() => controller.abort(), 5000); 
 
                        const res = await fetch(`/api/user/profile?t=${Date.now()}`, {
                            cache: "no-store",
                            headers: session.access_token ? {
                                Authorization: `Bearer ${session.access_token}`
                            } : undefined,
                            signal: controller.signal
                        });
                        clearTimeout(id);

                        if (res.ok) {
                            const contentType = res.headers.get("content-type");
                            if (contentType && contentType.includes("application/json")) {
                                const data = await res.json();
                                profile = data.profile;
                                email = data.email || email;
                            } else {
                                const text = await res.text();
                                console.warn("[UserStore] Expected JSON profile but got HTML fallback:", text.slice(0, 100));
                            }
                        }
                    } catch (fetchError: any) {
                        if (fetchError.name === 'AbortError') {
                            console.warn("[UserStore] Profile fetch timed out or was aborted, using session data.");
                        } else {
                            console.warn("[UserStore] Profile fetch failed:", fetchError);
                        }
                    }
        
                    let localDisplayName = "";
                    if (typeof window !== "undefined") {
                        localDisplayName = localStorage.getItem("user_display_name") || "";
                    }

                    // Apply state with session data as baseline to prevent "logout on fail"
                    set({
                        id: session.user.id,
                        email: email || session.user.email || "",
                        name: localDisplayName || profile?.alias || profile?.first_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || get().name || session.user.email?.split("@")[0] || "Scholar",
                        firstName: profile?.first_name || session.user.user_metadata?.first_name || session.user.user_metadata?.full_name?.split(" ")[0] || get().firstName || "",
                        lastName: profile?.last_name || session.user.user_metadata?.last_name || session.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || get().lastName || "",
                        username: profile?.username || get().username || "",
                        age: profile?.age || get().age || 0,
                        avatar: (profile?.avatar_url && (profile.avatar_url.startsWith("http") || profile.avatar_url.includes("://"))) 
                            ? profile.avatar_url 
                            : (session.user.email?.[0] || "S").toUpperCase(),
                        streak: profile?.current_streak ?? profile?.streak ?? get().streak ?? 0,
                        credits: profile?.credits ?? get().credits ?? 100,
                        xp: profile?.xp_total ?? profile?.xp ?? get().xp ?? 0,
                        isLoading: false,
                        isAuthenticated: true,
                        hasOnboarded: profile ? !!profile.has_onboarded : get().hasOnboarded,
                        createdAt: session.user.created_at || get().createdAt || null,
                        syncError: false,
                        // Maintain existing stats if new ones are missing
                        streakFreezeCount: profile?.streak_freeze_count ?? get().streakFreezeCount ?? 0,
                        lastStreak: profile?.last_streak ?? get().lastStreak ?? 0,
                        streakResetAt: profile?.streak_reset_at ?? get().streakResetAt ?? null,
                        notificationEmail: profile?.notification_email ?? get().notificationEmail ?? true,
                        notificationPush: profile?.notification_push ?? get().notificationPush ?? true,
                        dailyGoalMinutes: profile?.daily_goal_minutes ?? get().dailyGoalMinutes ?? 30,
                        difficultyPreference: profile?.difficulty_preference ?? get().difficultyPreference ?? "medium",
                        themePreference: profile?.theme_preference ?? get().themePreference ?? "dark",
                        planStatus: profile?.plan_status ?? get().planStatus ?? "free",
                        subscriptionEndDate: profile?.subscription_end_date ?? get().subscriptionEndDate ?? null,
                    });

                } catch (error: any) {
                    // Log the error but DON'T log out the user if it's just a network/signal issue
                    console.error("Non-critical error in refreshUser:", error);
                    
                    // If we get an AbortError here, it means getSession() was aborted.
                    // We should just stop loading but keep the current state (which is persisted)
                    if (error.name === 'AbortError') {
                        set({ isLoading: false, syncError: true });
                    } else {
                        // For other critical errors, we still keep the current state if it's already authenticated
                        if (!get().isAuthenticated) {
                            set({ ...defaultUser, isLoading: false, isAuthenticated: false, syncError: true });
                        } else {
                            set({ isLoading: false, syncError: true });
                        }
                    }
                } finally {
                    isRefreshing = false;
                }
            }
        }),
        {
            name: "professor-user-storage",
            partialize: (state) => ({ 
                id: state.id, 
                name: state.name, 
                username: state.username,
                firstName: state.firstName,
                lastName: state.lastName,
                credits: state.credits, 
                xp: state.xp, 
                streak: state.streak,
                streakFreezeCount: state.streakFreezeCount,
                notificationEmail: state.notificationEmail,
                notificationPush: state.notificationPush,
                dailyGoalMinutes: state.dailyGoalMinutes,
                difficultyPreference: state.difficultyPreference,
                themePreference: state.themePreference,
                planStatus: state.planStatus,
                subscriptionEndDate: state.subscriptionEndDate
            }),
        }
    )
);
