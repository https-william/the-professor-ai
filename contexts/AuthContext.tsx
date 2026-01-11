
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
      if (session?.user) {
        const currentUser = session.user;
        
        // Fetch Profile from 'profiles' table
        const { data: profile } = await supabase
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
                uid: currentUser.id,
                email: currentUser.email || null,
                displayName: profile.alias || currentUser.user_metadata.full_name,
                photoURL: currentUser.user_metadata.avatar_url,
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
                    dailyQuizzesGenerated: profile.daily_quizzes_generated,
                    ...profile
                }
            };
            
            saveUserProfile(extendedUser.profile as UserProfile);
            setUser(extendedUser);
        } else {
            // New User - Insert default profile
            const newProfile = {
                id: currentUser.id,
                email: currentUser.email,
                role: 'student',
                plan: 'Fresher',
                xp: 500
            };
            await supabase.from('profiles').insert([newProfile]);
            
            setUser({
                uid: currentUser.id,
                email: currentUser.email || null,
                displayName: null,
                photoURL: null,
                plan: 'Fresher',
                role: 'student',
                hasCompletedOnboarding: false,
                profile: { xp: 500 }
            });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    // 1. Check active session immediately (handles OAuth redirect hash parsing)
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted && session) {
            processSession(session);
        } else if (mounted && !session) {
            // If no session found yet, wait for onAuthStateChange or timeout
            // Don't set loading false here immediately to avoid flash of login page if hash parsing is slow
        }
    });

    // 2. Setup Auth Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      await processSession(session);
    });

    // 3. Safety Valve: Force stop loading after 4 seconds if Supabase hangs
    const safetyTimer = setTimeout(() => {
        if (loading) {
            setLoading(false);
        }
    }, 4000);

    return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
        clearTimeout(safetyTimer);
    };
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
