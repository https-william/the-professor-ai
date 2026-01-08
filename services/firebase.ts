
// --- FIREBASE REPLACEMENT STUB ---
// The app has migrated to Supabase. This file exists to prevent import errors.

export const auth = null;
export const db = null;
export const googleProvider = null;

export const isConfigured = () => false;

// Dummy Auth
export const signInWithGoogle = async () => { console.warn("Switching to Supabase"); };
export const registerWithEmail = async (email: string, pass: string, name: string) => { console.warn("Switching to Supabase"); };
export const loginWithEmail = async (email: string, pass: string) => { 
    console.warn("Switching to Supabase"); 
    // Mock for admin login
    if(email.includes('admin') || email.includes('vexis')) return { user: { email } };
    return { user: { email } }; 
};
export const logout = async () => { console.warn("Switching to Supabase"); };

// Dummy Firestore
export const saveUserToFirestore = async (uid: string, data: any) => {};
export const logSystemAction = async (action: any) => {};
export const adminUpdateUser = async (uid: string, data: any) => {};
export const updateUserPlan = async (uid: string, plan: any) => {};
export const deleteUserAccount = async (uid: string) => {};
export const updateUserUsage = async (uid: string, usage: any) => {};

// Dummy Duel
export const initDuelLobby = async () => ({ duelId: "offline", code: "OFFLINE" });
export const updateDuelWithQuestions = async (duelId: string, questions: any) => {};
export const joinDuelByCode = async (code: string) => "offline";
export const subscribeToDuel = (duelId: string, callback: (data: any) => void) => { return () => {}; };
export const getDuel = async (duelId: string) => null;
export const submitDuelScore = async (duelId: string, userId: string, score: number) => {};
export const activateSuddenDeath = async (duelId: string, question: any) => {};
export const submitSuddenDeathAnswer = async (duelId: string, userId: string, isCorrect: boolean) => {};
