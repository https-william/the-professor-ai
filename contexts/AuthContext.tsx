
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
    
    const initializeAuth = async () => {
        // 1. Hash Detection
        // Supabase OAuth redirects contain #access_token=...
        const hash = window.location.hash;
        const isUrlRedirect = hash && (hash.includes('access_token') || hash.includes('type=recovery'));

        // If redirecting, we force loading to stay true until we resolve it
        if (!isUrlRedirect) {
            // No hash? Check existing local session quickly
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                if (session) {
                    await processSession(session);
                }
                // Only turn off loading if we definitely aren't waiting for a redirect
                setLoading(false);
            }
        } else {
            // 2. Handle Redirect Manually
            // Sometimes onAuthStateChange fires too late. We parse manually to be fast.
            try {
                // Remove the # character
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (!error && data.session) {
                        if (mounted) await processSession(data.session);
                        // Clean URL immediately after successful setSession
                        window.history.replaceState(null, '', window.location.pathname);
                        if (mounted) setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Manual hash parse failed", e);
            }
        }
    };

    initializeAuth();

    // 3. Listener as backup
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session) {
          await processSession(session);
          setLoading(false);
      } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
      }
    });

    return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
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
