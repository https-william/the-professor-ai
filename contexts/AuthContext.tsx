
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../services/firebase';
import { SubscriptionTier, UserRole, UserProfile } from '../types';

interface ExtendedUser extends User {
  plan?: SubscriptionTier;
  role?: UserRole;
  isBanned?: boolean;
  hasCompletedOnboarding?: boolean; // Added this
  profile?: Partial<UserProfile>; // store fetched profile snippet
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

  const fetchUserData = async (currentUser: User) => {
    try {
      if (!db) return;
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        if (userData.isBanned) {
            await signOut(auth);
            setUser(null);
            alert("Your account has been expelled from The Professor's academy.");
            return;
        }

        const extendedUser: ExtendedUser = {
          ...currentUser,
          plan: 'Excellentia Supreme', // Launch Week Override
          role: userData.role || 'student',
          isBanned: userData.isBanned || false,
          hasCompletedOnboarding: userData.hasCompletedOnboarding ?? false,
          profile: {
             alias: userData.alias,
             school: userData.school,
             academicLevel: userData.academicLevel,
             country: userData.country,
             ambientTheme: userData.ambientTheme
          }
        };
        setUser(extendedUser);
      } else {
        // Create minimal record if doesn't exist
        const newUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          plan: 'Fresher',
          role: 'student',
          createdAt: serverTimestamp(),
          isBanned: false,
          hasCompletedOnboarding: false // Explicitly false for new users
        };
        await setDoc(userDocRef, newUser);
        
        const extendedUser: ExtendedUser = {
          ...currentUser,
          plan: 'Excellentia Supreme',
          role: 'student',
          isBanned: false,
          hasCompletedOnboarding: false
        };
        setUser(extendedUser);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback
      const fallbackUser: ExtendedUser = {
          ...currentUser,
          plan: 'Excellentia Supreme',
          role: 'student'
      };
      setUser(fallbackUser);
    }
  };

  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (currentUser) {
            await fetchUserData(currentUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
