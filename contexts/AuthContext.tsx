
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

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: async () => {} });

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
            hasCompletedOnboarding: undefined, // undefined until verified
            profile: { xp: 500, credits: 50 } // Default fallback credits
        };

        // Fetch extra profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

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
                    credits: profile.credits ?? 50, // Ensure credits are mapped
                    dailyQuizzesGenerated: profile.daily_quizzes_generated,
                    ...profile
                }
            };
            
            saveUserProfile(extendedUser.profile as UserProfile);
            setUser(extendedUser);
        } else {
            // First time user? Create profile
            const newProfile = {
                id: currentUser.id,
                email: currentUser.email,
                role: 'student',
                plan: 'Fresher',
                xp: 500,
                credits: 50, // Welcome Bonus
                has_completed_onboarding: false
            };
            await supabase.from('profiles').insert([newProfile]);
            setUser({ ...baseUser, hasCompletedOnboarding: false, profile: { ...baseUser.profile, credits: 50 } });
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
              hasCompletedOnboarding: false, // Default to false if DB fails
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Only re-process if we don't have a user or user ID changed
        setUser(prev => {
            if (prev?.uid === session.user.id) return prev;
            processSession(session);
            return prev;
        });
      } else {
        setUser(null);
        setLoading(false);
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
