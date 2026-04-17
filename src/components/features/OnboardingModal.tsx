"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
    LogIn 
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
    { id: "concepts", icon: Puzzle, label: "I need complex concepts explained simply." },
    { id: "recall", icon: Brain, label: "I want to test my knowledge (Active Recall)." },
    { id: "synthesis", icon: Layers, label: "I struggle to synthesize long lectures/papers." },
    { id: "procrastination", icon: Timer, label: "I procrastinate and need structured habits." },
];

const COMMITMENT_LEVELS = [
    { id: "15m", icon: Zap, label: "15 mins", desc: "Quick daily habit" },
    { id: "30m", icon: Footprints, label: "30 mins", desc: "Steady progress" },
    { id: "1hr", icon: Dumbbell, label: "1+ hour", desc: "Deep mastery" },
];

const TESTIMONIALS = [
    { quote: "The Professor didn't just help me pass; it fundamentally changed how I understand complex algorithms.", author: "Sarah J.", role: "CS Major" },
    { quote: "Finally, an AI that challenges me instead of just feeding me the answers. The active recall tools are game-changing.", author: "Michael T.", role: "Med Student" },
    { quote: "I used to procrastinate reading long PDFs. Now, I upload them to The Hub and battle through the material.", author: "Elena R.", role: "Ph.D Candidate" }
];

const CURRICULUM_FEATURES = [
    { title: "Dynamic Spaced Repetition", icon: Clock, color: "#F59E0B", desc: "Optimizes memory retention automatically." },
    { title: "Socratic Method Dialogue", icon: MessageSquare, color: "#10B981", desc: "Guides you to the answer instead of spoon-feeding." },
    { title: "Hyper-Personalized Quizzes", icon: HelpCircle, color: "#818CF8", desc: "Tests tailored to your exact weaknesses." },
];

export default function OnboardingModal() {
    const { user, completeOnboarding, saveOnboardingStep } = useUser();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

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

    const isVisible = user.isAuthenticated && !user.isLoading && !user.hasOnboarded;

    // Testimonial Carousel Effect
    useEffect(() => {
        if (step === 6) {
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

    // Step 7: Fake Analyzing Animation
    useEffect(() => {
        if (step === 7 && !curriculumReady) {
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

    if (!isVisible) return null;

    const [topic, setTopic] = useState("");
    const [topicError, setTopicError] = useState("");

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
                setStep(7); // Gather Topic
            } else if (step === 7) {
                if (!topic || topic.length < 3) {
                    setTopicError("Please enter a valid topic to master.");
                    return;
                }
                setStep(8); // Analyzing & Generating
                // START GENERATION HERE
                generateInitialRoadmap();
            }
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
                // Fallback if AI fails so onboarding doesn't get stuck
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
            initialTopic: topic
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            {/* Cinematic Ambient Blur Background */}
            <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-[100px]" />
            
            {/* Ambient Orbs */}
            <motion.div 
                className="absolute w-[800px] h-[800px] rounded-full mix-blend-screen opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)", filter: "blur(120px)" }}
                animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, -40, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute w-[600px] h-[600px] rounded-full mix-blend-screen opacity-10 pointer-events-none right-[-5%] top-[-5%]"
                style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)", filter: "blur(100px)" }}
                animate={{ scale: [1.1, 1, 1.1], x: [0, -20, 0], y: [0, 20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Modal Container */}
            <div className="relative z-10 w-full max-w-[480px] overflow-hidden bg-black/40" style={clay.card}>
                
                {/* Embedded Top Progress Bar */}
                {step > 1 && step < 7 && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                            style={{ width: `${((step - 1) / 5) * 100}%` }} 
                        />
                    </div>
                )}

                <div className="px-8 py-10 min-h-[460px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: THE HOOK */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center my-auto">
                                <motion.div 
                                    className="w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.05)" }}
                                >
                                    <Cpu size={48} strokeWidth={1.5} className="text-white/90" style={{ filter: "drop-shadow(0 0 15px rgba(255,255,255,0.4))" }} />
                                </motion.div>
                                <h1 className="font-heading text-[32px] font-bold text-white/95 mb-4 leading-tight tracking-tight">Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#D97706]">understand</span><br />any topic?</h1>
                                <p className="text-[15px] text-white/40 leading-relaxed max-w-[85%] mx-auto">Join a network of high-performers accelerating their cognitive potential.</p>
                            </motion.div>
                        )}

                        {/* STEP 2: IDENTITY */}
                        {step === 2 && (
                            <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-2 tracking-tight">Claim your Identity.</h2>
                                    <p className="text-[14px] text-[var(--foreground-muted)]">How should The Professor address you?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-1/2 px-5 py-4 font-bold text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)] transition-all focus:border-[var(--border-hover)]" style={clay.input} />
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="w-1/2 px-5 py-4 font-bold text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)] transition-all focus:border-[var(--border-hover)]" style={clay.input} />
                                    </div>
                                    <div className="relative">
                                        <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="Choose a Handle (@)" className="w-full px-5 py-4 font-bold text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)] transition-all focus:border-[var(--border-hover)] pr-12" style={clay.input} />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 transition-all">
                                            {usernameStatus === "checking" && <RotateCw size={20} strokeWidth={1.5} className="animate-spin text-[var(--foreground-muted)]" />}
                                            {usernameStatus === "available" && <CheckCircle2 size={20} strokeWidth={1.5} className="text-[var(--success)] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                            {(usernameStatus === "taken" || usernameStatus === "invalid") && <AlertCircle size={20} strokeWidth={1.5} className="text-[var(--error)]" />}
                                        </div>
                                    </div>
                                    <div className="h-6">
                                        {usernameStatus === "taken" && <p className="text-[12px] text-[var(--error)] text-center font-medium">Handle is already claimed.</p>}
                                        {usernameStatus === "invalid" && <p className="text-[12px] text-[var(--error)] text-center font-medium">Alphanumeric characters only.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: DEMOGRAPHICS */}
                        {step === 3 && (
                            <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-heading text-2xl font-bold text-white/95 mb-2 tracking-tight">Your Context.</h2>
                                    <p className="text-[14px] text-white/40">This helps align the difficulty of the curriculum.</p>
                                </div>
                                <div className="space-y-6">
                                    <input type="tel" value={age} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                        setAge(val);
                                    }} placeholder="Your Age" className="w-full px-5 py-4 font-bold text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)] text-center text-lg transition-all focus:border-[var(--border-hover)]" style={clay.input} />
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {EDU_LEVELS.map(l => (
                                            <button key={l.id} onClick={() => setEduLevel(l.id)} className="p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 relative overflow-hidden" style={{ ...clay.input, background: eduLevel === l.id ? "rgba(245,158,11,0.15)" : clay.input.background, border: eduLevel === l.id ? "1px solid rgba(245,158,11,0.3)" : clay.input.border }}>
                                                {eduLevel === l.id && <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F59E0B]/5" />}
                                                <l.icon size={28} strokeWidth={1.5} className="relative z-10" style={{ color: eduLevel === l.id ? "#F59E0B" : "rgba(255,255,255,0.15)" }} />
                                                <span className="text-[12px] font-bold tracking-wide relative z-10" style={{ color: eduLevel === l.id ? "#F59E0B" : "rgba(255,255,255,0.4)" }}>{l.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-6">
                                        {parseInt(age) < 10 && age !== "" && <p className="text-[12px] text-[#EF4444] text-center font-medium">You must be at least 10 years old.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: PAIN POINTS (THE WHY) */}
                        {step === 4 && (
                            <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-8">
                                    <h2 className="font-heading text-2xl font-bold text-white/95 mb-2 tracking-tight">The Mission.</h2>
                                    <p className="text-[14px] text-white/40">Select all that apply to you.</p>
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
                                                {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981]/5 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors relative z-10 ${isSelected ? 'bg-[#10B981]/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                                    <p.icon size={20} strokeWidth={1.5} className="relative z-10" style={{ color: isSelected ? "#10B981" : "rgba(255,255,255,0.3)" }} />
                                                </div>
                                                <span className="text-[13px] font-bold flex-1 relative z-10 leading-snug" style={{ color: isSelected ? "#10B981" : "rgba(255,255,255,0.7)" }}>{p.label}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors relative z-10 ${isSelected ? 'border-[#10B981] bg-[#10B981]' : 'border-white/10'}`}>
                                                    {isSelected && <Check size={14} strokeWidth={1.5} className="text-black font-bold" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: COMMITMENT */}
                        {step === 5 && (
                            <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-heading text-2xl font-bold text-white/95 mb-2 tracking-tight">Commitment.</h2>
                                    <p className="text-[14px] text-white/40">How much time can you dedicate daily?</p>
                                </div>
                                <div className="space-y-4">
                                    {COMMITMENT_LEVELS.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => setCommitment(c.id)} 
                                            className="w-full flex items-center p-5 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden" 
                                            style={{ ...clay.input, background: commitment === c.id ? "rgba(245,158,11,0.15)" : clay.input.background, border: commitment === c.id ? "1px solid rgba(245,158,11,0.4)" : clay.input.border }}
                                        >
                                            {commitment === c.id && <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F59E0B]/10 to-transparent" />}
                                            <c.icon size={28} strokeWidth={1.5} className="mr-5 transition-transform group-hover:scale-110 relative z-10" style={{ color: commitment === c.id ? "#F59E0B" : "rgba(255,255,255,0.15)" }} />
                                            <div className="relative z-10">
                                                <div className="text-[16px] font-bold" style={{ color: commitment === c.id ? "#F59E0B" : "rgba(255,255,255,0.8)" }}>{c.label}</div>
                                                <div className="text-[13px] font-medium mt-0.5" style={{ color: commitment === c.id ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.3)" }}>{c.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 6: SOCIAL PROOF */}
                        {step === 6 && (
                            <motion.div key="step6" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center flex flex-col justify-center h-full my-auto">
                                <motion.div 
                                    className="w-16 h-16 mx-auto mb-6 bg-[#F59E0B]/10 rounded-full flex items-center justify-center border border-[#F59E0B]/20"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Users size={28} strokeWidth={1.5} className="text-[#F59E0B]" />
                                </motion.div>
                                <h2 className="font-heading text-2xl font-bold text-white/95 mb-10 tracking-tight">You're in good company.</h2>
                                
                                <div className="relative w-full h-[160px] flex items-center">
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            key={testiIndex}
                                            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                                            transition={{ duration: 0.5, ease: "easeInOut" }}
                                            className="absolute inset-0 px-4"
                                        >
                                            <div className="flex justify-center mb-5 gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={18} strokeWidth={1.5} className="text-[#F59E0B]" />
                                                ))}
                                            </div>
                                            <p className="text-[16px] italic text-white/80 leading-relaxed mb-6 font-serif tracking-wide">"{TESTIMONIALS[testiIndex].quote}"</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#D97706] flex items-center justify-center text-black font-extrabold text-[13px] shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                                    {TESTIMONIALS[testiIndex].author[0]}
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[14px] font-bold text-white/90">{TESTIMONIALS[testiIndex].author}</div>
                                                    <div className="text-[11px] text-white/40 font-medium tracking-wider uppercase">{TESTIMONIALS[testiIndex].role}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 7: TOPIC SELECTION (NEW) */}
                        {step === 7 && (
                            <motion.div key="step7" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                                <div className="text-center mb-10">
                                    <h2 className="font-heading text-2xl font-bold text-white/95 mb-2 tracking-tight">The First Mastery.</h2>
                                    <p className="text-[14px] text-white/40">What academic subject or skill are we conquering first?</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="relative">
                                        <textarea 
                                            value={topic} 
                                            onChange={e => {
                                                setTopic(e.target.value);
                                                if (e.target.value.length >= 3) setTopicError("");
                                            }}
                                            placeholder="e.g. Molecular Biology basics, Advanced Calculus, Python for Data Science..." 
                                            className="w-full px-6 py-8 font-bold text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)] text-center text-lg min-h-[140px] resize-none leading-relaxed" 
                                            style={clay.input} 
                                        />
                                        <div className="absolute -bottom-10 left-0 right-0">
                                            {topicError && <p className="text-[12px] text-red-500 font-bold animate-pulse">{topicError}</p>}
                                        </div>
                                    </div>
                                    <div className="text-center opacity-30 mt-12">
                                        <Library size={40} strokeWidth={1.5} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 8: THE REVEAL (WAS 7) */}
                        {step === 8 && (
                            <motion.div key="step8" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col justify-center h-full">
                                {!curriculumReady ? (
                                    <div className="text-center py-12">
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="w-20 h-20 mx-auto mb-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                        >
                                            <Cpu size={36} strokeWidth={1.5} className="text-[#F59E0B]" />
                                        </motion.div>
                                        <h2 className="font-heading text-xl font-bold text-white/90 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 animate-[pulse_2s_infinite]">Architecting your Curriculum...</h2>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden max-w-[240px] mx-auto">
                                            <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-all duration-75 relative" style={{ width: `${analyzingProgress}%` }}>
                                                <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-sm animate-[shimmer_1s_infinite]" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-white/20 mt-4 font-mono uppercase tracking-[0.2em]">Consulting the OpenRouter Trinity...</p>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                                        <div className="text-center mb-8">
                                            <motion.div 
                                                initial={{ scale: 0, rotate: -45 }} 
                                                animate={{ scale: 1, rotate: 0 }} 
                                                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                                className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#10B981]/20 shadow-[0_0_30_rgba(16,185,129,0.2)]"
                                            >
                                                <Sparkles size={40} strokeWidth={1.5} className="text-[#10B981]" />
                                            </motion.div>
                                            <h2 className="font-heading text-2xl font-bold text-white/95 mb-2 tracking-tight">Your Strategy is Ready.</h2>
                                            <div className="inline-flex items-center gap-1.5 bg-[#F59E0B]/10 px-3 py-1.5 rounded-lg border border-[#F59E0B]/20">
                                                <GraduationCap size={14} strokeWidth={1.5} className="text-[#F59E0B]" />
                                                <p className="text-[12px] text-[#F59E0B] font-bold tracking-wide uppercase">{topic}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {CURRICULUM_FEATURES.map((f, i) => (
                                                <motion.div 
                                                    key={f.title}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.15 + 0.4, type: "spring" }}
                                                    className="p-4 rounded-xl flex flex-row items-center gap-4 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-colors"
                                                >
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/50 border border-white/10 shrink-0 shadow-inner">
                                                        <f.icon size={22} strokeWidth={1.5} style={{ color: f.color }} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="text-[13px] font-bold text-white/90 mb-0.5">{f.title}</div>
                                                        <div className="text-[11px] text-white/40 leading-snug">{f.desc}</div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Navigation Controls */}
                    <div className="mt-8 pt-4 flex items-center gap-3 relative z-20">
                        {step > 1 && step < 8 && (
                            <button onClick={() => setStep(step - 1)} className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 active:scale-95 flex items-center justify-center shrink-0">
                                <ChevronLeft size={24} strokeWidth={1.5} />
                            </button>
                        )}
                        {(!curriculumReady || step !== 8) && step !== 8 && (
                            <button
                                onClick={handleNext}
                                disabled={isSaving || (step === 2 && (!firstName || !lastName || usernameStatus !== "available")) || (step === 3 && (!age || parseInt(age) < 10 || parseInt(age) > 120 || !eduLevel)) || (step === 4 && selectedPainPoints.length === 0) || (step === 5 && !commitment)}
                                className="flex-1 h-14 rounded-2xl font-bold text-[14px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none disabled:grayscale"
                                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 8px 20px rgba(245,158,11,0.2)" }}
                            >
                                {isSaving ? <RotateCw size={20} strokeWidth={1.5} className="animate-spin" /> : step === 1 ? "Begin" : step === 6 ? "Analyze Profile" : "Continue"}
                                {!isSaving && step !== 6 && step !== 1 && <ChevronRight size={18} strokeWidth={1.5} />}
                            </button>
                        )}
                        {curriculumReady && step === 8 && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                onClick={handleFinish}
                                disabled={isSaving}
                                className="flex-1 h-14 rounded-2xl font-bold text-[14px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                                style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "#000", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 8px 20px rgba(16,185,129,0.3)" }}
                            >
                                {isSaving ? <RotateCw size={20} strokeWidth={1.5} className="animate-spin" /> : "Enter Dashboard"}
                                {!isSaving && <LogIn size={18} strokeWidth={1.5} />}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
