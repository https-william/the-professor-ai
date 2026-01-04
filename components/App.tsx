
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Hero } from './Hero';
import { InputSection } from './InputSection';
import { LoadingOverlay } from './LoadingOverlay';
import { HistorySidebar } from './HistorySidebar';
import { UserProfileModal } from './UserProfileModal';
import { AboutModal } from './AboutModal';
import { SubscriptionModal } from './SubscriptionModal';
import { WelcomeModal } from './Onboarding/WelcomeModal';
import { TooltipOverlay } from './Onboarding/TooltipOverlay';
import { AuthPage } from './Auth/AuthPage';
import { LandingPage } from './LandingPage';
import { CountdownTimer } from './CountdownTimer';
import { AmbientBackground } from './AmbientBackground';
import { PWAPrompt } from './PWAPrompt';
import { DuelReadyModal } from './DuelReadyModal';
import { ConfirmationModal } from './ConfirmationModal';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent, simplifyExplanation } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, generateHistoryTitle, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, DuelState } from '../types';
import { logout, updateUserUsage, saveUserToFirestore, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore } from '../services/firebase';
import { processFile } from '../services/fileService';

// Lazy Load Heavy Components
const QuizView = React.lazy(() => import('./QuizView').then(module => ({ default: module.QuizView })));
const ProfessorView = React.lazy(() => import('./ProfessorView').then(module => ({ default: module.ProfessorView })));
const ChatView = React.lazy(() => import('./ChatView').then(module => ({ default: module.ChatView })));
const FlashcardView = React.lazy(() => import('./FlashcardView').then(module => ({ default: module.FlashcardView })));
const AdminDashboard = React.lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const App: React.FC = () => {
  const { user, loading, refreshUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(getDefaultProfile());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME' | 'TOOLTIPS'>('COMPLETE');

  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
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

  useEffect(() => {
    if (!user) return;
    if (status === AppStatus.IDLE) window.history.pushState({ page: 'dashboard' }, '', window.location.href);
    const handlePopState = () => { if (status === AppStatus.READY) setStatus(AppStatus.IDLE); else setShowAuth(false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, status]);

  useEffect(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Real-time History Sync & Persistence
  useEffect(() => {
      if (status !== AppStatus.READY || !activeHistoryId) return;

      const syncHistory = () => {
          let dataToSave: any = null;
          let title = '';
          let summary = history.find(h => h.id === activeHistoryId)?.summary || 'Session';
          let currentMode = appMode;
          let config: QuizConfig | undefined;
          
          if (appMode === 'EXAM' || appMode === 'FLASHCARDS') {
              dataToSave = quizState;
              title = history.find(h => h.id === activeHistoryId)?.title || 'Exam';
              config = history.find(h => h.id === activeHistoryId)?.config;
              if (activeDuelId) currentMode = 'DUEL';
          } else if (appMode === 'PROFESSOR') {
              dataToSave = professorState;
              title = history.find(h => h.id === activeHistoryId)?.title || 'Class';
          } else if (appMode === 'CHAT') {
              dataToSave = chatState;
              title = chatState.fileName || 'Chat';
              if (chatState.messages.length > 0) {
                  const lastMsg = chatState.messages[chatState.messages.length - 1];
                  const snippet = lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '');
                  summary = snippet; 
              }
          }

          if (dataToSave) {
              const item: HistoryItem = {
                  id: activeHistoryId,
                  timestamp: Date.now(),
                  mode: currentMode,
                  title: title,
                  data: dataToSave,
                  summary: summary,
                  config
              };
              saveToHistory(item);
              saveCurrentSession(currentMode, dataToSave, title, config);
              setHistory(loadHistory()); 
          }
      };

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(syncHistory, 1000); // 1s debounce

      return () => {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
  }, [quizState, professorState, chatState, activeHistoryId, status, appMode, activeDuelId]);

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
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) setOnboardingStep('TOOLTIPS');
    }
    
    if (user.plan) mergedProfile.subscriptionTier = user.plan;
    
    mergedProfile = updateStreak(mergedProfile);
    
    setUserProfile(mergedProfile);
    saveUserProfile(mergedProfile); 
    setHistory(loadHistory());
    
    const savedSession = loadCurrentSession();
    if (savedSession && savedSession.data) {
      setAppMode(savedSession.mode);
      if (savedSession.mode === 'EXAM' || savedSession.mode === 'FLASHCARDS' || savedSession.mode === 'DUEL') setQuizState(savedSession.data as QuizState);
      else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
      else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
      setStatus(AppStatus.READY);
      
      // Need to find which history ID this session belongs to or create a dummy one
      // For simplicity, we just look for latest in history
      const latest = loadHistory().sort((a,b) => b.timestamp - a.timestamp)[0];
      if (latest) setActiveHistoryId(latest.id);
    }
  }, [user]);

  const attemptAction = (action: () => void, force: boolean = false) => {
      let hasUnsavedProgress = false;
      if (status === AppStatus.READY) {
          if (appMode === 'EXAM' && !quizState.isSubmitted) hasUnsavedProgress = true; 
          if (appMode === 'CHAT' && chatState.messages.length > 3) hasUnsavedProgress = true;
      }
      if (!force && hasUnsavedProgress) {
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
    setOnboardingStep('TOOLTIPS');
  };

  const handleTooltipsComplete = () => {
      localStorage.setItem('hasSeenTour', 'true');
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

  const getDocumentSummary = async (text: string): Promise<string> => {
      try {
          const summary = await simplifyExplanation(text.substring(0, 5000), 'ELA');
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
        
        if (!questions || questions.length === 0) throw new Error("Neural Failure: Content insufficient.");

        const summary = await summaryPromise;
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0, currentQuestionIndex: 0 };
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
        incrementDailyUsage(userProfile, 'QUIZ');
      } else {
        setStatusText("Designing Lesson Plan...");
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        
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
      const updatedProfile = loadUserProfile()!; 
      setUserProfile(updatedProfile); 
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
              try {
                  const parsedUser = JSON.parse(quizState.userAnswers[q.id] || '[]');
                  const parsedCorrect = JSON.parse(q.correct_answer || '[]').sort();
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
      const newProfile = { ...userProfile, questionsAnswered: userProfile.questionsAnswered + quizState.questions.length, correctAnswers: userProfile.correctAnswers + score, xp: newXP };
      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      if (user) {
          await saveUserToFirestore(user.uid, { xp: newXP });
          if (activeDuelId) await submitDuelScore(activeDuelId, user.uid, score);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'RESET') {
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
      if (payload?.force) resetLogic(); else attemptAction(resetLogic);
    }
  };

  const handleChatUpdate = (updatedState: ChatState) => setChatState(updatedState);

  const handleOpenFloatingChat = () => {
      // Fresher Limit
      if (userProfile.subscriptionTier === 'Fresher') {
          setIsSubscriptionOpen(true);
          return;
      }
      
      if (appMode === 'CHAT') return;
      if ((appMode === 'EXAM' && !quizState.isSubmitted)) {
          alert("Chat disabled during active exams.");
          return;
      }

      const newState: ChatState = {
          messages: [{ id: 'init-float', role: 'model', content: "I am The Professor. How can I assist your studies today?", timestamp: Date.now() }],
          fileContext: '',
          fileName: 'General Inquiry'
      };
      setChatState(newState);
      setAppMode('CHAT');
      setStatus(AppStatus.READY);
      
      const newId = Date.now().toString();
      setActiveHistoryId(newId);
      saveToHistory({ id: newId, timestamp: Date.now(), mode: 'CHAT', title: 'General Inquiry', data: newState });
      setHistory(loadHistory());
  };

  const handleDuelStart = async (data: { wager: number, file: File }) => {
      if (!user) return;
      setStatus(AppStatus.PROCESSING_FILE);
      try {
          const processed = await processFile(data.file);
          const config: QuizConfig = { difficulty: 'Hard', questionType: 'Mixed', questionCount: 10, timerDuration: 'Limitless', personality: 'Academic', analogyDomain: 'General', useOracle: true };
          setStatusText("Initializing Arena...");
          const { duelId, code } = await initDuelLobby(user.uid, userProfile.alias || 'Host', data.wager, processed.content, config);
          setDuelReadyData({ id: duelId, code, isHost: true });
          setStatus(AppStatus.IDLE);
          generateQuizFromText(processed.content, config, userProfile).then(async (questions) => {
              if (questions && questions.length > 0) await updateDuelWithQuestions(duelId, questions);
          }).catch(err => console.error("Gen Error", err));
          
          incrementDailyUsage(userProfile, 'DUEL');
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
          incrementDailyUsage(userProfile, 'DUEL');
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
              const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'DUEL', title: `Duel: ${duelState.code}`, data: newState, config: duelState.quizConfig };
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

  return (
    <div className={`min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden relative bg-[#050505]`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleOnboardingComplete} />}
      {onboardingStep === 'TOOLTIPS' && <TooltipOverlay onComplete={handleTooltipsComplete} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); setIsSubscriptionOpen(false); }} />
      <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
      {duelReadyData && <DuelReadyModal duelId={duelReadyData.id} initialCode={duelReadyData.code} isHost={duelReadyData.isHost} onEnter={handleEnterDuel} />}
      
      {isAdBlockActive && <div className="bg-red-600 text-white font-bold text-center py-2 text-xs uppercase tracking-widest fixed top-0 left-0 w-full z-[100] shadow-xl animate-pulse">⚠️ System Blocked: Disable Ad-Blocker to Save Progress & Access Database</div>}

      <nav className={`border-b backdrop-blur-md sticky z-40 bg-black/40 border-white/5 ${isAdBlockActive ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (appMode === 'ADMIN') setAppMode('EXAM'); else handleQuizAction('RESET'); }}>
               <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white border border-white/10 shadow-lg overflow-hidden">
                  <BrandLogo />
               </div>
               <span className="font-serif font-bold text-lg hidden sm:block tracking-tight text-white">The Professor</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
               {/* Library always visible */}
               <button onClick={() => { setHistory(loadHistory()); setIsHistoryOpen(true); }} className="p-2 text-gray-400 hover:text-white transition-colors relative group" title="My Library">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </button>
               
               {userProfile.subscriptionTier === 'Fresher' && (
                   <button onClick={() => setIsSubscriptionOpen(true)} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-lg shadow-amber-900/20">
                       <span>Upgrade</span>
                       <span className="bg-white text-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-[8px] text-orange-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                       </span>
                   </button>
               )}
               <div className="h-6 w-px bg-white/10 mx-2"></div>
               
               {/* Admin Button */}
               {isAdmin && (
                   <button onClick={() => setAppMode('ADMIN')} className="p-2 text-gray-400 hover:text-amber-500 transition-colors" title="Dean's Office">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   </button>
               )}

               <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                   <div className="text-right hidden sm:block">
                       <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{userProfile.alias}</p>
                       <p className="text-[9px] font-mono text-gray-500 uppercase">Lvl {Math.floor(Math.sqrt((userProfile.xp || 0) / 100)) + 1}</p>
                   </div>
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} flex items-center justify-center border-2 border-transparent group-hover:border-blue-500 transition-all shadow-lg`}>
                       <span className="text-sm">{userProfile.avatarEmoji}</span>
                   </div>
               </button>
            </div>
        </div>
      </nav>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => {
            if (item.mode === 'EXAM' || item.mode === 'FLASHCARDS' || item.mode === 'DUEL') setQuizState(item.data as QuizState);
            else if (item.mode === 'PROFESSOR') setProfessorState(item.data as ProfessorState);
            else if (item.mode === 'CHAT') setChatState(item.data as ChatState);
            if (item.mode === 'DUEL') { setAppMode('EXAM'); setActiveDuelId('archive'); } else setAppMode(item.mode);
            setStatus(AppStatus.READY); setActiveHistoryId(item.id); setIsHistoryOpen(false);
        }} onDelete={(id) => { deleteHistoryItem(id); setHistory(loadHistory()); if (activeHistoryId === id) handleQuizAction('RESET', { force: true }); }} />

      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(updated) => { setUserProfile(updated); saveUserProfile(updated); if (user) saveUserToFirestore(user.uid, updated); }} onClearHistory={() => {}} onLogout={async () => { await logout(); window.location.reload(); }} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)] pb-32">
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
                    {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId, ans) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} duelId={activeDuelId} onIndexChange={(index) => handleQuizAction('INDEX', { index })} />}
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} />}
                    {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={(force) => handleQuizAction('RESET', { force })} />}
                    {appMode === 'ADMIN' && <AdminDashboard />}
                 </Suspense>
             </div>
         )}
         {status === AppStatus.ERROR && (
             <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-3xl text-center animate-bounce-subtle">
                 <div className="text-4xl mb-4 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                 <h3 className="text-xl font-bold text-red-500 mb-2">System Failure</h3>
                 <p className="text-gray-400 mb-6">{errorMsg || "An unknown error occurred."}</p>
                 <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-500 transition-colors">Reboot System</button>
             </div>
         )}
      </main>
      
      {/* FAB - Always Visible when logged in */}
      {user && !isModalOpen && (
          <button onClick={handleOpenFloatingChat} className="fixed bottom-8 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40 group pb-safe overflow-hidden">
              <div className="w-10 h-10 group-hover:scale-90 transition-transform"><BrandLogo /></div>
          </button>
      )}
    </div>
  );
};

export default App;
