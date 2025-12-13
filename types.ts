
export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  type?: QuestionType; // Optional override per question
}

export interface ProfessorSection {
  id: number;
  title: string;
  content: string;
  analogy: string; // Feynman technique analogy
  key_takeaway: string;
  diagram_markdown?: string; // Optional MermaidJS diagram
}

export interface QuizState {
  questions: QuizQuestion[];
  userAnswers: Record<number, string>; // questionId -> selectedOption (or JSON string for multi)
  flaggedQuestions: number[]; // Array of question IDs
  isSubmitted: boolean;
  score: number;
  startTime: number | null; // Timestamp
  timeRemaining: number | null; // Seconds (null if limitless)
  focusStrikes?: number; // Number of times focus was lost
  isCramMode?: boolean; // New Adrenaline Protocol
}

export interface ProfessorState {
  sections: ProfessorSection[];
}

export interface ChatState {
  messages: ChatMessage[];
  fileContext: string;
  fileName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  image?: string; // Base64 image
}

export interface DuelParticipant {
  id: string;
  name: string;
  score?: number;
  status: 'JOINED' | 'READY' | 'COMPLETED';
}

export interface DuelState {
  id: string; // Firestore ID
  code: string; // Readable Code (e.g., NEON-TIGER)
  hostId: string;
  participants: DuelParticipant[]; // Replaces single challenger
  wager: number;
  content: string; // Text content used to generate
  quizConfig: QuizConfig;
  quizQuestions?: QuizQuestion[]; // Optional initially for speed
  status: 'INITIALIZING' | 'WAITING' | 'ACTIVE' | 'COMPLETED';
  winnerId?: string;
  createdAt: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_FILE = 'PROCESSING_FILE',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  READY = 'READY',
  ERROR = 'ERROR'
}

export type InputMode = 'FILE' | 'TEXT' | 'CAMERA';
export type AppMode = 'EXAM' | 'PROFESSOR' | 'ADMIN' | 'CHAT' | 'DUEL';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Nightmare';
export type QuestionType = 'Multiple Choice' | 'True/False' | 'Fill in the Gap' | 'Scenario-based' | 'Matching' | 'Mixed' | 'Select All That Apply';
export type TimerDuration = 'Limitless' | '5m' | '10m' | '30m' | '45m' | '1h' | '1h 30m' | '2h';

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
  isCramMode?: boolean; // 10s per question
}

export type SubscriptionTier = 'Fresher' | 'Scholar' | 'Excellentia Supreme';
export type UserRole = 'student' | 'admin';
export type AmbientTheme = 'Deep Space';

export interface UserProfile {
  // Identity
  alias: string;
  fullName?: string; 
  age?: string; 
  school?: string; 
  academicLevel?: string; 
  country?: string; 
  socials?: {
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    snapchat?: string;
  }; 
  hasCompletedOnboarding: boolean;
  avatarGradient: string;
  avatarEmoji: string;
  
  // Preferences
  defaultDifficulty: Difficulty;
  weaknessFocus: string;
  feedbackDetail: 'Concise' | 'Deep Dive';
  learningStyle: LearningStyle;
  defaultPersonality: AIPersonality;
  theme: 'System' | 'Light' | 'Dark' | 'OLED';
  reducedMotion: boolean;
  studyReminders?: boolean; 
  reminderTime?: string; // HH:MM format
  ambientTheme?: AmbientTheme;
  
  // Gamification & Stats
  streak: number; 
  hasStreakFreeze?: boolean; // New Inventory Item
  questionsAnswered: number;
  correctAnswers: number;
  xp: number; // New XP system for levels
  lastStudyDate: number; 
  
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
  data: QuizState | ProfessorState | ChatState;
  config?: QuizConfig;
}

export interface ProcessedFile {
  type: 'TEXT' | 'IMAGE';
  content: string; // Text content or Base64 string for image
  mimeType?: string; // For images
  name: string;
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  adminEmail: string;
  targetUserId?: string;
  timestamp: any;
}
