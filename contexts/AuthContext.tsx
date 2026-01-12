
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

  // Helper to fetch and merge profile data
  const processSession = async (session: any) => {
      if (!session?.user) {
          setUser(null);
          return;
      }

      try {
        const currentUser = session.user;
        
        // Fetch Profile from 'profiles' table
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error("Profile fetch error:", error);
        }

        if (profile) {
            if (profile.is_banned) {
                await supabase.auth.signOut();
                setUser(null);
                alert("Account suspended by administration.");
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
            // New User - Insert default profile if it doesn't exist
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
      } catch (err) {
          console.error("Session processing error:", err);
          setUser(null);
      }
  };

  useEffect(() => {
    let mounted = true;
    
    // Check if we are expecting a redirect (contains access_token)
    // If so, we want to stay in 'loading' state until the listener fires.
    // If not, we want to resolve loading immediately if no session exists.
    const isRedirect = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'));

    const initializeAuth = async () => {
        // 1. Setup Listener (Supabase SDK handles URL parsing automatically here)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            
            if (session) {
                await processSession(session);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
            
            // Listener fired, so we are definitely done loading
            setLoading(false);
        });

        // 2. Check current local session (fast check)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                if (session) {
                    await processSession(session);
                    setLoading(false); // Session found, stop loading
                } else {
                    // No local session found.
                    // CRITICAL: Only stop loading if we are NOT waiting for a redirect hash.
                    // If we ARE waiting for a redirect, the onAuthStateChange above will handle it.
                    if (!isRedirect) {
                        setLoading(false);
                    }
                }
            }
        } catch (e) {
            console.error("Auth Init Error", e);
            if (!isRedirect) setLoading(false);
        }

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    };

    const cleanupPromise = initializeAuth();

    // 3. Fallback Safety Timer
    // If for some reason Supabase never fires (e.g. network hang on redirect), allow app to load eventually.
    // We only need a long timeout if we are redirecting; otherwise it should be instant.
    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.warn("Auth timeout. Releasing lock.");
            setLoading(false);
        }
    }, isRedirect ? 10000 : 2000); 

    return () => {
        mounted = false;
        clearTimeout(safetyTimer);
        cleanupPromise.then(cleanup => cleanup && cleanup());
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
