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
import { useAuth } from '../contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore } from '../services/supabase';
import { processFile } from '../services/fileService';
import { useNavigate } from 'react-router-dom';

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

// Desktop Dock
const FloatingDock: React.FC<{ mode: AppMode, setMode: (m: AppMode) => void, onHub: () => void, isDuelActive: boolean, onDuel: () => void }> = ({ mode, setMode, onHub, isDuelActive, onDuel }) => {
    const DockItem = ({ active, onClick, icon, label, colorClass }: any) => (
        <button 
            onClick={onClick}
            className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${active ? `${colorClass} -translate-y-4 scale-110 shadow-lg text-white` : 'bg-white/5 hover:bg-white/10 hover:-translate-y-2 text-gray-400'}`}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] hidden md:flex items-end gap-3 px-4 pb-3 pt-3 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all hover:scale-105 hover:bg-black/90">
            <DockItem active={mode === 'EXAM'} onClick={() => setMode('EXAM')} label="Exam" colorClass="bg-blue-600 shadow-blue-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>} />
            <DockItem active={mode === 'PROFESSOR'} onClick={() => setMode('PROFESSOR')} label="Lecture" colorClass="bg-amber-600 shadow-amber-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>} />
            <DockItem active={mode === 'FLASHCARDS'} onClick={() => setMode('FLASHCARDS')} label="Cards" colorClass="bg-pink-600 shadow-pink-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} />
            <DockItem active={mode === 'HUB'} onClick={() => { setMode('HUB'); onHub(); }} label="The Hub" colorClass="bg-green-600 shadow-green-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>} />
            <DockItem active={mode === 'DUEL'} onClick={() => { if(isDuelActive) setMode('DUEL'); else onDuel(); }} label="Arena" colorClass="bg-purple-600 shadow-purple-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} />
        </div>
    );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  const saveTimeoutRef = useRef<any>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Restore Session
  useEffect(() => {
    if (!user) return;
    const localProfile = loadUserProfile() || getDefaultProfile();
    setUserProfile(localProfile);
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
              saveToHistory(item);
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
      
      setHistory(await loadHistory());
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

  const handleQuizAction = (action: string, payload?: any) => {
      if (action === 'RESET') {
          clearCurrentSession();
          setStatus(AppStatus.IDLE);
          setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
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
  const hideFABs = appMode === 'EXAM' && !quizState.isSubmitted;

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
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={() => { if(pendingAction) pendingAction(); setShowExitConfirmation(false); setPendingAction(null); }} onCancel={() => setShowExitConfirmation(false)} />
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
            if (activeHistoryId === id) handleQuizAction('RESET');
      }} />
      
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(updated) => { setUserProfile(updated); saveUserProfile(updated); if(user) saveUserToSupabase(user.uid, updated); }} onClearHistory={() => {}} onLogout={async () => { await logout(); navigate('/'); }} isAdmin={!!isAdmin} onRequestAdminAccess={() => { setIsProfileOpen(false); setShowAdminVerify(true); }} />

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
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId: any, ans: any) => setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [qId]: ans } }))} onFlagQuestion={(qId: any) => setQuizState(prev => ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(qId) ? prev.flaggedQuestions.filter(id => id !== qId) : [...prev.flaggedQuestions, qId] }))} onSubmit={() => {
                        let score = 0;
                        quizState.questions.forEach(q => { if (quizState.userAnswers[q.id] === q.correct_answer) score++; });
                        setQuizState(prev => ({ ...prev, isSubmitted: true, score }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => {}} duelId={activeDuelId} onIndexChange={(idx: any) => setQuizState(prev => ({ ...prev, currentQuestionIndex: idx }))} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force: any) => handleQuizAction('RESET')} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={setChatState} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force: any) => handleQuizAction('RESET')} onGenerate={(newState) => { setQuizState(newState); setStatus(AppStatus.READY); }} />}
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

export default Dashboard;