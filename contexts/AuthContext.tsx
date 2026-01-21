
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { SubscriptionTier, UserRole, UserProfile } from '../types';
import { saveUserProfile } from '../services/storageService';

export interface ExtendedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan?: SubscriptionTier;
  role?: UserRole;
  isBanned?: boolean;
  hasCompletedOnboarding?: boolean;
  profile?: Partial<UserProfile>;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: async () => { } });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const processSession = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = session.user;

      // Basic user structure with undefined onboarding status initially
      const baseUser: ExtendedUser = {
        uid: currentUser.id,
        email: currentUser.email || null,
        displayName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
        photoURL: currentUser.user_metadata?.avatar_url,
        plan: 'Fresher',
        role: 'student',
        hasCompletedOnboarding: undefined,
        profile: { xp: 500, credits: 50, hasCompletedOnboarding: false }
      };

      // Optimistic Load: Use metadata first if possible? No, we need profile for bans/credits.
      // But we can RACE the profile fetch.

      const fetchProfile = supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000));

      // Race: If DB takes > 4s, we load with partial data (Fresher) and fetch in background
      let profile: any = null;
      try {
        const { data } = await Promise.race([fetchProfile, timeout]) as any;
        profile = data;
      } catch (e) {
        console.warn("Profile fetch timed out or failed. Using default.");
      }

      if (profile) {
        if (profile.is_banned) {
          await supabase.auth.signOut();
          setUser(null);
          alert("Account suspended by administration.");
          setLoading(false);
          return;
        }

        const extendedUser: ExtendedUser = {
          ...baseUser,
          displayName: profile.alias || baseUser.displayName,
          plan: profile.plan || 'Fresher',
          role: profile.role || 'student',
          isBanned: profile.is_banned,
          hasCompletedOnboarding: profile.has_completed_onboarding ?? false,
          profile: {
            alias: profile.alias,
            fullName: profile.full_name,
            school: profile.school,
            country: profile.country,
            xp: profile.xp,
            credits: profile.credits ?? 50,
            dailyQuizzesGenerated: profile.daily_quizzes_generated,
            hasCompletedOnboarding: profile.has_completed_onboarding,
            ...profile
          }
        };

        saveUserProfile(extendedUser.profile as UserProfile);
        setUser(extendedUser);
      } else {
        // Profile doesn't exist OR Timed/Errored out
        // If it error'd out, we might create a duplicate if we insert? 
        // Better to just set User to base and let standard logic handle creation later if needed
        // For now, if no profile found, we create one.
        if (!profile && !fetchProfile.then) { // Check if we actually tried and got null vs timeout
          // It was a true 404
          const newProfile = {
            id: currentUser.id,
            email: currentUser.email,
            role: 'student',
            plan: 'Fresher',
            xp: 500,
            credits: 50,
            has_completed_onboarding: false
          };
          const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
          if (!insertError) {
            setUser({ ...baseUser, hasCompletedOnboarding: false });
          } else {
            // Fallback if insert fails (maybe it existed and we just timed out?)
            setUser(baseUser);
          }
        } else {
          // It communicated but timed out, show base user
          setUser(baseUser);
        }
      }
    } catch (err) {
      console.error("Session processing error:", err);
      // Fallback
      setUser({
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.email?.split('@')[0],
        photoURL: null,
        plan: 'Fresher',
        role: 'student',
        hasCompletedOnboarding: false,
        profile: { xp: 500, credits: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check active session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processSession(session);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes (SignIn, SignOut, Auto-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // OPTIMIZATION: Check if we already have this user loaded to avoid re-fetching profile
        if (user?.uid === session.user.id) return;

        await processSession(session);
      } else {
        if (user !== null) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await processSession(session);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
