
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
import { getFirestore, doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { SubscriptionTier, UserProfile, DuelState, QuizQuestion, QuizConfig } from "../types";

// --- SECURE CONFIGURATION ---
const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
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
  if (!getApps().length) {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }
  
  if (app) {
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
  if (!auth) throw new Error("System not initialized. Check .env configuration.");
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("System not initialized. Check .env configuration.");
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error registering", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("System not initialized. Check .env configuration.");
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

// --- USER DATA SYNC ---
export const saveUserToFirestore = async (userId: string, data: Partial<UserProfile>) => {
    if (!db) return;
    try {
        const userRef = doc(db, "users", userId);
        // Use setDoc with merge: true to allow creating or updating without overwriting missing fields
        await setDoc(userRef, data, { merge: true });
    } catch (e) {
        console.error("Failed to sync user profile", e);
    }
}

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
    // Ignore permission errors in console
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

// Admin: Update any field for a user
export const adminUpdateUser = async (userId: string, data: Partial<UserProfile>) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, data, { merge: true });
    await logSystemAction("ADMIN_UPDATE", `Updated user fields: ${Object.keys(data).join(', ')}`, userId);
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

// --- DUEL SYSTEM ---

export const createDuel = async (hostId: string, hostName: string, wager: number, content: string, quizConfig: QuizConfig, quizQuestions: QuizQuestion[]) => {
    if (!db) throw new Error("Database not connected");
    const duelData: Omit<DuelState, 'id'> = {
        hostId,
        hostName,
        wager,
        content,
        quizConfig,
        quizQuestions,
        status: 'WAITING'
    };
    const docRef = await addDoc(collection(db, "duels"), duelData);
    return docRef.id;
};

export const getDuel = async (duelId: string): Promise<DuelState | null> => {
    if (!db) return null;
    const docRef = doc(db, "duels", duelId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as DuelState;
    }
    return null;
};

export const joinDuel = async (duelId: string, challengerId: string, challengerName: string) => {
    if (!db) return;
    const docRef = doc(db, "duels", duelId);
    await updateDoc(docRef, {
        challengerId,
        challengerName,
        status: 'ACTIVE'
    });
};

export const submitDuelScore = async (duelId: string, userId: string, score: number, role: 'host' | 'challenger') => {
    if (!db) return;
    const docRef = doc(db, "duels", duelId);
    const update = role === 'host' ? { hostScore: score } : { challengerScore: score };
    await updateDoc(docRef, update);
    
    // Check if both scores are in to declare winner
    const snap = await getDoc(docRef);
    const data = snap.data();
    if (data && data.hostScore !== undefined && data.challengerScore !== undefined) {
        let winnerId = null;
        if (data.hostScore > data.challengerScore) winnerId = data.hostId;
        else if (data.challengerScore > data.hostScore) winnerId = data.challengerId;
        else winnerId = 'DRAW';
        
        await updateDoc(docRef, { status: 'COMPLETED', winnerId });
    }
};
