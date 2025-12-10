
import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { InputSection } from './components/InputSection';
import { QuizView } from './components/QuizView';
import { ProfessorView } from './components/ProfessorView';
import { ChatView } from './components/ChatView';
import { HistorySidebar } from './components/HistorySidebar';
import { LoadingOverlay } from './components/LoadingOverlay';
import { UserProfileModal } from './components/UserProfileModal';
import { AboutModal } from './components/AboutModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { WelcomeModal } from './components/Onboarding/WelcomeModal';
import { AuthPage } from './components/Auth/AuthPage';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { CountdownTimer } from './components/CountdownTimer';
import { AmbientBackground } from './components/AmbientBackground';
import { useAuth } from './contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from './services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, generateHistoryTitle, incrementDailyUsage } from './services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, SubscriptionTier } from './types';
import { logout, updateUserUsage } from './services/firebase';

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
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');

  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null });
  const [professorState, setProfessorState] = useState<ProfessorState>({ sections: [] });
  const [chatFileContext, setChatFileContext] = useState('');
  const [chatFileName, setChatFileName] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Navigation Guard
  useEffect(() => {
    if (!user) return;
    if (status === AppStatus.IDLE) window.history.pushState({ page: 'dashboard' }, '', window.location.href);
    const handlePopState = () => { if (status === AppStatus.READY) setStatus(AppStatus.IDLE); else setShowAuth(false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, status]);

  // Init
  useEffect(() => {
    if (!user) return;
    const savedProfile = loadUserProfile();
    if (savedProfile) {
      const updated = updateStreak(savedProfile);
      if (user.plan) updated.subscriptionTier = user.plan;
      setUserProfile(updated);
      if (!savedProfile.hasCompletedOnboarding) {
        if (savedProfile.alias && savedProfile.alias.trim().length > 0) setOnboardingStep('COMPLETE');
        else setOnboardingStep('WELCOME');
      } else {
        setOnboardingStep('COMPLETE');
      }
    } else {
      const newProfile = getDefaultProfile();
      if (user.plan) newProfile.subscriptionTier = user.plan;
      setUserProfile(newProfile);
      setOnboardingStep('WELCOME');
    }
    const savedSession = loadCurrentSession();
    setHistory(loadHistory());
    if (savedSession) {
      setAppMode(savedSession.mode);
      if (savedSession.mode === 'EXAM') setQuizState(savedSession.data as QuizState);
      else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
      setStatus(AppStatus.READY);
    }
  }, [user]);

  const handleAliasSet = (alias: string) => {
    const updated = { ...userProfile, alias, hasCompletedOnboarding: true };
    setUserProfile(updated);
    saveUserProfile(updated);
    setOnboardingStep('COMPLETE');
  };

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
    try {
      if (mode === 'CHAT') {
        setChatFileContext(file.content);
        setChatFileName(file.name); 
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        return;
      }
      setStatus(AppStatus.GENERATING_CONTENT);
      setErrorMsg(null);
      const timeRemaining = config.timerDuration === 'Limitless' ? null : parseInt(config.timerDuration) * 60;

      if (mode === 'EXAM') {
        setStatusText(`Generating ${config.questionCount} questions...`);
        const questions = await generateQuizFromText(file.content, config, userProfile);
        const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0 };
        setQuizState(newState);
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'EXAM', title: generateHistoryTitle('EXAM', newState), data: newState, config };
        saveToHistory(historyItem);
      } else {
        setStatusText("Professor is structuring your lesson plan...");
        const sections = await generateProfessorContent(file.content, config);
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        setQuizState(prev => ({ ...prev, timeRemaining }));
        const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: generateHistoryTitle('PROFESSOR', newState), data: newState };
        saveToHistory(historyItem);
      }

      setHistory(loadHistory());
      const updatedProfile = { ...incrementDailyUsage(userProfile), xp: (userProfile.xp || 0) + 50 };
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
      const newProfile = { ...userProfile, questionsAnswered: userProfile.questionsAnswered + quizState.questions.length, correctAnswers: userProfile.correctAnswers + score, xp: (userProfile.xp || 0) + (score * 10) };
      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'RESET') {
      clearCurrentSession();
      setStatus(AppStatus.IDLE);
      setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null });
      setProfessorState({ sections: [] });
      setChatFileContext('');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user && !showAuth) return <LandingPage onEnter={() => setShowAuth(true)} />;
  if (!user && showAuth) return <AuthPage />;

  const isAdmin = user?.email && ['popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com'].includes(user.email);
  const theme = userProfile.theme;

  return (
    <div className={`min-h-screen text-white selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-1000 ${theme === 'Light' ? 'bg-[#f4f1ea] text-gray-900' : 'bg-[#050505]'}`}>
      <AmbientBackground theme={userProfile.ambientTheme || 'None'} />
      <CountdownTimer />
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleAliasSet} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); setIsSubscriptionOpen(false); }} />
      
      <nav className={`border-b backdrop-blur-md sticky top-0 z-40 ${theme === 'Light' ? 'bg-white/70 border-gray-200' : 'bg-black/40 border-white/5'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (appMode === 'ADMIN') setAppMode('EXAM'); else handleQuizAction('RESET'); }}>
               <span className="text-2xl">🎓</span><span className="font-bold hidden sm:block">The Professor</span>
            </div>
            <div className="flex gap-4">
               {isAdmin && <button onClick={() => setAppMode(appMode === 'ADMIN' ? 'EXAM' : 'ADMIN')} className="text-red-400 text-xs font-bold uppercase">Admin</button>}
               <button onClick={() => setIsSubscriptionOpen(true)} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold uppercase">{userProfile.subscriptionTier === 'Excellentia Supreme' ? '👑 Supreme' : 'Upgrade'}</button>
               <button onClick={() => setIsProfileOpen(true)} className="text-2xl">{userProfile.avatarEmoji}</button>
               <button onClick={() => setIsHistoryOpen(true)} className="opacity-60">📚</button>
            </div>
        </div>
      </nav>

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => { setAppMode(item.mode); if (item.mode === 'EXAM') setQuizState(item.data as QuizState); else setProfessorState(item.data as ProfessorState); setStatus(AppStatus.READY); setIsHistoryOpen(false); }} onDelete={(id) => { deleteHistoryItem(id); setHistory(loadHistory()); }} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(p) => { setUserProfile(p); saveUserProfile(p); }} onClearHistory={() => { localStorage.clear(); window.location.reload(); }} onLogout={logout} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 pt-8 min-h-[calc(100vh-64px)] relative z-10">
        {errorMsg && <div className="mb-8 p-4 bg-red-900/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-bold">{errorMsg} <button onClick={() => setErrorMsg(null)} className="float-right">✕</button></div>}
        
        {appMode === 'ADMIN' && isAdmin ? <AdminDashboard /> : (
          <>
            {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
              <div className="space-y-12 pb-20">
                {appMode === 'EXAM' && <Hero />}
                {appMode === 'PROFESSOR' && <div className="text-center py-12"><h1 className="text-5xl font-serif font-bold mb-4">What shall we master?</h1><p className="text-xl opacity-60">"If you can't explain it simply, you don't understand it."</p></div>}
                <InputSection onProcess={handleProcess} isLoading={false} appMode={appMode} setAppMode={setAppMode} defaultConfig={{ difficulty: userProfile.defaultDifficulty }} userProfile={userProfile} onShowSubscription={() => setIsSubscriptionOpen(true)} />
              </div>
            ) : null}

            {(status === AppStatus.PROCESSING_FILE || status === AppStatus.GENERATING_CONTENT) && <LoadingOverlay status={statusText} type={appMode === 'ADMIN' ? 'EXAM' : (appMode === 'CHAT' ? 'PROFESSOR' : appMode)} />}
            
            {status === AppStatus.READY && (
              <div className="h-full">
                {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={() => handleQuizAction('RESET')} timeRemaining={quizState.timeRemaining} />}
                {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId, ans) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} />}
                {appMode === 'CHAT' && <ChatView fileContext={chatFileContext} onExit={() => handleQuizAction('RESET')} fileName={chatFileName} />}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
