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
    Clock, 
    MessageSquare, 
    HelpCircle, 
    Cpu, 
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
    Smartphone,
    Monitor,
    ShieldCheck
} from "lucide-react";

/* ═══ Neumorphic Helpers ═══ */
const clay = {
    card: {
        background: "var(--card)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderRadius: "28px",
        border: "1px solid var(--border)",
        boxShadow: "20px 20px 60px rgba(0,0,0,0.5), -10px -10px 30px rgba(255,255,255,0.05), inset 0 1px 1px rgba(255,255,255,0.1)",
    } as React.CSSProperties,
    input: {
        background: "var(--background)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.02)",
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
    { id: "1hr", icon: Dumbbell, label: "1+ hour", desc: "Deep mastery" },
];

const TESTIMONIALS = [
    { quote: "The Professor didn't just help me pass; it fundamentally changed how I understand complex algorithms.", author: "Sarah J.", role: "CS Major" },
    { quote: "Finally, an AI that challenges me instead of just feeding me the answers. The active recall tools are game-changing.", author: "Michael T.", role: "Med Student" },
    { quote: "I used to procrastinate reading long PDFs. Now, I upload them and battle through the material.", author: "Elena R.", role: "Ph.D Candidate" }
];

const CURRICULUM_FEATURES = [
    { title: "Dynamic Spaced Repetition", icon: Clock, color: "#F59E0B", desc: "Optimizes memory retention automatically." },
    { title: "Socratic Method Dialogue", icon: MessageSquare, color: "#10B981", desc: "Guides you to the answer instead of spoon-feeding." },
    { title: "Hyper-Personalized Quizzes", icon: HelpCircle, color: "#818CF8", desc: "Tests tailored to your exact weaknesses." },
];

export default function OnboardingModal() {
    const { user, completeOnboarding, saveOnboardingStep } = useUser();
    const { isDesktop, isMobile, platform } = useAppPlatform();
    const router = useRouter();
    const pathname = usePathname();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ── Pre-mount Guards ──
    const isLanding = pathname === "/";
    const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(pathname);
    
    // Don't mount on landing, auth pages, or if already onboarded/unauthenticated
    if (!mounted || isLanding || isAuthPage || user.hasOnboarded) return null;
    
    // ─── CRITICAL: SIGNUP-ONLY PROTECTION ───
    // Only show if the user's account was created in the last 2 minutes (Fresh Signup)
    const isNewSignup = user.createdAt ? (Date.now() - new Date(user.createdAt).getTime()) < 120000 : false;
    
    if (!user.isAuthenticated || user.isLoading || !isNewSignup) return null;

    // Form data
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
    const [age, setAge] = useState<string>("");
    const [eduLevel, setEduLevel] = useState("");
    const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
    const [commitment, setCommitment] = useState("");

    // Animation / Fake Loading state
    const [analyzingProgress, setAnalyzingProgress] = useState(0);
    const [curriculumReady, setCurriculumReady] = useState(false);
    
    // Testimonial index
    const [testiIndex, setTestiIndex] = useState(0);

    // Topic selection (must be declared before any early returns — Rules of Hooks)
    const [topic, setTopic] = useState("");
    const [topicError, setTopicError] = useState("");

    const isVisible = user.isAuthenticated && !user.isLoading && !user.hasOnboarded;

    // Testimonial Carousel Effect
    useEffect(() => {
        if (step === 7) { // Shifted for specialized step
            const timer = setInterval(() => {
                setTestiIndex(prev => (prev + 1) % TESTIMONIALS.length);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [step]);

    // Username Checking debounce
    useEffect(() => {
        if (step !== 2) return;
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

    // Analyzing Animation
    useEffect(() => {
        if (step === 9 && !curriculumReady) {
            const duration = 2500;
            const interval = 50;
            const steps = duration / interval;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                setAnalyzingProgress(Math.min((currentStep / steps) * 100, 100));
                if (currentStep >= steps) {
                    clearInterval(timer);
                    setCurriculumReady(true);
                }
            }, interval);
            return () => clearInterval(timer);
        }
    }, [step, curriculumReady]);

    if (user.isLoading) {
        return (
            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-[#08080E] flex items-center justify-center"
                >
                     <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center"
                    >
                         <div className="w-12 h-12 border-2 border-[#F59E0B]/30 border-t-[#F59E0B] rounded-full animate-spin mb-4" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F59E0B]/50">Synchronizing Archives</span>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    const handleNext = async () => {
        setIsSaving(true);
        try {
            if (step === 1) {
                setStep(2);
            } else if (step === 2) {
                await saveOnboardingStep({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    username: username.toLowerCase().trim(),
                    alias: firstName.trim()
                });
                setStep(3);
            } else if (step === 3) {
                await saveOnboardingStep({
                    age: parseInt(age),
                    education_level: eduLevel
                });
                setStep(4);
            } else if (step === 4) {
                setStep(5);
            } else if (step === 5) {
                setStep(6);
            } else if (step === 6) {
                setStep(7);
            } else if (step === 7) {
                setStep(8);
            } else if (step === 8) {
                if (!topic || topic.length < 3) {
                    setTopicError("Please enter a valid topic to master.");
                    return;
                }
                setStep(9);
                await generateInitialRoadmap();
            }
        } catch (error) {
            console.error("Onboarding progression failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const generateInitialRoadmap = async () => {
        try {
            const res = await fetch("/api/generate/roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    title: topic, 
                    context: `User is a ${eduLevel} student focused on ${selectedPainPoints.join(", ")}. Learning Goal: Master ${topic}.` 
                }),
            });
            if (res.ok) {
                setCurriculumReady(true);
            } else {
                setCurriculumReady(true);
            }
        } catch (error) {
            console.error("Roadmap generation failed during onboarding:", error);
            setCurriculumReady(true);
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
        router.push("/dashboard");
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden font-sans">
            {/* Cinematic Ambient Blur Background */}
            <div className="absolute inset-0 bg-[#08080E]/80 backdrop-blur-[100px]" />
            
            {/* Ambient Orbs */}
            <motion.div 
                className="absolute w-[800px] h-[800px] rounded-full mix-blend-screen opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)", filter: "blur(120px)" }}
                animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, -40, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-[480px] overflow-hidden bg-black/40" style={clay.card}>
                
                {/* Embedded Top Progress Bar */}
                {step > 1 && step < 8 && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.6)]" 
                            style={{ width: `${((step - 1) / 7) * 100}%` }} 
                        />
                    </div>
                )}

                <div className="px-8 py-10 min-h-[480px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: THE HOOK */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center my-auto">
                                <motion.div 
                                    className="w-24 h-24 mx-auto mb-8 rounded-[32px] flex items-center justify-center bg-white/5 border border-white/10"
                                    animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.05)" }}
                                >
                                    <Cpu size={48} strokeWidth={1.5} className="text-[#F59E0B]" style={{ filter: "drop-shadow(0 0 15px rgba(245,158,11,0.5))" }} />
                                </motion.div>
                                <h1 className="font-sans text-[34px] font-black text-white leading-tight tracking-tighter">Ready to <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#F59E0B] to-[#D97706]">Understand</span><br />Anything?</h1>
                                <p className="text-[15px] text-white/40 mt-4 leading-relaxed max-w-[85%] mx-auto font-medium">Join the next generation of scholars mastering complexity through AI.</p>
                            </motion.div>
                        )}

                        {/* STEP 2: IDENTITY */}
                        {step === 2 && (
                            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full justify-center">
                                <div className="text-center mb-10">
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">Claim your Identity.</h2>
                                    <p className="text-[14px] text-white/40 font-medium">How should The Professor address you?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-1/2 px-5 py-4 font-bold text-white outline-none placeholder:text-white/20 transition-all focus:border-[#F59E0B]/50" style={clay.input} />
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="w-1/2 px-5 py-4 font-bold text-white outline-none placeholder:text-white/20 transition-all focus:border-[#F59E0B]/50" style={clay.input} />
                                    </div>
                                    <div className="relative">
                                        <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="Choose a Handle (@)" className="w-full px-5 py-4 font-bold text-white outline-none placeholder:text-white/20 transition-all focus:border-[#F59E0B]/50 pr-12" style={clay.input} />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            {usernameStatus === "checking" && <RotateCw size={20} className="animate-spin text-white/30" />}
                                            {usernameStatus === "available" && <CheckCircle2 size={20} className="text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                            {(usernameStatus === "taken" || usernameStatus === "invalid") && <AlertCircle size={20} className="text-[#EF4444]" />}
                                        </div>
                                    </div>
                                    <div className="h-6">
                                        {usernameStatus === "taken" && <p className="text-[12px] text-[#EF4444] text-center font-bold">Handle is already claimed.</p>}
                                        {usernameStatus === "invalid" && <p className="text-[12px] text-[#EF4444] text-center font-bold">Alphanumeric characters only.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 6: SPECIALIZED (PLATFORM AWARENESS) */}
                        {step === 6 && (
                            <motion.div key="step6" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto">
                                <div className="mb-6 flex justify-center">
                                    <div className="flex -space-x-4">
                                        {isDesktop ? (
                                            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center relative z-10 shadow-2xl">
                                                <Monitor size={40} className="text-amber-500" />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center relative z-10 shadow-2xl">
                                                <Smartphone size={40} className="text-blue-500" />
                                            </div>
                                        )}
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-2xl">
                                            <ShieldCheck size={40} className="text-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                                <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">
                                    {isDesktop ? "Desktop Ready." : "Mobile Optimized."}
                                </h2>
                                <p className="text-[14px] text-white/40 font-medium mb-8">
                                    {isDesktop 
                                        ? "We've enabled High-Speed Local File indexing for your textbooks and PDFs." 
                                        : "Quick-Capture is active. Glance through flashcards anywhere, anytime."}
                                </p>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Zap size={16} className="text-amber-500" />
                                        <span className="text-[12px] font-black uppercase tracking-widest text-amber-500">Device Feature Unlocked</span>
                                    </div>
                                    <p className="text-[13px] text-white/70 font-semibold leading-relaxed">
                                        {isDesktop 
                                            ? "Drag and drop massive PDF libraries directly into your workspace for instant synthesis." 
                                            : "Study habits sync across all devices. We'll remind you when it's time for Active Recall."}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 8: TOPIC SELECTION */}
                        {step === 8 && (
                            <motion.div key="step8" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">The First Mastery.</h2>
                                    <p className="text-[14px] text-white/40 font-medium">What academic subject are we conquering first?</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="relative">
                                        <textarea 
                                            value={topic} 
                                            onChange={e => {
                                                setTopic(e.target.value);
                                                if (e.target.value.length >= 3) setTopicError("");
                                            }}
                                            placeholder="e.g. Molecular Biology, Advanced Calculus, Python Robotics..." 
                                            className="w-full px-6 py-8 font-black text-white outline-none placeholder:text-white/10 text-center text-xl min-h-[160px] resize-none leading-relaxed transition-all focus:border-[#F59E0B]/40" 
                                            style={clay.input} 
                                        />
                                        <div className="absolute -bottom-8 left-0 right-0">
                                            {topicError && <p className="text-[12px] text-red-500 font-bold animate-pulse text-center">{topicError}</p>}
                                        </div>
                                    </div>
                                    <div className="text-center opacity-20 mt-12">
                                        <Library size={48} strokeWidth={1.5} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Rest of the steps (3, 4, 5, 7, 9, 10) logic remains similar but with Montserrat & updated styling */}
                        {step === 3 && (
                            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">Your Context.</h2>
                                    <p className="text-[14px] text-white/40 font-medium">We align the curriculum difficulty to your current level.</p>
                                </div>
                                <div className="space-y-6">
                                    <input type="tel" value={age} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                        setAge(val);
                                    }} placeholder="Your Age" className="w-full px-5 py-4 font-black text-white outline-none placeholder:text-white/20 text-center text-2xl transition-all focus:border-[#F59E0B]/50" style={clay.input} />
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {EDU_LEVELS.map(l => (
                                            <button key={l.id} onClick={() => setEduLevel(l.id)} className="p-5 rounded-3xl flex flex-col items-center gap-3 transition-all duration-300 relative overflow-hidden group" style={{ ...clay.input, background: eduLevel === l.id ? "rgba(245,158,11,0.15)" : clay.input.background, border: eduLevel === l.id ? "1px solid rgba(245,158,11,0.4)" : clay.input.border }}>
                                                <l.icon size={32} strokeWidth={1.5} className="relative z-10 transition-transform group-hover:scale-110" style={{ color: eduLevel === l.id ? "#F59E0B" : "rgba(255,255,255,0.1)" }} />
                                                <span className="text-[11px] font-black uppercase tracking-widest relative z-10" style={{ color: eduLevel === l.id ? "#F59E0B" : "rgba(255,255,255,0.3)" }}>{l.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-6">
                                        {parseInt(age) < 10 && age !== "" && <p className="text-[12px] text-[#EF4444] text-center font-bold">Minimum age is 10.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-8">
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">The Mission.</h2>
                                    <p className="text-[14px] text-white/40 font-medium">Select your primary struggle areas.</p>
                                </div>
                                <div className="space-y-3">
                                    {PAIN_POINTS.map(p => {
                                        const isSelected = selectedPainPoints.includes(p.id);
                                        return (
                                            <button 
                                                key={p.id} 
                                                onClick={() => togglePainPoint(p.id)} 
                                                className="w-full flex items-center p-4 rounded-2xl transition-all duration-300 text-left relative overflow-hidden group" 
                                                style={{ ...clay.input, background: isSelected ? "rgba(16,185,129,0.1)" : clay.input.background, border: isSelected ? "1px solid rgba(16,185,129,0.3)" : clay.input.border }}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors relative z-10 ${isSelected ? 'bg-[#10B981]/20' : 'bg-white/5'}`}>
                                                    <p.icon size={20} strokeWidth={1.5} style={{ color: isSelected ? "#10B981" : "rgba(255,255,255,0.2)" }} />
                                                </div>
                                                <span className="text-[13px] font-black flex-1 relative z-10 tracking-tight leading-snug" style={{ color: isSelected ? "#10B981" : "rgba(255,255,255,0.6)" }}>{p.label}</span>
                                                {isSelected && <Check size={18} className="text-[#10B981] mr-1" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">Commitment.</h2>
                                    <p className="text-[14px] text-white/40 font-medium">Daily dedication required for mastery.</p>
                                </div>
                                <div className="space-y-4">
                                    {COMMITMENT_LEVELS.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => setCommitment(c.id)} 
                                            className="w-full flex items-center p-5 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden" 
                                            style={{ ...clay.input, background: commitment === c.id ? "rgba(245,158,11,0.15)" : clay.input.background, border: commitment === c.id ? "1px solid rgba(245,158,11,0.4)" : clay.input.border }}
                                        >
                                            <c.icon size={28} strokeWidth={1.5} className="mr-5 relative z-10" style={{ color: commitment === c.id ? "#F59E0B" : "rgba(255,255,255,0.15)" }} />
                                            <div className="relative z-10">
                                                <div className="text-[16px] font-black" style={{ color: commitment === c.id ? "#F59E0B" : "rgba(255,255,255,0.8)" }}>{c.label}</div>
                                                <div className="text-[12px] font-bold mt-0.5" style={{ color: commitment === c.id ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.2)" }}>{c.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 7 && (
                            <motion.div key="step7" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto">
                                <h2 className="font-sans text-2xl font-black text-white mb-8 tracking-tight">You're in good company.</h2>
                                <div className="relative w-full h-[180px] flex items-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            key={testiIndex}
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                                            className="absolute inset-0 px-4"
                                        >
                                            <div className="flex justify-center mb-5 gap-1">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-[#F59E0B]" fill="#F59E0B" />)}
                                            </div>
                                            <p className="text-[16px] font-bold text-white/80 leading-relaxed mb-6 italic">"{TESTIMONIALS[testiIndex].quote}"</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#D97706] flex items-center justify-center text-black font-black text-[13px]">{TESTIMONIALS[testiIndex].author[0]}</div>
                                                <div className="text-left font-sans">
                                                    <div className="text-[14px] font-black text-white/95">{TESTIMONIALS[testiIndex].author}</div>
                                                    <div className="text-[10px] text-white/30 font-black uppercase tracking-wider">{TESTIMONIALS[testiIndex].role}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {step === 9 && (
                            <motion.div key="step9" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col justify-center h-full">
                                {!curriculumReady ? (
                                    <div className="text-center py-12">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-10 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                                            <Cpu size={40} className="text-[#F59E0B]" />
                                        </motion.div>
                                        <h2 className="font-sans text-xl font-black text-white mb-6 animate-pulse">Architecting your Curriculum...</h2>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden max-w-[280px] mx-auto border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#10B981] transition-all duration-75" style={{ width: `${analyzingProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                        <div className="mb-10">
                                            <Sparkles size={48} className="mx-auto mb-5 text-[#10B981] drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                                            <h2 className="font-sans text-2xl font-black text-white mb-3 tracking-tight">Your Strategy is Ready.</h2>
                                            <p className="text-[12px] font-black uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 rounded-xl inline-block border border-[#F59E0B]/20">{topic}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {CURRICULUM_FEATURES.map((f, i) => (
                                                <div key={f.title} className="p-4 rounded-2xl flex items-center gap-4 bg-white/[0.03] border border-white/5 text-left transition-transform hover:scale-[1.02]">
                                                    <f.icon size={24} style={{ color: f.color }} className="shrink-0" />
                                                    <div>
                                                        <div className="text-[13px] font-black text-white">{f.title}</div>
                                                        <div className="text-[11px] text-white/40 font-bold">{f.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {step === 10 && (
                            <motion.div key="step10" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto">
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                                    className="w-32 h-32 mx-auto mb-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.4)] border-4 border-white/10 relative"
                                >
                                    <Zap size={64} className="text-black" fill="currentColor" />
                                    {/* Volumetric glow */}
                                    <div className="absolute inset-0 rounded-full animate-pulse bg-amber-400/20 blur-2xl -z-10" />
                                </motion.div>
                                
                                <h2 className="font-sans text-3xl font-black text-white mb-4 tracking-tighter">Welcome Gift.</h2>
                                <p className="text-[16px] text-white/60 font-medium mb-12 px-4 italic leading-relaxed">
                                    To kickstart your journey to mastery, The Professor has assigned <span className="text-amber-500 font-black">100 Credits</span> to your archives.
                                </p>
                                
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">Scholar's Reward Assigned</p>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Navigation Controls */}
                    <div className="mt-8 pt-4 flex items-center gap-4 relative z-20">
                        {step > 1 && step < 9 && (
                            <button onClick={() => setStep(step - 1)} className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:text-white/90 hover:bg-white/10 transition-all border border-white/10 active:scale-95 flex items-center justify-center shrink-0">
                                <ChevronLeft size={28} />
                            </button>
                        )}
                        {(!curriculumReady || (step !== 9 && step !== 10)) && (
                            <button
                                onClick={handleNext}
                                disabled={isSaving || (step === 2 && (!firstName || !lastName || usernameStatus !== "available")) || (step === 3 && (!age || parseInt(age) < 10)) || (step === 4 && selectedPainPoints.length === 0) || (step === 5 && !commitment)}
                                className="flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", boxShadow: "0 10px 30px rgba(245,158,11,0.25)" }}
                            >
                                {isSaving ? <RotateCw size={24} className="animate-spin" /> : step === 1 ? "Begin" : step === 8 ? "Analyze" : "Continue"}
                                {!isSaving && step !== 1 && step !== 8 && <ChevronRight size={22} />}
                            </button>
                        )}
                        {curriculumReady && step === 9 && (
                            <button
                                onClick={() => setStep(10)}
                                className="flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", boxShadow: "0 10px 30px rgba(245,158,11,0.25)" }}
                            >
                                Claim Welcome Gift
                                <ChevronRight size={22} />
                            </button>
                        )}
                        {step === 10 && (
                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="flex-1 h-16 rounded-2xl font-black text-[15px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98] px-8"
                                style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "#000", boxShadow: "0 12px 40px rgba(16,185,129,0.3)" }}
                            >
                                {isSaving ? <RotateCw size={24} className="animate-spin" /> : "Enter Workspace"}
                                {!isSaving && <LogIn size={22} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
