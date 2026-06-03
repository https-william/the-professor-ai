"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { 
    Backpack, 
    GraduationCap, 
    Medal, 
    Briefcase, 
    Puzzle, 
    Brain, 
    Layers, 
    Timer, 
    Zap, 
    Footprints, 
    Dumbbell, 
    RotateCw, 
    CheckCircle2, 
    AlertCircle, 
    Check, 
    Users, 
    Star, 
    Library, 
    Sparkles, 
    ChevronLeft, 
    ChevronRight, 
    LogIn,
    Trophy,
} from "lucide-react";

/* ═══ Glassmorphism Helpers ═══ */
const clay = {
    card: {
        background: "linear-gradient(160deg, rgba(20, 20, 28, 0.85) 0%, rgba(10, 10, 14, 0.98) 100%)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderRadius: "32px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 30px 60px -10px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 0 50px rgba(37, 99, 235, 0.08)",
    } as React.CSSProperties,
    input: {
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
        color: "#ffffff",
    } as React.CSSProperties,
};

const EDU_LEVELS = [
    { id: "high_school", icon: Backpack, label: "High School" },
    { id: "undergrad", icon: GraduationCap, label: "Undergraduate" },
    { id: "postgrad", icon: Medal, label: "Postgraduate" },
    { id: "professional", icon: Briefcase, label: "Professional" },
];

const PAIN_POINTS = [
    { id: "concepts", icon: Puzzle, label: "Explain complex concepts safely." },
    { id: "recall", icon: Brain, label: "Active Recall (Flashcards/Quizzes)." },
    { id: "synthesis", icon: Layers, label: "Synthesize long papers/textbooks." },
    { id: "procrastination", icon: Timer, label: "I need consistency and habits." },
];

const COMMITMENT_LEVELS = [
    { id: "15m", icon: Zap, label: "15 mins", desc: "Quick daily habit" },
    { id: "30m", icon: Footprints, label: "30 mins", desc: "Steady progress" },
    { id: "1hr", icon: Dumbbell, label: "1+ hour", desc: "Deep study" },
];



import { usePWA } from "@/context/PWAContext";

export default function OnboardingPage() {
    const { user, completeOnboarding, saveOnboardingStep } = useUser();
    const { isDesktop, isMobile, platform } = useAppPlatform();
    const { isInstallable, installApp } = usePWA();
    const router = useRouter();
    const pathname = usePathname();

    // ── State Hooks ──
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
    const [age, setAge] = useState<string>("");
    const [eduLevel, setEduLevel] = useState("");
    const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
    const [commitment, setCommitment] = useState("");
    const [topic, setTopic] = useState("");
    const [topicError, setTopicError] = useState("");
    const [saveError, setSaveError] = useState<string | null>(null);

    // ── Effect Hooks ──
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load persisted topic from landing page
    useEffect(() => {
        if (typeof window !== "undefined") {
            const persisted = localStorage.getItem("pending_study");
            if (persisted) setTopic(persisted);
        }
    }, []);

    useEffect(() => {
        if (step !== 1) return;
        if (!username || username.length < 3) {
            setUsernameStatus("idle");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setUsernameStatus("invalid");
            return;
        }

        const timer = setTimeout(async () => {
            setUsernameStatus("checking");
            try {
                const res = await fetch(`/api/user/profile?username=${username.toLowerCase()}`);
                const data = await res.json();
                if (data.profile && data.profile.id !== user.id) {
                    setUsernameStatus("taken");
                } else {
                    setUsernameStatus("available");
                }
            } catch {
                setUsernameStatus("available");
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [username, user.id, step]);

    // ── Render Logic ──
    const isLanding = pathname === "/";
    const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(pathname || "");
    
    // Redirect if already onboarded
    useEffect(() => {
        if (mounted && user.hasOnboarded) {
            const searchParams = new URLSearchParams(window.location.search);
            const nextUrl = searchParams.get("next") || "/dashboard";
            router.push(nextUrl);
        }
    }, [mounted, user.hasOnboarded, router]);

    // Don't mount on landing, auth pages, or if unauthenticated
    if (!mounted || isLanding || isAuthPage || user.hasOnboarded || !user.isAuthenticated) return null;

    const handleNext = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            let success = false;
            if (step === 1) {
                // Identity & Handle
                success = await saveOnboardingStep({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    username: username.toLowerCase().trim(),
                    alias: firstName.trim()
                });
                if (success) setStep(2);
            } else if (step === 2) {
                // Academic Profile
                success = await saveOnboardingStep({
                    age: parseInt(age),
                    education_level: eduLevel,
                    study_goal: JSON.stringify({ painPoints: selectedPainPoints })
                });
                if (success) setStep(3);
            } else if (step === 3) {
                // Commitment
                success = await saveOnboardingStep({
                    study_goal: JSON.stringify({
                        painPoints: selectedPainPoints,
                        commitmentTime: commitment
                    })
                });
                if (success) setStep(4);
            }

            if (!success) {
                setSaveError("The Professor couldn't save your progress. Please check your connection and try again.");
            }
        } catch (error) {
            console.error("Onboarding progression failed:", error);
            setSaveError("A network error occurred. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = async () => {
        setIsSaving(true);
        setSaveError(null);
        const combinedGoal = JSON.stringify({
            painPoints: selectedPainPoints,
            commitmentTime: commitment,
            initialTopic: topic.trim(),
            platformDetected: platform
        });
        const success = await completeOnboarding({
            alias: firstName.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.toLowerCase().trim(),
            age: parseInt(age),
            education_level: eduLevel,
            study_goal: combinedGoal
        });
        setIsSaving(false);
        if (success) {
            const searchParams = new URLSearchParams(window.location.search);
            const nextUrl = searchParams.get("next");
            if (nextUrl) {
                router.push(nextUrl);
            } else {
                router.push("/create");
            }
        } else {
            setSaveError("Could not complete onboarding. Let's try that one more time.");
        }
    };

    const togglePainPoint = (id: string) => {
        setSelectedPainPoints(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    // Animation Configs
    const stepVariants = {
        initial: { opacity: 0, scale: 0.95, y: 15 },
        animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
        exit: { opacity: 0, scale: 1.02, y: -10, transition: { duration: 0.25, ease: "easeIn" as const } }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden font-sans bg-[var(--background)] relative">
            {/* Cinematic Ambient Blur Background */}
            <div className="absolute inset-0 bg-[#06060B]/90 backdrop-blur-[100px]" />
            
            {/* Ambient Orbs */}
            <motion.div 
                className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)", filter: "blur(120px)" }}
                animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-[480px] overflow-hidden bg-[var(--card)] shadow-2xl" style={clay.card}>
                
                {/* Embedded Top Progress Bar */}
                {step > 1 && step < 4 && (
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-white/20 via-white/80 to-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-700 ease-out" 
                            style={{ width: `${((step - 1) / 3) * 100}%` }} 
                        />
                    </div>
                )}

                <div className="px-8 py-10 min-h-[400px] h-auto flex flex-col justify-between gap-6">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: IDENTITY & HANDLE */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full justify-center">
                                <div className="text-center mb-8">
                                    <h2 className="font-sans text-3xl font-black bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent mb-3 tracking-tight">Your Scholar Profile.</h2>
                                    <p className="text-[14px] text-white/50 font-medium">How should The Professor address you?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            value={firstName} 
                                            onChange={e => setFirstName(e.target.value)} 
                                            placeholder="First Name" 
                                            className="w-1/2 px-5 py-4 font-bold text-white outline-none placeholder:text-white/30 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-blue-500/50 focus:bg-white/[0.06] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(37,99,235,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]" 
                                        />
                                        <input 
                                            type="text" 
                                            value={lastName} 
                                            onChange={e => setLastName(e.target.value)} 
                                            placeholder="Last Name" 
                                            className="w-1/2 px-5 py-4 font-bold text-white outline-none placeholder:text-white/30 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-blue-500/50 focus:bg-white/[0.06] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(37,99,235,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]" 
                                        />
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={username} 
                                            onChange={e => setUsername(e.target.value.toLowerCase())} 
                                            placeholder="Choose a Handle (@)" 
                                            className="w-full px-5 py-4 font-bold text-white outline-none placeholder:text-white/30 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-blue-500/50 focus:bg-white/[0.06] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(37,99,235,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)] pr-12" 
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            {usernameStatus === "checking" && <RotateCw size={20} className="animate-spin text-white/30" />}
                                            {usernameStatus === "available" && <CheckCircle2 size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
                                            {(usernameStatus === "taken" || usernameStatus === "invalid") && <AlertCircle size={20} className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />}
                                        </div>
                                    </div>
                                    <div className="h-6 text-center mt-2">
                                        {usernameStatus === "checking" && <p className="text-[12px] text-white/40 font-bold animate-pulse">Checking handle...</p>}
                                        {usernameStatus === "available" && <p className="text-[12px] text-emerald-400 font-bold opacity-90 drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">Handle is available.</p>}
                                        {usernameStatus === "taken" && <p className="text-[12px] text-rose-400 font-bold">Handle is already claimed.</p>}
                                        {usernameStatus === "invalid" && <p className="text-[12px] text-rose-400 font-bold">Alphanumeric characters only.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* STEP 2: SCHOLAR CONTEXT */}
                        {step === 2 && (
                            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="font-sans text-3xl font-black bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent mb-3 tracking-tight">Academic Context.</h2>
                                    <p className="text-[14px] text-white/50 font-medium">Aligning difficulty to your profile.</p>
                                </div>
                                
                                <div className="flex gap-4 items-end">
                                    <div className="w-1/3 flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Age</label>
                                        <input 
                                            type="tel" 
                                            value={age} 
                                            onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} 
                                            placeholder="e.g. 21" 
                                            className="w-full px-4 py-3.5 font-black text-white text-center text-2xl outline-none placeholder:text-white/20 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all duration-300 focus:border-blue-500/50 focus:bg-white/[0.06] focus:scale-[1.01] focus:shadow-[0_0_15px_rgba(37,99,235,0.15),_inset_0_2px_4px_rgba(0,0,0,0.4)]" 
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">Education Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {EDU_LEVELS.map(l => (
                                                <button 
                                                    key={l.id} 
                                                    onClick={() => setEduLevel(l.id)} 
                                                    className={`py-3.5 rounded-2xl border transition-all duration-300 active:scale-[0.97] hover:scale-[1.01] text-center ${
                                                        eduLevel === l.id 
                                                            ? 'bg-gradient-to-br from-blue-600/25 via-indigo-600/15 to-transparent border-blue-500/50 text-white font-bold shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
                                                            : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04] text-white/40 hover:text-white'
                                                    }`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{l.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-1.5 pl-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Primary Struggle Areas</p>
                                        <span className="text-[9px] font-bold text-white/40 lowercase italic">(select all that apply)</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {PAIN_POINTS.map(p => {
                                            const isSelected = selectedPainPoints.includes(p.id);
                                            return (
                                                <button 
                                                    key={p.id} 
                                                    onClick={() => togglePainPoint(p.id)} 
                                                    className={`w-full flex items-center p-3.5 rounded-xl border transition-all duration-300 active:scale-[0.98] hover:scale-[1.01] ${
                                                        isSelected 
                                                            ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border-blue-500/40 text-white font-bold shadow-[0_4px_12px_rgba(37,99,235,0.15)]' 
                                                            : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04] text-white/40 hover:text-white'
                                                    }`}
                                                >
                                                    <p.icon size={16} className={`mr-3 ${isSelected ? 'text-white' : 'text-white/30'}`} />
                                                    <span className="text-[12px] font-bold">{p.label}</span>
                                                    {isSelected && <Check size={16} className="text-white ml-auto" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: COMMITMENT */}
                        {step === 3 && (
                            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="font-sans text-3xl font-black bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent mb-3 tracking-tight">Study Commitment.</h2>
                                    <p className="text-[14px] text-white/50 font-medium">How long are you willing to study every day?</p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    {COMMITMENT_LEVELS.map(c => {
                                        const isSelected = commitment === c.id;
                                        return (
                                            <button 
                                                key={c.id} 
                                                onClick={() => setCommitment(c.id)} 
                                                className={`w-full flex items-center p-4 rounded-2xl border transition-all duration-300 active:scale-[0.98] hover:scale-[1.01] ${
                                                    isSelected 
                                                        ? 'bg-gradient-to-br from-blue-600/25 via-indigo-600/15 to-transparent border-blue-500/50 text-white font-bold shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
                                                        : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04] text-white/40 hover:text-white'
                                                }`}
                                            >
                                                <div className={`p-2.5 rounded-xl mr-4 ${isSelected ? 'bg-blue-500/20 text-white' : 'bg-white/[0.03] text-white/30'}`}>
                                                    <c.icon size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold">{c.label}</p>
                                                    <p className="text-[11px] text-white/40 font-medium">{c.desc}</p>
                                                </div>
                                                {isSelected && <Check size={18} className="text-white ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 (final): INSTALL THE APP & FINISH */}
                        {step === 4 && (
                            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto relative overflow-visible">
                                {/* Confetti particles */}
                                {[...Array(30)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full pointer-events-none"
                                        style={{
                                            backgroundColor: ['#F59E0B','#10B981','#818CF8','#F472B6','#34D399','#FBBF24','#A78BFA'][i % 7],
                                            left: `${15 + Math.random() * 70}%`,
                                        }}
                                        initial={{ y: 0, opacity: 1, scale: 0 }}
                                        animate={{
                                            y: [0, -(80 + Math.random() * 120), 200],
                                            x: [0, (Math.random() - 0.5) * 100],
                                            opacity: [0, 1, 0],
                                            scale: [0, 1.2, 0],
                                            rotate: [0, Math.random() * 720],
                                        }}
                                        transition={{
                                            duration: 2.5 + Math.random() * 2,
                                            delay: 0.1 + Math.random() * 1.5,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                        }}
                                    />
                                ))}
                                
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                                    className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.25)] border-2 border-white/10 relative"
                                >
                                    <Zap size={36} className="text-black" fill="currentColor" />
                                    <div className="absolute inset-0 rounded-full animate-pulse bg-amber-400/20 blur-2xl -z-10" />
                                </motion.div>
                                
                                <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tighter">You're In, Scholar.</h2>
                                <p className="text-[13px] text-white/60 font-medium mb-4 px-2 leading-relaxed">
                                    50 credits loaded. But wait, your browser is fine, but your home screen is better.
                                </p>

                                {isInstallable ? (
                                    <div className="mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                                            <Backpack size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-white mb-0.5">Install The Professor App</p>
                                            <p className="text-[11px] text-white/40 leading-snug">Get offline access to your study vault, quick photo uploads, and micro-reminders so you never break your streak.</p>
                                            <button 
                                                onClick={installApp}
                                                className="mt-3 px-4 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors active:scale-95"
                                            >
                                                Add to Home Screen
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                                            <Trophy size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-white mb-0.5">Keep the flow on mobile</p>
                                            <p className="text-[11px] text-white/40 leading-snug">To study offline, open The Professor in Safari or Chrome on your phone, tap the share menu, and select &quot;Add to Home Screen&quot;.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Network Save Error Warning */}
                    {saveError && (
                        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold leading-normal mb-2 animate-shake">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{saveError}</span>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="mt-4 pt-2 flex items-center gap-4 relative z-20">
                        {step > 1 && step < 4 && (
                            <button onClick={() => setStep(step - 1)} className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10 active:scale-95 flex items-center justify-center shrink-0">
                                <ChevronLeft size={28} />
                            </button>
                        )}
                        {(step < 4) && (
                            <button
                                onClick={handleNext}
                                disabled={isSaving || (step === 1 && (!firstName || !lastName || !username || usernameStatus !== "available")) || (step === 2 && (!age || parseInt(age) < 10 || !eduLevel || selectedPainPoints.length === 0)) || (step === 3 && !commitment)}
                                className={`flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.97] duration-300 border ${
                                    (isSaving || (step === 1 && (!firstName || !lastName || !username || usernameStatus !== "available")) || (step === 2 && (!age || parseInt(age) < 10 || !eduLevel || selectedPainPoints.length === 0)) || (step === 3 && !commitment))
                                        ? "bg-white/[0.02] text-white/20 border-white/5 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-500/30 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] shadow-[0_4px_15px_rgba(37,99,235,0.2)] hover:scale-[1.01]"
                                }`}
                            >
                                {isSaving || usernameStatus === "checking" ? (
                                    <div className="flex items-center gap-2">
                                        <RotateCw size={20} className="animate-spin" />
                                        <span>{usernameStatus === "checking" ? "Checking..." : "Saving..."}</span>
                                    </div>
                                ) : step === 3 ? "Done — Claim Credits" : "Continue"}
                                {!isSaving && usernameStatus !== "checking" && step < 3 && <ChevronRight size={22} />}
                            </button>
                        )}
                        {step === 4 && (
                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="flex-1 h-16 rounded-2xl font-black text-[13px] tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.97] px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-[1.01] border border-amber-400/20"
                            >
                                {isSaving ? <RotateCw size={24} className="animate-spin" /> : "Launch Study Studio"}
                                {!isSaving && <Zap size={20} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

