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
    { id: "1hr", icon: Dumbbell, label: "1+ hour", desc: "Deep mastery" },
];

const TESTIMONIALS = [
    { quote: "The Professor didn't just help me pass; it fundamentally changed how I understand complex algorithms.", author: "Sarah J.", role: "CS Major" },
    { quote: "Finally, an AI that challenges me instead of just feeding me the answers. The active recall tools are game-changing.", author: "Michael T.", role: "Med Student" },
    { quote: "I used to procrastinate reading long PDFs. Now, I upload them and battle through the material.", author: "Elena R.", role: "Ph.D Candidate" }
];

const CURRICULUM_FEATURES = [
    { title: "Dynamic Spaced Repetition", icon: Clock, color: "var(--blue)", desc: "Optimizes memory retention automatically." },
    { title: "Socratic Method Dialogue", icon: MessageSquare, color: "#10B981", desc: "Guides you to the answer instead of spoon-feeding." },
    { title: "Hyper-Personalized Quizzes", icon: HelpCircle, color: "#818CF8", desc: "Tests tailored to your exact weaknesses." },
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
                {step > 1 && step < 6 && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--bg-2)]">
                        <div 
                            className="h-full bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] transition-all duration-700 ease-out shadow-[0_0_15px_var(--blue-glow)]" 
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
                                        {topic ? "Confirm your Goal." : "Strategy & Topic."}
                                    </h2>
                                    <p className="text-[14px] text-[var(--text)]/40 font-medium">
                                        {topic ? `You're mastering ${topic}.` : "What are we mastering today?"}
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
                                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text)]/20 pl-1">Initial Mastery Topic</p>
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

                        {/* STEP 4: ARCHITECTING */}
                        {step === 4 && (
                            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col justify-center h-full">
                                {!curriculumReady ? (
                                    <div className="text-center py-12">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-20 h-20 mx-auto mb-10 rounded-3xl flex items-center justify-center bg-[var(--bg-2)] border border-[var(--border)] shadow-[0_0_40px_var(--blue-glow)]">
                                            <Cpu size={40} className="text-[var(--blue)]" />
                                        </motion.div>
                                        <h2 className="font-sans text-xl font-black text-[var(--text)] mb-6 animate-pulse">Architecting Strategy...</h2>
                                        <div className="h-2 w-full bg-[var(--bg-2)] rounded-full overflow-hidden max-w-[280px] mx-auto border border-[var(--border)]">
                                            <div className="h-full bg-gradient-to-r from-[var(--blue)] to-[var(--emerald)] transition-all duration-75" style={{ width: `${analyzingProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                        <div className="mb-8">
                                            <Sparkles size={48} className="mx-auto mb-5 text-[var(--emerald)] drop-shadow-[0_0_20px_var(--emerald-glow)]" />
                                            <h2 className="font-sans text-2xl font-black text-[var(--text)] mb-3 tracking-tight">Your Strategy is Ready.</h2>
                                            <p className="text-[12px] font-black uppercase tracking-widest text-[var(--blue-text)] bg-[var(--blue-dim)] px-4 py-2 rounded-xl inline-block border border-[var(--blue-border)]">{topic}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {CURRICULUM_FEATURES.map((f, i) => (
                                                <div key={f.title} className="p-4 rounded-2xl flex items-center gap-4 bg-[var(--bg-2)] border border-[var(--border)] text-left">
                                                    <f.icon size={24} style={{ color: f.color }} className="shrink-0" />
                                                    <div>
                                                        <div className="text-[13px] font-black text-[var(--text)]">{f.title}</div>
                                                        <div className="text-[11px] text-[var(--text)]/40 font-bold">{f.desc}</div>
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
                                    className="w-32 h-32 mx-auto mb-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.4)] border-4 border-[var(--border)] relative"
                                >
                                    <Zap size={64} className="text-black" fill="currentColor" />
                                    <div className="absolute inset-0 rounded-full animate-pulse bg-amber-400/20 blur-2xl -z-10" />
                                </motion.div>
                                
                                <h2 className="font-sans text-3xl font-black text-[var(--text)] mb-4 tracking-tighter">Welcome, Scholar.</h2>
                                <p className="text-[16px] text-[var(--text)]/60 font-medium mb-12 px-4 italic leading-relaxed">
                                    To kickstart your journey, The Professor has assigned <span className="text-amber-500 font-black">100 Credits</span> to your archives.
                                </p>
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
                        {(step < 4 || (step === 4 && !curriculumReady)) && (
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
                                ) : step === 3 ? "Analyze" : "Continue"}
                                {!isSaving && usernameStatus !== "checking" && step < 3 && <ChevronRight size={22} />}
                            </button>
                        )}
                        {curriculumReady && step === 4 && (
                            <button
                                onClick={() => setStep(5)}
                                className="flex-1 h-14 rounded-2xl font-black text-[14px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-dark))", color: "#fff", boxShadow: "0 10px 30px var(--blue-glow)" }}
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
                                style={{ background: "linear-gradient(135deg, var(--emerald), var(--emerald-border))", color: "#000", boxShadow: "0 12px 40px var(--emerald-glow)" }}
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

