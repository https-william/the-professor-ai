
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

/**
 * Generates a smart, descriptive title for the history item.
 */
export const generateHistoryTitle = (mode: AppMode, data: QuizState | ProfessorState | ChatState): string => {
  const clean = (str: string) => str.replace(/[*_#\[\]]/g, '').replace(/\s+/g, ' ').trim();

  if (mode === 'EXAM') {
    const quizData = data as QuizState;
    if (quizData.questions.length > 0) {
      const firstQ = quizData.questions[0].question;
      const cleanQ = clean(firstQ);
      return cleanQ.length > 45 ? `${cleanQ.substring(0, 45)}...` : cleanQ;
    }
    return 'Untitled Exam';
  } else if (mode === 'PROFESSOR') {
    const profData = data as ProfessorState;
    if (profData.sections.length > 0) {
      const title = profData.sections[0].title;
      const cleanTitle = clean(title);
      return `Class: ${cleanTitle}`;
    }
    return 'Untitled Class';
  } else if (mode === 'CHAT') {
      const chatData = data as ChatState;
      if (chatData.fileName && chatData.fileName !== 'General Session') return `Chat: ${chatData.fileName}`;
      
      // Dynamic title based on first user message if filename is generic
      if (chatData.messages && chatData.messages.length > 0) {
          const firstUserMsg = chatData.messages.find(m => m.role === 'user');
          if (firstUserMsg) {
              const content = clean(firstUserMsg.content.replace(/\[IMAGE_DATA:.*?\]/g, 'Image'));
              return content.length > 30 ? content.substring(0, 30) + '...' : content;
          }
      }
      return 'New Conversation';
  }
  return 'Untitled Session';
};

/**
 * Generates a short snippet preview of the session state.
 */
export const getHistorySnippet = (item: HistoryItem): string => {
    const clean = (str: string) => str.replace(/[*_#\[\]]/g, '').replace(/\s+/g, ' ').trim();

    if (item.mode === 'CHAT') {
        const data = item.data as ChatState;
        if (!data.messages || data.messages.length === 0) return 'No messages yet';
        
        // Find last user message or last bot message
        const lastMsg = data.messages[data.messages.length - 1];
        if (!lastMsg) return 'Empty';

        const sender = lastMsg.role === 'user' ? 'You' : 'Prof';
        const rawContent = lastMsg.content.replace(/\[IMAGE_DATA:.*?\]/g, '📷 Image');
        
        // Remove JSON artifacts if present
        let cleanContent = clean(rawContent);
        if (cleanContent.startsWith('{') || cleanContent.startsWith('[')) cleanContent = "Structured Data";

        return `${sender}: ${cleanContent.substring(0, 40)}${cleanContent.length > 40 ? '...' : ''}`;
    }
    if (item.mode === 'EXAM') {
        const data = item.data as QuizState;
        const status = data.isSubmitted ? 'Completed' : 'In Progress';
        return `${data.score}/${data.questions.length} • ${status}`;
    }
    if (item.mode === 'DUEL') {
        const data = item.data as QuizState;
        const status = data.isSubmitted ? 'Completed' : 'Arena Active';
        return `Combat • ${status}`;
    }
    if (item.mode === 'PROFESSOR') {
        const data = item.data as ProfessorState;
        return `${data.sections.length} Sections • Lecture`;
    }
    return '';
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
      updated = [item, ...history].slice(0, 50); // Keep last 50 items
  }
  const userId = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}').alias || 'anon';
  localStorage.setItem(`${userId}_${HISTORY_KEY}`, JSON.stringify(updated));
};

export const loadHistory = (): HistoryItem[] => {
  const userId = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}').alias || 'anon';
  const stored = localStorage.getItem(`${userId}_${HISTORY_KEY}`);
  return stored ? JSON.parse(stored) : [];
};

export const deleteHistoryItem = (id: string) => {
  const history = loadHistory();
  const updated = history.filter(h => h.id !== id);
  const userId = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}').alias || 'anon';
  localStorage.setItem(`${userId}_${HISTORY_KEY}`, JSON.stringify(updated));
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
  hasStreakFreeze: false,
  questionsAnswered: 0,
  correctAnswers: 0,
  xp: 500, 
  lastStudyDate: Date.now(),
  theme: 'Dark', // Enforced Dark
  reducedMotion: false,
  subscriptionTier: 'Fresher',
  role: 'student',
  // Tracking
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

  // Check if days are different
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Reset daily limits if new day
  if (!isSameDay(now, lastGen)) {
    updated.dailyQuizzesGenerated = 0;
    updated.dailyFilesUploaded = 0;
    updated.dailyImagesUploaded = 0;
    updated.dailyDuelsJoined = 0;
    updated.dailyLockIns = 0;
    updated.lastGenerationDate = Date.now();
  }

  // Streak Logic
  if (isSameDay(now, last)) {
    return updated;
  }
  
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const oneDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.floor((now.getTime() - last.getTime()) / oneDay);

  if (daysDiff <= 1) { 
    updated.streak = (updated.streak || 0) + 1;
  } else {
    // Check for Freeze
    if (updated.hasStreakFreeze) {
        updated.hasStreakFreeze = false; // Consume freeze
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
