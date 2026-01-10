
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
import { NotificationBell } from './NotificationBell';
import { AdminVerifyModal } from './AdminVerifyModal';
import { SharedView } from './SharedView';
import { useAuth } from '../contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent, simplifyExplanation } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan } from '../services/supabase';
import { processFile } from '../services/fileService';

// Lazy Load Heavy Components
const QuizView = React.lazy(() => import('./QuizView').then(module => ({ default: module.QuizView })));
const ProfessorView = React.lazy(() => import('./ProfessorView').then(module => ({ default: module.ProfessorView })));
const ChatView = React.lazy(() => import('./ChatView').then(module => ({ default: module.ChatView })));
const FlashcardView = React.lazy(() => import('./FlashcardView').then(module => ({ default: module.FlashcardView })));
const AdminDashboard = React.lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const TheHub = React.lazy(() => import('./TheHub').then(module => ({ default: module.TheHub })));

// Routing State
type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED';

const ADMIN_EMAILS = [
    'popoolaariseoluwa@gmail.com', 
    'professoradmin@gmail.com',
    'vexis.automations@gmail.com'
];

const App: React.FC = () => {
  const { user, loading } = useAuth();
  
  // MANUAL ROUTING
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
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME'>('COMPLETE');
  
  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
  const [professorState, setProfessorState] = useState<ProfessorState>({ sections: [] });
  const [chatState, setChatState] = useState<ChatState>({ messages: [], fileContext: '', fileName: '' });
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [duelReadyData, setDuelReadyData] = useState<{ id: string, code: string, isHost: boolean } | null>(null);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
  const [showAdminVerify, setShowAdminVerify] = useState(false);
  
  const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const QUIZ_LIMIT = isFresher ? 1 : 100;
  const usagePercentage = Math.min(((userProfile.dailyQuizzesGenerated || 0) / QUIZ_LIMIT) * 100, 100);

  useEffect(() => {
    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#/share/')) {
            const id = hash.split('/share/')[1];
            if (id) {
                setShareId(id);
                setCurrentView('SHARED');
                return;
            }
        }
        
        // Handle URL Paths
        const path = window.location.pathname.toLowerCase();
        if (path === '/administrator' || path.startsWith('/admin')) setCurrentView('ADMIN_LOGIN');
        else if (path === '/pricing' || path === '/tuition') setCurrentView('PRICING');
        else if (path === '/scholar' || path === '/excellentia') {
             const tier = path === '/scholar' ? 'Scholar' : 'Excellentia';
             setCheckoutTier(tier);
             setCurrentView('CHECKOUT');
        }
        else if (path === '/login' || path === '/auth') {
             // Only show auth if not logged in
             if (!user) setCurrentView('AUTH');
             else setCurrentView('APP');
        }
        else if (user) setCurrentView('APP');
        else setCurrentView('LANDING');
    };

    if (!loading) {
        handleHashChange();
    }
    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
        window.removeEventListener('popstate', handleHashChange);
        window.removeEventListener('hashchange', handleHashChange);
    };
  }, [user, loading]);

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

  const checkIsAdmin = (email: string | null | undefined) => {
      if (!email) return false;
      const normalized = email.toLowerCase().trim();
      return ADMIN_EMAILS.includes(normalized) || normalized.includes('vexis.automation');
  };

  const isAdmin = checkIsAdmin(user?.email);

  const navigateTo = (view: ViewState, path: string) => {
      window.history.pushState({}, '', path);
      setCurrentView(view);
  };

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
    
    if (!checkIsAdmin(user.email)) {
        const savedSession = loadCurrentSession();
        if (savedSession) {
          setAppMode(savedSession.mode);
          if (savedSession.mode === 'EXAM' || savedSession.mode === 'FLASHCARDS') setQuizState(savedSession.data as QuizState);
          else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
          else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
          setStatus(AppStatus.READY);
        }
    } else {
        if (currentView === 'APP' && appMode !== 'ADMIN') setAppMode('ADMIN');
    }
  }, [user]);

  const handleRequestAdminAccess = async () => {
      if (user) await logout();
      navigateTo('ADMIN_LOGIN', '/administrator');
  };

  const handleAdminSuccess = () => {
      setAppMode('ADMIN');
      navigateTo('APP', '/');
      setStatus(AppStatus.READY);
  };

  const handleOnboardingComplete = async (data: Partial<UserProfile>) => {
    if (user) {
        await saveUserToSupabase(user.uid, { ...data, hasCompletedOnboarding: true });
    }
    const updated = { ...userProfile, ...data, hasCompletedOnboarding: true };
    setUserProfile(updated);
    saveUserProfile(updated);
    setOnboardingStep('COMPLETE');
  };

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
    try {
      setStatus(AppStatus.GENERATING_CONTENT);
      setStatusText("Initializing Neural Link...");
      setErrorMsg(null);
      
      const summaryPromise = getDocumentSummary(file.content);
      
      if (mode === 'CHAT') {
        const summary = await summaryPromise;
        const newState: ChatState = { messages: [], fileContext: file.content, fileName: file.name };
        setChatState(newState);
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        return;
      }
      
      const questions = await generateQuizFromText(file.content, config, userProfile);
      // Logic from existing app...
      const summary = await summaryPromise;
      if (mode === 'EXAM' || mode === 'FLASHCARDS') {
          const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining: null, focusStrikes: 0, currentQuestionIndex: 0 };
          setQuizState(newState);
          setAppMode(mode);
          saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, summary });
      } else {
          const sections = await generateProfessorContent(file.content, config);
          const newState: ProfessorState = { sections };
          setProfessorState(newState);
          setAppMode('PROFESSOR');
          saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: file.name, data: newState, summary });
      }
      setStatus(AppStatus.READY);
      setHistory(loadHistory());
      
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "Failed to process content.");
    }
  };
  
  const handleCancelGeneration = () => { setStatus(AppStatus.IDLE); setErrorMsg(null); };
  const handleQuizAction = (action: any, payload?: any) => { /* logic */ }; 
  const handleChatUpdate = (s: ChatState) => setChatState(s);
  const handleDuelStart = () => {}; 
  const handleDuelJoin = () => {};
  const handleEnterDuel = () => {};
  const getDocumentSummary = async (t: string) => "Document"; 

  const handleGoToCheckout = async (tier: SubscriptionTier) => {
      setCheckoutTier(tier);
      setIsSubscriptionOpen(false);
      navigateTo('CHECKOUT', `/${tier.toLowerCase()}`);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (currentView === 'SHARED' && shareId) return <SharedView shareId={shareId} onNavigateHome={() => window.location.href = '/'} />;
  if (currentView === 'ADMIN_LOGIN') return <AdminLoginPage onBack={() => navigateTo('LANDING', '/')} onSuccess={handleAdminSuccess} />;
  if (currentView === 'PRICING') return <PricingPage onBack={() => navigateTo('LANDING', '/')} onSelectPlan={(tier) => { localStorage.setItem('pending_plan', tier); navigateTo('AUTH', '/login'); }} />;
  if (currentView === 'CHECKOUT' && checkoutTier) return <PlanCheckoutPage tier={checkoutTier} onBack={() => navigateTo('APP', '/')} onSuccess={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); navigateTo('APP', '/'); }} />;
  if (currentView === 'AUTH' && !user) return <AuthPage />;
  if (currentView === 'LANDING' && !user) return <LandingPage onEnter={() => navigateTo('AUTH', '/login')} onPricing={() => navigateTo('PRICING', '/pricing')} />;

  const showLibrary = status === AppStatus.IDLE && appMode !== 'ADMIN';

  return (
    <div className={`min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-1000 bg-[#050505] font-sans`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleOnboardingComplete} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={handleGoToCheckout} />
      {duelReadyData && <DuelReadyModal duelId={duelReadyData.id} initialCode={duelReadyData.code} isHost={duelReadyData.isHost} onEnter={handleEnterDuel} />}
      {isAdBlockActive && <div className="bg-red-600 text-white font-bold text-center py-2 text-xs uppercase tracking-widest fixed top-0 left-0 w-full z-[100] shadow-xl animate-pulse">⚠️ System Blocked: Disable Ad-Blocker to Save Progress & Access Database</div>}
      
      <AdminVerifyModal isOpen={showAdminVerify} onClose={() => setShowAdminVerify(false)} onSuccess={handleAdminSuccess} />

      {isAdmin && (
          <button onClick={() => setShowAdminVerify(true)} className="fixed bottom-6 left-6 z-50 w-12 h-12 bg-red-900/80 border border-red-500/50 rounded-full flex items-center justify-center text-red-400 hover:text-white hover:bg-red-600 hover:scale-110 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] backdrop-blur-md animate-pulse-slow group" title="Dean's Office">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </button>
      )}

      <nav className={`border-b backdrop-blur-md sticky z-40 bg-black/40 border-white/5 ${isAdBlockActive ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { 
                if (appMode === 'ADMIN') {
                    setAppMode('EXAM');
                    setStatus(AppStatus.IDLE); 
                } else {
                    // Quick Reset
                    clearCurrentSession();
                    setStatus(AppStatus.IDLE);
                    setAppMode('EXAM');
                    setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
                }
            }}>
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white border border-white/10 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
               </div>
               <span className="font-display font-bold text-lg hidden sm:block tracking-tight text-white">The Professor</span>
            </div>

            {isFresher && appMode !== 'ADMIN' && (
                <div className="hidden md:flex flex-col w-48 gap-1 mx-6 items-stretch justify-center" title="Daily Neural Energy">
                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                        <span>Neural Energy</span>
                        <span className={usagePercentage > 90 ? 'text-red-500' : 'text-blue-400'}>{Math.round(100 - usagePercentage)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 transition-all duration-1000 ease-out" 
                            style={{ width: `${100 - usagePercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 sm:gap-4">
               {appMode === 'ADMIN' && (
                   <button onClick={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-900/50 transition-all">Exit Office</button>
               )}
               
               {showLibrary && (
                   <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors relative group" title="My Library">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:text-amber-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                   </button>
               )}
               
               <NotificationBell />
               
               {userProfile.subscriptionTier === 'Fresher' && appMode !== 'ADMIN' && (
                   <button onClick={() => setIsSubscriptionOpen(true)} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-lg shadow-amber-900/20">
                       <span>Upgrade</span>
                       <span className="bg-white text-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-[8px]">👑</span>
                   </button>
               )}
               <div className="h-6 w-px bg-white/10 mx-2"></div>
               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                   <div className="text-right hidden sm:block">
                       <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{userProfile.alias}</p>
                       <p className="text-[9px] font-mono text-gray-500 uppercase">Lvl {Math.floor((userProfile.xp || 0) / 100) + 1}</p>
                   </div>
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-blue-500 transition-all shadow-lg`}>
                       <span className="text-sm">{userProfile.avatarEmoji}</span>
                   </div>
               </button>
            </div>
        </div>
      </nav>

      {/* ... Rest of Main Content ... */}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={() => {}} onDelete={() => {}} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={() => {}} onClearHistory={() => {}} onLogout={async () => { await logout(); window.location.reload(); }} isAdmin={!!isAdmin} onRequestAdminAccess={() => { setIsProfileOpen(false); setShowAdminVerify(true); }} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
         {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
             <>
                <Hero />
                <InputSection onProcess={handleProcess} isLoading={false} appMode={appMode} setAppMode={setAppMode} defaultConfig={{ difficulty: userProfile.defaultDifficulty }} userProfile={userProfile} onShowSubscription={() => setIsSubscriptionOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} onDuelStart={handleDuelStart} onDuelJoin={handleDuelJoin} onHubEnter={() => { setAppMode('HUB'); setStatus(AppStatus.READY); }} />
             </>
         )}
         {status === AppStatus.PROCESSING_FILE && <LoadingOverlay status="Processing Document..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.GENERATING_CONTENT && <LoadingOverlay status={statusText || "Generating Content..."} type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.READY && (
             <div className="animate-slide-up-fade">
                 <Suspense fallback={<div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-white rounded-full animate-spin"></div></div>}>
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={() => {}} onFlagQuestion={() => {}} onSubmit={() => {}} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => {}} duelId={activeDuelId} onIndexChange={() => {}} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force) => handleQuizAction('RESET', { force })} />}
                    {appMode === 'HUB' && <TheHub user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'ADMIN' && <AdminDashboard onExit={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} />}
                 </Suspense>
             </div>
         )}
         {status === AppStatus.ERROR && (
             <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-3xl text-center animate-bounce-subtle">
                 <div className="text-4xl mb-4">⚠️</div>
                 <h3 className="text-xl font-bold text-red-500 mb-2">System Failure</h3>
                 <p className="text-gray-400 mb-6">{errorMsg || "An unknown error occurred."}</p>
                 <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-500 transition-colors">Reboot System</button>
             </div>
         )}
      </main>
    </div>
  );
};

export default App;
