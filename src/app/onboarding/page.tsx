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

import { cn } from "@/lib/utils";

// Types for onboarding data
type OnboardingData = {
    university: string;
    year: string;
    examDate: string;
    subjects: string[];
};

const STEPS = 5;

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<OnboardingData>({
        university: "",
        year: "",
        examDate: "",
        subjects: [],
    });
    const router = useRouter();
    const supabase = createClient();
    const { requestNotificationPermission } = usePWA();
    const { completeOnboarding } = useUser();

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

    const handleNext = () => {
        if (step < STEPS) setStep(step + 1);
        else handleComplete();
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = async () => {
        setLoading(true);
        
        // Claim the pending upload if it exists
        const pendingMastery = localStorage.getItem("pending_mastery");
        const pendingUploadName = localStorage.getItem("pending_upload_name");

        const success = await completeOnboarding({
            education_level: data.year || "university",
            study_goal: data.examDate || "exams",
            preferred_subjects: data.subjects,
        } as any);

        if (success) {
            // Clear pending items
            localStorage.removeItem("pending_mastery");
            localStorage.removeItem("pending_upload_name");
            router.push("/dashboard");
        } else {
            router.push("/dashboard");
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 2: return data.university !== "";
            case 3: return data.year !== "";
            case 4: return data.examDate !== "";
            default: return true;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--foreground)]" />
            </div>
        );
    }

    const slideVariants = {
        enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
        center: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } as any },
        exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0, scale: 0.95, transition: { duration: 0.2 } })
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] flex flex-col relative overflow-hidden selection:bg-amber-500/30">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--border)] z-50">
                <motion.div 
                    className="h-full bg-[var(--foreground)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(step / STEPS) * 100}%` }}
                    transition={{ ease: "easeInOut", duration: 0.5 }}
                />
            </div>

            {/* Top Nav */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-40">
                {step > 1 && step < STEPS && (
                    <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="mx-auto">
                    <BrandLogo size="sm" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-6 pt-24">
                <div className="w-full max-w-lg relative">
                    <AnimatePresence mode="wait">
                        <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
                            
                            {/* STEP 1: Welcome & Context */}
                            {step === 1 && (
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-[2rem] bg-[var(--foreground)]/5 flex items-center justify-center mb-8 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[var(--foreground)] opacity-5 animate-pulse" />
                                        <GraduationCap size={40} className="text-[var(--foreground)]" />
                                    </div>
                                    <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tighter mb-4 leading-none">
                                        Account Verified.
                                    </h1>
                                    <p className="text-lg text-[var(--foreground-muted)] font-medium leading-relaxed mb-12">
                                        Your study pack for <span className="text-[var(--foreground)] font-bold italic">"{localStorage.getItem("pending_upload_name") || "your material"}"</span> is ready. Just 3 quick details to finish setting up your lab.
                                    </p>
                                    <button onClick={handleNext} className="w-full py-5 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl">
                                        Finish Setup
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: University */}
                            {step === 2 && (
                                <div className="space-y-8">
                                    <div className="text-center">
                                        <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Which University?</h2>
                                        <p className="text-[var(--foreground-muted)] font-medium mt-2">So the Professor can adapt to your school's style.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {["University of Lagos (UNILAG)", "Covenant University", "University of Ibadan (UI)", "Obafemi Awolowo University (OAU)", "Ahmadu Bello University (ABU)", "Other / International"].map(uni => (
                                            <button 
                                                key={uni}
                                                onClick={() => { setData({...data, university: uni}); handleNext(); }}
                                                className={cn(
                                                    "w-full text-left p-5 rounded-2xl border-2 font-bold transition-all flex items-center justify-between group",
                                                    data.university === uni ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] bg-[var(--card)]/50 hover:border-[var(--foreground)]/30"
                                                )}
                                            >
                                                <span>{uni}</span>
                                                <ChevronRight size={18} className={cn("transition-transform group-hover:translate-x-1", data.university === uni && "opacity-0")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Year */}
                            {step === 3 && (
                                <div className="space-y-8 text-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Current Level?</h2>
                                        <p className="text-[var(--foreground-muted)] font-medium mt-2">To tailor the complexity of your study materials.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {["100L", "200L", "300L", "400L", "500L", "Postgrad"].map(lvl => (
                                            <button 
                                                key={lvl}
                                                onClick={() => { setData({...data, year: lvl}); handleNext(); }}
                                                className={cn(
                                                    "p-8 rounded-3xl border-2 font-black text-2xl transition-all",
                                                    data.year === lvl ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] bg-[var(--card)]/50 hover:border-[var(--foreground)]/30"
                                                )}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Exam Date */}
                            {step === 4 && (
                                <div className="space-y-8 text-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Your Next Exam?</h2>
                                        <p className="text-[var(--foreground-muted)] font-medium mt-2">The Professor will build a countdown strategy for you.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Within 2 weeks", val: "2-weeks", icon: Zap },
                                            { label: "Next Month", val: "1-month", icon: Target },
                                            { label: "End of Semester", val: "end-semester", icon: Clock },
                                            { label: "Just Learning", val: "learning", icon: Brain }
                                        ].map(opt => (
                                            <button 
                                                key={opt.val}
                                                onClick={() => { setData({...data, examDate: opt.val}); handleNext(); }}
                                                className={cn(
                                                    "w-full text-left p-6 rounded-2xl border-2 font-bold transition-all flex items-center gap-4",
                                                    data.examDate === opt.val ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] bg-[var(--card)]/50 hover:border-[var(--foreground)]/30"
                                                )}
                                            >
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", data.examDate === opt.val ? "bg-[var(--background)]/20 text-[var(--background)]" : "bg-[var(--foreground)]/5 text-[var(--foreground-muted)]")}>
                                                    <opt.icon size={20} />
                                                </div>
                                                <span className="text-lg">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Viral Loop / Done */}
                            {step === 5 && (
                                <div className="text-center space-y-8">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                                        <Trophy className="text-emerald-500" size={40} />
                                    </div>
                                    <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tighter leading-none">
                                        You're Legend Status.
                                    </h2>
                                    <p className="text-[var(--foreground-muted)] font-medium text-lg leading-relaxed max-w-sm mx-auto">
                                        Your strategy lab is built. Don't let your coursemates struggle — share the Professor with them.
                                    </p>
                                    
                                    <div className="space-y-3 pt-4">
                                        <button 
                                            onClick={() => {
                                                const text = encodeURIComponent("I'm using The Professor to kill my exams this semester. It's an AI study strategist for Nigerian students. Try it: https://theprofessor.ai");
                                                window.open(`https://wa.me/?text=${text}`, "_blank");
                                            }}
                                            className="w-full py-5 rounded-2xl bg-[#25D366] text-white font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                            Invite my coursemates
                                        </button>
                                        <button onClick={handleComplete} className="w-full py-4 rounded-xl bg-transparent text-[var(--foreground-muted)] font-bold text-sm hover:text-[var(--foreground)] transition-colors">
                                            Go to my Dashboard
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                    {/* Bottom Navigation / Next Button */}
                    {step > 1 && step < 5 && (
                        <div className="mt-12">
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 group disabled:opacity-20 disabled:cursor-not-allowed"
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
