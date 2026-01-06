
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
  // Check critical keys
  if (!firebaseConfig.apiKey) {
      console.warn("Firebase Configuration Missing: API Key not found in environment.");
  }

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
}

export { auth, db, googleProvider };

export const isConfigured = () => {
  return !!firebaseConfig.apiKey && !!auth;
};

// --- AUTHENTICATION ---

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Authentication System Unavailable. Check API Keys.");
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("Authentication System Unavailable. Check API Keys.");
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error registering", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("Authentication System Unavailable. Check API Keys.");
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

// --- FIRESTORE HELPERS ---

const ensureDB = () => {
    if (!db) throw new Error("Database connection unavailable. Check internet connection or ad-blockers.");
};

export const saveUserToFirestore = async (userId: string, data: Partial<UserProfile>) => {
    try {
        ensureDB();
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, data, { merge: true });
    } catch (e) {
        console.error("Sync Profile Error:", e);
    }
}

// --- SYSTEM ACTIONS ---

export const logSystemAction = async (action: string, details: string, targetUserId?: string) => {
  if (!auth?.currentUser || !db) return;
  try {
    await addDoc(collection(db, "system_logs"), {
       action,
       details,
       targetUserId: targetUserId || null,
       adminEmail: auth.currentUser!.email,
       timestamp: serverTimestamp()
    });
  } catch (e) { console.error(e); }
};

export const logPayment = async (userId: string, tier: string, amount: number, ref: string) => {
  try {
    ensureDB();
    await addDoc(collection(db, "payments"), {
      userId,
      tier,
      amount,
      reference: ref,
      timestamp: serverTimestamp()
    });
  } catch (e) { console.error(e); }
};

// --- ADMIN ---

export const adminUpdateUser = async (userId: string, data: Partial<UserProfile>) => {
    ensureDB();
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, data, { merge: true });
};

export const updateUserPlan = async (userId: string, newPlan: SubscriptionTier) => {
    ensureDB();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { plan: newPlan });
};

export const toggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    ensureDB();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isBanned: !currentBanStatus });
};

export const deleteUserAccount = async (userId: string) => {
    ensureDB();
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
};

export const resetUserLimits = async (userId: string) => {
    ensureDB();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { dailyQuizzesGenerated: 0 });
};

export const updateUserUsage = async (userId: string, usage: number) => {
  try {
      ensureDB();
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { dailyQuizzesGenerated: usage });
  } catch (e) { /* silent fail for usage stats */ }
};

// --- DUEL SYSTEM (THE ARENA) ---

export const initDuelLobby = async (hostId: string, hostName: string, wager: number, content: string, quizConfig: QuizConfig): Promise<{ duelId: string, code: string }> => {
    ensureDB();
    const ADJ = ["IRON", "NEON", "CYBER", "VOID", "AZURE", "SOLAR", "LUNAR", "HYPER", "DARK", "SILENT"];
    const NOUN = ["TIGER", "WOLF", "EAGLE", "STORM", "VORTEX", "CORE", "FLAME", "SHARD", "TITAN", "GHOST"];
    const code = `${ADJ[Math.floor(Math.random()*ADJ.length)]}-${NOUN[Math.floor(Math.random()*NOUN.length)]}`;

    const participants: DuelParticipant[] = [{ id: hostId, name: hostName, status: 'JOINED' }];
    const duelData: Omit<DuelState, 'id'> = {
        code, hostId, participants, wager, content, quizConfig, status: 'INITIALIZING', createdAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, "duels"), duelData);
    return { duelId: docRef.id, code };
};

export const updateDuelWithQuestions = async (duelId: string, questions: QuizQuestion[]) => {
    ensureDB();
    const docRef = doc(db, "duels", duelId);
    await updateDoc(docRef, { quizQuestions: questions, status: 'WAITING' });
};

export const joinDuelByCode = async (code: string, userId: string, userName: string): Promise<string> => {
    ensureDB();
    const q = query(collection(db, "duels"), where("code", "==", code.toUpperCase()), where("status", "in", ["INITIALIZING", "WAITING"]));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) throw new Error("Arena not found or active.");
    
    const duelDoc = snapshot.docs[0];
    const duelData = duelDoc.data() as DuelState;
    
    if (duelData.participants.some(p => p.id === userId)) return duelDoc.id;
    
    const newParticipant: DuelParticipant = { id: userId, name: userName, status: 'JOINED' };
    await updateDoc(doc(db, "duels", duelDoc.id), { participants: [...duelData.participants, newParticipant] });
    return duelDoc.id;
};

export const subscribeToDuel = (duelId: string, onUpdate: (data: DuelState) => void) => {
    if (!db) return () => {};
    return onSnapshot(doc(db, "duels", duelId), (doc) => {
        if (doc.exists()) onUpdate({ id: doc.id, ...doc.data() } as DuelState);
    });
};

export const startDuel = async (duelId: string) => {
    ensureDB();
    await updateDoc(doc(db, "duels", duelId), { status: 'ACTIVE' });
};

export const getDuel = async (duelId: string): Promise<DuelState | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, "duels", duelId);
        const snap = await getDoc(docRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } as DuelState : null;
    } catch (e) { return null; }
};

export const submitDuelScore = async (duelId: string, userId: string, score: number) => {
    if (!db) return;
    try {
        const duelRef = doc(db, "duels", duelId);
        const snap = await getDoc(duelRef);
        if (!snap.exists()) return;
        
        const data = snap.data() as DuelState;
        const updatedParticipants = data.participants.map(p => 
            p.id === userId ? { ...p, score, status: 'COMPLETED' } : p
        );
        
        let updateData: any = { participants: updatedParticipants };
        
        if (updatedParticipants.every(p => p.status === 'COMPLETED')) {
            const sorted = [...updatedParticipants].sort((a, b) => (b.score || 0) - (a.score || 0));
            if (sorted.length > 1 && sorted[0].score === sorted[1].score) {
                updateData.status = 'SUDDEN_DEATH_PENDING';
            } else {
                updateData.status = 'COMPLETED';
                updateData.winnerId = sorted[0].id;
            }
        }
        await updateDoc(duelRef, updateData as any);
    } catch (e) { console.error(e); }
};

export const activateSuddenDeath = async (duelId: string, question: QuizQuestion) => {
    ensureDB();
    await updateDoc(doc(db, "duels", duelId), {
        status: 'SUDDEN_DEATH_ACTIVE',
        suddenDeathQuestion: question
    });
};

export const submitSuddenDeathAnswer = async (duelId: string, userId: string, isCorrect: boolean) => {
    ensureDB();
    const duelRef = doc(db, "duels", duelId);
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
};

// --- THE HUB (REAL-TIME SYNC ONLY) ---

export const createHubRoom = async (hostAlias: string, modules: ProfessorSection[]): Promise<string> => {
    ensureDB();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ref = await addDoc(collection(db, "hubs"), {
        code,
        host: hostAlias,
        modules,
        createdAt: serverTimestamp(),
        participants: [hostAlias]
    });
    return ref.id;
};

export const joinHubRoom = async (code: string, userAlias: string): Promise<string> => {
    ensureDB();
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
