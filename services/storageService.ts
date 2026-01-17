
import { HistoryItem, QuizState, ProfessorState, AppMode, QuizConfig, UserProfile, ChatState } from '../types';
import { supabase } from './supabase';

const USER_PROFILE_KEY = 'exam_prep_user_profile';
const CURRENT_SESSION_KEY = 'exam_prep_current_session';

interface CurrentSession {
  mode: AppMode;
  data: QuizState | ProfessorState | ChatState;
  config?: QuizConfig;
  title: string;
}

// --- CURRENT SESSION (Keep Local for Speed/Resume) ---
export const saveCurrentSession = (mode: AppMode, data: QuizState | ProfessorState | ChatState, title: string, config?: QuizConfig) => {
  const userId = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}').alias || 'anon';
  const session: CurrentSession = { mode, data, title, config };
  localStorage.setItem(`${userId}_${CURRENT_SESSION_KEY}`, JSON.stringify(session));
};

export const loadCurrentSession = (): CurrentSession | null => {
  const userId = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}').alias || 'anon';
  const stored = localStorage.getItem(`${userId}_${CURRENT_SESSION_KEY}`);
  return stored ? JSON.parse(stored) : null;
};

export const clearCurrentSession = () => {
  const userId = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}').alias || 'anon';
  localStorage.removeItem(`${userId}_${CURRENT_SESSION_KEY}`);
};

// --- HISTORY (Migrated to Supabase) ---

export const saveToHistory = async (item: HistoryItem) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
      // Fallback for guests (Local Only)
      saveToHistoryLocal(item);
      return;
  }

  // Upsert to Supabase
  const { error } = await supabase.from('history').upsert({
      id: item.id,
      user_id: user.id,
      mode: item.mode,
      title: item.title,
      data: item.data, // JSONB
      summary: item.summary,
      config: item.config,
      timestamp: new Date(item.timestamp).toISOString()
  });

  if (error) console.error("Cloud Save Error:", error);
};

const saveToHistoryLocal = (item: HistoryItem) => {
    const userId = 'guest';
    const key = `${userId}_exam_prep_history`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [item, ...existing.filter((i: any) => i.id !== item.id)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
};

export const loadHistory = async (): Promise<HistoryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
      const userId = 'guest';
      return JSON.parse(localStorage.getItem(`${userId}_exam_prep_history`) || '[]');
  }

  const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

  if (error) {
      console.error("Cloud Load Error:", error);
      return [];
  }

  return data.map((d: any) => ({
      id: d.id,
      timestamp: new Date(d.timestamp).getTime(),
      mode: d.mode as AppMode,
      title: d.title,
      data: d.data,
      summary: d.summary,
      config: d.config
  }));
};

export const deleteHistoryItem = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
      await supabase.from('history').delete().eq('id', id);
  } else {
      const userId = 'guest';
      const key = `${userId}_exam_prep_history`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.filter((i: any) => i.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
  }
};

// --- USER PROFILE (Synced via AuthContext usually, but helpers here) ---

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

export const loadUserProfile = (): UserProfile | null => {
  const stored = localStorage.getItem(USER_PROFILE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getDefaultProfile = (): UserProfile => ({
  alias: '',
  hasCompletedOnboarding: false,
  avatarGradient: 'from-blue-500 to-cyan-500',
  avatarEmoji: '🎓',
  defaultDifficulty: 'Medium',
  weaknessFocus: '',
  feedbackDetail: 'Concise',
  learningStyle: 'Textual',
  defaultPersonality: 'Academic',
  streak: 0,
  hasStreakFreeze: false,
  questionsAnswered: 0,
  correctAnswers: 0,
  xp: 500, 
  lastStudyDate: Date.now(),
  theme: 'Dark',
  reducedMotion: false,
  subscriptionTier: 'Fresher',
  role: 'student',
  lastGenerationDate: Date.now(),
  dailyQuizzesGenerated: 0,
  dailyFilesUploaded: 0,
  dailyImagesUploaded: 0,
  dailyDuelsJoined: 0,
  dailyLockIns: 0
});

export const updateStreak = (profile: UserProfile): UserProfile => {
  const now = new Date();
  const last = new Date(profile.lastStudyDate);
  const lastGen = new Date(profile.lastGenerationDate);
  
  let updated = { ...profile };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (!isSameDay(now, lastGen)) {
    updated.dailyQuizzesGenerated = 0;
    updated.dailyFilesUploaded = 0;
    updated.dailyImagesUploaded = 0;
    updated.dailyDuelsJoined = 0;
    updated.dailyLockIns = 0;
    updated.lastGenerationDate = Date.now();
  }

  if (isSameDay(now, last)) {
    return updated;
  }
  
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const oneDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.floor((now.getTime() - last.getTime()) / oneDay);

  if (daysDiff <= 1) { 
    updated.streak = (updated.streak || 0) + 1;
  } else {
    if (updated.hasStreakFreeze) {
        updated.hasStreakFreeze = false;
    } else {
        updated.streak = 1;
    }
  }
  
  updated.lastStudyDate = Date.now();
  return updated;
};

export const incrementDailyUsage = (profile: UserProfile, type: 'QUIZ' | 'FILE' | 'IMAGE' | 'DUEL' | 'LOCKIN' = 'QUIZ'): UserProfile => {
  const updated = { ...profile };
  if (type === 'QUIZ') updated.dailyQuizzesGenerated = (profile.dailyQuizzesGenerated || 0) + 1;
  if (type === 'FILE') updated.dailyFilesUploaded = (profile.dailyFilesUploaded || 0) + 1;
  if (type === 'IMAGE') updated.dailyImagesUploaded = (profile.dailyImagesUploaded || 0) + 1;
  if (type === 'DUEL') updated.dailyDuelsJoined = (profile.dailyDuelsJoined || 0) + 1;
  if (type === 'LOCKIN') updated.dailyLockIns = (profile.dailyLockIns || 0) + 1;
  saveUserProfile(updated);
  return updated;
};
