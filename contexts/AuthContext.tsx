
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from '../services/firebase';
import { SubscriptionTier, UserRole, UserProfile } from '../types';
import { saveUserProfile } from '../services/storageService';

export interface ExtendedUser extends User {
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
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!db) {
            // Offline/No-DB Mode Fallback
            setUser({ ...currentUser } as ExtendedUser);
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        
        // REAL-TIME LISTENER
        unsubscribeUserDoc = onSnapshot(userDocRef, async (userSnap) => {
            if (userSnap.exists()) {
                const userData = userSnap.data();
                
                if (userData.isBanned) {
                    await signOut(auth);
                    setUser(null);
                    alert("Your account has been expelled from The Professor's academy.");
                    return;
                }

                const profileData = {
                     alias: userData.alias,
                     fullName: userData.fullName,
                     school: userData.school,
                     academicLevel: userData.academicLevel,
                     country: userData.country,
                     age: userData.age,
                     socials: userData.socials || {},
                     xp: userData.xp || 0,
                     avatarGradient: userData.avatarGradient,
                     studyReminders: userData.studyReminders,
                     reminderTime: userData.reminderTime,
                     ambientTheme: userData.ambientTheme,
                     dailyQuizzesGenerated: userData.dailyQuizzesGenerated,
                     // Add other synced fields
                };

                const extendedUser: ExtendedUser = {
                  ...currentUser,
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                  plan: userData.plan || 'Fresher',
                  role: userData.role || 'student',
                  isBanned: userData.isBanned || false,
                  hasCompletedOnboarding: userData.hasCompletedOnboarding ?? false,
                  profile: profileData
                };
                
                // Sync to local storage for offline use
                saveUserProfile(profileData as UserProfile);
                
                setUser(extendedUser);
                setLoading(false);
            } else {
                // Initialize new user
                const newUser = {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  photoURL: currentUser.photoURL,
                  plan: 'Fresher',
                  role: 'student',
                  createdAt: serverTimestamp(),
                  isBanned: false,
                  hasCompletedOnboarding: false,
                  xp: 500 // Signing Bonus
                };
                await setDoc(userDocRef, newUser, { merge: true });
            }
        }, (error) => {
            console.error("Auth Snapshot Error", error);
            // Fallback if snapshot fails (e.g. permission denied)
            setUser({ ...currentUser } as ExtendedUser);
            setLoading(false);
        });

      } else {
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const refreshUser = async () => {
    // No-op for snapshot listeners, they update automatically
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
