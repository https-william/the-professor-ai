import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Hero } from './Hero';
import { InputSection } from './InputSection';
import { LoadingOverlay } from './LoadingOverlay';
import { HistorySidebar } from './HistorySidebar';
import { UserProfileModal } from './UserProfileModal';
import { AboutModal } from './AboutModal';
import { SubscriptionModal } from './SubscriptionModal';
import { WelcomeModal } from './Onboarding/WelcomeModal';
import { CountdownTimer } from './CountdownTimer';
import { AmbientBackground } from './AmbientBackground';
import { PWAPrompt } from './PWAPrompt';
import { DuelReadyModal } from './DuelReadyModal';
import { ConfirmationModal } from './ConfirmationModal';
import { NotificationBell } from './NotificationBell';
import { AdminVerifyModal } from './AdminVerifyModal';
import { ProfessorCharacter } from './ProfessorCharacter';
import { ArenaView } from './ArenaView';
import { MobileNavBar } from './MobileNavBar';
import { FloatingDock } from './FloatingDock';
import { RadialProgress } from './RadialProgress';
import { useAuth } from '../contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, incrementDailyUsage, updateStreak } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan } from '../services/supabase';
import { processFile } from '../services/fileService';
import { LandingPage } from './LandingPage';
import { AuthPage } from './Auth/AuthPage';
import { AdminLoginPage } from './Auth/AdminLoginPage';
import { PricingPage } from './PricingPage';
import { PlanCheckoutPage } from './PlanCheckoutPage';
import { AuthCallback } from './Auth/AuthCallback';
import { SharedView } from './SharedView';

// Robust Lazy Loading with Retry
function lazyRetry(componentImport: () => Promise<any>): React.LazyExoticComponent<React.ComponentType<any>> {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await componentImport();
    }
  }) as React.LazyExoticComponent<React.ComponentType<any>>;
}

const QuizView = lazyRetry(() => import('./QuizView'));
const ProfessorView = lazyRetry(() => import('./ProfessorView'));
const ChatView = lazyRetry(() => import('./ChatView'));
const FlashcardView = lazyRetry(() => import('./FlashcardView'));
const AdminDashboard = lazyRetry(() => import('./AdminDashboard'));
const TheHub = lazyRetry(() => import('./TheHub'));

const ADMIN_EMAILS = ['popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com', 'vexis.automations@gmail.com'];

type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED' | 'AUTH_CALLBACK';

export const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  
  const [currentView, setCurrentView] = useState<ViewState>(() => {
      if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.has('code')) return 'AUTH_CALLBACK';
          if (window.location.hash.includes('access_token')) return 'AUTH_CALLBACK';

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
  const dailyLimit = userProfile.subscriptionTier === 'Scholar' ? 10 : (isFresher ? 1 : 1000);
  const usagePercentage = Math.min(((userProfile.dailyQuizzesGenerated || 0) / dailyLimit) * 100, 100);
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // View Navigation Logic
  const handleNavigate = (view: ViewState, url: string) => {
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

  // Auth State Management
  useEffect(() => {
    if (loading) return; 
    if (currentView === 'SHARED') return;
    if (currentView === 'PRICING') return;
    if (currentView === 'AUTH_CALLBACK') return;
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

  // Restore Session
  useEffect(() => {
    if (!user) return;
    const localProfile = loadUserProfile() || getDefaultProfile();
    let mergedProfile: UserProfile = { ...localProfile };
    
    if (user.profile) {
        mergedProfile = { 
            ...mergedProfile, 
            ...user.profile, 
            socials: user.profile.socials || mergedProfile.socials, 
            xp: Math.max(user.profile.xp || 0, mergedProfile.xp || 0)
        };
    }
    
    if (user.plan) mergedProfile.subscriptionTier = user.plan;
    mergedProfile = updateStreak(mergedProfile);
    setUserProfile(mergedProfile);
    saveUserProfile(mergedProfile);
    
    loadHistory().then(setHistory);
    
    if (user.hasCompletedOnboarding === false) setOnboardingStep('WELCOME');
    
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

  // Sync History
  useEffect(() => {
      if (status !== AppStatus.READY || !activeHistoryId) return;
      const syncHistory = async () => {
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
              await saveToHistory(item);
              loadHistory().then(setHistory);
          }
      };
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(syncHistory, 2000);
      return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [quizState, professorState, chatState, activeHistoryId, status, appMode]);

  const handleAdminSuccess = () => {
      setIsAdminUnlocked(true);
      setAppMode('ADMIN');
      setStatus(AppStatus.READY);
  };

  const handleSetAppMode = (mode: AppMode) => {
      if (mode === 'PROFESSOR' && professorState.sections.length === 0) setStatus(AppStatus.IDLE);
      else if (mode === 'EXAM' && quizState.questions.length === 0) setStatus(AppStatus.IDLE);
      else setStatus(AppStatus.READY);
      setAppMode(mode);
  };

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
    try {
      setStatus(AppStatus.GENERATING_CONTENT);
      setStatusText("Initializing Neural Link...");
      setErrorMsg(null);
      setActiveHistoryId(Date.now().toString()); 
      
      if (mode === 'CHAT') {
        const newState: ChatState = { messages: [], fileContext: file.content, fileName: file.name };
        setChatState(newState);
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        return;
      }

      if (mode === 'EXAM' || mode === 'FLASHCARDS') {
        const questions = await generateQuizFromText(file.content, config, userProfile);
        if (!questions || questions.length === 0) throw new Error("Neural Failure: No questions generated.");
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, null, focusStrikes: 0, currentQuestionIndex: 0 };
        setQuizState(newState);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, config });
        setAppMode(mode); 
      } else {
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: file.name, data: newState });
      }
      
      setHistory(await loadHistory());
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

  const handleCancelGeneration = () => {
      setStatus(AppStatus.IDLE);
      setErrorMsg(null);
  };

  const handleQuizAction = async (action: 'ANSWER' | 'FLAG' | 'SUBMIT' | 'RESET' | 'INDEX', payload?: any) => {
    if (action === 'INDEX') setQuizState(prev => ({ ...prev, currentQuestionIndex: payload.index }));
    if (action === 'ANSWER') setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [payload.qId]: payload.ans } }));
    if (action === 'FLAG') setQuizState(prev => ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(payload) ? prev.flaggedQuestions.filter(id => id !== payload) : [...prev.flaggedQuestions, payload] }));
    if (action === 'SUBMIT') {
      let score = 0;
      quizState.questions.forEach(q => { 
          if (q.type === 'Select All That Apply') {
              // ... same logic
          } else {
              if (quizState.userAnswers[q.id] === q.correct_answer) score++; 
          }
      });
      setQuizState(prev => ({ ...prev, isSubmitted: true, score }));
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
              await saveToHistory(historyItem);
              setHistory(await loadHistory());
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
          handleNavigate('CHECKOUT', `/${tier.toLowerCase()}`);
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
  
  if (currentView === 'AUTH_CALLBACK') {
      return <AuthCallback onSuccess={() => handleNavigate('APP', '/')} onError={(msg) => { alert(msg); handleNavigate('AUTH', '/login'); }} />;
  }

  if (currentView === 'SHARED' && shareId) return <SharedView shareId={shareId} onNavigateHome={() => window.location.href = '/'} />;
  if (currentView === 'ADMIN_LOGIN') return <AdminLoginPage onBack={() => handleNavigate('LANDING', '/')} onSuccess={handleAdminSuccess} />;
  
  if (currentView === 'PRICING') return <PricingPage onBack={() => handleNavigate('LANDING', '/')} onSelectPlan={(tier) => {
      localStorage.setItem('pending_plan', tier);
      handleNavigate('AUTH', '/login');
  }} />;
  
  if (currentView === 'CHECKOUT' && checkoutTier) return <PlanCheckoutPage tier={checkoutTier} onBack={() => handleNavigate('APP', '/')} onSuccess={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); handleNavigate('APP', '/'); }} />;
  if (currentView === 'AUTH' && !user) return <AuthPage />;
  if (currentView === 'LANDING' && !user) return <LandingPage onEnter={() => handleNavigate('AUTH', '/login')} onPricing={() => handleNavigate('PRICING', '/pricing')} />;

  const showLibrary = status === AppStatus.IDLE && appMode !== 'ADMIN';

  return (
    <div className={`min-h-screen text-text-pri bg-core selection:bg-accent/30 overflow-x-hidden relative transition-colors duration-1000 font-sans pb-32`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={(data) => { setUserProfile({...userProfile, ...data}); setOnboardingStep('COMPLETE'); }} />}
      <SubscriptionModal 
        isOpen={isSubscriptionOpen} 
        onClose={() => setIsSubscriptionOpen(false)} 
        currentTier={userProfile.subscriptionTier} 
        onUpgrade={handleGoToCheckout} 
        userEmail={user?.email || undefined}
      />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
      <AdminVerifyModal isOpen={showAdminVerify} onClose={() => setShowAdminVerify(false)} onSuccess={handleAdminSuccess} />
      {duelReadyData && <DuelReadyModal duelId={duelReadyData.id} initialCode={duelReadyData.code} isHost={duelReadyData.isHost} onEnter={handleEnterDuel} />}

      {/* Docks */}
      {status !== AppStatus.ERROR && appMode !== 'ADMIN' && status !== AppStatus.PROCESSING_FILE && status !== AppStatus.GENERATING_CONTENT && (
          <>
            <FloatingDock mode={appMode} setMode={handleSetAppMode} onHub={() => setStatus(AppStatus.READY)} isDuelActive={!!activeDuelId} onDuel={() => setAppMode('DUEL')} />
            <MobileNavBar mode={appMode} setMode={handleSetAppMode} />
          </>
      )}

      {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
          <ProfessorCharacter onClick={() => { setAppMode('CHAT'); setStatus(AppStatus.READY); }} />
      )}

      <nav className={`border-b backdrop-blur-md sticky z-40 bg-panel border-border-main top-0`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }}>
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white border border-white/10 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
               </div>
               <span className="font-display font-bold text-lg hidden sm:block tracking-tight text-text-pri">The Professor</span>
            </div>
            
            {isFresher && appMode !== 'ADMIN' && (
                <div className="flex items-center gap-2" title="Daily Neural Energy">
                    <RadialProgress percentage={100 - usagePercentage} size={32} strokeWidth={4} color={usagePercentage > 90 ? 'text-red-500' : 'text-accent'} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-sec hidden md:block">Neural Energy</span>
                </div>
            )}

            <div className="flex items-center gap-4">
               {status === AppStatus.IDLE && <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-text-sec hover:text-text-pri"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></button>}
               <NotificationBell />
               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-accent transition-all overflow-hidden relative shadow-lg`}>
                       {userProfile.photoURL ? (
                           <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                           <span className="text-sm">{userProfile.avatarEmoji}</span>
                       )}
                   </div>
               </button>
            </div>
        </div>
      </nav>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => {
            if (item.mode === 'EXAM' || item.mode === 'FLASHCARDS') setQuizState(item.data as QuizState);
            else if (item.mode === 'PROFESSOR') setProfessorState(item.data as ProfessorState);
            else if (item.mode === 'CHAT') setChatState(item.data as ChatState);
            setAppMode(item.mode);
            setStatus(AppStatus.READY);
            setActiveHistoryId(item.id);
            setIsHistoryOpen(false);
      }} onDelete={async (id) => {
            await deleteHistoryItem(id);
            setHistory(await loadHistory());
            if (activeHistoryId === id) handleQuizAction('RESET', { force: true });
      }} />
      
      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profile={userProfile} 
        onSave={(updated) => { setUserProfile(updated); saveUserProfile(updated); if(user) saveUserToSupabase(user.uid, updated); }} 
        onClearHistory={() => {}} 
        onLogout={async () => { await logout(); handleNavigate('LANDING', '/'); }} 
        isAdmin={!!isAdmin} 
        onRequestAdminAccess={() => { setIsProfileOpen(false); setShowAdminVerify(true); }}
        onUpgradeRequest={() => setIsSubscriptionOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
         {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
             <>
                <Hero />
                <InputSection onProcess={handleProcess} isLoading={false} appMode={appMode} setAppMode={handleSetAppMode} defaultConfig={{ difficulty: userProfile.defaultDifficulty }} userProfile={userProfile} onShowSubscription={() => setIsSubscriptionOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} onDuelStart={handleDuelStart} onDuelJoin={handleDuelJoin} onHubEnter={() => { setAppMode('HUB'); setStatus(AppStatus.READY); }} />
             </>
         )}
         
         {status === AppStatus.PROCESSING_FILE && <LoadingOverlay status="Processing Document..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.GENERATING_CONTENT && <LoadingOverlay status={statusText || "Generating Content..."} type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         
         {status === AppStatus.READY && (
             <div className="animate-slide-up-fade">
                 <Suspense fallback={<div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-accent rounded-full animate-spin"></div></div>}>
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId: any, ans: any) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId: any) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} duelId={activeDuelId} onIndexChange={(index: any) => handleQuizAction('INDEX', { index })} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force: any) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={setChatState} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force: any) => handleQuizAction('RESET', { force })} onGenerate={(newState) => { setQuizState(newState); setStatus(AppStatus.READY); }} />}
                    {appMode === 'HUB' && <TheHub user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'DUEL' && <ArenaView user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'ADMIN' && <AdminDashboard onExit={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} />}
                 </Suspense>
             </div>
         )}
         
         {status === AppStatus.ERROR && (
             <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-3xl text-center">
                 <h3 className="text-xl font-bold text-red-500 mb-2">System Failure</h3>
                 <p className="text-text-sec mb-6">{errorMsg || "An unknown error occurred."}</p>
                 <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs">Reboot System</button>
             </div>
         )}
      </main>
    </div>
  );
};