/**
 * The Professor AI — Design System Tokens
 * Centralized source of truth for the Midnight Scholar palette, theme presets,
 * spacing scales, and component constants.
 */

// ═══ THEME PRESETS ═══
export type ThemePreset = 'midnight-scholar' | 'volcanic-ember' | 'obsidian' | 'high-contrast';

export interface ThemeColors {
  bg: string;
  bg2: string;
  bg3: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  accentBorder: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  'midnight-scholar': {
    bg: '#09090b',
    bg2: '#18181b',
    bg3: '#27272a',
    text: '#E0E0E0',
    textMuted: 'rgba(224, 224, 224, 0.50)',
    accent: '#E5A93C',
    accentDim: 'rgba(229, 169, 60, 0.08)',
    accentBorder: 'rgba(229, 169, 60, 0.18)',
    success: '#2BB288',
    warning: '#E5A93C',
    danger: '#E85D75',
    info: '#4A7CF5',
  },
  'volcanic-ember': {
    bg: '#0d0a07',
    bg2: '#1a1410',
    bg3: '#2a2118',
    text: '#E8DDD0',
    textMuted: 'rgba(232, 221, 208, 0.50)',
    accent: '#D4763A',
    accentDim: 'rgba(212, 118, 58, 0.08)',
    accentBorder: 'rgba(212, 118, 58, 0.18)',
    success: '#4A9B7A',
    warning: '#D4A23A',
    danger: '#C44D3A',
    info: '#5A8BC2',
  },
  'obsidian': {
    bg: '#050508',
    bg2: '#111115',
    bg3: '#1c1c22',
    text: '#C8C8D0',
    textMuted: 'rgba(200, 200, 208, 0.45)',
    accent: '#8B8BFF',
    accentDim: 'rgba(139, 139, 255, 0.08)',
    accentBorder: 'rgba(139, 139, 255, 0.18)',
    success: '#5AC4A0',
    warning: '#E5A93C',
    danger: '#C45A6A',
    info: '#5A8BC4',
  },
  'high-contrast': {
    bg: '#000000',
    bg2: '#1a1a1a',
    bg3: '#333333',
    text: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.70)',
    accent: '#E5A93C',
    accentDim: 'rgba(229, 169, 60, 0.15)',
    accentBorder: 'rgba(229, 169, 60, 0.40)',
    success: '#00FF88',
    warning: '#E5A93C',
    danger: '#FF4466',
    info: '#44AAFF',
  },
};

// ═══ PALETTE CONSTANTS ═══
export const COLORS = {
  amber: '#E5A93C',
  amberLight: '#F2BE65',
  amberDark: '#B8821F',
  blue: '#4A7CF5',
  blueLight: '#608DF6',
  cyan: '#4CDAEF',
  crimson: '#E85D75',
  crimsonDark: '#B8344B',
  emerald: '#2BB288',
  emeraldLight: '#81E0C1',
  violet: '#9673F5',
  violetDark: '#6F4BC9',
  bg: '#09090b',
  bg2: '#18181b',
  bg3: '#27272a',
  text: '#E0E0E0',
} as const;

// ═══ SPACING SCALE (4px base) ═══
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ═══ BORDER RADII ═══
export const RADII = {
  sm: '10px',
  md: '14px',
  lg: '18px',
  xl: '24px',
  '2xl': '28px',
  full: '9999px',
} as const;

// ═══ ANIMATION DURATIONS ═══
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  glacial: 1000,
} as const;

// ═══ GLASSMORPHISM PRESETS ═══
export const GLASS = {
  light: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px) saturate(120%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(24px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  heavy: {
    background: 'rgba(9, 9, 11, 0.70)',
    backdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
  },
} as const;

// ═══ HIGHLIGHT COLORS (for user annotations) ═══
export const HIGHLIGHT_COLORS = {
  amber: { bg: 'rgba(229, 169, 60, 0.20)', border: 'rgba(229, 169, 60, 0.40)', text: '#F7D293' },
  violet: { bg: 'rgba(150, 115, 245, 0.20)', border: 'rgba(150, 115, 245, 0.40)', text: '#CDBDFD' },
  emerald: { bg: 'rgba(43, 178, 136, 0.20)', border: 'rgba(43, 178, 136, 0.40)', text: '#81E0C1' },
  blue: { bg: 'rgba(74, 124, 245, 0.20)', border: 'rgba(74, 124, 245, 0.40)', text: '#A5C0FF' },
  crimson: { bg: 'rgba(232, 93, 117, 0.20)', border: 'rgba(232, 93, 117, 0.40)', text: '#FCA3B0' },
} as const;

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS;

// ═══ VERNACULAR VERDICTS ═══
export const VERDICT_TEMPLATES = {
  perfect: [
    "Perfect run, {name}! Spot on.",
    "{name}, you nailed it! Nothing missed.",
    "Clean sweep, {name}. Your bed misses you — go rest.",
  ],
  great: [
    "Sharp work, {name}! Almost flawless.",
    "Solid, {name}. Just a few gaps to patch.",
    "{name}, that was smooth. Quick review and you're golden.",
  ],
  good: [
    "Not bad at all, {name}. A couple of tricky spots.",
    "Good effort, {name}! Let's revisit the rough edges.",
    "{name}, you try sha. Let's tighten up the loose ends.",
  ],
  needsWork: [
    "Don't stress, {name}. This one just needs more time.",
    "{name}, let's break this down again. You'll get it.",
    "Rough patch, {name}, but that's what reviews are for.",
  ],
} as const;

/** Generate a personalized verdict based on score percentage */
export function getVerdict(name: string, scorePercent: number): string {
  const category = scorePercent >= 95 ? 'perfect'
    : scorePercent >= 75 ? 'great'
    : scorePercent >= 50 ? 'good'
    : 'needsWork';
  const templates = VERDICT_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{name}', name);
}

// ═══ ANALYTICS EVENT TYPES (Medium Granularity) ═══
export const EVENT_TYPES = {
  // Summary
  SUMMARY_STARTED: 'summary_started',
  SUMMARY_COMPLETED: 'summary_completed',
  SUMMARY_CHAPTER_READ: 'summary_chapter_read',
  SUMMARY_HIGHLIGHT_CREATED: 'summary_highlight_created',
  SUMMARY_BOOKMARK_SAVED: 'summary_bookmark_saved',
  SUMMARY_AUDIO_PLAYED: 'summary_audio_played',
  SUMMARY_FOCUS_MODE_TOGGLED: 'summary_focus_mode_toggled',
  SUMMARY_EXPORTED: 'summary_exported',
  // Quiz
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  QUIZ_QUESTION_ANSWERED: 'quiz_question_answered',
  QUIZ_SAVED_TO_FLASHCARDS: 'quiz_saved_to_flashcards',
  // Flashcards
  FLASHCARD_SESSION_STARTED: 'flashcard_session_started',
  FLASHCARD_SESSION_COMPLETED: 'flashcard_session_completed',
  FLASHCARD_FLIPPED: 'flashcard_flipped',
  FLASHCARD_BOOKMARKED: 'flashcard_bookmarked',
  FLASHCARD_SRS_RATED: 'flashcard_srs_rated',
  // Roadmap
  ROADMAP_STARTED: 'roadmap_started',
  ROADMAP_STEP_COMPLETED: 'roadmap_step_completed',
  ROADMAP_COMPLETED: 'roadmap_completed',
  // Wrapped
  WRAPPED_VIEWED: 'wrapped_viewed',
  WRAPPED_SHARED: 'wrapped_shared',
  // Dashboard
  DASHBOARD_LOADED: 'dashboard_loaded',
  STUDY_PACK_CREATED: 'study_pack_created',
  SEARCH_USED: 'search_used',
  // Arena
  ARENA_MATCH_STARTED: 'arena_match_started',
  ARENA_MATCH_COMPLETED: 'arena_match_completed',
  // Settings
  THEME_CHANGED: 'theme_changed',
  PREFERENCE_UPDATED: 'preference_updated',
  // General
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  ASK_PROFESSOR_USED: 'ask_professor_used',
  OFFLINE_MODE_ENTERED: 'offline_mode_entered',
  SHARE_LINK_CREATED: 'share_link_created',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// ═══ COGNITIVE FATIGUE THRESHOLDS ═══
export const FATIGUE = {
  BREAK_AFTER_MINUTES: 25,
  LONG_BREAK_AFTER_MINUTES: 45,
  MAX_CONSECUTIVE_QUIZZES: 3,
  MAX_CONSECUTIVE_CHAPTERS: 5,
} as const;

// ═══ OFFLINE STORAGE ═══
export const OFFLINE = {
  DB_NAME: 'professor-vault',
  DB_VERSION: 1,
  MAX_SYNC_QUEUE: 50,
  STORAGE_WARNING_MB: 40,
  STORAGE_LIMIT_MB: 50,
} as const;
