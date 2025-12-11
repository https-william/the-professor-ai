
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
import { useAuth } from './contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from './services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, generateHistoryTitle, incrementDailyUsage } from './services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState } from './types';
import { logout, updateUserUsage, saveUserToFirestore, createDuel } from './services/firebase';
import { processFile } from './services/fileService';

// Lazy Load Heavy Components
const QuizView = React.lazy(() => import('./components/QuizView').then(module => ({ default: module.QuizView })));
const ProfessorView = React.lazy(() => import('./components/ProfessorView').then(module => ({ default: module.ProfessorView })));
const ChatView = React.lazy(() => import('./components/ChatView').then(module => ({ default: module.ChatView })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  
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
    const savedProfile = loadUserProfile();
    let currentProfile = savedProfile || getDefaultProfile();
    const extendedUser = user as any;
    if (extendedUser.hasCompletedOnboarding === false) setOnboardingStep('WELCOME');
    else setOnboardingStep('COMPLETE');
    if (extendedUser.profile?.alias) currentProfile.alias = extendedUser.profile.alias;
    if (user.plan) currentProfile.subscriptionTier = user.plan;
    currentProfile = updateStreak(currentProfile);
    
    if (currentProfile.studyReminders && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    setUserProfile(currentProfile);
    saveUserProfile(currentProfile);
    setHistory(loadHistory());
    const savedSession = loadCurrentSession();
    if (savedSession) {
      setAppMode(savedSession.mode);
      if (savedSession.mode === 'EXAM') setQuizState(savedSession.data as QuizState);
      else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
      else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
      setStatus(AppStatus.READY);
    }
  }, [user]);

  const handleOnboardingComplete = async (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data, hasCompletedOnboarding: true };
    setUserProfile(updated);
    saveUserProfile(updated);
    if (updated.studyReminders) {
        Notification.requestPermission();
    }
    if (user) await saveUserToFirestore(user.uid, { alias: updated.alias, hasCompletedOnboarding: true });
    setOnboardingStep('COMPLETE');
  };

  const parseDuration = (duration: string): number | null => {
      if (duration === 'Limitless') return null;
      
      // Parse "1h 30m" format
      let totalSeconds = 0;
      
      const hourMatch = duration.match(/(\d+)h/);
      if (hourMatch) {
          totalSeconds += parseInt(hourMatch[1]) * 3600;
      }
      
      const minMatch = duration.match(/(\d+)m/);
      if (minMatch) {
          totalSeconds += parseInt(minMatch[1]) * 60;
      }
      
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

      if (mode === 'EXAM') {
        setStatusText("Constructing Exam...");
        const questions = await generateQuizFromText(file.content, config, userProfile);
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0 };
        setQuizState(newState);
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'EXAM', title: generateHistoryTitle('EXAM', newState), data: newState, config };
        saveToHistory(historyItem);
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

  const handleQuizAction = (action: 'ANSWER' | 'FLAG' | 'SUBMIT' | 'RESET', payload?: any) => {
    if (action === 'ANSWER') setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [payload.qId]: payload.ans } }));
    if (action === 'FLAG') setQuizState(prev => ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(payload) ? prev.flaggedQuestions.filter(id => id !== payload) : [...prev.flaggedQuestions, payload] }));
    if (action === 'SUBMIT') {
      let score = 0;
      quizState.questions.forEach(q => { if (quizState.userAnswers[q.id] === q.correct_answer) score++; });
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
      if (user) saveUserToFirestore(user.uid, { xp: newProfile.xp });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'RESET') {
      clearCurrentSession();
      setStatus(AppStatus.IDLE);
      setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null });
      setProfessorState({ sections: [] });
      setChatState({ messages: [], fileContext: '', fileName: '' });
      setAppMode('EXAM'); 
      setActiveHistoryId(null);
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
      // If modal is open (like profile), close it? Or just overlap.
      // If we are already in a view, floating chat acts as a "quick assistant"
      // For this implementation, it switches to CHAT mode.
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

  const handleDuelStart = async (data: { wager: number, file: File }) => {
      if (!user) return;
      setStatus(AppStatus.PROCESSING_FILE);
      try {
          const processed = await processFile(data.file);
          setStatusText("Initializing Arena...");
          
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

          const questions = await generateQuizFromText(processed.content, config, userProfile);
          
          const duelId = await createDuel(user.uid, userProfile.alias, data.wager, processed.content, config, questions);
          
          alert(`Duel Created! Share this ID with your opponent: ${duelId}`);
          
          // Auto-start for host
          const newState: QuizState = { 
              questions, 
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

      } catch (e: any) {
          setErrorMsg("Failed to create Duel: " + e.message);
          setStatus(AppStatus.IDLE);
      }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user && !showAuth) return <LandingPage onEnter={() => setShowAuth(true)} />;
  if (!user && showAuth) return <AuthPage />;
  const isAdmin = user?.email && ['popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com'].includes(user.email);

  // Determine modal overlay state to prevent FAB click
  const isModalOpen = isProfileOpen || isAboutOpen || isSubscriptionOpen || onboardingStep === 'WELCOME';

  return (
    <div className={`min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-1000 bg-[#050505]`}>
      <AmbientBackground theme='Deep Space' />
      <CountdownTimer />
      <PWAPrompt />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleOnboardingComplete} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); setIsSubscriptionOpen(false); }} />
      
      <nav className="border-b backdrop-blur-md sticky top-0 z-40 bg-black/40 border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (appMode === 'ADMIN') setAppMode('EXAM'); else handleQuizAction('RESET'); }}>
               <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
               <span className="font-bold hidden sm:block">The Professor</span>
            </div>
            <div className="flex gap-3 md:gap-4 items-center">
               {isAdmin && <button onClick={() => setAppMode(appMode === 'ADMIN' ? 'EXAM' : 'ADMIN')} className="text-red-400 text-[10px] font-bold uppercase">Admin</button>}
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
            setActiveHistoryId(item.id);
            if (item.mode === 'PROFESSOR') { setProfessorState(item.data as ProfessorState); setAppMode('PROFESSOR'); } 
            else if (item.mode === 'CHAT') { setChatState(item.data as ChatState); setAppMode('CHAT'); }
            else { setQuizState(item.data as QuizState); setAppMode('EXAM'); } 
            setStatus(AppStatus.READY); 
            setIsHistoryOpen(false); 
        }} 
        onDelete={(id) => { deleteHistoryItem(id); setHistory(loadHistory()); }} 
      />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(p) => { setUserProfile(p); saveUserProfile(p); }} onClearHistory={() => { localStorage.clear(); window.location.reload(); }} onLogout={logout} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 pt-4 md:pt-8 min-h-[calc(100vh-64px)] relative z-10">
        {errorMsg && <div className="mb-8 p-4 bg-red-900/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-bold">{errorMsg} <button onClick={() => setErrorMsg(null)} className="float-right">✕</button></div>}
        
        <Suspense fallback={
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        }>
            {appMode === 'ADMIN' && isAdmin ? <AdminDashboard /> : (
              <>
                {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
                  <div className="space-y-6 md:space-y-12 pb-20">
                    {appMode === 'EXAM' && <Hero />}
                    {appMode === 'PROFESSOR' && <div className="text-center py-12"><h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">What shall we master?</h1><p className="text-xl opacity-60">"If you can't explain it simply, you don't understand it."</p></div>}
                    
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
                    />
                  </div>
                ) : null}

                {(status === AppStatus.PROCESSING_FILE || status === AppStatus.GENERATING_CONTENT) && <LoadingOverlay status={statusText} type={(appMode === 'PROFESSOR' || appMode === 'CHAT') ? 'PROFESSOR' : 'EXAM'} />}
                
                {status === AppStatus.READY && (
                  <div className="h-full">
                    {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={() => handleQuizAction('RESET')} timeRemaining={quizState.timeRemaining} />}
                    {appMode === 'EXAM' && <QuizView quizState={quizState} difficulty={quizState.questions.length > 0 ? 'Medium' : undefined} onAnswerSelect={(qId, ans) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} />}
                    {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} />}
                  </div>
                )}
              </>
            )}
        </Suspense>
      </main>

      {/* Floating Chat Button (Omni-FAB) - Hidden when modals are open */}
      {!isModalOpen && status === AppStatus.IDLE && (
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
