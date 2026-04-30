"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";
import { usePWA } from "@/context/PWAContext";
import { useUser } from "@/context/UserContext";
import { 
    Loader2, 
    ChevronRight, 
    ChevronLeft,
    CheckCircle2, 
    Bell, 
    Download,
    GraduationCap,
    BookOpen,
    Target,
    Brain,
    Clock,
    Zap,
    Trophy
} from "lucide-react";

// Types for onboarding data
type OnboardingData = {
    level: string;
    goal: string;
    style: string;
    subjects: string[];
    timeCommitment: string;
    challenge: string;
    aiPreference: string;
};

const STEPS = 12;

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<OnboardingData>({
        level: "",
        goal: "",
        style: "",
        subjects: [],
        timeCommitment: "",
        challenge: "",
        aiPreference: "",
    });
    const router = useRouter();
    const supabase = createClient();
    const { requestNotificationPermission, isInstallable, installApp } = usePWA();
    const { completeOnboarding, saveOnboardingStep } = useUser();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
            } else {
                setUser(user);
                setLoading(false);
            }
        };
        checkUser();
    }, [router, supabase]);

    // Auto-advance logic for processing step (moved to top level to fix hook error)
    useEffect(() => {
        if (step === 11) {
            const timer = setTimeout(() => handleNext(), 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleNext = () => {
        // Save current step progress before moving next
        saveOnboardingStep({
            education_level: data.level,
            study_goal: data.goal,
            study_style: data.style,
            preferred_subjects: data.subjects,
            time_commitment: data.timeCommitment,
            main_challenge: data.challenge,
            ai_persona: data.aiPreference,
        });

        if (step < STEPS) setStep(step + 1);
        else handleComplete();
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = async () => {
        setLoading(true);
        const success = await completeOnboarding({
            education_level: data.level,
            study_goal: data.goal,
            study_style: data.style,
            preferred_subjects: data.subjects,
            time_commitment: data.timeCommitment,
            main_challenge: data.challenge,
            ai_persona: data.aiPreference,
        });

        if (success) {
            router.push("/dashboard");
        } else {
            // Fallback if API fails
            router.push("/dashboard");
        }
    };

    const toggleSubject = (subject: string) => {
        setData(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subject)
                ? prev.subjects.filter(s => s !== subject)
                : [...prev.subjects, subject]
        }));
    };

    const isStepValid = () => {
        switch (step) {
            case 2: return data.level !== "";
            case 3: return data.goal !== "";
            case 4: return data.style !== "";
            case 5: return data.subjects.length > 0;
            case 6: return data.timeCommitment !== "";
            case 7: return data.challenge !== "";
            case 8: return data.aiPreference !== "";
            default: return true;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
            </div>
        );
    }

    // Animation Variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 } as any
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2 }
        })
    };

    // Option Button Component
    const OptionButton = ({ 
        selected, 
        onClick, 
        icon: Icon, 
        title, 
        description 
    }: { selected: boolean, onClick: () => void, icon: any, title: string, description?: string }) => (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${
                selected 
                ? "border-[#F59E0B] bg-[#F59E0B]/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                : "border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--foreground-muted)]"
            }`}
        >
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${selected ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[var(--foreground)]/5 text-[var(--foreground-secondary)]"}`}>
                <Icon size={20} />
            </div>
            <div>
                <h3 className={`font-bold text-[15px] ${selected ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)]"}`}>{title}</h3>
                {description && <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">{description}</p>}
            </div>
        </button>
    );

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] flex flex-col relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--border)] z-50">
                <motion.div 
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-amber-300"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(step / STEPS) * 100}%` }}
                    transition={{ ease: "easeInOut", duration: 0.5 }}
                />
            </div>

            {/* Top Nav */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-40">
                {step > 1 && step < 11 && (
                    <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="mx-auto">
                    <BrandLogo size="sm" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-6 mt-12">
                <div className="w-full max-w-lg relative">
                    <AnimatePresence mode="wait" custom={1}>
                        <motion.div
                            key={step}
                            custom={1}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full"
                        >
                            {/* STEP 1: Welcome */}
                            {step === 1 && (
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-[#F59E0B]/10 flex items-center justify-center mb-8">
                                        <BrandLogo size="lg" />
                                    </div>
                                    <h1 className="font-galaxie text-4xl font-bold text-[var(--foreground)] tracking-tight mb-4">
                                        Welcome, {user?.email?.split('@')[0]}
                                    </h1>
                                    <p className="text-[16px] text-[var(--foreground-secondary)] leading-relaxed mb-10">
                                        Your scholarly journey begins here. Let&apos;s take 60 seconds to tailor The Professor to your unique learning style.
                                    </p>
                                    <button onClick={handleNext} className="w-full py-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
                                        Begin Customization
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: Level */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">Where are you in your academic journey?</h2>
                                    <div className="space-y-3">
                                        {[
                                            { id: "highschool", title: "High School / Secondary", desc: "Preparing for exams or college" },
                                            { id: "undergrad", title: "Undergraduate Student", desc: "Pursuing a Bachelor's degree" },
                                            { id: "postgrad", title: "Postgraduate / PhD", desc: "Masters, Doctorate, or research" },
                                            { id: "lifelong", title: "Lifelong Learner", desc: "Learning for personal or professional growth" }
                                        ].map(opt => (
                                            <OptionButton key={opt.id} selected={data.level === opt.id} onClick={() => setData({...data, level: opt.id})} icon={BookOpen} title={opt.title} description={opt.desc} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Goal */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">What is your primary goal?</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: "exams", title: "Ace Exams", icon: Target },
                                            { id: "concepts", title: "Understand Concepts", icon: Brain },
                                            { id: "research", title: "Research & Writing", icon: BookOpen },
                                            { id: "skills", title: "Skill Building", icon: Zap }
                                        ].map(opt => (
                                            <OptionButton key={opt.id} selected={data.goal === opt.id} onClick={() => setData({...data, goal: opt.id})} icon={opt.icon} title={opt.title} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Style */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">How do you learn best?</h2>
                                    <div className="space-y-3">
                                        {[
                                            { id: "visual", title: "Visual Learner", desc: "Diagrams, flashcards, spatial understanding" },
                                            { id: "reading", title: "Reading / Writing", desc: "Detailed notes, essays, textbook summaries" },
                                            { id: "auditory", title: "Auditory Learner", desc: "Lectures, podcasts, discussion" },
                                            { id: "kinesthetic", title: "Kinesthetic / Practical", desc: "Practice tests, problem solving, active recall" }
                                        ].map(opt => (
                                            <OptionButton key={opt.id} selected={data.style === opt.id} onClick={() => setData({...data, style: opt.id})} icon={Brain} title={opt.title} description={opt.desc} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Subjects */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-2">What subjects interest you?</h2>
                                    <p className="text-center text-[var(--foreground-muted)] mb-6 text-sm">Select all that apply</p>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {["STEM", "Humanities", "Business", "Medicine", "Law", "Arts", "Languages", "Computer Science", "Social Sciences"].map(subject => (
                                            <button
                                                key={subject}
                                                onClick={() => toggleSubject(subject)}
                                                className={`px-5 py-3 rounded-full border-2 text-[14px] font-semibold transition-all ${
                                                    data.subjects.includes(subject)
                                                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                                                    : "border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:border-[var(--foreground-muted)]"
                                                }`}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 6: Time */}
                            {step === 6 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">How much time do you dedicate to studying weekly?</h2>
                                    <div className="space-y-3">
                                        {[
                                            { id: "light", title: "0 - 5 hours", desc: "Casual learning" },
                                            { id: "medium", title: "5 - 15 hours", desc: "Part-time study" },
                                            { id: "heavy", title: "15 - 30 hours", desc: "Full-time student" },
                                            { id: "intense", title: "30+ hours", desc: "Intensive academic rigor" }
                                        ].map(opt => (
                                            <OptionButton key={opt.id} selected={data.timeCommitment === opt.id} onClick={() => setData({...data, timeCommitment: opt.id})} icon={Clock} title={opt.title} description={opt.desc} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 7: Challenge */}
                            {step === 7 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">What is your biggest academic hurdle?</h2>
                                    <div className="space-y-3">
                                        {[
                                            { id: "procrastination", title: "Procrastination", icon: Clock },
                                            { id: "retention", title: "Memory & Retention", icon: Brain },
                                            { id: "comprehension", title: "Complex Comprehension", icon: Target },
                                            { id: "focus", title: "Maintaining Focus", icon: Zap }
                                        ].map(opt => (
                                            <OptionButton key={opt.id} selected={data.challenge === opt.id} onClick={() => setData({...data, challenge: opt.id})} icon={opt.icon} title={opt.title} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 8: AI Preference */}
                            {step === 8 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">How should The Professor interact with you?</h2>
                                    <div className="space-y-3">
                                        {[
                                            { id: "socratic", title: "The Socratic Guide", desc: "Asks leading questions to help me find the answer" },
                                            { id: "direct", title: "The Direct Tutor", desc: "Gives clear, concise answers immediately" },
                                            { id: "deep", title: "The Deep Thinker", desc: "Provides extensive, detailed breakdowns" }
                                        ].map(opt => (
                                            <OptionButton key={opt.id} selected={data.aiPreference === opt.id} onClick={() => setData({...data, aiPreference: opt.id})} icon={Brain} title={opt.title} description={opt.desc} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 9: Notifications */}
                            {step === 9 && (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                                        <Bell className="w-10 h-10 text-blue-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Stay on Track</h2>
                                    <p className="text-[15px] text-[var(--foreground-secondary)] leading-relaxed max-w-sm mx-auto">
                                        Enable notifications to get spaced repetition reminders and streak alerts. We promise not to spam.
                                    </p>
                                    <div className="pt-6 space-y-3">
                                        <button 
                                            onClick={async () => {
                                                await requestNotificationPermission();
                                                handleNext();
                                            }}
                                            className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                        >
                                            Enable Notifications
                                        </button>
                                        <button onClick={handleNext} className="w-full py-3 rounded-xl bg-transparent text-[var(--foreground-muted)] font-medium hover:text-[var(--foreground)] transition-colors">
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 10: Install App */}
                            {step === 10 && (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-[var(--foreground)]/5 flex items-center justify-center mb-4">
                                        <Download className="w-10 h-10 text-[var(--foreground)]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Install the App</h2>
                                    <p className="text-[15px] text-[var(--foreground-secondary)] leading-relaxed max-w-sm mx-auto">
                                        For the best experience, install The Professor on your device. It works offline and loads instantly.
                                    </p>
                                    <div className="pt-6 space-y-3">
                                        {isInstallable ? (
                                            <button 
                                                onClick={async () => {
                                                    await installApp();
                                                    handleNext();
                                                }}
                                                className="w-full py-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                            >
                                                Install App
                                            </button>
                                        ) : (
                                            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]">
                                                <p className="text-sm text-[var(--foreground-muted)]">App is already installed or your browser does not support automatic installation.</p>
                                            </div>
                                        )}
                                        <button onClick={handleNext} className="w-full py-3 rounded-xl bg-transparent text-[var(--foreground-muted)] font-medium hover:text-[var(--foreground)] transition-colors">
                                            Continue to App
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 11: Processing */}
                            {step === 11 && (
                                <div className="text-center py-12">
                                    <div className="relative w-24 h-24 mx-auto mb-8">
                                        <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]"></div>
                                        <motion.div 
                                            className="absolute inset-0 rounded-full border-4 border-t-[#F59E0B] border-r-[#F59E0B] border-b-transparent border-l-transparent"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Brain className="w-8 h-8 text-[#F59E0B]" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Building Your Curriculum</h2>
                                    <p className="text-[15px] text-[var(--foreground-muted)]">
                                        Analyzing your goals and adapting the AI engine...
                                    </p>
                                    {/* Auto-advance handled by top-level useEffect */}
                                </div>
                            )}

                            {/* STEP 12: Done */}
                            {step === 12 && (
                                <div className="text-center py-12">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-8"
                                    >
                                        <Trophy className="w-12 h-12 text-emerald-500" />
                                    </motion.div>
                                    <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4 tracking-tight">You&apos;re All Set!</h2>
                                    <p className="text-[16px] text-[var(--foreground-secondary)] leading-relaxed mb-10 max-w-sm mx-auto">
                                        Your scholarly workspace is ready. Let&apos;s achieve those academic goals together.
                                    </p>
                                    <button 
                                        onClick={handleComplete}
                                        className="w-full py-4 rounded-xl bg-[#F59E0B] text-black font-bold text-lg hover:bg-[#FCD34D] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                                    >
                                        Enter Dashboard
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Bottom Navigation / Next Button */}
                    {step > 1 && step < 9 && (
                        <div className="mt-10">
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="w-full py-4 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                    background: isStepValid() ? "var(--foreground)" : "var(--background-secondary)",
                                    color: isStepValid() ? "var(--background)" : "var(--foreground-muted)",
                                    border: isStepValid() ? "none" : "1px solid var(--border)"
                                }}
                            >
                                Continue
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
