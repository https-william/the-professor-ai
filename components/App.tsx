import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Hero } from './Hero';
import { InputSection } from './InputSection';
import { LoadingOverlay } from './LoadingOverlay';
import { HistorySidebar } from './HistorySidebar';
import { UserProfileModal } from './UserProfileModal';
import { AboutModal } from './AboutModal';
import { SubscriptionModal } from './SubscriptionModal';
import { AuthPage } from './Auth/AuthPage';
import { AdminLoginPage } from './Auth/AdminLoginPage';
import { LandingPage } from './LandingPage';
import { PricingPage } from './PricingPage';
import { PlanCheckoutPage } from './PlanCheckoutPage';
import { CountdownTimer } from './CountdownTimer';
import { AmbientBackground } from './AmbientBackground';
import { PWAPrompt } from './PWAPrompt';
import { DuelReadyModal } from './DuelReadyModal';
import { ConfirmationModal } from './ConfirmationModal';
import { NotificationBell } from './NotificationBell';
import { AdminVerifyModal } from './AdminVerifyModal';
import { SharedView } from './SharedView';
import { ProfessorCharacter } from './ProfessorCharacter';
import { ArenaView } from './ArenaView';
import { ErrorBoundary } from './ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan } from '../services/supabase';
import { processFile } from '../services/fileService';

// Lazy Load Heavy Components - Explicit default export mapping for correct type inference
const QuizView = React.lazy(() => import('./QuizView').then(module => ({ default: module.QuizView })));
const ProfessorView = React.lazy(() => import('./ProfessorView').then(module => ({ default: module.ProfessorView })));
const ChatView = React.lazy(() => import('./ChatView').then(module => ({ default: module.ChatView })));
const FlashcardView = React.lazy(() => import('./FlashcardView').then(module => ({ default: module.FlashcardView })));
const AdminDashboard = React.lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const TheHub = React.lazy(() => import('./TheHub').then(module => ({ default: module.TheHub })));

type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED';

const ADMIN_EMAILS = [
    'popoolaariseoluwa@gmail.com', 
    'professoradmin@gmail.com',
    'vexis.automations@gmail.com'
];

// Updated Floating Dock with SVGs, Labels, and Flashcards
const FloatingDock: React.FC<{ mode: AppMode, setMode: (m: AppMode) => void, onHub: () => void, isDuelActive: boolean, onDuel: () => void }> = ({ mode, setMode, onHub, isDuelActive, onDuel }) => {
    
    const DockItem = ({ active, onClick, icon, label, colorClass }: any) => (
        <button 
            onClick={onClick}
            className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${active ? `${colorClass} -translate-y-4 scale-110 shadow-lg` : 'bg-white/5 hover:bg-white/10 hover:-translate-y-2'}`}
        >
            <div className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {icon}
            </div>
            {/* Label - visible on hover or active */}
            <span className={`absolute -top-8 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md whitespace-nowrap transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {label}
            </span>
            {active && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
        </button>
    );

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-end gap-3 px-4 pb-3 pt-3 bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all hover:scale-105 hover:bg-black/90">
            <DockItem 
                active={mode === 'EXAM'} 
                onClick={() => setMode('EXAM')} 
                label="Exam"
                colorClass="bg-blue-600 shadow-blue-900/50"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>}
            />
            <DockItem 
                active={mode === 'PROFESSOR'} 
                onClick={() => setMode('PROFESSOR')} 
                label="Lecture"
                colorClass="bg-amber-600 shadow-amber-900/50"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>}
            />
            <DockItem 
                active={mode === 'FLASHCARDS'} 
                onClick={() => setMode('FLASHCARDS')} 
                label="Cards"
                colorClass="bg-pink-600 shadow-pink-900/50"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
            />
            <DockItem 
                active={mode === 'HUB'} 
                onClick={() => { setMode('HUB'); onHub(); }} 
                label="The Hub"
                colorClass="bg-green-600 shadow-green-900/50"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>}
            />
            <DockItem 
                active={mode === 'DUEL'} 
                onClick={() => { if(isDuelActive) setMode('DUEL'); else onDuel(); }} 
                label="Arena"
                colorClass="bg-purple-600 shadow-purple-900/50"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
            />
        </div>
    );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
  const [currentView, setCurrentView] = useState<ViewState>(() => {
      if (typeof window !== 'undefined') {
          const path = window.location.pathname.toLowerCase();
          const hash = window.location.hash;
          if (hash.startsWith('#/share/')) return 'SHARED';
          if (path === '/pricing' || path === '/tuition') return 'PRICING';
          if (path === '/login' || path === '/auth') return 'AUTH';
          if (path === '/scholar' || path === '/excellentia') return 'CHECKOUT';
          if (path === '/administrator' || path.startsWith('/admin')) return 'ADMIN_LOGIN';
      }
      return 'LANDING';
  });

  const [shareId, setShareId] = useState<string | null>(() => {
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#/share/')) {
          return window.location.hash.split('/share/')[1];
      }
      return null;
  });

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile() || getDefaultProfile());
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  
  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
  const [professorState, setProfessorState] = useState<ProfessorState>({ sections: [] });
  const [chatState, setChatState] = useState<ChatState>({ messages: [], fileContext: '', fileName: '' });
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [duelReadyData, setDuelReadyData] = useState<{ id: string, code: string, isHost: boolean } | null>(null);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const [showAdminVerify, setShowAdminVerify] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const QUIZ_LIMIT = isFresher ? 1 : 100;
  const usagePercentage = Math.min(((userProfile.dailyQuizzesGenerated || 0) / QUIZ_LIMIT) * 100, 100);

  const currentLevel = Math.max(1, Math.floor(Math.sqrt(userProfile.xp || 0) * 0.2));

  // --- SAFE MODE SWITCHING ---
  // Fixes "Literal Error Page" when switching between Arena/Professor without data
  const handleSetAppMode = (mode: AppMode) => {
      // If we are switching to Professor or Exam, check if we have data
      if (mode === 'PROFESSOR' && professorState.sections.length === 0) {
          setStatus(AppStatus.IDLE); // Go back to input
      } else if (mode === 'EXAM' && quizState.questions.length === 0) {
          setStatus(AppStatus.IDLE);
      } else if (mode === 'FLASHCARDS' && quizState.questions.length === 0) {
          // If trying to access flashcards without a quiz, maybe prompt generation or go idle
          setStatus(AppStatus.IDLE);
      } else {
          // If we have data, or it's a mode like HUB/CHAT that handles its own init
          if (status === AppStatus.IDLE && (mode === 'EXAM' || mode === 'PROFESSOR')) {
              // Stay in IDLE if we don't have data
          } else {
              setStatus(AppStatus.READY);
          }
      }
      setAppMode(mode);
  };

  useEffect(() => {
    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#/share/')) {
            const id = hash.split('/share/')[1];
            if (id) {
                setShareId(id);
                setCurrentView('SHARED');
            }
        }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (view: ViewState, url: string) => {
      window.history.pushState({}, '', url);
      setCurrentView(view);
  };

  useEffect(() => {
      const handlePopState = () => {
          const path = window.location.pathname.toLowerCase();
          if (path === '/pricing') setCurrentView('PRICING');
          else if (path === '/login') setCurrentView('AUTH');
          else if (path === '/administrator') setCurrentView('ADMIN_LOGIN');
          else if (user) setCurrentView('APP');
          else setCurrentView('LANDING');
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] && typeof args[0] === 'object' && args[0].message && args[0].message.includes("ERR_BLOCKED_BY_CLIENT")) {
            setIsAdBlockActive(true);
        }
        originalConsoleError(...args);
    };
    window.addEventListener('error', (e) => {
        if (e.message && e.message.includes('ERR_BLOCKED_BY_CLIENT')) setIsAdBlockActive(true);
    }, true);
  }, []);

  const isPotentialAdmin = (email: string | null | undefined) => {
      if (!email) return false;
      const normalized = email.toLowerCase().trim();
      return ADMIN_EMAILS.includes(normalized);
  };

  const isAdmin = isPotentialAdmin(user?.email);

  useEffect(() => {
    if (loading) return; 
    if (currentView === 'SHARED') return;
    if (currentView === 'PRICING') return;
    if (currentView === 'ADMIN_LOGIN' && !user) return;

    if (user) {
        const storedPendingPlan = localStorage.getItem('pending_plan');
        if (storedPendingPlan && storedPendingPlan !== 'Fresher') {
            setCheckoutTier(storedPendingPlan as SubscriptionTier);
            setCurrentView('CHECKOUT');
            localStorage.removeItem('pending_plan');
        } else {
            setCurrentView('APP');
        }
    } else {
        if (currentView === 'APP' || currentView === 'CHECKOUT') {
            setCurrentView('LANDING');
        }
    }
  }, [user, loading, currentView]);

  useEffect(() => {
      if (status !== AppStatus.READY || !activeHistoryId) return;
      const syncHistory = () => {
          let dataToSave: any = null;
          let title = '';
          if (appMode === 'EXAM' || appMode === 'FLASHCARDS') {
              dataToSave = quizState;
              title = history.find(h => h.id === activeHistoryId)?.title || 'Exam';
          } else if (appMode === 'PROFESSOR') {
              dataToSave = professorState;
              title = history.find(h => h.id === activeHistoryId)?.title || 'Class';
          } else if (appMode === 'CHAT') {
              dataToSave = chatState;
              title = chatState.fileName || 'Chat';
          }
          if (dataToSave) {
              const item: HistoryItem = {
                  id: activeHistoryId,
                  timestamp: Date.now(),
                  mode: appMode,
                  title: title,
                  data: dataToSave,
                  summary: history.find(h => h.id === activeHistoryId)?.summary
              };
              saveToHistory(item);
              setHistory(loadHistory());
          }
      };
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(syncHistory, 2000);
      return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [quizState, professorState, chatState, activeHistoryId, status, appMode]);

  useEffect(() => {
    if (!user) return;

    const firestoreProfile = user.profile;
    const localProfile = loadUserProfile() || getDefaultProfile();
    let mergedProfile: UserProfile = { ...localProfile };
    
    if (firestoreProfile) {
        mergedProfile = { 
            ...mergedProfile, 
            ...firestoreProfile, 
            socials: firestoreProfile.socials || mergedProfile.socials, 
            xp: Math.max(firestoreProfile.xp || 0, mergedProfile.xp || 0)
        };
    }
    
    if (user.plan) mergedProfile.subscriptionTier = user.plan;
    
    mergedProfile = updateStreak(mergedProfile);
    
    setUserProfile(mergedProfile);
    saveUserProfile(mergedProfile); 
    setHistory(loadHistory());
    
    if (!isAdminUnlocked) {
        const savedSession = loadCurrentSession();
        if (savedSession) {
          setAppMode(savedSession.mode);
          if (savedSession.mode === 'EXAM' || savedSession.mode === 'FLASHCARDS') setQuizState(savedSession.data as QuizState);
          else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
          else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
          setStatus(AppStatus.READY);
        }
    }
  }, [user, isAdminUnlocked]);

  const handleAdminSuccess = () => {
      setIsAdminUnlocked(true);
      setAppMode('ADMIN');
      navigate('APP', '/');
      setStatus(AppStatus.READY);
  };

  const attemptAction = (action: () => void, force: boolean = false) => {
      if (!force && status === AppStatus.READY && ((appMode === 'EXAM' && !quizState.isSubmitted) || (appMode === 'PROFESSOR') || (appMode === 'CHAT') || (appMode === 'FLASHCARDS'))) {
          setPendingAction(() => action);
          setShowExitConfirmation(true);
      } else {
          action();
      }
  };

  const confirmExit = () => {
      if (pendingAction) pendingAction();
      setShowExitConfirmation(false);
      setPendingAction(null);
  };

  const parseDuration = (duration: string): number | null => {
      if (duration === 'Limitless') return null;
      let totalSeconds = 0;
      const hourMatch = duration.match(/(\d+)h/);
      if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
      const minMatch = duration.match(/(\d+)m/);
      if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
      return totalSeconds > 0 ? totalSeconds : null;
  };

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
    try {
      setStatus(AppStatus.GENERATING_CONTENT);
      setStatusText("Initializing Neural Link...");
      setErrorMsg(null);

      setActiveHistoryId(Date.now().toString()); 
      
      if (mode === 'CHAT') {
        setStatusText("Analyzing Context...");
        const newState: ChatState = { messages: [], fileContext: file.content, fileName: file.name };
        setChatState(newState);
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'CHAT', title: file.name, data: newState, summary: "Chat Session" };
        saveToHistory(historyItem);
        setHistory(loadHistory());
        setActiveHistoryId(historyItem.id);
        return;
      }

      const timeRemaining = parseDuration(config.timerDuration);
      if (mode === 'EXAM' || mode === 'FLASHCARDS') {
        setStatusText("Constructing Materials...");
        const questions = await generateQuizFromText(file.content, config, userProfile);
        if (!questions || questions.length === 0) throw new Error("Neural Failure: No questions generated.");
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0, currentQuestionIndex: 0 };
        setQuizState(newState);
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: mode, title: file.name, data: newState, config, summary: "Exam" };
        saveToHistory(historyItem);
        setAppMode(mode); 
      } else {
        setStatusText("Designing Lesson Plan...");
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        setQuizState(prev => ({ ...prev, timeRemaining }));
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: file.name, data: newState, summary: "Lecture" };
        saveToHistory(historyItem);
      }
      setHistory(loadHistory());
      const updatedProfile = { ...incrementDailyUsage(userProfile) };
      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);
      if (user) updateUserUsage(user.uid, updatedProfile.dailyQuizzesGenerated);
      setStatus(AppStatus.READY);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "Failed to process content.");
    }
  };

  const handleCancelGeneration = () => { setStatus(AppStatus.IDLE); setErrorMsg(null); };

  const handleQuizAction = async (action: 'ANSWER' | 'FLAG' | 'SUBMIT' | 'RESET' | 'INDEX', payload?: any) => {
    if (action === 'INDEX') setQuizState(prev => ({ ...prev, currentQuestionIndex: payload.index }));
    if (action === 'ANSWER') setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [payload.qId]: payload.ans } }));
    if (action === 'FLAG') setQuizState(prev => ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(payload) ? prev.flaggedQuestions.filter(id => id !== payload) : [...prev.flaggedQuestions, payload] }));
    if (action === 'SUBMIT') {
      let score = 0;
      quizState.questions.forEach(q => { 
          if (q.type === 'Select All That Apply') {
              const userAnswer = quizState.userAnswers[q.id];
              const correctAnswer = q.correct_answer;
              try {
                  const parsedUser = JSON.parse(userAnswer || '[]');
                  const parsedCorrect = JSON.parse(correctAnswer || '[]').sort();
                  if (JSON.stringify(parsedUser.sort()) === JSON.stringify(parsedCorrect)) score++;
              } catch(e) {}
          } else if (q.type === 'Fill in the Gap') {
              if (quizState.userAnswers[q.id]?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()) score++;
          } else {
              if (quizState.userAnswers[q.id] === q.correct_answer) score++; 
          }
      });
      setQuizState(prev => ({ ...prev, isSubmitted: true, score }));
      const xpGained = score * 50;
      let newXP = (userProfile.xp || 0) + xpGained;
      if (newXP > 10000) newXP = 10000;
      const newProfile = { ...userProfile, questionsAnswered: userProfile.questionsAnswered + quizState.questions.length, correctAnswers: userProfile.correctAnswers + score, xp: newXP };
      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      if (user) {
          await saveUserToSupabase(user.uid, { xp: newXP });
          if (activeDuelId) await submitDuelScore(activeDuelId, user.uid, score);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'RESET') {
      const force = payload?.force === true;
      const resetLogic = () => {
          clearCurrentSession();
          setStatus(AppStatus.IDLE);
          setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
          setProfessorState({ sections: [] });
          setChatState({ messages: [], fileContext: '', fileName: '' });
          setAppMode('EXAM'); 
          setActiveHistoryId(null);
          setErrorMsg(null); 
          setDuelReadyData(null); 
          setActiveDuelId(null); 
      };
      if (force) resetLogic();
      else attemptAction(resetLogic);
    }
  };

  const handleChatUpdate = (updatedState: ChatState) => { setChatState(updatedState); };

  const handleDuelStart = async (data: { wager: number, file: File }) => {
      if (!user) return;
      setStatus(AppStatus.PROCESSING_FILE);
      setErrorMsg(null);
      try {
          const processed = await processFile(data.file);
          const config: QuizConfig = { difficulty: 'Hard', questionType: 'Mixed', questionCount: 10, timerDuration: 'Limitless', personality: 'Academic', analogyDomain: 'General', useOracle: true, useWeaknessDestroyer: false };
          setStatusText("Initializing Arena...");
          const { duelId, code } = await initDuelLobby(user.uid, userProfile.alias || 'Host', data.wager, processed.content, config);
          setDuelReadyData({ id: duelId, code, isHost: true });
          setStatus(AppStatus.IDLE);
          setAppMode('DUEL');
          generateQuizFromText(processed.content, config, userProfile).then(async (questions) => {
              if (questions && questions.length > 0) await updateDuelWithQuestions(duelId, questions);
          }).catch(err => console.error("Background Gen Error", err));
      } catch (e: any) {
          console.error(e);
          setErrorMsg(e.message || "Failed to start duel.");
          setStatus(AppStatus.ERROR);
      }
  };

  const handleDuelJoin = async (code: string) => {
      if (!user) return;
      try {
          const duelId = await joinDuelByCode(code, user.uid, userProfile.alias || 'Challenger');
          setDuelReadyData({ id: duelId, code, isHost: false });
          setAppMode('DUEL');
      } catch (e: any) {
          alert(e.message || "Could not join arena.");
      }
  };

  const handleEnterDuel = async () => {
      if (duelReadyData) {
          const duelState = await getDuel(duelReadyData.id);
          if (duelState && duelState.quizQuestions) {
              const newState: QuizState = { questions: duelState.quizQuestions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining: null, focusStrikes: 0, currentQuestionIndex: 0 };
              setQuizState(newState);
              setAppMode('EXAM');
              setStatus(AppStatus.READY);
              setActiveDuelId(duelReadyData.id);
              setDuelReadyData(null);
              const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'EXAM', title: `Duel: ${duelState.code}`, data: newState, config: duelState.quizConfig };
              saveToHistory(historyItem);
              setHistory(loadHistory());
          } else {
              alert("Host is still preparing materials...");
          }
      }
  };

  const handleGoToCheckout = async (tier: SubscriptionTier) => {
      if (tier === 'Fresher') {
          if (confirm("Are you sure you want to downgrade to the Fresher plan? Access to advanced features will be revoked.")) {
              const updatedProfile = { ...userProfile, subscriptionTier: 'Fresher' as SubscriptionTier };
              setUserProfile(updatedProfile);
              saveUserProfile(updatedProfile);
              if (user) await updateUserPlan(user.uid, 'Fresher');
              setIsSubscriptionOpen(false);
              alert("You are now on the Fresher plan.");
          }
      } else {
          setCheckoutTier(tier);
          setIsSubscriptionOpen(false);
          // Force navigation by updating view state directly if needed, or ensuring route change
          navigate('CHECKOUT', `/${tier.toLowerCase()}`);
      }
  };

  // --- LOADER ---
  if (loading) {
      return (
          <div className="min-h-screen bg-core flex items-center justify-center relative overflow-hidden transition-colors duration-500">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
              
              <div className="flex flex-col items-center gap-6 z-10">
                  <div className="relative">
                      <div className="w-16 h-16 border-4 border-border-main rounded-full animate-spin"></div>
                      <div className="absolute inset-0 border-4 border-t-accent border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-4 bg-accent rounded-full animate-pulse opacity-20"></div>
                  </div>
                  
                  <div className="text-center">
                      <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent animate-pulse">
                          Authenticating Scholar
                      </p>
                      <p className="text-[10px] text-text-sec font-mono mt-2">
                          Retrieving Student Profile...
                      </p>
                  </div>
              </div>
          </div>
      );
  }
  
  if (currentView === 'SHARED' && shareId) return <SharedView shareId={shareId} onNavigateHome={() => window.location.href = '/'} />;
  if (currentView === 'ADMIN_LOGIN') return <AdminLoginPage onBack={() => navigate('LANDING', '/')} onSuccess={handleAdminSuccess} />;
  
  if (currentView === 'PRICING') return <PricingPage onBack={() => navigate('LANDING', '/')} onSelectPlan={(tier) => {
      localStorage.setItem('pending_plan', tier);
      navigate('AUTH', '/login');
  }} />;
  
  if (currentView === 'CHECKOUT' && checkoutTier) return <PlanCheckoutPage tier={checkoutTier} onBack={() => navigate('APP', '/')} onSuccess={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); navigate('APP', '/'); }} />;
  if (currentView === 'AUTH' && !user) return <AuthPage />;
  if (currentView === 'LANDING' && !user) return <LandingPage onEnter={() => navigate('AUTH', '/login')} onPricing={() => navigate('PRICING', '/pricing')} />;

  const showLibrary = status === AppStatus.IDLE && appMode !== 'ADMIN';
  const shouldHideDock = status === 'READY' && appMode === 'EXAM';

  return (
    <div className={`min-h-screen text-text-pri bg-core selection:bg-accent/30 overflow-x-hidden relative transition-colors duration-1000 font-sans pb-24`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {/* Identity Modal Removed */}
      <SubscriptionModal 
        isOpen={isSubscriptionOpen} 
        onClose={() => setIsSubscriptionOpen(false)} 
        currentTier={userProfile.subscriptionTier} 
        onUpgrade={handleGoToCheckout} 
        userEmail={user?.email || undefined}
      />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
      {duelReadyData && <DuelReadyModal duelId={duelReadyData.id} initialCode={duelReadyData.code} isHost={duelReadyData.isHost} onEnter={handleEnterDuel} statusText={status === AppStatus.PROCESSING_FILE ? "ANALYZING ARENA DATA..." : undefined} />}
      {isAdBlockActive && <div className="bg-red-600 text-white font-bold text-center py-2 text-xs uppercase tracking-widest fixed top-0 left-0 w-full z-[100] shadow-xl animate-pulse">⚠️ System Blocked: Disable Ad-Blocker to Save Progress & Access Database</div>}
      
      <AdminVerifyModal 
        isOpen={showAdminVerify} 
        onClose={() => setShowAdminVerify(false)} 
        onSuccess={handleAdminSuccess}
      />

      {/* Floating Dock - Updated with SVGs and Hiding Logic */}
      {status !== AppStatus.ERROR && appMode !== 'ADMIN' && !shouldHideDock && (
          <FloatingDock 
            mode={appMode} 
            setMode={handleSetAppMode} 
            onHub={() => { setStatus(AppStatus.READY); }}
            isDuelActive={!!activeDuelId}
            onDuel={() => setAppMode('DUEL')}
          />
      )}

      {/* Professor Character (Chat Trigger) */}
      {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
          <div className="fixed bottom-24 right-6 z-40">
             <ProfessorCharacter onClick={() => { 
                 setChatState({ messages: [], fileContext: '', fileName: 'General Assistant' }); 
                 setAppMode('CHAT'); 
                 setStatus(AppStatus.READY); 
             }} />
          </div>
      )}

      {/* CLEAN HEADER */}
      <nav className={`border-b backdrop-blur-md sticky z-40 bg-panel border-border-main ${isAdBlockActive ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { 
                if (appMode === 'ADMIN') {
                    setAppMode('EXAM');
                    setStatus(AppStatus.IDLE); 
                } else {
                    handleQuizAction('RESET');
                }
            }}>
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white border border-white/10 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
               </div>
               <span className="font-display font-bold text-lg hidden sm:block tracking-tight text-text-pri">The Professor</span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
               {appMode === 'ADMIN' && (
                   <button onClick={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-900/50 transition-all">Exit Office</button>
               )}
               
               {showLibrary && (
                   <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-text-sec hover:text-text-pri transition-colors relative group" title="My Library">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                   </button>
               )}
               
               <NotificationBell />
               
               {userProfile.subscriptionTier === 'Fresher' && appMode !== 'ADMIN' && (
                   <button onClick={() => setIsSubscriptionOpen(true)} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-lg shadow-amber-900/20">
                       <span>Upgrade</span>
                       <span className="bg-white text-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-[8px]">👑</span>
                   </button>
               )}
               <div className="h-6 w-px bg-border-main mx-2"></div>
               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                   <div className="text-right hidden sm:block">
                       <p className="text-xs font-bold text-text-pri group-hover:text-accent transition-colors">{userProfile.alias}</p>
                       <p className="text-[9px] font-mono text-text-sec uppercase">Lvl {currentLevel}</p>
                   </div>
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-accent transition-all shadow-lg`}>
                       <span className="text-sm">{userProfile.avatarEmoji}</span>
                   </div>
               </button>
            </div>
        </div>
      </nav>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} 
        onSelect={(item) => {
            if (item.mode === 'EXAM' || item.mode === 'FLASHCARDS') {
                setQuizState(item.data as QuizState);
            } else if (item.mode === 'PROFESSOR') {
                setProfessorState(item.data as ProfessorState);
            } else if (item.mode === 'CHAT') {
                setChatState(item.data as ChatState);
            }
            setAppMode(item.mode);
            setStatus(AppStatus.READY);
            setActiveHistoryId(item.id);
            setIsHistoryOpen(false);
        }} 
        onDelete={(id) => {
            deleteHistoryItem(id);
            setHistory(loadHistory());
            if (activeHistoryId === id) handleQuizAction('RESET', { force: true });
        }}
      />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(updated) => { setUserProfile(updated); saveUserProfile(updated); if (user) saveUserToSupabase(user.uid, updated); }} onClearHistory={() => {}} onLogout={async () => { await logout(); window.location.reload(); }} isAdmin={!!isAdmin} onRequestAdminAccess={() => { setIsProfileOpen(false); setShowAdminVerify(true); }} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
         {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
             <>
                <Hero />
                <InputSection 
                    onProcess={handleProcess} 
                    isLoading={false} 
                    appMode={appMode} 
                    setAppMode={setAppMode} 
                    defaultConfig={{ difficulty: userProfile.defaultDifficulty }} 
                    userProfile={userProfile} 
                    onShowSubscription={() => setIsSubscriptionOpen(true)} 
                    onOpenProfile={() => setIsProfileOpen(true)} 
                    onDuelStart={handleDuelStart} 
                    onDuelJoin={handleDuelJoin} 
                    onHubEnter={() => { setAppMode('HUB'); setStatus(AppStatus.READY); }} 
                />
             </>
         )}
         {status === AppStatus.PROCESSING_FILE && <LoadingOverlay status="Processing Document..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.GENERATING_CONTENT && <LoadingOverlay status={statusText || "Generating Content..."} type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.READY && (
             <div className="animate-slide-up-fade">
                 <Suspense fallback={<div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-accent rounded-full animate-spin"></div></div>}>
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId: any, ans: any) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId: any) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} duelId={activeDuelId} onIndexChange={(index: any) => handleQuizAction('INDEX', { index })} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force: any) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force: any) => handleQuizAction('RESET', { force })} />}
                    {appMode === 'HUB' && <TheHub user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'DUEL' && <ArenaView user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'ADMIN' && <AdminDashboard onExit={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} />}
                 </Suspense>
             </div>
         )}
         {status === AppStatus.ERROR && (
             <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-3xl text-center animate-bounce-subtle">
                 <div className="text-4xl mb-4">⚠️</div>
                 <h3 className="text-xl font-bold text-red-500 mb-2">System Failure</h3>
                 <p className="text-text-sec mb-6">{errorMsg || "An unknown error occurred."}</p>
                 <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-500 transition-colors">Reboot System</button>
             </div>
         )}
      </main>
    </div>
  );
};

// Wrap default export in Error Boundary
const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;