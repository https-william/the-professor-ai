
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  Auth
} from "firebase/auth";
import { getFirestore, doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { SubscriptionTier } from "../types";

// --- SECURE CONFIGURATION LOADER ---
// Strictly uses environment variables. No hardcoded fallbacks.
const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Return empty string if missing - let validation handle it
  return "";
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID")
};

// Initialize Firebase
let app;
let auth: Auth;
let googleProvider: GoogleAuthProvider;
let db: any;

try {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase Configuration Missing. Please check your .env file.");
  } else {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { auth, db, googleProvider };

export const isConfigured = () => {
  return !!firebaseConfig.apiKey;
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("System not initialized. Missing configuration.");
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("System not initialized. Missing configuration.");
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error registering", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("System not initialized. Missing configuration.");
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error logging in", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

// --- SYSTEM & ADMIN ACTIONS ---

export const logSystemAction = async (action: string, details: string, targetUserId?: string) => {
  if (!auth?.currentUser || !db) return;
  try {
    await addDoc(collection(db, "system_logs"), {
       action,
       details,
       targetUserId: targetUserId || null,
       adminEmail: auth.currentUser.email,
       timestamp: serverTimestamp()
    });
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
      console.warn("Failed to log action:", e.message);
    }
  }
};

export const logPayment = async (userId: string, tier: string, amount: number, ref: string) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "payments"), {
      userId,
      tier,
      amount,
      reference: ref,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to log payment", e);
  }
};

export const updateUserPlan = async (userId: string, newPlan: SubscriptionTier) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { plan: newPlan });
    await logSystemAction("UPDATE_PLAN", `Updated plan to ${newPlan}`, userId);
};

export const toggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const newStatus = !currentBanStatus;
    await updateDoc(userRef, { isBanned: newStatus });
    await logSystemAction(newStatus ? "BAN_USER" : "UNBAN_USER", `User ban status set to ${newStatus}`, userId);
};

export const deleteUserAccount = async (userId: string) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    await logSystemAction("DELETE_USER", "Deleted user account", userId);
};

export const resetUserLimits = async (userId: string) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { dailyQuizzesGenerated: 0 });
    await logSystemAction("RESET_LIMITS", "Reset daily generation limits", userId);
};

export const updateUserUsage = async (userId: string, usage: number) => {
  if (!db) return;
  try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { dailyQuizzesGenerated: usage });
  } catch(e) {
      // Ignore permission errors
  }
};
