
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
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
import { NotificationBell } from './NotificationBell';
import { ErrorBoundary } from './ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState } from '../types';
import { signOutUser } from '../services/supabase'; // Switched to Supabase
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';

// Lazy Components
const QuizView = React.lazy(() => import('./QuizView').then(m => ({ default: m.QuizView })));
const ProfessorView = React.lazy(() => import('./ProfessorView').then(m => ({ default: m.ProfessorView })));
const ChatView = React.lazy(() => import('./ChatView').then(m => ({ default: m.ChatView })));
const FlashcardView = React.lazy(() => import('./FlashcardView').then(m => ({ default: m.FlashcardView })));
const TheHub = React.lazy(() => import('./TheHub').then(m => ({ default: m.TheHub })));
const AdminDashboard = React.lazy(() => import('./AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SharedView = React.lazy(() => import('./SharedView').then(module => ({ default: module.SharedView })));

const ADMIN_EMAILS = ['vexis.automations@gmail.com'];

// Layout Component
const Layout = ({ children, userProfile, onOpenProfile, onOpenHistory, onOpenSubscription }: any) => (
  <div className="min-h-screen text-white bg-[#050505] font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
    <AmbientBackground theme='Deep Space' />
    <CountdownTimer />
    
    <nav className="border-b backdrop-blur-md sticky top-0 z-40 bg-black/60 border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white border border-white/10 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
               </div>
               <span className="font-display font-bold text-lg hidden sm:block tracking-tight text-white">The Professor</span>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={onOpenHistory} className="p-2 text-gray-400 hover:text-white transition-colors" title="Library">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </button>
               <NotificationBell />
               <button onClick={onOpenProfile} className="flex items-center gap-2 group">
                   <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${userProfile?.avatarGradient || 'from-gray-700 to-gray-600'} flex items-center justify-center border-2 border-transparent group-hover:border-blue-500 transition-all shadow-lg`}>
                       <span className="text-sm">{userProfile?.avatarEmoji || '👤'}</span>
                   </div>
               </button>
            </div>
        </div>
    </nav>
    <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-80px)]">
        {children}
    </main>
  </div>
);

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // State
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [appMode, setAppMode] = useState<AppMode>('EXAM');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile() || getDefaultProfile());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'COMPLETE' | 'WELCOME'>('COMPLETE');

  // Session Data
  const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
  const [professorState, setProfessorState] = useState<ProfessorState>({ sections: [] });
  const [chatState, setChatState] = useState<ChatState>({ messages: [], fileContext: '', fileName: '' });

  useEffect(() => {
    // Check if coming from share
    if (window.location.hash.startsWith('#/share/')) return;

    if (user) {
        const profile = { ...getDefaultProfile(), ...user.profile };
        setUserProfile(profile);
        saveUserProfile(profile);
        setHistory(loadHistory());
        if (!user.hasCompletedOnboarding) setOnboardingStep('WELCOME');
    }
  }, [user]);

  const handleProcess = async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
      try {
          setStatus(AppStatus.GENERATING_CONTENT);
          
          if (mode === 'CHAT') {
              const newState: ChatState = { messages: [], fileContext: file.content, fileName: file.name };
              setChatState(newState);
              setAppMode('CHAT');
              navigate('/app/session');
              setStatus(AppStatus.READY);
              return;
          }

          if (mode === 'EXAM') {
              const questions = await generateQuizFromText(file.content, config, userProfile);
              const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining: config.timerDuration === 'Limitless' ? null : parseInt(config.timerDuration) * 60, currentQuestionIndex: 0 };
              setQuizState(newState);
              setAppMode('EXAM');
              
              const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'EXAM', title: `Exam: ${file.name}`, data: newState, config };
              saveToHistory(historyItem);
              setHistory(loadHistory());
              
              navigate('/app/session');
              setStatus(AppStatus.READY);
              return;
          }

          if (mode === 'PROFESSOR') {
              const sections = await generateProfessorContent(file.content, config);
              const newState: ProfessorState = { sections };
              setProfessorState(newState);
              setAppMode('PROFESSOR');
              
              const historyItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: `Lecture: ${file.name}`, data: newState };
              saveToHistory(historyItem);
              setHistory(loadHistory());

              navigate('/app/session');
              setStatus(AppStatus.READY);
              return;
          }

      } catch (e) {
          setStatus(AppStatus.ERROR);
          console.error(e);
      }
  };

  const handleReset = () => {
      clearCurrentSession();
      setQuizState({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
      setProfessorState({ sections: [] });
      navigate('/app/dashboard');
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white rounded-full animate-spin"></div></div>;

  return (
    <ErrorBoundary>
        {user && onboardingStep === 'WELCOME' && (
            <WelcomeModal onComplete={async (data) => {
                // Simplified local update as backend trigger handles DB creation
                setUserProfile({ ...userProfile, ...data, hasCompletedOnboarding: true });
                setOnboardingStep('COMPLETE');
            }} />
        )}
        
        <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} onSave={(u) => { setUserProfile(u); saveUserProfile(u); }} onClearHistory={() => {}} onLogout={signOutUser} isAdmin={false} />
        <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} currentTier={userProfile.subscriptionTier} onUpgrade={() => {}} />
        <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => { 
            if (item.mode === 'EXAM') setQuizState(item.data as QuizState);
            else if (item.mode === 'PROFESSOR') setProfessorState(item.data as ProfessorState);
            else if (item.mode === 'CHAT') setChatState(item.data as ChatState);
            setAppMode(item.mode);
            navigate('/app/session');
            setIsHistoryOpen(false);
        }} onDelete={(id) => { deleteHistoryItem(id); setHistory(loadHistory()); }} />

        <Routes>
            <Route path="/" element={user ? <Navigate to="/app/dashboard" /> : <LandingPage onEnter={() => navigate('/auth')} onPricing={() => navigate('/pricing')} />} />
            <Route path="/auth" element={user ? <Navigate to="/app/dashboard" /> : <AuthPage />} />
            <Route path="/pricing" element={<PricingPage onBack={() => navigate('/')} onSelectPlan={() => navigate('/auth')} />} />
            <Route path="/share/:id" element={<Suspense fallback={<div>Loading...</div>}><SharedView /></Suspense>} />
            
            {/* Protected Routes */}
            <Route path="/app" element={user ? <Layout userProfile={userProfile} onOpenProfile={() => setIsProfileOpen(true)} onOpenHistory={() => setIsHistoryOpen(true)} onOpenSubscription={() => setIsSubscriptionOpen(true)}><Outlet /></Layout> : <Navigate to="/auth" />}>
                <Route path="dashboard" element={
                    <>
                        <Hero />
                        <InputSection 
                            onProcess={handleProcess} 
                            isLoading={status === AppStatus.GENERATING_CONTENT} 
                            appMode={appMode} 
                            setAppMode={setAppMode} 
                            defaultConfig={{ difficulty: userProfile.defaultDifficulty }} 
                            userProfile={userProfile} 
                            onShowSubscription={() => setIsSubscriptionOpen(true)} 
                            onOpenProfile={() => setIsProfileOpen(true)} 
                            onHubEnter={() => navigate('/app/hub')} 
                        />
                        {(status === AppStatus.GENERATING_CONTENT) && <LoadingOverlay status="Processing Neural Link..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} />}
                    </>
                } />
                <Route path="session" element={
                    <Suspense fallback={<div>Loading...</div>}>
                        {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={() => {}} onFlagQuestion={() => {}} onSubmit={() => {}} onReset={handleReset} onTimeExpired={() => {}} onIndexChange={() => {}} />}
                        {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={handleReset} timeRemaining={null} />}
                        {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={() => {}} onExit={handleReset} />}
                        {appMode === 'FLASHCARDS' && <FlashcardView quizState={quizState} onExit={handleReset} />}
                    </Suspense>
                } />
                <Route path="hub" element={<Suspense fallback={<div>Loading...</div>}><TheHub user={userProfile} onExit={() => navigate('/app/dashboard')} /></Suspense>} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </ErrorBoundary>
  );
};

export default App;
