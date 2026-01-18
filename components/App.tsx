import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { Hero } from './Hero';
import { InputSection } from './InputSection';
import { LoadingOverlay } from './LoadingOverlay';
import { HistorySidebar } from './HistorySidebar';
import { UserProfileModal } from './UserProfileModal';
import { AboutModal } from './AboutModal';
import { SubscriptionModal } from './SubscriptionModal';
import { WelcomeModal } from './Onboarding/WelcomeModal';
import { FeatureTourModal } from './Onboarding/FeatureTourModal';
import { AuthPage } from './Auth/AuthPage';
import { AdminLoginPage } from './Auth/AdminLoginPage';
import { LandingPage } from './LandingPage';
import { PricingPage } from './PricingPage';
import { PlanCheckoutPage } from './PlanCheckoutPage';
import { AuthCallback } from './Auth/AuthCallback';
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
import { FloatingDock } from './FloatingDock';
import { CreditWallet } from './CreditWallet';
import { CallOverlay } from './CallOverlay';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan, deductCredits } from '../services/supabase';
import { processFile } from '../services/fileService';
import { getModeCost } from '../services/creditService';
import { callService } from '../services/callService';
import { LegalPage } from './LegalPage';
import { initAnalytics, trackEvent, identifyUser, trackPageView } from '../services/analytics';

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

type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED' | 'AUTH_CALLBACK' | 'LEGAL';

const ADMIN_EMAILS = [
    'popoolaariseoluwa@gmail.com', 
    'professoradmin@gmail.com',
    'vexis.automations@gmail.com'
];

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [currentView, setCurrentView] = useState<ViewState>('LANDING'); 
  const [shareId, setShareId] = useState<string | null>(null);

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile() || getDefaultProfile());
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  
  // Onboarding Flow
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME' | 'TOUR'>('COMPLETE');
  
  // Isolated States
  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
  const [flashcardState, setFlashcardState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
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

  // --- CALL STATES ---
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallPeerId, setActiveCallPeerId] = useState<string | null>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isPotentialAdmin = (email: string | null | undefined): boolean => {
    return ADMIN_EMAILS.includes(email?.toLowerCase() || '');
  };
  const isAdmin = isPotentialAdmin(user?.email);

  // Initialize Analytics
  useEffect(() => {
      initAnalytics();
  }, []);

  useEffect(() => {
      if (user) {
          identifyUser(user.uid, user.email || undefined);
      }
  }, [user]);

  // Track Page Views
  useEffect(() => {
      trackPageView(`/${currentView.toLowerCase()}`);
  }, [currentView]);

  // --- FUNCTIONS ---

  const handleNavigate = useCallback((view: ViewState, url: string) => {
      if (typeof window !== 'undefined') {
          window.history.pushState({}, '', url);
      }
      setCurrentView(view);
  }, []);

  const parseDuration = (duration: string): number | null => {
      if (duration === 'Limitless') return null;
      let totalSeconds = 0;
      const hourMatch = duration.match(/(\d+)h/);
      if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
      const minMatch = duration.match(/(\d+)m/);
      if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
      return totalSeconds > 0 ? totalSeconds : null;
  };

  const handleAdminSuccess = useCallback(() => {
      setIsAdminUnlocked(true);
      setAppMode('ADMIN');
      setStatus(AppStatus.READY);
  }, []);

  const handleGoToCheckout = useCallback(async (tier: SubscriptionTier) => {
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
          trackEvent('checkout_initiated', { tier });
          setIsSubscriptionOpen(false);
          handleNavigate('CHECKOUT', `/${tier.toLowerCase()}`);
      }
  }, [userProfile, user, handleNavigate]);

  const handleDuelStart = useCallback(async (data: { wager: number, file: File }) => {
      if (!user) return;
      setStatus(AppStatus.PROCESSING_FILE);
      setErrorMsg(null);
      trackEvent('duel_created', { wager: data.wager });
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
  }, [user, userProfile]);

  const handleDuelJoin = useCallback(async (code: string) => {
      if (!user) return;
      trackEvent('duel_joined');
      try {
          const duelId = await joinDuelByCode(code, user.uid, userProfile.alias || 'Challenger');
          setDuelReadyData({ id: duelId, code, isHost: false });
      } catch (e: any) {
          alert(e.message || "Could not join arena.");
      }
  }, [user, userProfile]);

  const handleChatUpdate = useCallback((updatedState: ChatState) => { setChatState(updatedState); }, []);

  // --- INIT LOGIC ---
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.has('code')) setCurrentView('AUTH_CALLBACK');
          else if (window.location.hash.includes('access_token')) setCurrentView('AUTH_CALLBACK');
          else if (window.location.pathname === '/login') setCurrentView('AUTH');
          else if (user) setCurrentView('APP');
      }
  }, [user]);

  // --- CALL SERVICE INIT ---
  useEffect(() => {
      if (user && userProfile.alias) {
          // Initialize PeerJS with alias as ID
          callService.initialize(userProfile.alias).then(() => {
              callService.onIncomingCall = (call) => {
                  setIncomingCall(call);
              };
          });
      }
  }, [user, userProfile.alias]);

  const handleStartCall = (remotePeerId: string) => {
      callService.getMedia(true, true).then(() => {
          callService.callUser(remotePeerId);
          setActiveCallPeerId(remotePeerId);
      });
  };

  const handleAcceptCall = () => {
      if (incomingCall) {
          callService.answerCall(incomingCall);
          setActiveCallPeerId(incomingCall.peer);
          setIncomingCall(null);
      }
  };

  const handleEndCall = () => {
      callService.disconnect();
      setActiveCallPeerId(null);
      setIncomingCall(null);
  };

  // Helper for Credit Deduction
  const handleDeductCredits = async (amount: number, reason: string): Promise<boolean> => {
      if ((userProfile.credits || 0) < amount) {
          trackEvent('credits_low', { reason });
          setIsSubscriptionOpen(true);
          return false;
      }
      const oldCredits = userProfile.credits;
      const updatedProfile = { ...userProfile, credits: oldCredits - amount };
      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);

      if (user) {
          const success = await deductCredits(user.uid, amount, reason);
          if (!success) {
              const rollbackProfile = { ...userProfile, credits: oldCredits };
              setUserProfile(rollbackProfile);
              saveUserProfile(rollbackProfile);
              setIsSubscriptionOpen(true);
              return false;
          }
      }
      return true;
  };

  useEffect(() => {
    if (!user) return;
    
    // Merge Auth User Data
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
    
    // Sync Subscription
    if (user.plan) mergedProfile.subscriptionTier = user.plan;
    
    // Sync Onboarding status from DB/Auth Context
    if (user.hasCompletedOnboarding !== undefined) {
        mergedProfile.hasCompletedOnboarding = user.hasCompletedOnboarding;
    }

    mergedProfile = updateStreak(mergedProfile);
    setUserProfile(mergedProfile);
    saveUserProfile(mergedProfile);
    
    loadHistory().then(setHistory);
    
    // If not completed onboarding in DB, trigger it
    if (!mergedProfile.hasCompletedOnboarding) {
        setOnboardingStep('WELCOME');
    }

    if (!isAdminUnlocked) {
        const savedSession = loadCurrentSession();
        if (savedSession) {
          setAppMode(savedSession.mode);
          if (savedSession.mode === 'EXAM') setQuizState(savedSession.data as QuizState);
          else if (savedSession.mode === 'FLASHCARDS') setFlashcardState(savedSession.data as QuizState);
          else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
          else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
          setStatus(AppStatus.READY);
        }
    }
  }, [user, isAdminUnlocked]);

  const handleProcess = useCallback(async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
      if (mode === 'EXAM' || mode === 'PROFESSOR' || mode === 'FLASHCARDS') {
          const cost = getModeCost(mode, config);
          const success = await handleDeductCredits(cost, `Generated ${mode}`);
          if (!success) return; 
      }
      
      trackEvent('content_generation_started', { mode, difficulty: config.difficulty });
      setStatus(AppStatus.GENERATING_CONTENT);
      setStatusText("Initializing Neural Link...");
      setErrorMsg(null);
      setActiveHistoryId(Date.now().toString()); 
      
      if (mode === 'CHAT') {
        const newState: ChatState = { messages: [], fileContext: file.content, fileName: file.name };
        setChatState(newState);
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'CHAT', title: file.name, data: newState });
        setHistory(await loadHistory());
        return;
      }

      const timeRemaining = parseDuration(config.timerDuration);
      if (mode === 'EXAM') {
        const questions = await generateQuizFromText(file.content, config, userProfile);
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0, currentQuestionIndex: 0 };
        setQuizState(newState);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, config });
        setAppMode('EXAM'); 
      } else if (mode === 'FLASHCARDS') {
        const questions = await generateQuizFromText(file.content, config, userProfile);
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0, currentQuestionIndex: 0 };
        setFlashcardState(newState);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, config });
        setAppMode('FLASHCARDS');
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
      trackEvent('content_generation_success', { mode });
  }, [userProfile]);

  const handleCancelGeneration = useCallback(() => { setStatus(AppStatus.IDLE); setErrorMsg(null); }, []);
  
  const handleSetAppMode = useCallback((mode: AppMode) => {
      if (mode === 'PROFESSOR' && professorState.sections.length === 0) setStatus(AppStatus.IDLE);
      else if (mode === 'EXAM' && quizState.questions.length === 0) setStatus(AppStatus.IDLE);
      // Change: Flashcards view handles its own empty state (Creation UI), so always set to READY
      else if (mode === 'FLASHCARDS') setStatus(AppStatus.READY); 
      else if (mode === 'CHAT' && chatState.messages.length === 0) setStatus(AppStatus.IDLE);
      else setStatus(AppStatus.READY);
      setAppMode(mode);
  }, [professorState, quizState, chatState, flashcardState]);

  const handleQuizAction = useCallback(async (action: any, payload?: any) => {
      if(action === 'RESET') {
          clearCurrentSession();
          setStatus(AppStatus.IDLE);
          setAppMode('EXAM');
      }
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
        trackEvent('exam_submitted', { score, total: quizState.questions.length });
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
  }, [quizState, userProfile, user, activeDuelId]);

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

  const confirmExit = () => {
      if (pendingAction) pendingAction();
      setShowExitConfirmation(false);
      setPendingAction(null);
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen bg-core flex items-center justify-center text-white">Authenticating...</div>;
  if (currentView === 'AUTH_CALLBACK') return <AuthCallback onSuccess={() => handleNavigate('APP', '/')} onError={(msg) => alert(msg)} />;
  if (currentView === 'SHARED' && shareId) return <SharedView shareId={shareId} onNavigateHome={() => window.location.href = '/'} />;
  if (currentView === 'ADMIN_LOGIN') return <AdminLoginPage onBack={() => handleNavigate('LANDING', '/')} onSuccess={handleAdminSuccess} />;
  if (currentView === 'LEGAL') return <LegalPage onBack={() => user ? handleNavigate('APP', '/') : handleNavigate('LANDING', '/')} />;
  if (currentView === 'PRICING') return <PricingPage onBack={() => handleNavigate('LANDING', '/')} onSelectPlan={(tier) => { localStorage.setItem('pending_plan', tier); handleNavigate('AUTH', '/login'); }} />;
  if (currentView === 'CHECKOUT' && checkoutTier) return <PlanCheckoutPage tier={checkoutTier} onBack={() => handleNavigate('APP', '/')} onSuccess={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); handleNavigate('APP', '/'); }} />;
  if (currentView === 'AUTH' && !user) return <AuthPage />;
  if (currentView === 'LANDING' && !user) return <LandingPage onEnter={() => { trackEvent('landing_enter_click'); handleNavigate('AUTH', '/login'); }} onPricing={() => handleNavigate('PRICING', '/pricing')} onLegal={() => handleNavigate('LEGAL', '/legal')} />;

  const showLibrary = status === AppStatus.IDLE && appMode !== 'ADMIN';

  return (
    <div className={`min-h-screen text-text-pri bg-core selection:bg-accent/30 overflow-x-hidden relative transition-colors duration-1000 font-sans pb-32`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      
      {/* Onboarding Modals */}
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={(data) => { 
            const updatedProfile = {...userProfile, ...data, hasCompletedOnboarding: true};
            setUserProfile(updatedProfile); 
            if (user) {
                saveUserToSupabase(user.uid, { ...data, has_completed_onboarding: true });
            }
            setOnboardingStep('TOUR'); 
      }} />}
      
      {onboardingStep === 'TOUR' && <FeatureTourModal onComplete={() => setOnboardingStep('COMPLETE')} />}

      {/* CALL OVERLAYS */}
      {(activeCallPeerId || incomingCall) && (
          <CallOverlay 
            remotePeerId={activeCallPeerId || incomingCall?.peer} 
            onClose={handleEndCall} 
            isIncoming={!!incomingCall}
            onAccept={handleAcceptCall}
          />
      )}

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
      
      {/* ... Navigation & Main Content */}
      {status !== AppStatus.ERROR && appMode !== 'ADMIN' && status !== AppStatus.PROCESSING_FILE && status !== AppStatus.GENERATING_CONTENT && (
          <>
            <FloatingDock 
                mode={appMode} 
                setMode={handleSetAppMode} 
                onHub={() => setStatus(AppStatus.READY)} 
                isDuelActive={!!activeDuelId} 
                onDuel={() => setAppMode('DUEL')}
            />
            <MobileNavBar 
                mode={appMode} 
                setMode={handleSetAppMode} 
            />
          </>
      )}

      <nav className={`border-b backdrop-blur-md sticky z-40 bg-panel border-border-main top-0`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
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

            {/* Credits Display */}
            {isFresher && appMode !== 'ADMIN' && (
                <CreditWallet balance={userProfile.credits || 0} onClick={() => setIsSubscriptionOpen(true)} className="hidden sm:flex" />
            )}

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
               
               <div className="h-6 w-px bg-border-main mx-2"></div>
               
               {/* Enhanced Profile Button (Ring + Icon) */}
               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group relative">
                   <div className="text-right hidden sm:block">
                       <p className="text-xs font-bold text-text-pri group-hover:text-accent transition-colors">{userProfile.alias}</p>
                       <p className="text-[9px] font-mono text-text-sec uppercase">Lvl {Math.floor((userProfile.xp || 0) / 100) + 1}</p>
                   </div>
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-accent transition-all shadow-lg ring-2 ring-white/10 relative overflow-hidden`}>
                       <span className="text-sm">{userProfile.avatarEmoji}</span>
                   </div>
               </button>
            </div>
        </div>
      </nav>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} 
        onSelect={(item) => {
            if (item.mode === 'EXAM') {
                setQuizState(item.data as QuizState);
            } else if (item.mode === 'FLASHCARDS') {
                setFlashcardState(item.data as QuizState);
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
        onDelete={async (id) => {
            await deleteHistoryItem(id);
            setHistory(await loadHistory());
            if (activeHistoryId === id) handleQuizAction('RESET', { force: true });
        }}
      />
      
      {/* Passed Upgrade Handler to Profile Modal */}
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
        onLegalRequest={() => { setIsProfileOpen(false); handleNavigate('LEGAL', '/legal'); }}
      />
      
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
         {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
             <>
                <Hero />
                <InputSection 
                    onProcess={handleProcess} 
                    isLoading={false} 
                    appMode={appMode} 
                    setAppMode={handleSetAppMode} 
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
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} userProfile={userProfile} onDeductCredits={handleDeductCredits} />}
                    
                    {/* Separate State for Flashcards */}
                    {appMode === 'FLASHCARDS' && (
                        <FlashcardView 
                            quizState={flashcardState} 
                            onExit={(force: any) => handleQuizAction('RESET', { force })} 
                            onGenerate={(newState: QuizState) => { 
                                setFlashcardState(newState); 
                                setStatus(AppStatus.READY); 
                                // Save flashcard generation to history immediately
                                saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'FLASHCARDS', title: 'New Flashcard Deck', data: newState });
                                loadHistory().then(setHistory);
                            }} 
                            userProfile={userProfile} 
                            onDeductCredits={handleDeductCredits} 
                        />
                    )}
                    
                    {appMode === 'HUB' && <TheHub user={userProfile} onExit={() => handleQuizAction('RESET')} onStartCall={handleStartCall} />}
                    {appMode === 'DUEL' && <ArenaView user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'ADMIN' && <AdminDashboard onExit={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} />}
                 </Suspense>
             </div>
         )}
         {status === AppStatus.ERROR && (
             <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-3xl text-center">
                 <div className="text-4xl mb-4">⚠️</div>
                 <h3 className="text-xl font-bold text-red-500 mb-2">System Failure</h3>
                 <p className="text-text-sec mb-6">{errorMsg || "An unknown error occurred."}</p>
                 <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs">Reboot System</button>
             </div>
         )}
      </main>
    </div>
  );
};

export default App;