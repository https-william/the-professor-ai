
import { HistoryItem, QuizState, ProfessorState, AppMode, QuizConfig, UserProfile, ChatState } from '../types';

const CURRENT_SESSION_KEY = 'exam_prep_current_session';
const HISTORY_KEY = 'exam_prep_history';
const USER_PROFILE_KEY = 'exam_prep_user_profile';

interface CurrentSession {
  mode: AppMode;
  data: QuizState | ProfessorState | ChatState;
  config?: QuizConfig;
  title: string;
}

export const saveCurrentSession = (mode: AppMode, data: QuizState | ProfessorState | ChatState, title: string, config?: QuizConfig) => {
  const session: CurrentSession = { mode, data, title, config };
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
};

export const loadCurrentSession = (): CurrentSession | null => {
  const stored = localStorage.getItem(CURRENT_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearCurrentSession = () => {
  localStorage.removeItem(CURRENT_SESSION_KEY);
};

/**
 * Generates a smart, descriptive title for the history item.
 */
export const generateHistoryTitle = (mode: AppMode, data: QuizState | ProfessorState | ChatState): string => {
  if (mode === 'EXAM') {
    const quizData = data as QuizState;
    if (quizData.questions.length > 0) {
      const firstQ = quizData.questions[0].question;
      const cleanQ = firstQ.replace(/[*_#]/g, '').replace(/\s+/g, ' ').trim();
      return cleanQ.length > 45 ? `${cleanQ.substring(0, 45)}...` : cleanQ;
    }
    return 'Untitled Exam';
  } else if (mode === 'PROFESSOR') {
    const profData = data as ProfessorState;
    if (profData.sections.length > 0) {
      const title = profData.sections[0].title;
      const cleanTitle = title.replace(/[*_#]/g, '').trim();
      return `Class: ${cleanTitle}`;
    }
    return 'Untitled Class';
  } else if (mode === 'CHAT') {
      const chatData = data as ChatState;
      return `Chat: ${chatData.fileName || 'General Session'}`;
  }
  return 'Untitled Session';
};

export const saveToHistory = (item: HistoryItem) => {
  const history = loadHistory();
  // Check if item with same ID exists, update it instead of adding new
  const existingIndex = history.findIndex(h => h.id === item.id);
  let updated;
  if (existingIndex >= 0) {
      updated = [...history];
      updated[existingIndex] = item;
  } else {
      updated = [item, ...history].slice(20); // Keep last 20
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const loadHistory = (): HistoryItem[] => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const deleteHistoryItem = (id: string) => {
  const history = loadHistory();
  const updated = history.filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

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
  questionsAnswered: 0,
  correctAnswers: 0,
  xp: 500, // SIGNING BONUS: Grant 500XP so they can duel immediately
  lastStudyDate: Date.now(),
  theme: 'System',
  reducedMotion: false,
  subscriptionTier: 'Fresher',
  role: 'student',
  dailyQuizzesGenerated: 0,
  lastGenerationDate: Date.now()
});

export const updateStreak = (profile: UserProfile): UserProfile => {
  const now = new Date();
  const last = new Date(profile.lastStudyDate);
  const lastGen = new Date(profile.lastGenerationDate);
  
  let updated = { ...profile };

  // Reset daily limit if new day
  if (now.getDate() !== lastGen.getDate() || now.getMonth() !== lastGen.getMonth()) {
    updated.dailyQuizzesGenerated = 0;
    updated.lastGenerationDate = Date.now();
  }

  // Streak Logic
  if (now.toDateString() === last.toDateString()) {
    return updated;
  }
  
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays <= 2) { 
    updated.streak = profile.streak + 1;
  } else {
    updated.streak = 1;
  }
  
  updated.lastStudyDate = Date.now();
  return updated;
};

export const incrementDailyUsage = (profile: UserProfile): UserProfile => {
  const updated = {
    ...profile,
    dailyQuizzesGenerated: (profile.dailyQuizzesGenerated || 0) + 1
  };
  saveUserProfile(updated);
  return updated;
};

// XP Calculation: 100 XP per level
export const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;
export const calculateProgress = (xp: number) => xp % 100;