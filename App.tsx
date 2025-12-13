
import React, { useState, useEffect, Suspense } from 'react';
import { Hero } from './components/Hero';
import { InputSection } from './components/InputSection';
import { LoadingOverlay } from './components/LoadingOverlay';
import { HistorySidebar } from './components/HistorySidebar';
import { UserProfileModal } from './components/UserProfileModal';
import { AboutModal } from './components/AboutModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { WelcomeModal } from './components/Onboarding/WelcomeModal';
import { AuthPage } from './components/Auth/AuthPage';
import { LandingPage } from './components/LandingPage';
import { CountdownTimer } from './components/CountdownTimer';
import { AmbientBackground } from './components/AmbientBackground';
import { PWAPrompt } from './components/PWAPrompt';
import { DuelReadyModal } from './components/DuelReadyModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { useAuth } from './contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from './services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, generateHistoryTitle, incrementDailyUsage } from './services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, DuelState } from './types';
import { logout, updateUserUsage, saveUserToFirestore, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore } from './services/firebase';
import { processFile } from './services/fileService';

// Lazy Load Heavy Components
const QuizView = React.lazy(() => import('./components/QuizView').then(module => ({ default: module.QuizView })));
const ProfessorView = React.lazy(() => import('./components/ProfessorView').then(module => ({ default: module.ProfessorView })));
const ChatView = React.lazy(() => import('./components/ChatView').then(module => ({ default: module.ChatView })));
const FlashcardView = React.lazy(() => import('./components/FlashcardView').then(module => ({ default: module.FlashcardView }))); // Added Lazy Load
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const App: React.FC = () => {
  const { user, loading, refreshUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  
  // Ad-Blocker State
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(getDefaultProfile());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME'>('COMPLETE');

  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null });
  const [professorState, setProfessorState] = useState<ProfessorState>({ sections: [] });
  const [chatState, setChatState] = useState<ChatState>({ messages: [], fileContext: '', fileName: '' });
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Duel State
  const [duelReadyData, setDuelReadyData] = useState<{ id: string, code: string, isHost: boolean } | null>(null);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Detect AdBlocker via Firebase failure
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] && typeof args[0] === 'object' && args[0].message && args[0].message.includes("ERR_BLOCKED_BY_CLIENT")) {
            setIsAdBlockActive(true);
        }
        originalConsoleError(...args);
    };
    
    // Also check on window error events
    window.addEventListener('error', (e) => {
        if (e.message && e.message.includes('ERR_BLOCKED_BY_CLIENT')) setIsAdBlockActive(true);
    }, true);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (status === AppStatus.IDLE) window.history.pushState({ page: 'dashboard' }, '', window.location.href);
    const handlePopState = () => { if (status === AppStatus.READY) setStatus(AppStatus.IDLE); else setShowAuth(false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, status]);

  // Notification Polling Logic
  useEffect(() => {
    const checkReminder = () => {
      if (!userProfile.studyReminders || !userProfile.reminderTime) return;
      
      const now = new Date();
      const [targetHours, targetMinutes] = userProfile.reminderTime.split(':').map(Number);
      
      if (now.getHours() === targetHours && now.getMinutes() === targetMinutes && now.getSeconds() < 10) {
         if (Notification.permission === 'granted') {
             new Notification("The Professor", {
                 body: "Class is in session. Do not be late.",
                 icon: "/favicon.ico"
             });
         }
      }
    };

    const interval = setInterval(checkReminder, 10000); 
    return () => clearInterval(interval);
  }, [userProfile]);

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
            xp: firestoreProfile.xp !== undefined ? firestoreProfile.xp : mergedProfile.xp
        };
    }

    if (user.hasCompletedOnboarding === false) {
        setOnboardingStep('WELCOME');
    } else {
        setOnboardingStep('COMPLETE');
    }
    
    if (user.plan) mergedProfile.subscriptionTier = user.plan;
    
    mergedProfile = updateStreak(mergedProfile);
    
    setUserProfile(mergedProfile);
    saveUserProfile(mergedProfile); 
    setHistory(loadHistory());
    
    const savedSession = loadCurrentSession();
    if (savedSession) {
      setAppMode(savedSession.mode);
      if (savedSession.mode === 'EXAM' || savedSession.mode === 'FLASHCARDS') setQuizState(savedSession.data as QuizState);
      else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
      else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
      setStatus(AppStatus.READY);
    }
  }, [user]);

  // Safe Exit Wrapper
  const attemptAction = (action: () => void) => {
      if (status === AppStatus.READY && (
          (appMode === 'EXAM' && !quizState.isSubmitted) || 
          (appMode === 'PROFESSOR') ||
          (appMode === 'CHAT') ||
          (appMode === 'FLASHCARDS')
      )) {
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
        await saveUserToFirestore(user.uid, { ...data, hasCompletedOnboarding: true });
        await refreshUser(); 
    }
    
    const updated = { ...userProfile, ...data, hasCompletedOnboarding: true };
    setUserProfile(updated);
    saveUserProfile(updated);
    
    if (updated.studyReminders) {
        Notification.requestPermission();
    }
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
      setActiveHistoryId(Date.now().toString()); 
      if (mode === 'CHAT') {
        const newState: ChatState = {
            messages: [],
            fileContext: file.content,
            fileName: file.name
        };
        setChatState(newState);
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        return;
      }
      setStatus(AppStatus.GENERATING_CONTENT);
      setErrorMsg(null);
      const timeRemaining = parseDuration(config.timerDuration);

      if (mode === 'EXAM' || mode === 'FLASHCARDS') {
        setStatusText("Constructing Materials...");
        const questions = await generateQuizFromText(file.content, config, userProfile);
        
        // --- BLANK PAGE PROTECTION ---
        if (!questions || questions.length === 0) {
            throw new Error("Neural Failure: No questions generated. Content might be insufficient or blocked.");
        }

        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0 };
        setQuizState(newState);
        // Use mode explicitly for history title generation
        const historyItem: HistoryItem = { 
            id: Date.now().toString(), 
            timestamp: Date.now(), 
            mode: mode, 
            title: generateHistoryTitle(mode, newState), 
            data: newState, 
            config 
        };
        saveToHistory(historyItem);
        setAppMode(mode); // Ensure state mode is set correctly
      } else {
        setStatusText("Designing Lesson Plan...");
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        setQuizState(prev => ({ ...prev, timeRemaining }));
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: generateHistoryTitle('PROFESSOR', newState), data: newState };
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

  const handleCancelGeneration = () => {
      setStatus(AppStatus.IDLE);
      setErrorMsg(null);
  };

  const handleQuizAction = async (action: 'ANSWER' | 'FLAG' | 'SUBMIT' | 'RESET', payload?: any) => {
    if (action === 'ANSWER') setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [payload.qId]: payload.ans } }));
    if (action === 'FLAG') setQuizState(prev => ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(payload) ? prev.flaggedQuestions.filter(id => id !== payload) : [...prev.flaggedQuestions, payload] }));
    if (action === 'SUBMIT') {
      let score = 0;
      quizState.questions.forEach(q => { 
          // Flexible scoring for multi-select
          if (q.type === 'Select All That Apply') {
              const userAnswer = quizState.userAnswers[q.id];
              const correctAnswer = q.correct_answer;
              try {
                  // Safe Parse inside submission loop as well
                  const parsedUser = JSON.parse(userAnswer || '[]');
                  const parsedCorrect = JSON.parse(correctAnswer || '[]').sort();
                  // Simple array comparison after sort
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

      const newProfile = { 
          ...userProfile, 
          questionsAnswered: userProfile.questionsAnswered + quizState.questions.length, 
          correctAnswers: userProfile.correctAnswers + score, 
          xp: newXP 
      };
      
      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      
      if (user) {
          await saveUserToFirestore(user.uid, { xp: newXP });
          // CRITICAL: Submit Duel Score if active
          if (activeDuelId) {
              await submitDuelScore(activeDuelId, user.uid, score);
          }
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'RESET') {
      const force = payload?.force === true;
      const resetLogic = () => {
          clearCurrentSession();
          setStatus(AppStatus.IDLE);
          setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null });
          setProfessorState({ sections: [] });
          setChatState({ messages: [], fileContext: '', fileName: '' });
          setAppMode('EXAM'); 
          setActiveHistoryId(null);
          setErrorMsg(null); 
          setDuelReadyData(null); // Clear duel state
          setActiveDuelId(null); // Clear active duel
      };

      if (force) {
          resetLogic();
      } else {
          attemptAction(resetLogic);
      }
    }
  };

  const handleChatUpdate = (updatedState: ChatState) => {
      setChatState(updatedState);
      if (activeHistoryId) {
          const item: HistoryItem = {
              id: activeHistoryId,
              timestamp: Date.now(),
              mode: 'CHAT',
              title: generateHistoryTitle('CHAT', updatedState),
              data: updatedState
          };
          saveToHistory(item);
          setHistory(loadHistory());
      }
  };

  const handleOpenFloatingChat = () => {
      if (appMode !== 'CHAT') {
          const newState: ChatState = {
              messages: [{
                  id: 'init-float',
                  role: 'model',
                  content: "I am The Professor. How can I assist your studies today?",
                  timestamp: Date.now()
              }],
              fileContext: '',
              fileName: 'General Inquiry'
          };
          setChatState(newState);
          setAppMode('CHAT');
          setStatus(AppStatus.READY);
          setActiveHistoryId(Date.now().toString());
      }
  };

  // --- DUEL LOGIC ---

  const handleDuelStart = async (data: { wager: number, file: File }) => {
      if (!user) return;
      setStatus(AppStatus.PROCESSING_FILE);
      setErrorMsg(null);
      
      try {
          // 1. Process File
          const processed = await processFile(data.file);
          
          const config: QuizConfig = {
              difficulty: 'Hard',
              questionType: 'Mixed',
              questionCount: 10,
              timerDuration: 'Limitless',
              personality: 'Academic',
              analogyDomain: 'General',
              useOracle: true,
              useWeaknessDestroyer: false
          };

          // 2. IMMEDIATE: Create Lobby (Fast Feedback)
          setStatusText("Initializing Arena...");
          const { duelId, code } = await initDuelLobby(user.uid, userProfile.alias || 'Host', data.wager, processed.content, config);
          
          // 3. Show Lobby UI Immediately
          setDuelReadyData({ id: duelId, code, isHost: true });
          setStatus(AppStatus.IDLE);

          // 4. BACKGROUND: Generate Questions
          // This happens while the user is staring at the Lobby screen
          generateQuizFromText(processed.content, config, userProfile).then(async (questions) => {
              if (questions && questions.length > 0) {
                   await updateDuelWithQuestions(duelId, questions);
                   // The DuelReadyModal subscription will pick up the status change
              } else {
                   // Handle error silently or update status to ERROR in db
              }
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
              const newState: QuizState = { 
                  questions: duelState.quizQuestions, 
                  userAnswers: {}, 
                  flaggedQuestions: [], 
                  isSubmitted: false, 
                  score: 0, 
                  startTime: Date.now(), 
                  timeRemaining: null, 
                  focusStrikes: 0 
              };
              setQuizState(newState);
              setAppMode('EXAM');
              setStatus(AppStatus.READY);
              setActiveDuelId(duelReadyData.id); // Set Active Duel ID to track state
              setDuelReadyData(null);
              
              // Force Save to History so they can resume or review later
              const historyItem: HistoryItem = { 
                  id: Date.now().toString(), 
                  timestamp: Date.now(), 
                  mode: 'EXAM', 
                  title: `Duel: ${duelState.code}`, 
                  data: newState,
                  config: duelState.quizConfig
              };
              saveToHistory(historyItem);
              setHistory(loadHistory());
          } else {
              alert("Host is still preparing materials...");
          }
      }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user && !showAuth) return <LandingPage onEnter={() => setShowAuth(true)} />;
  if (!user && showAuth) return <AuthPage />;
  const isAdmin = user?.email && ['popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com'].includes(user.email);

  const isModalOpen = isProfileOpen || isAboutOpen || isSubscriptionOpen || onboardingStep === 'WELCOME' || !!duelReadyData || showExitConfirmation;
  const isActiveSession = status === AppStatus.READY;

  return (
    <div className={`min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-1000 bg-[#050505]`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleOnboardingComplete} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); setIsSubscriptionOpen(false); }} />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
      
      {/* DUEL READY MODAL */}
      {duelReadyData && (
          <DuelReadyModal 
            duelId={duelReadyData.id} 
            initialCode={duelReadyData.code}
            isHost={duelReadyData.isHost}
            onEnter={handleEnterDuel} 
          />
      )}
      
      {/* AD BLOCKER WARNING BANNER */}
      {isAdBlockActive && (
          <div className="bg-red-600 text-white font-bold text-center py-2 text-xs uppercase tracking-widest fixed top-0 left-0 w-full z-[100] shadow-xl animate-pulse">
              ⚠️ System Blocked: Disable Ad-Blocker to Save Progress & Access Database
          </div>
      )}

      <nav className={`border-b backdrop-blur-md sticky z-40 bg-black/40 border-white/5 ${isAdBlockActive ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (appMode === 'ADMIN') setAppMode('EXAM'); else handleQuizAction('RESET'); }}>
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
               <span className="font-bold hidden sm:block">The Professor</span>
            </div>
            <div className="flex gap-3 md:gap-4 items-center">
               {isAdmin && <button onClick={() => setAppMode(appMode === 'ADMIN' ? 'EXAM' : 'ADMIN')} className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${appMode === 'ADMIN' ? 'bg-amber-900/50 text-amber-500 border-amber-500' : 'text-red-400 border-transparent hover:border-red-500'}`}>{appMode === 'ADMIN' ? 'Exit Dean' : 'Dean\'s Office'}</button>}
               <button onClick={() => setIsSubscriptionOpen(true)} className="px-3 py-1 bg-blue-600 rounded text-[10px] font-bold uppercase">{userProfile.subscriptionTier === 'Excellentia Supreme' ? '👑 Supreme' : 'Upgrade'}</button>
               <div className="hidden md:flex items-center gap-2">
                   <div className="text-right">
                       <div className="text-[10px] font-bold text-gray-400 uppercase">{userProfile.alias || 'Student'}</div>
                       <div className="text-[10px] font-mono text-blue-400">{userProfile.xp || 0} XP</div>
                   </div>
                   <button onClick={() => setIsProfileOpen(true)} className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   </button>
               </div>
               <button onClick={() => setIsProfileOpen(true)} className="md:hidden w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
               <button onClick={() => setIsHistoryOpen(true)} className="opacity-60 hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </button>
            </div>
        </div>
      </nav>

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        onSelect={(item) => { 
            attemptAction(() => {
                setActiveHistoryId(item.id);
                if (item.mode === 'PROFESSOR') { setProfessorState(item.data as ProfessorState); setAppMode('PROFESSOR'); } 
                else if (item.mode === 'CHAT') { setChatState(item.data as ChatState); setAppMode('CHAT'); }
                else if (item.mode === 'FLASHCARDS') { setQuizState(item.data as QuizState); setAppMode('FLASHCARDS'); }
                else { setQuizState(item.data as QuizState); setAppMode('EXAM'); } 
                setStatus(AppStatus.READY); 
                setIsHistoryOpen(false); 
            });
        }} 
        onDelete={(id) => { deleteHistoryItem(id); setHistory(loadHistory()); }} 
      />
      
      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profile={userProfile} 
        onSave={async (p) => { 
            setUserProfile(p); 
            saveUserProfile(p);
            if (user) await saveUserToFirestore(user.uid, p);
        }} 
        onClearHistory={() => { localStorage.clear(); window.location.reload(); }} 
        onLogout={logout} 
      />
      
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 min-h-[calc(100vh-64px)] relative z-10">
        
        {/* Full Screen Error View if Status is ERROR */}
        {status === AppStatus.ERROR ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-red-900/20 flex items-center justify-center border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-pulse-slow">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                </div>
                
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-serif font-bold text-white tracking-tight">System Overload</h2>
                    <p className="text-gray-400 leading-relaxed text-sm">
                        {errorMsg || "The Professor is currently at maximum capacity processing other students. Please wait a moment before trying again."}
                    </p>
                </div>

                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={() => handleQuizAction('RESET')} 
                        className="px-8 py-3 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-transform hover:scale-105 shadow-lg"
                    >
                        Return to Dashboard
                    </button>
                </div>
                
                <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest pt-8">
                    Error Code: 503 / 429 :: Neural Capacity Exceeded
                </p>
            </div>
        ) : (
            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            }>
                {appMode === 'ADMIN' && isAdmin ? <AdminDashboard /> : (
                  <>
                    {status === AppStatus.IDLE ? (
                      <div className="space-y-6 md:space-y-12 pb-20">
                        {appMode === 'EXAM' && <Hero />}
                        {appMode === 'PROFESSOR' && <div className="text-center py-12"><h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">What shall we master?</h1><p className="text-xl opacity-60">"If you can't explain it simply, you don't understand it."</p></div>}
                        
                        <InputSection 
                            onProcess={handleProcess} 
                            isLoading={false} 
                            appMode={appMode} 
                            setAppMode={(m) => attemptAction(() => setAppMode(m))} 
                            defaultConfig={{ difficulty: userProfile.defaultDifficulty }} 
                            userProfile={userProfile} 
                            onShowSubscription={() => setIsSubscriptionOpen(true)}
                            onOpenProfile={() => setIsProfileOpen(true)}
                            onDuelStart={handleDuelStart}
                            onDuelJoin={handleDuelJoin}
                        />
                      </div>
                    ) : null}

                    {(status === AppStatus.PROCESSING_FILE || status === AppStatus.GENERATING_CONTENT) && (
                        <LoadingOverlay 
                            status={statusText} 
                            type={(appMode === 'PROFESSOR' || appMode === 'CHAT') ? 'PROFESSOR' : 'EXAM'} 
                            onCancel={handleCancelGeneration}
                        />
                    )}
                    
                    {status === AppStatus.READY && (
                      <div className="h-full">
                        {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={() => handleQuizAction('RESET')} timeRemaining={quizState.timeRemaining} />}
                        {appMode === 'EXAM' && <QuizView quizState={quizState} difficulty={quizState.questions.length > 0 ? 'Medium' : undefined} onAnswerSelect={(qId, ans) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} duelId={activeDuelId} />}
                        {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force) => handleQuizAction('RESET', { force })} />}
                        {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} />}
                      </div>
                    )}
                  </>
                )}
            </Suspense>
        )}
      </main>

      {!isModalOpen && !isActiveSession && appMode !== 'ADMIN' && status === AppStatus.IDLE && (
          <button 
            onClick={handleOpenFloatingChat}
            className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-amber-600 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center text-white hover:scale-110 transition-transform group border border-amber-500/50 animate-pulse-slow"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>
      )}
    </div>
  );
};

export default App;
