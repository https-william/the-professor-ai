
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
import { TooltipOverlay } from './components/Onboarding/TooltipOverlay';
import { AuthPage } from './components/Auth/AuthPage';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './contexts/AuthContext';
import { generateQuizFromText, generateProfessorContent } from './services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, generateHistoryTitle, incrementDailyUsage } from './services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, SubscriptionTier } from './types';
import { logout, updateUserUsage } from './services/firebase';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Navigation State
  const [showAuth, setShowAuth] = useState(false);

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  
  // User Profile & Onboarding
  const [userProfile, setUserProfile] = useState<UserProfile>(getDefaultProfile());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME' | 'TOOLTIPS'>('COMPLETE');

  // Saving State
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');

  // States
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    userAnswers: {},
    flaggedQuestions: [],
    isSubmitted: false,
    score: 0,
    startTime: null,
    timeRemaining: null
  });

  const [professorState, setProfessorState] = useState<ProfessorState>({
    sections: []
  });

  // Chat State
  const [chatFileContext, setChatFileContext] = useState('');
  const [chatFileName, setChatFileName] = useState('');

  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Navigation Guard - Push State
  useEffect(() => {
    if (!user) return;

    if (status === AppStatus.IDLE) {
      // Push entry to history so Back button goes to Landing/Auth instead of closing
      window.history.pushState({ page: 'dashboard' }, '', window.location.href);
    }
      
    const handlePopState = (event: PopStateEvent) => {
      // If we are deep in the app (Ready state), go back to Idle
      if (status === AppStatus.READY) {
        setStatus(AppStatus.IDLE);
        // window.history.pushState({ page: 'dashboard' }, '', window.location.href); // Optional: Maintain history state
      } else {
        // If we are at dashboard, let it go back (to landing/auth)
        // or handle logic to show landing page
        setShowAuth(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, status]);

  // Initialize
  useEffect(() => {
    if (!user) return; // Wait for auth

    // Load Profile
    const savedProfile = loadUserProfile();
    if (savedProfile) {
      const updated = updateStreak(savedProfile);
      
      // Sync plan from Firestore if available
      if (user.plan) {
        updated.subscriptionTier = user.plan;
      }
      
      // Sync usage if user object has it (assuming we added it to extended user, but auth context update might lag. 
      // For now, relies on local storage or fresh sync. 
      // Ideally AuthContext should fetch dailyQuizzesGenerated too. 
      // Let's assume we implement that in AuthContext later if needed, but for now local is primary source for quick check)

      setUserProfile(updated);
      saveUserProfile(updated);
      
      // Strict Onboarding Check
      if (!savedProfile.hasCompletedOnboarding) {
        // If they already have an alias, skip to tooltips to avoid asking identity again
        if (savedProfile.alias && savedProfile.alias.trim().length > 0) {
           setOnboardingStep('TOOLTIPS');
        } else {
           setOnboardingStep('WELCOME');
        }
      } else {
        setOnboardingStep('COMPLETE');
      }
    } else {
      // New User
      const newProfile = getDefaultProfile();
      if (user.plan) newProfile.subscriptionTier = user.plan;
      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      setOnboardingStep('WELCOME');
    }

    // Load Session
    const savedSession = loadCurrentSession();
    const savedHistory = loadHistory();
    setHistory(savedHistory);

    if (savedSession) {
      setAppMode(savedSession.mode);
      if (savedSession.mode === 'EXAM') {
        setQuizState(savedSession.data as QuizState);
      } else if (savedSession.mode === 'PROFESSOR') {
        setProfessorState(savedSession.data as ProfessorState);
      }
      setStatus(AppStatus.READY);
    }
  }, [user]);

  // Sync plan if it changes in AuthContext (e.g. updated by Admin)
  useEffect(() => {
    if (user && user.plan && userProfile.subscriptionTier !== user.plan) {
      const updated = { ...userProfile, subscriptionTier: user.plan };
      setUserProfile(updated);
      saveUserProfile(updated);
    }
  }, [user, userProfile]);

  const finishOnboarding = () => {
    const updated = { ...userProfile, hasCompletedOnboarding: true };
    setUserProfile(updated);
    saveUserProfile(updated);
    setOnboardingStep('COMPLETE');
  };

  const handleAliasSet = (alias: string) => {
    const updated = { ...userProfile, alias };
    setUserProfile(updated);
    saveUserProfile(updated);
    setOnboardingStep('TOOLTIPS');
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    const updated = { ...userProfile, subscriptionTier: tier };
    setUserProfile(updated);
    saveUserProfile(updated);
    setIsSubscriptionOpen(false);
  };

  // Generic Save Function
  const handleSaveSession = (isManual: boolean = false) => {
    if (status !== AppStatus.READY) return;

    if (isManual) setSaveStatus('SAVING');

    if (appMode === 'EXAM' && quizState.questions.length > 0) {
      saveCurrentSession('EXAM', quizState, `Exam Session - ${new Date().toLocaleString()}`);
    } else if (appMode === 'PROFESSOR' && professorState.sections.length > 0) {
      saveCurrentSession('PROFESSOR', professorState, `Professor Class - ${new Date().toLocaleString()}`);
    }

    if (isManual) {
      setTimeout(() => setSaveStatus('SAVED'), 500);
      setTimeout(() => setSaveStatus('IDLE'), 2500);
    } else {
      // Auto-save feedback (subtle)
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }
  };

  // Auto-Save Effect (Every 2 minutes if active)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (status === AppStatus.READY && appMode !== 'CHAT') {
        handleSaveSession(false);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(autoSaveInterval);
  }, [status, appMode, quizState, professorState]);


  // Timer Logic
  useEffect(() => {
    let interval: any;
    const isExamActive = appMode === 'EXAM' && status === AppStatus.READY && !quizState.isSubmitted && quizState.timeRemaining !== null && quizState.timeRemaining > 0;
    const isProfessorActive = appMode === 'PROFESSOR' && status === AppStatus.READY && quizState.timeRemaining !== null && quizState.timeRemaining > 0;

    if (isExamActive || isProfessorActive) {
      interval = setInterval(() => {
        setQuizState(prev => {
          const newTime = (prev.timeRemaining || 0) - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [appMode, status, quizState.isSubmitted, quizState.timeRemaining]);


  const getSecondsFromDuration = (duration: string): number | null => {
    switch (duration) {
      case '5m': return 5 * 60;
      case '10m': return 10 * 60;
      case '30m': return 30 * 60;
      case '60m': return 60 * 60;
      default: return null;
    }
  };

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
    try {
      if (mode === 'CHAT') {
        setChatFileContext(file.content);
        setChatFileName(file.type === 'TEXT' ? 'Text Note' : 'Uploaded File'); 
        setAppMode('CHAT');
        setStatus(AppStatus.READY);
        return;
      }

      setStatus(AppStatus.GENERATING_CONTENT);
      setErrorMsg(null);
      const timeRemaining = getSecondsFromDuration(config.timerDuration);

      if (mode === 'EXAM') {
        setStatusText(`Generating ${config.questionCount} ${config.difficulty} questions...`);
        const questions = await generateQuizFromText(file.content, config, userProfile);
        
        const newState: QuizState = {
          questions,
          userAnswers: {},
          flaggedQuestions: [],
          isSubmitted: false,
          score: 0,
          startTime: Date.now(),
          timeRemaining
        };
        
        setQuizState(newState);
        
        const historyItem: HistoryItem = {
           id: Date.now().toString(),
           timestamp: Date.now(),
           mode: 'EXAM',
           title: generateHistoryTitle('EXAM', newState),
           data: newState,
           config
        };
        saveToHistory(historyItem);
        setHistory(loadHistory());

      } else {
        setStatusText("Professor is structuring your lesson plan...");
        const sections = await generateProfessorContent(file.content, config);
        
        const newState: ProfessorState = { sections };
        setProfessorState(newState);
        setQuizState(prev => ({ ...prev, timeRemaining }));

        const historyItem: HistoryItem = {
           id: Date.now().toString(),
           timestamp: Date.now(),
           mode: 'PROFESSOR',
           title: generateHistoryTitle('PROFESSOR', newState),
           data: newState
        };
        saveToHistory(historyItem);
        setHistory(loadHistory());
      }

      // Usage Tracking + XP Gain
      const xpGain = 50; 
      const updatedProfile = { 
          ...incrementDailyUsage(userProfile),
          xp: (userProfile.xp || 0) + xpGain
      };
      setUserProfile(updatedProfile);
      saveUserProfile(updatedProfile);
      
      // Sync usage to Firebase
      if (user) {
         updateUserUsage(user.uid, updatedProfile.dailyQuizzesGenerated);
      }

      setStatus(AppStatus.READY);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "Failed to process content.");
    }
  };

  const handleQuizAction = (action: 'ANSWER' | 'FLAG' | 'SUBMIT' | 'RESET', payload?: any) => {
    if (action === 'ANSWER') {
      const { qId, ans } = payload;
      setQuizState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [qId]: ans } }));
    } else if (action === 'FLAG') {
      const qId = payload;
      setQuizState(prev => {
        const isFlagged = prev.flaggedQuestions.includes(qId);
        return { ...prev, flaggedQuestions: isFlagged ? prev.flaggedQuestions.filter(id => id !== qId) : [...prev.flaggedQuestions, qId] };
      });
    } else if (action === 'SUBMIT') {
      let score = 0;
      quizState.questions.forEach(q => { if (quizState.userAnswers[q.id] === q.correct_answer) score++; });
      setQuizState(prev => ({ ...prev, isSubmitted: true, score }));
      
      // Update XP & Stats
      const xpGain = score * 10;
      const newProfile = { 
          ...userProfile, 
          questionsAnswered: userProfile.questionsAnswered + quizState.questions.length, 
          correctAnswers: userProfile.correctAnswers + score,
          xp: (userProfile.xp || 0) + xpGain
      };
      setUserProfile(newProfile);
      saveUserProfile(newProfile);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'RESET') {
      clearCurrentSession();
      setStatus(AppStatus.IDLE);
      setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null });
      setProfessorState({ sections: [] });
      setChatFileContext('');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>;
  
  // LANDING PAGE LOGIC
  if (!user && !showAuth) {
    return <LandingPage onEnter={() => setShowAuth(true)} />;
  }
  
  if (!user && showAuth) {
    return <AuthPage />;
  }

  // --- DASHBOARD (LOGGED IN) ---

  // Admin Access Control - GOD MODE ONLY
  const SUPER_ADMINS = ['popoolaariseoluwa@gmail.com', 'professoradmin@gmail.com'];
  const isAdmin = user?.email && SUPER_ADMINS.includes(user.email);
  
  // Theme Logic
  const theme = userProfile.theme;
  const isOLED = theme === 'OLED';
  const isLight = theme === 'Light';
  
  // Theme Variables
  let bgClass = 'bg-[#050505]';
  let textClass = 'text-white';
  if (isLight) {
    bgClass = 'bg-[#f4f1ea]'; // Manuscript Cream
    textClass = 'text-gray-900';
  } else if (isOLED) {
    bgClass = 'bg-black';
  } else if (theme === 'Dark') {
    bgClass = 'bg-[#121214]';
  }

  // Global Style Injection for Light Mode Overrides
  const lightModeOverrides = isLight ? `
    .glass-panel { background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(0,0,0,0.08); backdrop-filter: blur(12px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .glass-panel-light { background: rgba(0, 0, 0, 0.03); border: 1px solid rgba(0,0,0,0.05); }
    .bg-white\\/5 { background-color: rgba(0,0,0,0.05) !important; }
    .bg-white\\/10 { background-color: rgba(0,0,0,0.08) !important; }
    .border-white\\/10 { border-color: rgba(0,0,0,0.08) !important; }
    .border-white\\/5 { border-color: rgba(0,0,0,0.05) !important; }
    .text-gray-400 { color: #57534e !important; }
    .text-gray-300 { color: #44403c !important; }
    .text-gray-200 { color: #292524 !important; }
    .text-white { color: #1c1917 !important; }
    input, select, textarea { background-color: rgba(255,255,255,0.8) !important; color: #1c1917 !important; border-color: rgba(0,0,0,0.1) !important; }
    .bg-black\\/20 { background-color: rgba(0,0,0,0.05) !important; }
  ` : '';

  return (
    <div className={`min-h-screen ${textClass} selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-1000 ${bgClass}`}>
      <style>{lightModeOverrides}</style>

      {/* Onboarding Overlays */}
      {onboardingStep === 'WELCOME' && <WelcomeModal onComplete={handleAliasSet} />}
      {onboardingStep === 'TOOLTIPS' && <TooltipOverlay onComplete={finishOnboarding} />}
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={handleUpgrade} />

      {/* Auto-Save Toast */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-500 ${saveStatus === 'SAVED' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-black/80 border-white/10'} backdrop-blur-md border px-4 py-2 rounded-full flex items-center gap-2 shadow-xl`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
           <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Session Saved</span>
        </div>
      </div>

      {/* Global Glow - Responsive & Themed */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 ease-in-out`}>
         <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000 ${
            appMode === 'PROFESSOR' ? 'bg-amber-900/30' : (isLight ? 'bg-blue-200/40' : 'bg-blue-900/30')
         }`}></div>
         <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000 ${
            appMode === 'PROFESSOR' ? 'bg-orange-900/25' : (isLight ? 'bg-indigo-200/30' : 'bg-indigo-900/20')
         }`}></div>
      </div>

      {/* Navbar */}
      <nav className={`border-b backdrop-blur-md sticky top-0 z-40 transition-colors duration-500 ${appMode === 'PROFESSOR' ? 'bg-black/40 border-amber-900/20' : (isLight ? 'bg-white/70 border-gray-200' : 'bg-black/50 border-white/5')}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { if (appMode === 'ADMIN') setAppMode('EXAM'); else handleQuizAction('RESET'); }}>
               <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shadow-lg transition-all duration-500 ${
                 appMode === 'PROFESSOR' 
                   ? 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-amber-600/20' 
                   : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/20'
               } text-white`}>
                 {appMode === 'PROFESSOR' ? (
                   <span className="text-lg sm:text-xl">👨‍🏫</span>
                 ) : (
                   <span className="text-lg sm:text-xl">⚡</span>
                 )}
               </div>
               <span className={`font-bold text-lg sm:text-xl tracking-tight transition-colors ${appMode === 'PROFESSOR' ? 'text-amber-100' : (isLight ? 'text-gray-800' : 'text-gray-200')} group-hover:opacity-80 hidden sm:block`}>The Professor</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
               {isAdmin && (
                 <button
                    onClick={() => setAppMode(appMode === 'ADMIN' ? 'EXAM' : 'ADMIN')}
                    className="hidden md:flex px-3 py-1 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-900/40 transition-colors"
                 >
                   {appMode === 'ADMIN' ? 'Exit Admin' : 'Admin'}
                 </button>
               )}

               {status === AppStatus.READY && appMode !== 'ADMIN' && appMode !== 'CHAT' && (
                 <button 
                   onClick={() => handleSaveSession(true)}
                   disabled={saveStatus === 'SAVING'}
                   className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all ${
                     saveStatus === 'SAVING' 
                       ? 'bg-green-500/20 border-green-500/50 text-green-500' 
                       : (isLight ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white')
                   }`}
                 >
                    {saveStatus === 'SAVING' ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    )}
                    <span className="text-sm font-medium hidden sm:block">Save</span>
                 </button>
               )}

               <button onClick={() => setIsSubscriptionOpen(true)} className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white hover:scale-105 transition-transform flex items-center gap-1">
                 {userProfile.subscriptionTier === 'Excellentia Supreme' ? (
                   <>
                     <span className="text-amber-300">👑</span>
                     Supreme
                   </>
                 ) : (
                   'Upgrade'
                 )}
               </button>

               <button onClick={() => setIsProfileOpen(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${isLight ? 'bg-white border-gray-300 hover:bg-gray-50' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}>
                 <span className="text-xl">{userProfile.avatarEmoji}</span>
                 {userProfile.streak > 0 && <span className="text-xs text-orange-500 font-bold hidden sm:inline">🔥 {userProfile.streak}</span>}
               </button>
               <button onClick={() => setIsHistoryOpen(true)} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => { setAppMode(item.mode); if (item.mode === 'EXAM') setQuizState(item.data as QuizState); else setProfessorState(item.data as ProfessorState); setStatus(AppStatus.READY); setIsHistoryOpen(false); }} onDelete={(id) => { deleteHistoryItem(id); setHistory(loadHistory()); }} />
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(p) => { setUserProfile(p); saveUserProfile(p); }} onClearHistory={() => { localStorage.clear(); window.location.reload(); }} onLogout={logout} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 min-h-[calc(100vh-64px)] relative z-10">
        
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-900/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-500 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm font-bold">{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} className="ml-auto hover:opacity-70">✕</button>
          </div>
        )}

        {/* --- ADMIN DASHBOARD VIEW --- */}
        {appMode === 'ADMIN' && isAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
              <div className="animate-fade-in space-y-8 sm:space-y-12 pb-20">
                {appMode === 'PROFESSOR' ? (
                  <div className="text-center py-8 sm:py-12 px-4 animate-slide-up-fade">
                    <h1 className={`text-4xl sm:text-6xl font-serif font-bold tracking-tight mb-4 drop-shadow-lg ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      What shall we <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">master</span> today?
                    </h1>
                    {userProfile.alias && <p className="text-lg text-amber-500 font-bold mb-2">Welcome back, {userProfile.alias}.</p>}
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl opacity-60 italic">
                      "If you can't explain it simply, you don't understand it well enough."
                    </p>
                  </div>
                ) : (
                  <Hero />
                )}
                <InputSection 
                  onProcess={handleProcess}
                  isLoading={false}
                  appMode={appMode}
                  setAppMode={setAppMode}
                  defaultConfig={{ difficulty: userProfile.defaultDifficulty }}
                  userProfile={userProfile}
                  onShowSubscription={() => setIsSubscriptionOpen(true)}
                />
              </div>
            ) : null}

            {(status === AppStatus.PROCESSING_FILE || status === AppStatus.GENERATING_CONTENT) && (
              <LoadingOverlay status={statusText} type={appMode === 'ADMIN' ? 'EXAM' : (appMode === 'CHAT' ? 'PROFESSOR' : appMode)} />
            )}

            {status === AppStatus.READY && (
              <div className="animate-slide-in h-full">
                {appMode === 'PROFESSOR' && (
                  <ProfessorView state={professorState} onExit={() => handleQuizAction('RESET')} timeRemaining={quizState.timeRemaining} />
                )}
                
                {appMode === 'EXAM' && (
                  <QuizView 
                      quizState={quizState}
                      onAnswerSelect={(qId, ans) => handleQuizAction('ANSWER', { qId, ans })}
                      onFlagQuestion={(qId) => handleQuizAction('FLAG', qId)}
                      onSubmit={() => handleQuizAction('SUBMIT')}
                      onReset={() => handleQuizAction('RESET')}
                      onTimeExpired={() => handleQuizAction('SUBMIT')}
                  />
                )}

                {appMode === 'CHAT' && (
                    <ChatView 
                        fileContext={chatFileContext} 
                        onExit={() => handleQuizAction('RESET')}
                        fileName={chatFileName}
                    />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;