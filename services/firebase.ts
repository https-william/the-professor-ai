
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
} catch (error: any) {
  console.error("Firebase Initialization Error:", error);
  if (error.message && error.message.includes("ERR_BLOCKED_BY_CLIENT")) {
      console.warn("🚨 AD-BLOCKER DETECTED: Firebase requests are being blocked. App running in offline/local mode.");
  }
}

export { auth, db, googleProvider };

export const isConfigured = () => {
  return !!firebaseConfig.apiKey;
};

// Helper to safely execute Firestore ops even if blocked
const safeFirestoreOp = async (operation: () => Promise<any>, fallbackMessage: string) => {
    try {
        if (!db) return; // DB Init failed previously
        await operation();
    } catch (error: any) {
        const msg = error.message || '';
        // If it's an ad-blocker error, just log a warning and let the app continue
        if (msg.includes("ERR_BLOCKED_BY_CLIENT") || msg.includes("Failed to fetch")) {
            console.warn(`🔥 AdBlocker Prevented: ${fallbackMessage}. Proceeding locally.`);
        } else {
            // Real errors should be logged
            console.error(error);
        }
    }
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("System not initialized. Check .env configuration or disable AdBlocker.");
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("System not initialized. Check .env configuration or disable AdBlocker.");
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error registering", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("System not initialized. Check .env configuration or disable AdBlocker.");
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
    await safeFirestoreOp(async () => {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, data, { merge: true });
    }, "Sync User Profile");
}

// --- SYSTEM & ADMIN ACTIONS ---

export const logSystemAction = async (action: string, details: string, targetUserId?: string) => {
  if (!auth?.currentUser) return;
  await safeFirestoreOp(async () => {
    await addDoc(collection(db, "system_logs"), {
       action,
       details,
       targetUserId: targetUserId || null,
       adminEmail: auth.currentUser!.email,
       timestamp: serverTimestamp()
    });
  }, "Log System Action");
};

export const logPayment = async (userId: string, tier: string, amount: number, ref: string) => {
  await safeFirestoreOp(async () => {
    await addDoc(collection(db, "payments"), {
      userId,
      tier,
      amount,
      reference: ref,
      timestamp: serverTimestamp()
    });
  }, "Log Payment");
};

// Admin: Update any field for a user
export const adminUpdateUser = async (userId: string, data: Partial<UserProfile>) => {
    await safeFirestoreOp(async () => {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, data, { merge: true });
        await logSystemAction("ADMIN_UPDATE", `Updated user fields: ${Object.keys(data).join(', ')}`, userId);
    }, "Admin Update User");
};

export const updateUserPlan = async (userId: string, newPlan: SubscriptionTier) => {
    await safeFirestoreOp(async () => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { plan: newPlan });
        await logSystemAction("UPDATE_PLAN", `Updated plan to ${newPlan}`, userId);
    }, "Update User Plan");
};

export const toggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    await safeFirestoreOp(async () => {
        const userRef = doc(db, "users", userId);
        const newStatus = !currentBanStatus;
        await updateDoc(userRef, { isBanned: newStatus });
        await logSystemAction(newStatus ? "BAN_USER" : "UNBAN_USER", `User ban status set to ${newStatus}`, userId);
    }, "Ban/Unban User");
};

export const deleteUserAccount = async (userId: string) => {
    await safeFirestoreOp(async () => {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
        await logSystemAction("DELETE_USER", "Deleted user account", userId);
    }, "Delete User");
};

export const resetUserLimits = async (userId: string) => {
    await safeFirestoreOp(async () => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { dailyQuizzesGenerated: 0 });
        await logSystemAction("RESET_LIMITS", "Reset daily generation limits", userId);
    }, "Reset User Limits");
};

export const updateUserUsage = async (userId: string, usage: number) => {
  await safeFirestoreOp(async () => {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { dailyQuizzesGenerated: usage });
  }, "Update Usage");
};

// --- DUEL SYSTEM ---

export const createDuel = async (hostId: string, hostName: string, wager: number, content: string, quizConfig: QuizConfig, quizQuestions: QuizQuestion[]) => {
    if (!db) throw new Error("Database connection required for Duels. Please disable AdBlocker.");
    
    try {
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
    } catch (error: any) {
        // --- ERROR SANITIZATION ---
        const msg = (error.message || '').toLowerCase();
        const code = error.code || '';
        
        if (code === 'permission-denied' || msg.includes("permission") || msg.includes("sufficient")) {
            console.error("🔥 CRITICAL ADMIN ERROR: Firestore Security Rules are blocking writes.");
            throw new Error("The Duel Arena is temporarily locked. Please try again later.");
        }
        
        console.error("Duel Creation Failed:", error);
        throw new Error("Failed to initialize Duel. Connection to the Arena was interrupted.");
    }
};

export const getDuel = async (duelId: string): Promise<DuelState | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, "duels", duelId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as DuelState;
        }
    } catch (error) {
        console.error("Get Duel Error:", error);
    }
    return null;
};

export const joinDuel = async (duelId: string, challengerId: string, challengerName: string) => {
    await safeFirestoreOp(async () => {
        const docRef = doc(db, "duels", duelId);
        await updateDoc(docRef, {
            challengerId,
            challengerName,
            status: 'ACTIVE'
        });
    }, "Join Duel");
};

export const submitDuelScore = async (duelId: string, userId: string, score: number, role: 'host' | 'challenger') => {
    await safeFirestoreOp(async () => {
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
    }, "Submit Duel Score");
};
