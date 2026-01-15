
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
import { ErrorBoundary } from './ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan } from '../services/supabase';
import { processFile } from '../services/fileService';

// Robust Lazy Loading with Retry
function lazyRetry(
  componentImport: () => Promise<any>
): React.LazyExoticComponent<any> {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Lazy Load Error, retrying...", error);
      // Wait 1 second and retry once
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await componentImport();
    }
  });
}

const QuizView = lazyRetry(() => import('./QuizView'));
const ProfessorView = lazyRetry(() => import('./ProfessorView'));
const ChatView = lazyRetry(() => import('./ChatView'));
const FlashcardView = lazyRetry(() => import('./FlashcardView'));
const AdminDashboard = lazyRetry(() => import('./AdminDashboard'));
const TheHub = lazyRetry(() => import('./TheHub'));

type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED';

const ADMIN_EMAILS = [
    'popoolaariseoluwa@gmail.com', 
    'professoradmin@gmail.com',
    'vexis.automations@gmail.com'
];

// Desktop Dock
const FloatingDock: React.FC<{ mode: AppMode, setMode: (m: AppMode) => void, onHub: () => void, isDuelActive: boolean, onDuel: () => void }> = ({ mode, setMode, onHub, isDuelActive, onDuel }) => {
    const DockItem = ({ active, onClick, icon, label, colorClass }: any) => (
        <button 
            onClick={onClick}
            className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${active ? `${colorClass} -translate-y-4 scale-110 shadow-lg` : 'bg-white/5 hover:bg-white/10 hover:-translate-y-2'}`}
        >
            <div className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {icon}
            </div>
            <span className={`absolute -top-10 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md whitespace-nowrap transition-opacity duration-200 pointer-events-none ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {label}
            </span>
            {active && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
        </button>
    );

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] hidden md:flex items-end gap-3 px-4 pb-3 pt-3 bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all hover:scale-105 hover:bg-black/90">
            <DockItem active={mode === 'EXAM'} onClick={() => setMode('EXAM')} label="Exam" colorClass="bg-blue-600 shadow-blue-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>} />
            <DockItem active={mode === 'PROFESSOR'} onClick={() => setMode('PROFESSOR')} label="Lecture" colorClass="bg-amber-600 shadow-amber-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>} />
            <DockItem active={mode === 'FLASHCARDS'} onClick={() => setMode('FLASHCARDS')} label="Cards" colorClass="bg-pink-600 shadow-pink-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} />
            <DockItem active={mode === 'HUB'} onClick={() => { setMode('HUB'); onHub(); }} label="The Hub" colorClass="bg-green-600 shadow-green-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>} />
            <DockItem active={mode === 'DUEL'} onClick={() => { if(isDuelActive) setMode('DUEL'); else onDuel(); }} label="Arena" colorClass="bg-purple-600 shadow-purple-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} />
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
  const currentLevel = Math.max(1, Math.floor(Math.sqrt(userProfile.xp || 0) * 0.2));

  // Mode Switching Logic
  const handleSetAppMode = (mode: AppMode) => {
      // Ensure we don't clear state unnecessarily
      if (mode === 'PROFESSOR' && professorState.sections.length === 0) setStatus(AppStatus.IDLE);
      else if (mode === 'EXAM' && quizState.questions.length === 0) setStatus(AppStatus.IDLE);
      else setStatus(AppStatus.READY);
      
      setAppMode(mode);
  };

  useEffect(() => {
    // Hash router for shares
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
    if (currentView === 'SHARED' || currentView === 'PRICING') return;
    
    if (user) {
        if (currentView !== 'CHECKOUT') setCurrentView('APP');
    } else {
        if (currentView === 'APP' || currentView === 'CHECKOUT') setCurrentView('LANDING');
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const localProfile = loadUserProfile() || getDefaultProfile();
    // Simplified sync logic for profile
    setUserProfile(localProfile);
    setHistory(loadHistory());
  }, [user]);

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
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining: null, focusStrikes: 0, currentQuestionIndex: 0 };
        setQuizState(newState);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, config });
        setAppMode(mode); 
      } else {
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: file.name, data: newState });
      }
      
      setHistory(loadHistory());
      setStatus(AppStatus.READY);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "Failed to process content. The queue might be full.");
    }
  };

  const handleCancelGeneration = () => { setStatus(AppStatus.IDLE); setErrorMsg(null); };

  const handleQuizAction = (action: string, payload?: any) => {
      if (action === 'RESET') {
          clearCurrentSession();
          setStatus(AppStatus.IDLE);
          setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
      }
      // Other actions handled inside QuizView now for cleaner App.tsx
  };

  // --- RENDERING ---
  if (loading) return <div className="min-h-screen bg-core flex items-center justify-center"><div className="w-16 h-16 border-4 border-border-main border-t-accent rounded-full animate-spin"></div></div>;
  if (currentView === 'SHARED' && shareId) return <SharedView shareId={shareId} onNavigateHome={() => window.location.href = '/'} />;
  if (currentView === 'ADMIN_LOGIN') return <AdminLoginPage onBack={() => navigate('LANDING', '/')} onSuccess={handleAdminSuccess} />;
  if (currentView === 'PRICING') return <PricingPage onBack={() => navigate('LANDING', '/')} onSelectPlan={(tier) => { localStorage.setItem('pending_plan', tier); navigate('AUTH', '/login'); }} />;
  if (currentView === 'CHECKOUT' && checkoutTier) return <PlanCheckoutPage tier={checkoutTier} onBack={() => navigate('APP', '/')} onSuccess={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); navigate('APP', '/'); }} />;
  if (currentView === 'AUTH' && !user) return <AuthPage />;
  if (currentView === 'LANDING' && !user) return <LandingPage onEnter={() => navigate('AUTH', '/login')} onPricing={() => navigate('PRICING', '/pricing')} />;

  const shouldHideDock = status === AppStatus.READY && appMode === 'EXAM';

  return (
    <div className={`min-h-screen text-text-pri bg-core selection:bg-accent/30 overflow-x-hidden relative transition-colors duration-1000 font-sans pb-32`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={(data) => { setUserProfile({...userProfile, ...data}); setOnboardingStep('COMPLETE'); }} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={() => {}} />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => setShowExitConfirmation(false)} />
      <AdminVerifyModal isOpen={showAdminVerify} onClose={() => setShowAdminVerify(false)} onSuccess={handleAdminSuccess} />

      {/* Docks */}
      {status !== AppStatus.ERROR && appMode !== 'ADMIN' && !shouldHideDock && (
          <>
            <FloatingDock mode={appMode} setMode={handleSetAppMode} onHub={() => setStatus(AppStatus.READY)} isDuelActive={false} onDuel={() => setAppMode('DUEL')} />
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
            <div className="flex items-center gap-4">
               {status === AppStatus.IDLE && <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-text-sec hover:text-text-pri"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></button>}
               <NotificationBell />
               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-accent transition-all`}>
                       <span className="text-sm">{userProfile.avatarEmoji}</span>
                   </div>
               </button>
            </div>
        </div>
      </nav>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={() => {}} onDelete={() => {}} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={() => {}} onClearHistory={() => {}} onLogout={async () => { await logout(); window.location.reload(); }} isAdmin={!!isAdmin} onRequestAdminAccess={() => { setIsProfileOpen(false); setShowAdminVerify(true); }} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
         {status === AppStatus.IDLE && appMode !== 'ADMIN' && (
             <>
                <Hero />
                <InputSection onProcess={handleProcess} isLoading={false} appMode={appMode} setAppMode={handleSetAppMode} defaultConfig={{ difficulty: userProfile.defaultDifficulty }} userProfile={userProfile} onShowSubscription={() => setIsSubscriptionOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} onHubEnter={() => { setAppMode('HUB'); setStatus(AppStatus.READY); }} />
             </>
         )}
         
         {status === AppStatus.PROCESSING_FILE && <LoadingOverlay status="Processing Document..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.GENERATING_CONTENT && <LoadingOverlay status={statusText || "Generating Content..."} type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         
         {status === AppStatus.READY && (
             <div className="animate-slide-up-fade">
                 <Suspense fallback={<div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-accent rounded-full animate-spin"></div></div>}>
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId: any, ans: any) => setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [qId]: ans } }))} onFlagQuestion={() => {}} onSubmit={() => {}} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => {}} onIndexChange={() => {}} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force: any) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={setChatState} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force: any) => handleQuizAction('RESET', { force })} />}
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

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
