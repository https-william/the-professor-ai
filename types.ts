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

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_FILE = 'PROCESSING_FILE',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  READY = 'READY',
  ERROR = 'ERROR'
}

export type InputMode = 'FILE' | 'TEXT';
export type AppMode = 'EXAM' | 'PROFESSOR';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Nightmare';
export type QuestionType = 'Multiple Choice' | 'True/False' | 'Fill in the Gap' | 'Scenario-based' | 'Matching' | 'Random';
export type TimerDuration = 'Limitless' | '5m' | '10m' | '30m' | '60m';

// Professor Mode Specifics
export type AIPersonality = 'Buddy' | 'Academic' | 'Drill Sergeant' | 'ELI5';
export type AnalogyDomain = 'General' | 'Sports' | 'Gaming' | 'Cooking' | 'Pop Culture' | 'Engineering';

export interface QuizConfig {
  difficulty: Difficulty;
  questionType: QuestionType;
  questionCount: number;
  timerDuration: TimerDuration;
  // Professor Config
  personality: AIPersonality;
  analogyDomain: AnalogyDomain;
}

export interface UserProfile {
  alias: string;
  hasCompletedOnboarding: boolean; // New field for onboarding
  avatarGradient: string;
  avatarEmoji: string;
  defaultDifficulty: Difficulty;
  weaknessFocus: string;
  feedbackDetail: 'Concise' | 'Deep Dive';
  streak: number; // Days in a row
  questionsAnswered: number;
  correctAnswers: number;
  lastStudyDate: number; // Timestamp
  theme: 'System' | 'Light' | 'Dark' | 'OLED';
  reducedMotion: boolean;
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