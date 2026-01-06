
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
import { getFirestore, doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp, setDoc, getDoc, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { SubscriptionTier, UserProfile, DuelState, QuizQuestion, QuizConfig, DuelParticipant, ProfessorSection } from "../types";

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

// --- DUEL SYSTEM (THE ARENA) ---

const generateDuelCode = (): string => {
    const ADJ = ["IRON", "NEON", "CYBER", "VOID", "AZURE", "SOLAR", "LUNAR", "HYPER", "DARK", "SILENT", "ATOMIC", "PRIME", "OMEGA", "NOVA"];
    const NOUN = ["TIGER", "WOLF", "EAGLE", "STORM", "VORTEX", "CORE", "FLAME", "SHARD", "TITAN", "GHOST", "PULSE", "VIPER", "DRIFT", "ECHO"];
    const adj = ADJ[Math.floor(Math.random() * ADJ.length)];
    const noun = NOUN[Math.floor(Math.random() * NOUN.length)];
    return `${adj}-${noun}`;
};

export const initDuelLobby = async (hostId: string, hostName: string, wager: number, content: string, quizConfig: QuizConfig): Promise<{ duelId: string, code: string }> => {
    if (!db) throw new Error("Database connection required for Duels. Please disable AdBlocker.");
    
    try {
        const code = generateDuelCode();
        
        const participants: DuelParticipant[] = [{
            id: hostId,
            name: hostName,
            status: 'JOINED'
        }];

        const duelData: Omit<DuelState, 'id'> = {
            code,
            hostId,
            participants,
            wager,
            content, 
            quizConfig,
            status: 'INITIALIZING', 
            createdAt: Date.now()
        };
        
        const docRef = await addDoc(collection(db, "duels"), duelData);
        return { duelId: docRef.id, code };
    } catch (error: any) {
        console.error("Duel Init Failed:", error);
        throw new Error("Failed to initialize Arena.");
    }
};

export const updateDuelWithQuestions = async (duelId: string, questions: QuizQuestion[]) => {
    await safeFirestoreOp(async () => {
        const docRef = doc(db, "duels", duelId);
        await updateDoc(docRef, {
            quizQuestions: questions,
            status: 'WAITING'
        });
    }, "Update Duel Content");
};

export const joinDuelByCode = async (code: string, userId: string, userName: string): Promise<string> => {
    if (!db) throw new Error("Offline.");
    
    const q = query(collection(db, "duels"), where("code", "==", code.toUpperCase()), where("status", "in", ["INITIALIZING", "WAITING"]));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error("Arena not found or active.");
    
    const duelDoc = snapshot.docs[0];
    const duelData = duelDoc.data() as DuelState;
    
    if (duelData.participants.some(p => p.id === userId)) return duelDoc.id;
    
    const newParticipant: DuelParticipant = {
        id: userId,
        name: userName,
        status: 'JOINED'
    };
    
    await updateDoc(doc(db, "duels", duelDoc.id), {
        participants: [...duelData.participants, newParticipant]
    });
    
    return duelDoc.id;
};

export const subscribeToDuel = (duelId: string, onUpdate: (data: DuelState) => void) => {
    if (!db) return () => {};
    const unsub = onSnapshot(doc(db, "duels", duelId), (doc) => {
        if (doc.exists()) {
            onUpdate({ id: doc.id, ...doc.data() } as DuelState);
        }
    });
    return unsub;
};

export const startDuel = async (duelId: string) => {
    await safeFirestoreOp(async () => {
        const docRef = doc(db, "duels", duelId);
        await updateDoc(docRef, { status: 'ACTIVE' });
    }, "Start Duel");
};

export const getDuel = async (duelId: string): Promise<DuelState | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, "duels", duelId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as DuelState;
        }
        return null;
    } catch (e) {
        console.error("Error fetching duel:", e);
        return null;
    }
};

export const submitDuelScore = async (duelId: string, userId: string, score: number) => {
    if (!db) return;
    const duelRef = doc(db, "duels", duelId);
    try {
        const snap = await getDoc(duelRef);
        if (!snap.exists()) return;
        const data = snap.data() as DuelState;
        const updatedParticipants = data.participants.map(p => 
            p.id === userId ? { ...p, score, status: 'COMPLETED' } : p
        );
        const allDone = updatedParticipants.every(p => p.status === 'COMPLETED');
        let updateData: any = { participants: updatedParticipants };
        if (allDone) {
            const sorted = [...updatedParticipants].sort((a, b) => (b.score || 0) - (a.score || 0));
            if (sorted.length > 1 && sorted[0].score === sorted[1].score) {
                updateData.status = 'SUDDEN_DEATH_PENDING';
            } else {
                updateData.status = 'COMPLETED';
                updateData.winnerId = sorted[0].id;
            }
        }
        await updateDoc(duelRef, updateData as any);
    } catch (e) {
        console.error("Score Submit Error", e);
    }
};

export const activateSuddenDeath = async (duelId: string, question: QuizQuestion) => {
    await safeFirestoreOp(async () => {
        const docRef = doc(db, "duels", duelId);
        await updateDoc(docRef, {
            status: 'SUDDEN_DEATH_ACTIVE',
            suddenDeathQuestion: question
        });
    }, "Activate Sudden Death");
};

export const submitSuddenDeathAnswer = async (duelId: string, userId: string, isCorrect: boolean) => {
    if (!db) return;
    const duelRef = doc(db, "duels", duelId);
    try {
        const snap = await getDoc(duelRef);
        if (!snap.exists()) return;
        const data = snap.data() as DuelState;
        const updatedParticipants = data.participants.map(p => 
            p.id === userId ? { ...p, score: isCorrect ? (p.score || 0) + 1 : (p.score || 0), suddenDeathStatus: 'COMPLETED' } : p
        );
        const allSDDone = updatedParticipants.every(p => p.suddenDeathStatus === 'COMPLETED');
        let updateData: any = { participants: updatedParticipants };
        if (allSDDone) {
            updateData.status = 'COMPLETED';
            const sorted = [...updatedParticipants].sort((a, b) => (b.score || 0) - (a.score || 0));
            updateData.winnerId = sorted[0].id;
        }
        await updateDoc(duelRef, updateData as any);
    } catch (e) {
        console.error("SD Submit Error", e);
    }
};

// --- THE HUB (REAL-TIME STUDY ROOMS) ---

export const createHubRoom = async (hostAlias: string, modules: ProfessorSection[]): Promise<string> => {
    if (!db) throw new Error("Offline.");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await addDoc(collection(db, "hubs"), {
        code,
        host: hostAlias,
        modules,
        createdAt: serverTimestamp(),
        participants: [hostAlias]
    });
    return code;
};

export const joinHubRoom = async (code: string, userAlias: string): Promise<string> => {
    if (!db) throw new Error("Offline.");
    const q = query(collection(db, "hubs"), where("code", "==", code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error("Room not found.");
    
    const roomDoc = snapshot.docs[0];
    const data = roomDoc.data();
    
    const participants = data.participants || [];
    if (!participants.includes(userAlias)) {
        await updateDoc(doc(db, "hubs", roomDoc.id), {
            participants: [...participants, userAlias]
        });
    }
    
    return roomDoc.id;
};

export const subscribeToHubRoom = (roomId: string, onUpdate: (data: any) => void) => {
    if (!db) return () => {};
    return onSnapshot(doc(db, "hubs", roomId), (doc) => {
        if (doc.exists()) onUpdate({ id: doc.id, ...doc.data() });
    });
};

export const sendHubMessage = async (roomId: string, sender: string, content: string) => {
    if (!db) return;
    await addDoc(collection(db, "hubs", roomId, "messages"), {
        sender,
        content,
        timestamp: serverTimestamp()
    });
};

export const subscribeToHubMessages = (roomId: string, onUpdate: (msgs: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, "hubs", roomId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(msgs);
    });
};
