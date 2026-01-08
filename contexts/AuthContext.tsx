
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUserProfile } from '../services/supabase';
import { SubscriptionTier, UserRole, UserProfile } from '../types';
import { saveUserProfile, getDefaultProfile } from '../services/storageService';

export interface ExtendedUser {
  uid: string;
  email: string | null;
  profile?: Partial<UserProfile>; 
  hasCompletedOnboarding?: boolean;
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

  const fetchProfile = async (sessionUser: any) => {
      if (!sessionUser) {
          setUser(null);
          setLoading(false);
          return;
      }

      try {
          const profileData = await getUserProfile(sessionUser.id);
          
          const extendedUser: ExtendedUser = {
              uid: sessionUser.id,
              email: sessionUser.email,
              hasCompletedOnboarding: !!profileData?.alias,
              profile: profileData || getDefaultProfile()
          };

          // Sync local storage
          if (profileData) saveUserProfile(profileData);
          
          setUser(extendedUser);
      } catch (e) {
          console.error("Profile Fetch Error", e);
          // Fallback to basic user if DB fails
          setUser({ uid: sessionUser.id, email: sessionUser.email, profile: getDefaultProfile() });
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
        fetchProfile(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        fetchProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchProfile(session?.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
