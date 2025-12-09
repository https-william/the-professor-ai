
export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface ProfessorSection {
  id: number;
  title: string;
  content: string;
  analogy: string; // Feynman technique analogy
  key_takeaway: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  userAnswers: Record<number, string>; // questionId -> selectedOption
  flaggedQuestions: number[]; // Array of question IDs
  isSubmitted: boolean;
  score: number;
  startTime: number | null; // Timestamp
  timeRemaining: number | null; // Seconds (null if limitless)
}

export interface ProfessorState {
  sections: ProfessorSection[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_FILE = 'PROCESSING_FILE',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  READY = 'READY',
  ERROR = 'ERROR'
}

export type InputMode = 'FILE' | 'TEXT';
export type AppMode = 'EXAM' | 'PROFESSOR' | 'ADMIN' | 'CHAT';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Nightmare';
export type QuestionType = 'Multiple Choice' | 'True/False' | 'Fill in the Gap' | 'Scenario-based' | 'Matching' | 'Random';
export type TimerDuration = 'Limitless' | '5m' | '10m' | '30m' | '60m';

// Professor Mode Specifics
export type AIPersonality = 'Buddy' | 'Academic' | 'Drill Sergeant' | 'ELI5';
export type AnalogyDomain = 'General' | 'Sports' | 'Gaming' | 'Cooking' | 'Pop Culture' | 'Engineering';
export type LearningStyle = 'Visual' | 'Auditory' | 'Textual';

export interface QuizConfig {
  difficulty: Difficulty;
  questionType: QuestionType;
  questionCount: number;
  timerDuration: TimerDuration;
  // Professor Config
  personality: AIPersonality;
  analogyDomain: AnalogyDomain;
  // Excellentia Supreme Features
  useOracle?: boolean; // Predictive questioning
  useWeaknessDestroyer?: boolean; // Focus on past mistakes
}

export type SubscriptionTier = 'Fresher' | 'Scholar' | 'Excellentia Supreme';
export type UserRole = 'student' | 'admin';

export interface UserProfile {
  alias: string;
  hasCompletedOnboarding: boolean;
  avatarGradient: string;
  avatarEmoji: string;
  defaultDifficulty: Difficulty;
  weaknessFocus: string;
  feedbackDetail: 'Concise' | 'Deep Dive';
  learningStyle: LearningStyle;
  defaultPersonality: AIPersonality;
  streak: number; 
  questionsAnswered: number;
  correctAnswers: number;
  xp: number; // New XP system for levels
  lastStudyDate: number; 
  theme: 'System' | 'Light' | 'Dark' | 'OLED';
  reducedMotion: boolean;
  
  // Subscription & Usage
  subscriptionTier: SubscriptionTier;
  role: UserRole;
  isBanned?: boolean; // Security flag
  dailyQuizzesGenerated: number;
  lastGenerationDate: number; // Timestamp to reset daily count
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  title: string;
  data: QuizState | ProfessorState;
  config?: QuizConfig;
}

export interface ProcessedFile {
  type: 'TEXT' | 'IMAGE';
  content: string; // Text content or Base64 string for image
  mimeType?: string; // For images
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  adminEmail: string;
  targetUserId?: string;
  timestamp: any;
}