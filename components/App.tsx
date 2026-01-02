
import React, { useState, useEffect, Suspense, useRef } from 'react';
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
import { generateQuizFromText, generateProfessorContent, simplifyExplanation } from './services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, generateHistoryTitle, incrementDailyUsage } from './services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, DuelState } from './types';
import { logout, updateUserUsage, saveUserToFirestore, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore } from './services/firebase';
import { processFile } from './services/fileService';

// Lazy Load Heavy Components
const QuizView = React.lazy(() => import('./components/QuizView').then(module => ({ default: module.QuizView })));
const ProfessorView = React.lazy(() => import('./components/ProfessorView').then(module => ({ default: module.ProfessorView })));
const ChatView = React.lazy(() => import('./components/ChatView').then(module => ({ default: module.ChatView })));
const FlashcardView = React.lazy(() => import('./components/FlashcardView').then(module => ({ default: module.FlashcardView })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const BrandLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style={{stopColor:'#3b82f6', stopOpacity:1}} />
        <stop offset='100%' style={{stopColor:'#8b5cf6', stopOpacity:1}} />
      </linearGradient>
    </defs>
    <rect width='100' height='100' rx='20' fill='#0f172a'/>
    <path d='M15 45 L50 25 L85 45 L50 65 Z' fill='url(#grad)' stroke='#ffffff' strokeWidth='2'/>
    <path d='M85 45 V70' stroke='#f59e0b' strokeWidth='3' strokeLinecap='round'/>
    <circle cx='85' cy='75' r='5' fill='#f59e0b'/>
    <path d='M30 55 V75 C30 85 70 85 70 75 V55' fill='none' stroke='white' strokeWidth='2'/>
    <circle cx='50' cy='45' r='5' fill='#fff'/>
  </svg>
);

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

  const saveTimeoutRef = useRef<any>(null);

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

  // Real-time History Sync
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
                  summary: history.find(h => h.id === activeHistoryId)?.summary // Preserve summary
              };
              saveToHistory(item);
              setHistory(loadHistory()); // Update UI
          }
      };

      // Debounce saving to avoid disk thrashing
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(syncHistory, 2000);

      return () => {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
  }, [quizState, professorState, chatState, activeHistoryId, status, appMode]);

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
  const attemptAction = (action: () => void, force: boolean = false) => {
      if (!force && status === AppStatus.READY && (
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

  // Helper to get 5-word summary
  const getDocumentSummary = async (text: string): Promise<string> => {
      try {
          const summary = await simplifyExplanation(text.substring(0, 5000), 'ELA', "5 word abstract/tagline");
          return summary.replace(/"/g, '').trim();
      } catch (e) {
          return "Uploaded Document";
      }
  };

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
    try {
      setActiveHistoryId(Date.now().toString()); 
      const summaryPromise = getDocumentSummary(file.content);

      if (mode === 'CHAT') {
        const summary = await summaryPromise;
        const newState: ChatState = {
            messages: [],
            fileContext: file.content,
            fileName: file.name
        };
        setChatState(newState);
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        
        const historyItem: HistoryItem = { 
            id: Date.now().toString(), 
            timestamp: Date.now(), 
            mode: 'CHAT', 
            title: file.name, 
            data: newState,
            summary: summary 
        };
        saveToHistory(historyItem);
        setHistory(loadHistory());
        setActiveHistoryId(historyItem.id);
        return;
      }
      setStatus(AppStatus.GENERATING_CONTENT);
      setErrorMsg(null);
      const timeRemaining = parseDuration(config.timerDuration);

      if (mode === 'EXAM' || mode === 'FLASHCARDS') {
        setStatusText("Constructing Materials...");
        const questions = await generateQuizFromText(file.content, config, userProfile);
        
        if (!questions || questions.length === 0) {
            throw new Error("Neural Failure: No questions generated. Content might be insufficient or blocked.");
        }

        const summary = await summaryPromise;
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0 };
        setQuizState(newState);
        
        const historyItem: HistoryItem = { 
            id: Date.now().toString(), 
            timestamp: Date.now(), 
            mode: mode, 
            title: file.name, 
            data: newState, 
            config,
            summary: summary
        };
        saveToHistory(historyItem);
        setAppMode(mode); 
      } else {
        setStatusText("Designing Lesson Plan...");
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        setQuizState(prev => ({ ...prev, timeRemaining }));
        
        const summary = await summaryPromise;
        const historyItem: HistoryItem = { 
            id: Date.now().toString(), 
            timestamp: Date.now(), 
            mode: 'PROFESSOR', 
            title: file.name, 
            data: newState,
            summary: summary 
        };
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
          setDuelReadyData(null); 
          setActiveDuelId(null); 
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
      // History sync handled by useEffect now
  };

  const handleOpenFloatingChat = () => {
      // Don't open if already in chat or during active exam/duel
      if (appMode === 'CHAT') return;
      if ((appMode === 'EXAM' && !quizState.isSubmitted)) {
          alert("Chat disabled during active exams.");
          return;
      }

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
      
      const newId = Date.now().toString();
      setActiveHistoryId(newId);
      saveToHistory({
          id: newId,
          timestamp: Date.now(),
          mode: 'CHAT',
          title: 'General Inquiry',
          data: newState
      });
      setHistory(loadHistory());
  };

  // --- DUEL LOGIC ---

  const handleDuelStart = async (data: { wager: number, file: File }) => {
      if (!user) return;
      setStatus(AppStatus.PROCESSING_FILE);
      setErrorMsg(null);
      
      try {
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

          setStatusText("Initializing Arena...");
          const { duelId, code } = await initDuelLobby(user.uid, userProfile.alias || 'Host', data.wager, processed.content, config);
          
          setDuelReadyData({ id: duelId, code, isHost: true });
          setStatus(AppStatus.IDLE);

          generateQuizFromText(processed.content, config, userProfile).then(async (questions) => {
              if (questions && questions.length > 0) {
                   await updateDuelWithQuestions(duelId, questions);
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
              setActiveDuelId(duelReadyData.id);
              setDuelReadyData(null);
              
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

  // Should we show the chat FAB?
  // Only if NOT in active exam or duel, and NOT in chat mode already
  const showChatFab = isActiveSession && appMode !== 'CHAT' && appMode !== 'DUEL' && (appMode !== 'EXAM' || quizState.isSubmitted);

  return (
    <div className={`min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-1000 bg-[#050505]`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleOnboardingComplete} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); setIsSubscriptionOpen(false); }} />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
      
      {duelReadyData && (
          <DuelReadyModal 
            duelId={duelReadyData.id} 
            initialCode={duelReadyData.code}
            isHost={duelReadyData.isHost}
            onEnter={handleEnterDuel} 
          />
      )}
      
      {isAdBlockActive && (
          <div className="bg-red-600 text-white font-bold text-center py-2 text-xs uppercase tracking-widest fixed top-0 left-0 w-full z-[100] shadow-xl animate-pulse">
              ⚠️ System Blocked: Disable Ad-Blocker to Save Progress & Access Database
          </div>
      )}

      <nav className={`border-b backdrop-blur-md sticky z-40 bg-black/40 border-white/5 ${isAdBlockActive ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (appMode === 'ADMIN') setAppMode('EXAM'); else handleQuizAction('RESET'); }}>
               <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white border border-white/10 shadow-lg overflow-hidden">
                  <BrandLogo />
               </div>
               <span className="font-serif font-bold text-lg hidden sm:block tracking-tight text-white">The Professor</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
               <button 
                 onClick={() => setIsHistoryOpen(true)}
                 className="p-2 text-gray-400 hover:text-white transition-colors relative"
                 title="My Library"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
               </button>
               
               {userProfile.subscriptionTier === 'Fresher' && (
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

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onSelect={(item) => {
            if (item.mode === 'EXAM' || item.mode === 'FLASHCARDS') {
                setQuizState(item.data as QuizState);
                if (item.config) {
                    // Restore config
                }
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

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profile={userProfile} 
        onSave={(updated) => {
            setUserProfile(updated);
            saveUserProfile(updated);
            if (user) saveUserToFirestore(user.uid, updated);
        }}
        onClearHistory={() => {}}
        onLogout={async () => {
            await logout();
            window.location.reload();
        }}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
         {status === AppStatus.IDLE && (
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
                />
             </>
         )}

         {status === AppStatus.PROCESSING_FILE && <LoadingOverlay status="Processing Document..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         {status === AppStatus.GENERATING_CONTENT && <LoadingOverlay status={statusText || "Generating Content..."} type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
         
         {status === AppStatus.READY && (
             <div className="animate-slide-up-fade">
                 <Suspense fallback={<div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-white rounded-full animate-spin"></div></div>}>
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId, ans) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} duelId={activeDuelId} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force) => handleQuizAction('RESET', { force })} />}
                    {appMode === 'ADMIN' && <AdminDashboard />}
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

      {/* Admin Secret Entry */}
      {isAdmin && (
          <div className="fixed bottom-2 right-2 opacity-20 hover:opacity-100 transition-opacity z-50">
              <button onClick={() => setAppMode('ADMIN')} className="text-[10px] uppercase font-mono text-gray-500">Admin</button>
          </div>
      )}
      
      {/* Floating Chat Trigger - Hide during exams */}
      {showChatFab && !isModalOpen && (
          <button 
            onClick={handleOpenFloatingChat}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40 group"
          >
              <span className="text-2xl group-hover:animate-wiggle">💬</span>
          </button>
      )}
    </div>
  );
};

export default App;
