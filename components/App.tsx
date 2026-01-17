
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Hero } from './Hero';
import { InputSection } from './InputSection';
import { LoadingOverlay } from './LoadingOverlay';
import { HistorySidebar } from './HistorySidebar';
import { UserProfileModal } from './UserProfileModal';
import { AboutModal } from './AboutModal';
import { SubscriptionModal } from './SubscriptionModal';
import { WelcomeModal } from './Onboarding/WelcomeModal';
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
import { MobileNavBar } from './MobileNavBar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan } from '../services/supabase';
import { processFile } from '../services/fileService';

// Lazy Load Heavy Components
const QuizView = React.lazy(() => import('./QuizView').then(module => ({ default: module.QuizView }))) as React.LazyExoticComponent<React.ComponentType<any>>;
const ProfessorView = React.lazy(() => import('./ProfessorView').then(module => ({ default: module.ProfessorView }))) as React.LazyExoticComponent<React.ComponentType<any>>;
const ChatView = React.lazy(() => import('./ChatView').then(module => ({ default: module.ChatView }))) as React.LazyExoticComponent<React.ComponentType<any>>;
const FlashcardView = React.lazy(() => import('./FlashcardView').then(module => ({ default: module.FlashcardView }))) as React.LazyExoticComponent<React.ComponentType<any>>;
const AdminDashboard = React.lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard }))) as React.LazyExoticComponent<React.ComponentType<any>>;
const TheHub = React.lazy(() => import('./TheHub').then(module => ({ default: module.TheHub }))) as React.LazyExoticComponent<React.ComponentType<any>>;

type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED';

const ADMIN_EMAILS = [
    'popoolaariseoluwa@gmail.com', 
    'professoradmin@gmail.com',
    'vexis.automations@gmail.com'
];

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [currentView, setCurrentView] = useState<ViewState>(() => {
      if (typeof window !== 'undefined') {
          const path = window.location.pathname.toLowerCase();
          const hash = window.location.hash;
          if (hash.startsWith('#/share/')) return 'SHARED';
          if (path === '/pricing' || path === '/tuition') return 'PRICING';
          if (path === '/login' || path === '/auth') return 'AUTH';
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
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME'>('COMPLETE');
  
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
  const QUIZ_LIMIT = isFresher ? 1 : 100; // Scholar cap is 10/day, but handling simplified here
  const dailyLimit = userProfile.subscriptionTier === 'Scholar' ? 10 : (isFresher ? 1 : 1000);
  const usagePercentage = Math.min(((userProfile.dailyQuizzesGenerated || 0) / dailyLimit) * 100, 100);

  // Admin Mode Force Dark
  useEffect(() => {
      if (appMode === 'ADMIN') {
          document.documentElement.classList.add('dark');
      } else if (theme === 'Light') {
          document.documentElement.classList.remove('dark');
      }
  }, [appMode, theme]);

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
        } else if (currentView !== 'CHECKOUT') {
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
    
    if (user.hasCompletedOnboarding === false) setOnboardingStep('WELCOME');
    else setOnboardingStep('COMPLETE');
    
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

  const handleOnboardingComplete = async (data: Partial<UserProfile>) => {
    if (user) {
        await saveUserToSupabase(user.uid, { ...data, hasCompletedOnboarding: true });
    }
    const updated = { ...userProfile, ...data, hasCompletedOnboarding: true };
    setUserProfile(updated);
    saveUserProfile(updated);
    if (updated.studyReminders) Notification.requestPermission();
    setOnboardingStep('COMPLETE');
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

  const handleGoToCheckout = async (tier: SubscriptionTier, billingCycle?: string) => {
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
          // Store cycle preference
          localStorage.setItem('pending_billing_cycle', billingCycle || 'monthly');
          navigate('CHECKOUT', `/${tier.toLowerCase()}`);
      }
  };

  const getInitials = (name: string) => {
      if (!name) return '??';
      const parts = name.split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
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

  return (
    <div className={`min-h-screen text-text-pri bg-core selection:bg-accent/30 overflow-x-hidden relative transition-colors duration-1000 font-sans`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleOnboardingComplete} />}
      <SubscriptionModal 
        isOpen={isSubscriptionOpen} 
        onClose={() => setIsSubscriptionOpen(false)} 
        currentTier={userProfile.subscriptionTier} 
        onUpgrade={handleGoToCheckout} 
        userEmail={user?.email || undefined}
      />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
      {duelReadyData && <DuelReadyModal duelId={duelReadyData.id} initialCode={duelReadyData.code} isHost={duelReadyData.isHost} onEnter={handleEnterDuel} />}
      {isAdBlockActive && <div className="bg-red-600 text-white font-bold text-center py-2 text-xs uppercase tracking-widest fixed top-0 left-0 w-full z-[100] shadow-xl animate-pulse">⚠️ System Blocked: Disable Ad-Blocker to Save Progress & Access Database</div>}
      
      {/* Admin Verify Modal */}
      <AdminVerifyModal 
        isOpen={showAdminVerify} 
        onClose={() => setShowAdminVerify(false)} 
        onSuccess={handleAdminSuccess}
      />

      {/* Professor Character (Chat Trigger) - Only show when IDLE and not in Admin Mode */}
      {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
          <ProfessorCharacter onClick={() => { setAppMode('CHAT'); setStatus(AppStatus.READY); }} />
      )}

      {/* Main Navbar */}
      <nav className={`border-b backdrop-blur-md sticky z-40 bg-panel border-border-main ${isAdBlockActive ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            
            {/* Logo Area */}
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

            {/* Admin Exit */}
            {appMode === 'ADMIN' && (
                <button onClick={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-900/50 transition-all">Exit Office</button>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
               
               {/* Neural Energy - Circular */}
               {isFresher && appMode !== 'ADMIN' && (
                   <div className="relative w-8 h-8 flex items-center justify-center group" title="Daily Neural Energy">
                       <svg className="w-full h-full transform -rotate-90">
                           <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-800" />
                           <circle 
                               cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" 
                               strokeDasharray="88" 
                               strokeDashoffset={88 - (88 * (100 - usagePercentage)) / 100}
                               className={`${usagePercentage > 90 ? 'text-red-500' : 'text-accent'} transition-all duration-1000`} 
                           />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                           {Math.round(100 - usagePercentage)}%
                       </div>
                   </div>
               )}

               {/* Theme Toggle */}
               <button 
                 onClick={() => setTheme(theme === 'Dark' ? 'Light' : 'Dark')} 
                 className="p-2 text-text-sec hover:text-text-pri transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                 title={theme === 'Dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
               >
                   {theme === 'Dark' ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                   )}
               </button>

               {/* Library Toggle */}
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
               
               {/* Profile Avatar */}
               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                   <div className="text-right hidden sm:block">
                       <p className="text-xs font-bold text-text-pri group-hover:text-accent transition-colors">{userProfile.alias || 'Guest'}</p>
                       <p className="text-[9px] font-mono text-text-sec uppercase">Lvl {Math.floor(Math.sqrt((userProfile.xp || 0) / 100)) + 1}</p>
                   </div>
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-accent transition-all shadow-lg overflow-hidden`}>
                       {userProfile.photoURL ? (
                           <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                       ) : (
                           <span className="text-xs font-bold text-white uppercase">{userProfile.alias ? userProfile.alias.substring(0, 2) : 'GS'}</span>
                       )}
                   </div>
               </button>
            </div>
        </div>
      </nav>

      {/* Floating Dock & Mobile Nav */}
      {status !== AppStatus.ERROR && appMode !== 'ADMIN' && status !== AppStatus.PROCESSING_FILE && status !== AppStatus.GENERATING_CONTENT && (
          <MobileNavBar mode={appMode} setMode={(m) => { setAppMode(m); setStatus(AppStatus.READY); }} />
      )}

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

export default App;
