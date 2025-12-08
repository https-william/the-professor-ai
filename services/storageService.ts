import { HistoryItem, QuizState, ProfessorState, AppMode, QuizConfig, UserProfile } from '../types';

const CURRENT_SESSION_KEY = 'exam_prep_current_session';
const HISTORY_KEY = 'exam_prep_history';
const USER_PROFILE_KEY = 'exam_prep_user_profile';

interface CurrentSession {
  mode: AppMode;
  data: QuizState | ProfessorState;
  config?: QuizConfig;
  title: string;
}

export const saveCurrentSession = (mode: AppMode, data: QuizState | ProfessorState, title: string, config?: QuizConfig) => {
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
export const generateHistoryTitle = (mode: AppMode, data: QuizState | ProfessorState): string => {
  if (mode === 'EXAM') {
    const quizData = data as QuizState;
    if (quizData.questions.length > 0) {
      const firstQ = quizData.questions[0].question;
      const cleanQ = firstQ.replace(/[*_#]/g, '').replace(/\s+/g, ' ').trim();
      return cleanQ.length > 45 ? `${cleanQ.substring(0, 45)}...` : cleanQ;
    }
    return 'Untitled Exam';
  } else {
    const profData = data as ProfessorState;
    if (profData.sections.length > 0) {
      const title = profData.sections[0].title;
      const cleanTitle = title.replace(/[*_#]/g, '').trim();
      return `Class: ${cleanTitle}`;
    }
    return 'Untitled Class';
  }
};

export const saveToHistory = (item: HistoryItem) => {
  const history = loadHistory();
  const updated = [item, ...history].slice(0, 20);
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
  streak: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  lastStudyDate: Date.now(),
  theme: 'System',
  reducedMotion: false,
});

export const updateStreak = (profile: UserProfile): UserProfile => {
  const now = new Date();
  const last = new Date(profile.lastStudyDate);
  
  if (now.toDateString() === last.toDateString()) {
    return profile;
  }
  
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays <= 2) { 
    return { ...profile, streak: profile.streak + 1, lastStudyDate: Date.now() };
  } else {
    return { ...profile, streak: 1, lastStudyDate: Date.now() };
  }
};