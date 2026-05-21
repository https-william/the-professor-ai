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

/* ═══ Neumorphic Helpers ═══ */
const clay = {
    card: {
        background: "var(--card)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderRadius: "28px",
        border: "1px solid var(--border)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.05)",
    } as React.CSSProperties,
    input: {
        background: "var(--background)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
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



export default function OnboardingPage() {
    const { user, completeOnboarding, saveOnboardingStep } = useUser();
    const { isDesktop, isMobile, platform } = useAppPlatform();
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
            router.push("/dashboard");
        }
    }, [mounted, user.hasOnboarded, router]);

    // Don't mount on landing, auth pages, or if unauthenticated
    if (!mounted || isLanding || isAuthPage || user.hasOnboarded || !user.isAuthenticated) return null;

    const handleNext = async () => {
        setIsSaving(true);
        try {
            if (step === 1) {
                // Identity & Handle
                await saveOnboardingStep({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    username: username.toLowerCase().trim(),
                    alias: firstName.trim()
                });
                setStep(2);
            } else if (step === 2) {
                // Academic Profile
                await saveOnboardingStep({
                    age: parseInt(age),
                    education_level: eduLevel,
                    study_goal: JSON.stringify({ painPoints: selectedPainPoints })
                });
                setStep(3);
            } else if (step === 3) {
                // Commitment & Topic → Skip straight to reward
                if (topic && topic.length >= 3) {
                    setStep(5);
                } else {
                    setTopicError("Please specify a subject to study.");
                }
            }
        } catch (error) {
            console.error("Onboarding progression failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = async () => {
        setIsSaving(true);
        const combinedGoal = JSON.stringify({
            painPoints: selectedPainPoints,
            commitmentTime: commitment,
            initialTopic: topic,
            platformDetected: platform
        });
        await completeOnboarding({
            alias: firstName.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.toLowerCase().trim(),
            age: parseInt(age),
            education_level: eduLevel,
            study_goal: combinedGoal
        });
        setIsSaving(false);
        // Redirect to create page with exam sprint active
        router.push("/create");
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
            <div className="absolute inset-0 bg-[#08080E]/80 backdrop-blur-[100px]" />
            
            {/* Ambient Orbs */}
            <motion.div 
                className="absolute w-[800px] h-[800px] rounded-full mix-blend-screen opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, var(--blue-dim), transparent 70%)", filter: "blur(120px)" }}
                animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, -40, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-[480px] overflow-hidden bg-[var(--card)]" style={clay.card}>
                
                {/* Embedded Top Progress Bar */}
                {step > 1 && step < 5 && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--bg-2)]">
                        <div 
                            className="h-full bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] transition-all duration-700 ease-out shadow-[0_0_15px_var(--blue-glow)]" 
                            style={{ width: `${((step - 1) / 3) * 100}%` }} 
                        />
                    </div>
                )}

                <div className="px-8 py-10 min-h-[480px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: IDENTITY & HANDLE */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full justify-center">
                                <div className="text-center mb-10">
                                    <h2 className="font-sans text-2xl font-black text-[var(--text)] mb-2 tracking-tight">Your Scholar Profile.</h2>
                                    <p className="text-[14px] text-[var(--text)]/40 font-medium">How should The Professor address you?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-1/2 px-5 py-4 font-bold text-[var(--text)] outline-none placeholder:text-[var(--text)]/20 transition-all focus:border-[var(--blue)]/50" style={clay.input} />
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="w-1/2 px-5 py-4 font-bold text-[var(--text)] outline-none placeholder:text-[var(--text)]/20 transition-all focus:border-[var(--blue)]/50" style={clay.input} />
                                    </div>
                                    <div className="relative">
                                        <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="Choose a Handle (@)" className="w-full px-5 py-4 font-bold text-[var(--text)] outline-none placeholder:text-[var(--text)]/20 transition-all focus:border-[var(--blue)]/50 pr-12" style={clay.input} />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            {usernameStatus === "checking" && <RotateCw size={20} className="animate-spin text-[var(--text)]/30" />}
                                            {usernameStatus === "available" && <CheckCircle2 size={20} className="text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                            {(usernameStatus === "taken" || usernameStatus === "invalid") && <AlertCircle size={20} className="text-[#EF4444]" />}
                                        </div>
                                    </div>
                                    <div className="h-6 text-center mt-2">
                                        {usernameStatus === "checking" && <p className="text-[12px] text-[var(--text)]/30 font-bold animate-pulse">Checking handle...</p>}
                                        {usernameStatus === "available" && <p className="text-[12px] text-[#10B981] font-bold">Handle is available.</p>}
                                        {usernameStatus === "taken" && <p className="text-[12px] text-[#EF4444] font-bold">Handle is already claimed.</p>}
                                        {usernameStatus === "invalid" && <p className="text-[12px] text-[#EF4444] font-bold">Alphanumeric characters only.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* STEP 2: SCHOLAR CONTEXT */}
                        {step === 2 && (
                            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="font-sans text-2xl font-black text-[var(--text)] mb-2 tracking-tight">Academic Context.</h2>
                                    <p className="text-[14px] text-[var(--text)]/40 font-medium">Aligning difficulty to your profile.</p>
                                </div>
                                
                                <div className="flex gap-4">
                                    <input type="tel" value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Age" className="w-1/4 px-4 py-4 font-black text-[var(--text)] text-center text-xl" style={clay.input} />
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        {EDU_LEVELS.map(l => (
                                            <button key={l.id} onClick={() => setEduLevel(l.id)} className={`py-3 rounded-2xl border transition-all ${eduLevel === l.id ? 'bg-[var(--blue-dim)] border-[var(--blue)]' : 'bg-[var(--bg-2)] border-[var(--border)]'}`}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${eduLevel === l.id ? 'text-[var(--blue)]' : 'text-[var(--text)]/30'}`}>{l.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text)]/20 pl-1">Primary Struggle Areas</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {PAIN_POINTS.map(p => {
                                            const isSelected = selectedPainPoints.includes(p.id);
                                            return (
                                                <button key={p.id} onClick={() => togglePainPoint(p.id)} className={`w-full flex items-center p-3.5 rounded-xl border transition-all ${isSelected ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-[var(--bg-2)] border-[var(--border)]'}`}>
                                                    <p.icon size={16} className={`mr-3 ${isSelected ? 'text-[#10B981]' : 'text-[var(--text)]/20'}`} />
                                                    <span className={`text-[12px] font-bold ${isSelected ? 'text-[#10B981]' : 'text-[var(--text)]/60'}`}>{p.label}</span>
                                                    {isSelected && <Check size={16} className="text-[#10B981] ml-auto" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: COMMITMENT & TOPIC */}
                        {step === 3 && (
                            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="font-sans text-2xl font-black text-[var(--text)] mb-2 tracking-tight">
                                        {topic ? "Confirm your Goal." : "Plan & Topic."}
                                    </h2>
                                    <p className="text-[14px] text-[var(--text)]/40 font-medium">
                                        {topic ? `You're studying ${topic}.` : "What are we studying today?"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {COMMITMENT_LEVELS.map(c => (
                                        <button key={c.id} onClick={() => setCommitment(c.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${commitment === c.id ? 'bg-[var(--blue-dim)] border-[var(--blue)]' : 'bg-[var(--bg-2)] border-[var(--border)]'}`}>
                                            <c.icon size={18} className={`mb-2 ${commitment === c.id ? 'text-[var(--blue)]' : 'text-[var(--text)]/20'}`} />
                                            <span className={`text-[10px] font-black uppercase ${commitment === c.id ? 'text-[var(--blue)]' : 'text-[var(--text)]/40'}`}>{c.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text)]/20 pl-1">Initial Study Topic</p>
                                    <textarea 
                                        value={topic} 
                                        onChange={e => { setTopic(e.target.value); setTopicError(""); }}
                                        placeholder="e.g. Molecular Biology, Advanced Calculus..." 
                                        className="w-full px-5 py-6 font-bold text-[var(--text)] outline-none placeholder:text-[var(--text)]/10 text-center text-lg min-h-[120px] resize-none leading-relaxed" 
                                        style={clay.input} 
                                    />
                                    {topicError && <p className="text-[11px] text-red-500 font-bold text-center">{topicError}</p>}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 (final): GIFT & FINISH — Confetti + Compelling CTA */}
                        {step === 5 && (
                            <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto relative overflow-visible">
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
                                    className="w-32 h-32 mx-auto mb-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.4)] border-4 border-[var(--border)] relative"
                                >
                                    <Zap size={64} className="text-black" fill="currentColor" />
                                    <div className="absolute inset-0 rounded-full animate-pulse bg-amber-400/20 blur-2xl -z-10" />
                                </motion.div>
                                
                                <h2 className="font-sans text-3xl font-black text-[var(--text)] mb-3 tracking-tighter">You're In, Scholar.</h2>
                                <p className="text-[14px] text-[var(--text)]/60 font-medium mb-4 px-4 leading-relaxed">
                                    50 fresh credits. Zero excuses. Your bed misses you already.
                                </p>

                                {/* Achievement Unlock Banner */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--amber-border)] shadow-[0_10px_30px_var(--amber-glow)] flex items-center gap-4 text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/30 flex items-center justify-center text-[var(--amber)] shrink-0 shadow-[0_0_15px_var(--amber-glow)]">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--amber)] bg-[var(--amber)]/10 px-2 py-0.5 rounded-full">Achievement Unlocked</span>
                                            <span className="text-[10px] font-mono text-[var(--text-3)]">+100 XP</span>
                                        </div>
                                        <p className="text-sm font-bold text-[var(--text)]">First Step, First Win</p>
                                        <p className="text-xs text-[var(--text-2)]">You've successfully completed onboarding. The Trophy Room is now fully unlocked!</p>
                                    </div>
                                </motion.div>

                                <motion.p 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-[12px] text-[var(--text)]/40 mb-8 font-bold italic"
                                >
                                    Time to turn those notes into something you actually remember.
                                </motion.p>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Navigation Controls */}
                    <div className="mt-8 pt-4 flex items-center gap-4 relative z-20">
                        {step > 1 && step < 4 && (
                            <button onClick={() => setStep(step - 1)} className="w-14 h-14 rounded-2xl bg-[var(--bg-2)] text-[var(--text)]/40 hover:text-[var(--text)]/90 hover:bg-white/10 transition-all border border-[var(--border)] active:scale-95 flex items-center justify-center shrink-0">
                                <ChevronLeft size={28} />
                            </button>
                        )}
                        {(step < 4) && (
                            <button
                                onClick={handleNext}
                                disabled={isSaving || (step === 1 && (!firstName || !lastName || !username || usernameStatus !== "available")) || (step === 2 && (!age || parseInt(age) < 10 || !eduLevel || selectedPainPoints.length === 0)) || (step === 3 && (!commitment || !topic.trim()))}
                                className="flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:grayscale"
                                style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))", color: "#fff", boxShadow: "0 10px 30px var(--blue-glow)" }}
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
                        {step === 5 && (
                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="flex-1 h-16 rounded-2xl font-black text-[13px] tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98] px-8 hover-scale-md"
                                style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-border))", color: "#000", boxShadow: "0 12px 40px var(--emerald-glow)" }}
                            >
                                {isSaving ? <RotateCw size={24} className="animate-spin" /> : "Use Your Credits → Exam Sprint"}
                                {!isSaving && <Zap size={20} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

