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

    // ── State Hooks ──
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
    const [testiIndex, setTestiIndex] = useState(0);
    const [age, setAge] = useState<string>("");
    const [eduLevel, setEduLevel] = useState("");
    const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
    const [commitment, setCommitment] = useState("");
    const [analyzingProgress, setAnalyzingProgress] = useState(0);
    const [curriculumReady, setCurriculumReady] = useState(false);
    const [topic, setTopic] = useState("");
    const [topicError, setTopicError] = useState("");

    // ── Effect Hooks ──
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load persisted topic from landing page
    useEffect(() => {
        if (typeof window !== "undefined") {
            const persisted = localStorage.getItem("pending_mastery");
            if (persisted) setTopic(persisted);
        }
    }, []);

    // Testimonial Carousel Effect
    useEffect(() => {
        if (step === 4) {
            const timer = setInterval(() => {
                setTestiIndex(prev => (prev + 1) % TESTIMONIALS.length);
            }, 4000);
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

    // ── Render Logic ──
    const isLanding = pathname === "/";
    const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(pathname);
    const isOnboardingRoute = pathname?.startsWith("/onboarding");
    
    // Don't mount on landing, auth pages, onboarding routes, or if already onboarded/unauthenticated
    if (!mounted || isLanding || isAuthPage || isOnboardingRoute || user.hasOnboarded) return null;
    
    // Guard for unauthenticated or still loading user state
    if (!user.isAuthenticated || user.isLoading) {
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
        return null;
    }

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
                // Commitment & Topic
                if (topic && topic.length >= 3) {
                    setStep(4);
                    await generateInitialRoadmap();
                } else {
                    setTopicError("Please specify a subject to master.");
                }
            } else if (step === 4) {
                // Analysis -> Finish
                setStep(5);
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
                {step > 1 && step < 6 && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.6)]" 
                            style={{ width: `${((step - 1) / 5) * 100}%` }} 
                        />
                    </div>
                )}

                <div className="px-8 py-10 min-h-[480px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: IDENTITY & HANDLE */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full justify-center">
                                <div className="text-center mb-10">
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">Your Scholar Profile.</h2>
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
                                    <div className="h-6 text-center">
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
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">Academic Context.</h2>
                                    <p className="text-[14px] text-white/40 font-medium">Aligning difficulty to your profile.</p>
                                </div>
                                
                                <div className="flex gap-4">
                                    <input type="tel" value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Age" className="w-1/4 px-4 py-4 font-black text-white text-center text-xl" style={clay.input} />
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        {EDU_LEVELS.map(l => (
                                            <button key={l.id} onClick={() => setEduLevel(l.id)} className={`py-3 rounded-2xl border transition-all ${eduLevel === l.id ? 'bg-[#F59E0B]/20 border-[#F59E0B]' : 'bg-white/5 border-white/10'}`}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${eduLevel === l.id ? 'text-[#F59E0B]' : 'text-white/30'}`}>{l.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-white/20 pl-1">Primary Struggle Areas</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {PAIN_POINTS.map(p => {
                                            const isSelected = selectedPainPoints.includes(p.id);
                                            return (
                                                <button key={p.id} onClick={() => togglePainPoint(p.id)} className={`w-full flex items-center p-3.5 rounded-xl border transition-all ${isSelected ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-white/5 border-white/5'}`}>
                                                    <p.icon size={16} className={`mr-3 ${isSelected ? 'text-[#10B981]' : 'text-white/20'}`} />
                                                    <span className={`text-[12px] font-bold ${isSelected ? 'text-[#10B981]' : 'text-white/60'}`}>{p.label}</span>
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
                                    <h2 className="font-sans text-2xl font-black text-white mb-2 tracking-tight">
                                        {topic ? "Confirm your Goal." : "Strategy & Topic."}
                                    </h2>
                                    <p className="text-[14px] text-white/40 font-medium">
                                        {topic ? `You're mastering ${topic}.` : "What are we mastering today?"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {COMMITMENT_LEVELS.map(c => (
                                        <button key={c.id} onClick={() => setCommitment(c.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${commitment === c.id ? 'bg-[#F59E0B]/10 border-[#F59E0B]' : 'bg-white/5 border-white/5'}`}>
                                            <c.icon size={18} className={`mb-2 ${commitment === c.id ? 'text-[#F59E0B]' : 'text-white/20'}`} />
                                            <span className={`text-[10px] font-black uppercase ${commitment === c.id ? 'text-[#F59E0B]' : 'text-white/40'}`}>{c.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-white/20 pl-1">Initial Mastery Topic</p>
                                    <textarea 
                                        value={topic} 
                                        onChange={e => { setTopic(e.target.value); setTopicError(""); }}
                                        placeholder="e.g. Molecular Biology, Advanced Calculus..." 
                                        className="w-full px-5 py-6 font-bold text-white outline-none placeholder:text-white/10 text-center text-lg min-h-[120px] resize-none leading-relaxed" 
                                        style={clay.input} 
                                    />
                                    {topicError && <p className="text-[11px] text-red-500 font-bold text-center">{topicError}</p>}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: ARCHITECTING */}
                        {step === 4 && (
                            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col justify-center h-full">
                                {!curriculumReady ? (
                                    <div className="text-center py-12">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-10 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                                            <Cpu size={40} className="text-[#F59E0B]" />
                                        </motion.div>
                                        <h2 className="font-sans text-xl font-black text-white mb-6 animate-pulse">Architecting Strategy...</h2>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden max-w-[280px] mx-auto border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#10B981] transition-all duration-75" style={{ width: `${analyzingProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                        <div className="mb-8">
                                            <Sparkles size={48} className="mx-auto mb-5 text-[#10B981] drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                                            <h2 className="font-sans text-2xl font-black text-white mb-3 tracking-tight">Your Strategy is Ready.</h2>
                                            <p className="text-[12px] font-black uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 rounded-xl inline-block border border-[#F59E0B]/20">{topic}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {CURRICULUM_FEATURES.map((f, i) => (
                                                <div key={f.title} className="p-4 rounded-2xl flex items-center gap-4 bg-white/[0.03] border border-white/5 text-left">
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

                        {/* STEP 5: GIFT & FINISH */}
                        {step === 5 && (
                            <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto">
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                                    className="w-32 h-32 mx-auto mb-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.4)] border-4 border-white/10 relative"
                                >
                                    <Zap size={64} className="text-black" fill="currentColor" />
                                    <div className="absolute inset-0 rounded-full animate-pulse bg-amber-400/20 blur-2xl -z-10" />
                                </motion.div>
                                
                                <h2 className="font-sans text-3xl font-black text-white mb-4 tracking-tighter">Welcome, Scholar.</h2>
                                <p className="text-[16px] text-white/60 font-medium mb-12 px-4 italic leading-relaxed">
                                    To kickstart your journey, The Professor has assigned <span className="text-amber-500 font-black">100 Credits</span> to your archives.
                                </p>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Navigation Controls */}
                    <div className="mt-8 pt-4 flex items-center gap-4 relative z-20">
                        {step > 1 && step < 4 && (
                            <button onClick={() => setStep(step - 1)} className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:text-white/90 hover:bg-white/10 transition-all border border-white/10 active:scale-95 flex items-center justify-center shrink-0">
                                <ChevronLeft size={28} />
                            </button>
                        )}
                        {(step < 4 || (step === 4 && !curriculumReady)) && (
                            <button
                                onClick={handleNext}
                                disabled={isSaving || (step === 1 && (!firstName || !lastName || usernameStatus !== "available")) || (step === 2 && (!age || parseInt(age) < 10 || !eduLevel || selectedPainPoints.length === 0)) || (step === 3 && (!commitment || !topic.trim()))}
                                className="flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", boxShadow: "0 10px 30px rgba(245,158,11,0.25)" }}
                            >
                                {isSaving ? <RotateCw size={24} className="animate-spin" /> : step === 3 ? "Analyze" : "Continue"}
                                {!isSaving && step < 3 && <ChevronRight size={22} />}
                            </button>
                        )}
                        {curriculumReady && step === 4 && (
                            <button
                                onClick={() => setStep(5)}
                                className="flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", boxShadow: "0 10px 30px rgba(245,158,11,0.25)" }}
                            >
                                Review Strategy
                                <ChevronRight size={22} />
                            </button>
                        )}
                        {step === 5 && (
                            <button
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="flex-1 h-16 rounded-2xl font-black text-[15px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98] px-8"
                                style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "#000", boxShadow: "0 12px 40px rgba(16,185,129,0.3)" }}
                            >
                                {isSaving ? <RotateCw size={24} className="animate-spin" /> : "Claim Gift & Enter"}
                                {!isSaving && <LogIn size={22} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
