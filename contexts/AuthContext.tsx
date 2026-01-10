
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

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const currentUser = session.user;
        
        // Fetch Profile from 'profiles' table
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
                    // Map other fields from DB snake_case to camelCase
                    ...profile
                }
            };
            
            // Sync local storage
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
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
              setUser(prev => prev ? ({ 
                  ...prev, 
                  plan: profile.plan, 
                  profile: { ...prev.profile, ...profile } 
              }) : null);
          }
      }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
