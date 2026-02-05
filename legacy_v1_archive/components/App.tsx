import { GlassWindow } from './ui/GlassWindow';
import { Dock } from './ui/Dock';
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
import { BlogPage } from './Blog/BlogPage';
import { BlogPost } from './Blog/BlogPost';
import { LegalPage } from './LegalPage';
import { NotFound } from './NotFound';
import { LandingPage } from './LandingPage';
import { PricingPage } from './PricingPage';
import { PlanCheckoutPage } from './PlanCheckoutPage';
import { AuthCallback } from './Auth/AuthCallback';
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
import { FloatingDock } from './FloatingDock';
import { CreditWallet } from './CreditWallet';
import { CallOverlay, IncomingCallModal } from './CallOverlay';
import { RadialProgress } from './RadialProgress';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateQuizFromText, generateProfessorContent } from '../services/geminiService';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession, saveToHistory, loadHistory, deleteHistoryItem, loadUserProfile, saveUserProfile, getDefaultProfile, updateStreak, incrementDailyUsage } from '../services/storageService';
import { AppStatus, QuizState, QuizConfig, AppMode, ProfessorState, HistoryItem, UserProfile, ProcessedFile, ChatState, SubscriptionTier } from '../types';
import { logout, updateUserUsage, saveUserToSupabase, initDuelLobby, updateDuelWithQuestions, joinDuelByCode, getDuel, submitDuelScore, updateUserPlan, deductCredits } from '../services/supabase';
import { processFile } from '../services/fileService';
import { getModeCost } from '../services/creditService';
import { callService } from '../services/callService';
import { initAnalytics, trackEvent, identifyUser, trackPageView } from '../services/analytics';
import { startHydraEngine } from '../services/syncService';

function lazyRetry(componentImport: () => Promise<any>, retries = 3): React.LazyExoticComponent<React.ComponentType<any>> {
    return React.lazy(async () => {
        return new Promise((resolve, reject) => {
            const attempt = (left: number) => {
                // Add cache-busting timestamp to force fresh fetch on retry
                const importWithCacheBust = left < retries
                    ? () => componentImport().catch(() => {
                        // Clear module cache and retry with timestamp
                        const timestamp = Date.now();
                        return import(/* @vite-ignore */ `${window.location.origin}/assets/chunk-${timestamp}.js`)
                            .catch(() => componentImport()); // Fallback to original
                    })
                    : componentImport;

                importWithCacheBust()
                    .then(resolve)
                    .catch((error) => {
                        if (left === 0) {
                            console.error('Chunk load failed after all retries:', error);
                            // Instead of crashing, resolve with a fallback component
                            resolve({
                                default: () => {
                                    window.location.reload();
                                    return null;
                                }
                            });
                            return;
                        }
                        console.warn(`Chunk load failed, retrying... (${left} attempts left)`);
                        // Exponential backoff: 1s, 2s, 4s
                        setTimeout(() => attempt(left - 1), 1000 * Math.pow(2, retries - left));
                    });
            };
            attempt(retries);
        });
    }) as React.LazyExoticComponent<React.ComponentType<any>>;
}

const QuizView = lazyRetry(() => import('./QuizView'));
const ProfessorView = lazyRetry(() => import('./ProfessorView'));
const ChatView = lazyRetry(() => import('./ChatView'));
const FlashcardView = lazyRetry(() => import('./FlashcardView'));
const AdminDashboard = lazyRetry(() => import('./AdminDashboard'));
const TheHub = lazyRetry(() => import('./TheHub'));

type ViewState = 'LANDING' | 'PRICING' | 'AUTH' | 'ADMIN_LOGIN' | 'APP' | 'CHECKOUT' | 'SHARED' | 'AUTH_CALLBACK' | 'LEGAL' | 'NOT_FOUND';

const ADMIN_EMAILS = [
    'popoolaariseoluwa@gmail.com',
    'professoradmin@gmail.com',
    'vexis.automations@gmail.com'
];

import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from './SEOHead';

import { SkeletonDashboard } from './skeletons/SkeletonDashboard';

const App: React.FC = () => {
    const { user, loading } = useAuth();
    const { theme, setTheme } = useTheme();

    const [currentView, setCurrentView] = useState<ViewState | 'BLOG' | 'BLOG_POST'>('LANDING'); // Extended type locally for now
    const [blogSlug, setBlogSlug] = useState<string | null>(null);

    // ... (existing state)

    // --- VIEW NAVIGATION LOGIC ---
    useEffect(() => {
        const path = window.location.pathname;

        // Blog Routes
        if (path.startsWith('/blog')) {
            const slug = path.split('/')[2];
            if (slug) {
                setBlogSlug(slug);
                setCurrentView('BLOG_POST');
            } else {
                setCurrentView('BLOG');
            }
            return;
        }

        // ... (existing routing logic)
    }, []);



    // ... (render logic)



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

    // Simplified Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Isolated States
    const [quizState, setQuizState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
    const [flashcardState, setFlashcardState] = useState<QuizState>({ questions: [], userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: null, timeRemaining: null, currentQuestionIndex: 0 });
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

    // --- CALL STATES ---
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [activeCallPeerId, setActiveCallPeerId] = useState<string | null>(null);

    const isFresher = userProfile.subscriptionTier === 'Fresher';
    const dailyLimit = userProfile.subscriptionTier === 'Scholar' ? 10 : (isFresher ? 1 : 1000);
    const usagePercentage = Math.min(((userProfile.dailyQuizzesGenerated || 0) / dailyLimit) * 100, 100);

    const isPotentialAdmin = (email: string | null | undefined): boolean => {
        return ADMIN_EMAILS.includes(email?.toLowerCase() || '');
    };
    const isAdmin = isPotentialAdmin(user?.email);

    // Initialize Analytics & Hydra Engine
    useEffect(() => {
        initAnalytics();
        startHydraEngine();
    }, []);

    useEffect(() => {
        if (user) {
            identifyUser(user.uid, user.email || undefined);
        }
    }, [user]);

    // Track Page Views
    useEffect(() => {
        trackPageView(`/${currentView.toLowerCase()}`);
    }, [currentView]);

    // --- FUNCTIONS ---

    const handleNavigate = useCallback((view: ViewState | 'BLOG' | 'BLOG_POST', url: string) => {
        if (view === 'BLOG_POST' && url.startsWith('/blog/')) {
            setBlogSlug(url.split('/')[2]);
        }
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', url);
        }
        setCurrentView(view);
    }, []);

    const parseDuration = (duration: string): number | null => {
        if (duration === 'Limitless') return null;
        let totalSeconds = 0;
        const hourMatch = duration.match(/(\d+)h/);
        if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
        const minMatch = duration.match(/(\d+)m/);
        if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
        return totalSeconds > 0 ? totalSeconds : null;
    };

    const handleAdminSuccess = useCallback(() => {
        setIsAdminUnlocked(true);
        setAppMode('ADMIN');
        setStatus(AppStatus.READY);
        setCurrentView('APP');
    }, []);

    const handleGoToCheckout = useCallback(async (tier: SubscriptionTier) => {
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
            trackEvent('checkout_initiated', { tier });
            setIsSubscriptionOpen(false);
            handleNavigate('CHECKOUT', `/${tier.toLowerCase()}`);
        }
    }, [userProfile, user, handleNavigate]);

    const handleDuelStart = useCallback(async (data: { wager: number, file: File }) => {
        if (!user) return;

        // Close any modals (handled by component unmounting when status changes)
        setStatus(AppStatus.PROCESSING_FILE);
        setStatusText("Constructing Arena...");
        setErrorMsg(null);
        trackEvent('duel_created', { wager: data.wager });

        try {
            // 1. Process File
            const processed = await processFile(data.file);

            // 2. Init DB Lobby
            const config: QuizConfig = { difficulty: 'Hard', questionType: 'Mixed', questionCount: 10, timerDuration: 'Limitless', personality: 'Academic', analogyDomain: 'General', useOracle: true, useWeaknessDestroyer: false };

            setStatusText("Securing Server...");
            // We need to use "try catch" here because RLS might block this if not set up
            const { duelId, code } = await initDuelLobby(user.uid, userProfile.alias || 'Host', data.wager, processed.content, config);

            setDuelReadyData({ id: duelId, code, isHost: true });
            setStatus(AppStatus.IDLE);
            setAppMode('EXAM'); // Or keep at DUEL until they click "Enter"

            // 3. Generate Questions (Async)
            generateQuizFromText(processed.content, config, userProfile).then(async (questions) => {
                if (questions && questions.length > 0) await updateDuelWithQuestions(duelId, questions);
            }).catch(err => console.error("Background Gen Error", err));

        } catch (e: any) {
            console.error("Duel Start Error", e);
            setErrorMsg(e.message || "Failed to start duel. Ensure you have network access.");
            setStatus(AppStatus.ERROR);
        }
    }, [user, userProfile]);

    const handleDuelJoin = useCallback(async (code: string) => {
        if (!user) return;
        trackEvent('duel_joined');
        try {
            const duelId = await joinDuelByCode(code, user.uid, userProfile.alias || 'Challenger');
            setDuelReadyData({ id: duelId, code, isHost: false });
        } catch (e: any) {
            alert(e.message || "Could not join arena.");
        }
    }, [user, userProfile]);

    const handleChatUpdate = useCallback((updatedState: ChatState) => { setChatState(updatedState); }, []);

    // --- INIT LOGIC ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const pathname = window.location.pathname;

            // Valid paths in the app
            const validPaths = ['/', '/login', '/pricing', '/legal', '/share', '/admin', '/callback'];
            const isValidPath = validPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

            // Route handling
            if (params.has('code')) setCurrentView('AUTH_CALLBACK');
            else if (window.location.hash.includes('access_token')) setCurrentView('AUTH_CALLBACK');
            else if (pathname === '/login') {
                // If user is logged in but on /login, redirect to app
                if (user) {
                    window.history.replaceState({}, '', '/');
                    setCurrentView('APP');
                } else {
                    setCurrentView('AUTH');
                }
            }
            else if (pathname === '/pricing') setCurrentView('PRICING');
            else if (pathname === '/legal') setCurrentView('LEGAL');
            else if (pathname.startsWith('/share/')) {
                const id = pathname.split('/share/')[1];
                if (id) {
                    setShareId(id);
                    setCurrentView('SHARED');
                }
            }
            else if (pathname === '/admin') setCurrentView('ADMIN_LOGIN');
            else if (pathname === '/' || isValidPath) {
                if (user) setCurrentView('APP');
                else setCurrentView('LANDING');
            }
            else {
                // Unknown path - show 404
                setCurrentView('NOT_FOUND');
            }
        }
    }, [user]);

    // --- CALL SERVICE INIT ---
    useEffect(() => {
        if (user && userProfile.alias) {
            try {
                callService.initialize(
                    userProfile.alias,
                    () => { }, // onStateChange - not used currently
                    (callerId, answer) => {
                        setIncomingCall({ peer: callerId, answer });
                    }
                );
            } catch (e) {
                console.error("Call service init failed:", e);
            }
        }
    }, [user, userProfile.alias]);

    const handleStartCall = (remotePeerId: string) => {
        try {
            callService.startCall(remotePeerId);
            setActiveCallPeerId(remotePeerId);
        } catch (e) {
            console.error("Start call failed:", e);
        }
    };

    const handleAcceptCall = () => {
        if (incomingCall && incomingCall.answer) {
            incomingCall.answer();
            setActiveCallPeerId(incomingCall.peer);
            setIncomingCall(null);
        }
    };

    const handleEndCall = () => {
        callService.endCall();
        setActiveCallPeerId(null);
        setIncomingCall(null);
    };

    // Helper for Credit Deduction
    const handleDeductCredits = async (amount: number, reason: string): Promise<boolean> => {
        if ((userProfile.credits || 0) < amount) {
            trackEvent('credits_low', { reason });
            setIsSubscriptionOpen(true);
            return false;
        }
        const oldCredits = userProfile.credits;
        const updatedProfile = { ...userProfile, credits: oldCredits - amount };
        setUserProfile(updatedProfile);
        saveUserProfile(updatedProfile);

        if (user) {
            const success = await deductCredits(user.uid, amount, reason);
            if (!success) {
                const rollbackProfile = { ...userProfile, credits: oldCredits };
                setUserProfile(rollbackProfile);
                saveUserProfile(rollbackProfile);
                setIsSubscriptionOpen(true);
                return false;
            }
        }
        return true;
    };

    useEffect(() => {
        if (!user) return;

        const localProfile = loadUserProfile() || getDefaultProfile();
        let mergedProfile: UserProfile = { ...localProfile };

        if (user.profile) {
            mergedProfile = {
                ...mergedProfile,
                ...user.profile,
                alias: (user.profile.alias && user.profile.alias !== 'Guest Scholar') ? user.profile.alias : (mergedProfile.alias || user.displayName || 'Scholar'),
                socials: user.profile.socials || mergedProfile.socials,
                xp: Math.max(user.profile.xp || 0, mergedProfile.xp || 0)
            };
        } else if (user.displayName) {
            if (!mergedProfile.alias || mergedProfile.alias === 'Guest Scholar') {
                mergedProfile.alias = user.displayName;
            }
        }

        if (user.plan) mergedProfile.subscriptionTier = user.plan;

        if (user.hasCompletedOnboarding === true) {
            mergedProfile.hasCompletedOnboarding = true;
        }

        mergedProfile = updateStreak(mergedProfile);
        setUserProfile(mergedProfile);
        saveUserProfile(mergedProfile);

        loadHistory().then(setHistory);

        // Priority Logic: Check LocalStorage first to avoid waiting for potentially slow DB sync
        const isLocallyComplete = localStorage.getItem('onboarding_completed') === 'true';
        // HOTFIX: If user has a real alias, they have definitively completed onboarding at some point.
        const hasValidAlias = mergedProfile.alias && mergedProfile.alias !== 'Guest Scholar' && mergedProfile.alias.length > 2;

        if (isLocallyComplete || mergedProfile.hasCompletedOnboarding === true || hasValidAlias) {
            setShowOnboarding(false);
            // Ensure localStorage is synced for future fast-checks
            if (!isLocallyComplete && (mergedProfile.hasCompletedOnboarding || hasValidAlias)) {
                localStorage.setItem('onboarding_completed', 'true');
            }
        } else {
            setShowOnboarding(true);
        }

        if (!isAdminUnlocked) {
            const savedSession = loadCurrentSession();
            if (savedSession) {
                setAppMode(savedSession.mode);
                if (savedSession.mode === 'EXAM') setQuizState(savedSession.data as QuizState);
                else if (savedSession.mode === 'FLASHCARDS') setFlashcardState(savedSession.data as QuizState);
                else if (savedSession.mode === 'PROFESSOR') setProfessorState(savedSession.data as ProfessorState);
                else if (savedSession.mode === 'CHAT') setChatState(savedSession.data as ChatState);
                setStatus(AppStatus.READY);
            }
        }
    }, [user, isAdminUnlocked]);

    const handleProcess = useCallback(async (file: ProcessedFile, config: QuizConfig, mode: AppMode) => {
        try {
            if (mode === 'EXAM' || mode === 'PROFESSOR' || mode === 'FLASHCARDS') {
                const cost = getModeCost(mode, config);
                const success = await handleDeductCredits(cost, `Generated ${mode}`);
                if (!success) return;
            }

            trackEvent('content_generation_started', { mode, difficulty: config.difficulty });
            setStatus(AppStatus.GENERATING_CONTENT);
            setStatusText("Initializing Neural Link...");
            setErrorMsg(null);
            setActiveHistoryId(Date.now().toString());

            if (mode === 'CHAT') {
                const newState: ChatState = { messages: [], fileContext: file.content, fileName: file.name };
                setChatState(newState);
                setAppMode('CHAT');
                setStatus(AppStatus.READY);
                saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'CHAT', title: file.name, data: newState });
                setHistory(await loadHistory());
                return;
            }

            const timeRemaining = parseDuration(config.timerDuration);
            if (mode === 'EXAM') {
                const questions = await generateQuizFromText(file.content, config, userProfile);
                const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0, currentQuestionIndex: 0 };
                setQuizState(newState);
                saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, config });
                setAppMode('EXAM');
            } else if (mode === 'FLASHCARDS') {
                const questions = await generateQuizFromText(file.content, config, userProfile);
                const newState: QuizState = { questions, userAnswers: {}, flaggedQuestions: [], isSubmitted: false, score: 0, startTime: Date.now(), timeRemaining, focusStrikes: 0, currentQuestionIndex: 0 };
                setFlashcardState(newState);
                saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode, title: file.name, data: newState, config });
                setAppMode('FLASHCARDS');
            } else {
                const sections = await generateProfessorContent(file.content, config);
                const newState: ProfessorState = { sections };
                setProfessorState(newState);
                saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'PROFESSOR', title: file.name, data: newState });
            }

            setHistory(await loadHistory());
            const updatedProfile = { ...incrementDailyUsage(userProfile) };
            setUserProfile(updatedProfile);
            saveUserProfile(updatedProfile);
            if (user) updateUserUsage(user.uid, updatedProfile.dailyQuizzesGenerated);
            setStatus(AppStatus.READY);
            trackEvent('content_generation_success', { mode });
        } catch (err: any) {
            console.error(err);
            // Graceful handling for Quota Exceeded (429)
            if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Quota')) {
                setErrorMsg("Neural Overload: System is experiencing extremely high traffic. Please try again in 1 minute.");
            } else {
                setErrorMsg(err.message || "Failed to process content. The neural link was interrupted.");
            }
            setStatus(AppStatus.ERROR);
        }
    }, [userProfile]);

    const handleCancelGeneration = useCallback(() => { setStatus(AppStatus.IDLE); setErrorMsg(null); }, []);

    const handleSetAppMode = useCallback((mode: AppMode) => {
        setAppMode(mode);
        if (mode === 'FLASHCARDS' || mode === 'HUB' || mode === 'DUEL') {
            setStatus(AppStatus.READY);
        } else if (mode === 'CHAT') {
            if (chatState.messages.length > 0) setStatus(AppStatus.READY);
            else setStatus(AppStatus.IDLE);
        } else if (mode === 'PROFESSOR') {
            if (professorState.sections.length > 0) setStatus(AppStatus.READY);
            else setStatus(AppStatus.IDLE);
        } else if (mode === 'EXAM') {
            if (quizState.questions.length > 0) setStatus(AppStatus.READY);
            else setStatus(AppStatus.IDLE);
        }
    }, [professorState, quizState, chatState, flashcardState]);

    const handleQuizAction = useCallback(async (action: any, payload?: any) => {
        if (action === 'RESET') {
            clearCurrentSession();
            setStatus(AppStatus.IDLE);
            setAppMode('EXAM');
        }
        if (action === 'INDEX') setQuizState(prev => ({ ...prev, currentQuestionIndex: payload.index }));
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
                    } catch (e) { }
                } else if (q.type === 'Fill in the Gap') {
                    if (quizState.userAnswers[q.id]?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim()) score++;
                } else {
                    if (quizState.userAnswers[q.id] === q.correct_answer) score++;
                }
            });
            setQuizState(prev => ({ ...prev, isSubmitted: true, score }));
            trackEvent('exam_submitted', { score, total: quizState.questions.length });
            const xpGained = score * 50;
            let newXP = (userProfile.xp || 0) + xpGained;
            if (newXP > 10000) newXP = 10000;
            const newProfile = { ...userProfile, questionsAnswered: userProfile.questionsAnswered + quizState.questions.length, correctAnswers: userProfile.correctAnswers + score, xp: newXP };
            setUserProfile(newProfile);
            saveUserProfile(newProfile);
            if (user) {
                await saveUserToSupabase(user.uid, { xp: newXP });
                if (activeDuelId) await submitDuelScore(activeDuelId, user.uid, score);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [quizState, userProfile, user, activeDuelId]);

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

    const confirmExit = () => {
        if (pendingAction) pendingAction();
        setShowExitConfirmation(false);
        setPendingAction(null);
    };


    // --- RENDER ---
    // --- GLASS OS STATE ---
    const [activeApp, setActiveApp] = useState<'TERMINAL' | 'EXAM' | 'LIBRARY' | 'PROFILE'>('TERMINAL');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // --- RENDER ---
    if (loading) return <SkeletonDashboard />;
    if (currentView === 'BLOG') return <BlogPage onNavigate={(path) => handleNavigate(path.includes('/blog/') ? 'BLOG_POST' : path === '/blog' ? 'BLOG' : 'LANDING', path)} />;
    if (currentView === 'BLOG_POST' && blogSlug) return <BlogPost slug={blogSlug} onNavigate={(path) => handleNavigate(path === '/blog' ? 'BLOG' : path === '/' ? 'LANDING' : 'AUTH', path)} />;
    if (currentView === 'AUTH_CALLBACK') return <AuthCallback onSuccess={() => handleNavigate('APP', '/')} onError={() => { console.warn('Auth callback failed, redirecting to login'); handleNavigate('AUTH', '/login'); }} />;
    if (currentView === 'SHARED' && shareId) return <SharedView shareId={shareId} onNavigateHome={() => window.location.href = '/'} />;
    if (currentView === 'ADMIN_LOGIN') return <AdminLoginPage onBack={() => handleNavigate('LANDING', '/')} onSuccess={handleAdminSuccess} />;

    // Admin Dashboard Mode
    if (appMode === 'ADMIN') return <AdminDashboard onExit={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} />;

    if (currentView === 'LEGAL') return <LegalPage onBack={() => user ? handleNavigate('APP', '/') : handleNavigate('LANDING', '/')} />;
    if (currentView === 'PRICING') return <PricingPage onBack={() => handleNavigate('LANDING', '/')} onSelectPlan={(tier) => { localStorage.setItem('pending_plan', tier); handleNavigate('AUTH', '/login'); }} />;
    if (currentView === 'CHECKOUT' && checkoutTier) return <PlanCheckoutPage tier={checkoutTier} onBack={() => handleNavigate('APP', '/')} onSuccess={(t) => { setUserProfile({ ...userProfile, subscriptionTier: t }); handleNavigate('APP', '/'); }} />;
    if (currentView === 'AUTH' && !user) return <AuthPage />;
    if (currentView === 'LANDING' && !user) return <LandingPage onEnter={() => { trackEvent('landing_enter_click'); handleNavigate('AUTH', '/login'); }} onPricing={() => handleNavigate('PRICING', '/pricing')} onLegal={() => handleNavigate('LEGAL', '/legal')} />;
    if (currentView === 'NOT_FOUND') return <NotFound onGoHome={() => handleNavigate('LANDING', '/')} />;

    return (
        <HelmetProvider>
            <div className={`min-h-screen text-text-pri bg-core selection:bg-accent/30 overflow-hidden relative font-sans`}>
                <SEOHead
                    title="The Professor | GlassOS"
                    description="Your AI Academic Operating System."
                />
                <AmbientBackground theme='Deep Space' />
                <CountdownTimer />
                <PWAPrompt />

                {/* --- OS LAYER: MODALS --- */}
                {showOnboarding && <WelcomeModal onComplete={(data) => {
                    const updated = { ...userProfile, ...data, hasCompletedOnboarding: true };
                    setUserProfile(updated);
                    setShowOnboarding(false);
                    if (user) saveUserToSupabase(user.uid, updated);
                }} />}

                <SubscriptionModal
                    isOpen={isSubscriptionOpen}
                    onClose={() => setIsSubscriptionOpen(false)}
                    currentTier={userProfile.subscriptionTier}
                    onUpgrade={handleGoToCheckout}
                    userEmail={user?.email || undefined}
                />

                <UserProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    profile={userProfile}
                    onSave={(u) => { setUserProfile(u); saveUserProfile(u); if (user) saveUserToSupabase(user.uid, u); }}
                    onLogout={async () => { await logout(); handleNavigate('LANDING', '/'); }}
                    isAdmin={isAdmin}
                    onRequestAdminAccess={() => setShowAdminVerify(true)}
                    onUpgradeRequest={() => setIsSubscriptionOpen(true)}
                    onLegalRequest={() => handleNavigate('LEGAL', '/legal')}
                />

                <ConfirmationModal isOpen={showExitConfirmation} onConfirm={confirmExit} onCancel={() => { setShowExitConfirmation(false); setPendingAction(null); }} />
                <AdminVerifyModal isOpen={showAdminVerify} onClose={() => setShowAdminVerify(false)} onSuccess={handleAdminSuccess} />
                {duelReadyData && <DuelReadyModal duelId={duelReadyData.id} initialCode={duelReadyData.code} isHost={duelReadyData.isHost} onEnter={handleEnterDuel} />}

                {/* --- OS LAYER: SYSTEM UI --- */}

                {/* Status Bar */}
                <div className="fixed top-0 left-0 w-full h-8 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50 select-none">
                    <div className="flex items-center gap-4">
                        <span className="font-display font-bold text-xs tracking-widest text-white">THE PROFESSOR <span className="text-cyan-400">OS</span></span>
                        <div className="h-3 w-px bg-white/10"></div>
                        <span className="font-mono text-[10px] text-gray-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSubscriptionOpen(true)} className="flex items-center gap-2 group">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="font-mono text-[10px] text-gray-400 group-hover:text-emerald-400 transition-colors uppercase">
                                {userProfile.credits} CR
                            </span>
                        </button>
                        <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 group">
                            <span className="font-mono text-[10px] text-gray-400 group-hover:text-white transition-colors uppercase truncate max-w-[100px]">
                                {userProfile.alias}
                            </span>
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${userProfile.avatarGradient} ring-1 ring-white/20`}></div>
                        </button>
                    </div>
                </div>

                {/* --- OS LAYER: WORKSPACE --- */}
                <main className="absolute inset-0 pt-8 pb-20 overflow-hidden flex items-center justify-center p-4">

                    {/* ERROR BOUNDARY DISPLAY */}
                    {status === AppStatus.ERROR && (
                        <div className="glass-window p-8 max-w-lg mx-auto text-center border-red-500/30 z-[100]">
                            <h2 className="text-xl font-bold text-white mb-2">System Failure</h2>
                            <p className="text-gray-400 mb-6 font-mono text-xs">{errorMsg}</p>
                            <button onClick={() => { setStatus(AppStatus.IDLE); setAppMode('EXAM'); }} className="glass-button text-white border-red-500/30">
                                Reboot
                            </button>
                        </div>
                    )}

                    {/* LOADING OVERLAY */}
                    {status === AppStatus.GENERATING_CONTENT && (
                        <LoadingOverlay
                            status={statusText}
                            type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'}
                            onCancel={handleCancelGeneration}
                        />
                    )}

                    {/* APP WINDOWS */}

                    {/* 1. TERMINAL (INPUT) */}
                    {activeApp === 'TERMINAL' && status === AppStatus.IDLE && (
                        <div className="w-full max-w-4xl h-[600px] animate-slide-up-fade">
                            <GlassWindow title="Neural_Input_Terminal" icon="⚡" onClose={() => { }}>
                                <InputSection
                                    onProcess={handleProcess}
                                    isLoading={false}
                                    appMode={appMode}
                                    setAppMode={handleSetAppMode} // Keeping for internal logic
                                    defaultConfig={{ difficulty: userProfile.defaultDifficulty || 'Medium' }}
                                    userProfile={userProfile}
                                    onShowSubscription={() => setIsSubscriptionOpen(true)}
                                    // These will be routed to OS actions later
                                    onOpenProfile={() => setIsProfileOpen(true)}
                                    onDuelStart={handleDuelStart}
                                    onDuelJoin={handleDuelJoin}
                                />
                            </GlassWindow>
                        </div>
                    )}
                    {status === AppStatus.PROCESSING_FILE && <LoadingOverlay status="Processing Document..." type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
                    {status === AppStatus.GENERATING_CONTENT && <LoadingOverlay status={statusText || "Generating Content..."} type={appMode === 'PROFESSOR' ? 'PROFESSOR' : 'EXAM'} onCancel={handleCancelGeneration} />}
                    {status === AppStatus.READY && (
                        <div className="animate-slide-up-fade">
                            <Suspense fallback={<div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-accent rounded-full animate-spin"></div></div>}>
                                {appMode === 'EXAM' && <QuizView quizState={quizState} onAnswerSelect={(qId: any, ans: any) => handleQuizAction('ANSWER', { qId, ans })} onFlagQuestion={(qId: any) => handleQuizAction('FLAG', qId)} onSubmit={() => handleQuizAction('SUBMIT')} onReset={() => handleQuizAction('RESET')} onTimeExpired={() => handleQuizAction('SUBMIT')} duelId={activeDuelId} onIndexChange={(index: any) => handleQuizAction('INDEX', { index })} />}
                                {appMode === 'PROFESSOR' && <ProfessorView state={professorState} onExit={(force: any) => handleQuizAction('RESET', { force })} timeRemaining={null} />}
                                {appMode === 'CHAT' && <ChatView chatState={chatState} onUpdate={handleChatUpdate} onExit={() => handleQuizAction('RESET')} userProfile={userProfile} onDeductCredits={handleDeductCredits} />}

                                {appMode === 'FLASHCARDS' && (
                                    <FlashcardView
                                        quizState={flashcardState}
                                        onExit={(force: any) => handleQuizAction('RESET', { force })}
                                        onGenerate={(newState: QuizState) => {
                                            setFlashcardState(newState);
                                            setStatus(AppStatus.READY);
                                            saveToHistory({ id: Date.now().toString(), timestamp: Date.now(), mode: 'FLASHCARDS', title: 'New Flashcard Deck', data: newState });
                                            loadHistory().then(setHistory);
                                        }}
                                        userProfile={userProfile}
                                        onDeductCredits={handleDeductCredits}
                                    />
                                )}

                                {appMode === 'HUB' && <TheHub user={userProfile} onExit={() => handleQuizAction('RESET')} onStartCall={handleStartCall} />}
                                {appMode === 'DUEL' && <ArenaView user={userProfile} onExit={() => handleQuizAction('RESET')} />}
                                {appMode === 'ADMIN' && <AdminDashboard onExit={() => { setAppMode('EXAM'); setStatus(AppStatus.IDLE); }} />}
                            </Suspense>
                        </div>
                    )}
                    {status === AppStatus.ERROR && (
                        <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-3xl text-center">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-red-500 mb-2">System Failure</h3>
                            <p className="text-text-sec mb-6">{errorMsg || "An unknown error occurred."}</p>
                            <button onClick={() => setStatus(AppStatus.IDLE)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs">Reboot System</button>
                        </div>
                    )}
                </main>
            </div>
        </HelmetProvider >
    );
};

export default App;
