"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

/* ═══ Claymorphic Helpers ═══ */
const clay = {
    card: {
        background: "rgba(255,255,255,0.025)",
        borderRadius: "28px",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
    } as React.CSSProperties,
    input: {
        background: "rgba(255,255,255,0.015)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 1px rgba(255,255,255,0.03), 0 1px 2px rgba(255,255,255,0.02)",
    } as React.CSSProperties,
};

const EDU_LEVELS = [
    { id: "high_school", icon: "backpack", label: "High School" },
    { id: "undergrad", icon: "school", label: "Undergraduate" },
    { id: "postgrad", icon: "workspace_premium", label: "Postgraduate" },
    { id: "professional", icon: "work", label: "Professional" },
];

const GOALS = [
    { id: "exams", icon: "military_tech", label: "Ace Exams", desc: "Pass with flying colors" },
    { id: "skills", icon: "psychology", label: "Master Skills", desc: "Deep, long-term retention" },
    { id: "curious", icon: "explore", label: "Just Exploring", desc: "Learning for fun" },
];

export default function OnboardingModal() {
    const { user, completeOnboarding } = useUser();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // Form data
    const [name, setName] = useState("");
    const [eduLevel, setEduLevel] = useState("");
    const [goal, setGoal] = useState("");

    const isVisible = user.isAuthenticated && !user.isLoading && !user.hasOnboarded;

    useEffect(() => {
        if (user.name && user.name !== "Scholar") {
            setName(user.name);
        }
    }, [user.name]);

    if (!isVisible) return null;

    const handleNext = () => {
        if (step === 1 && name.trim()) setStep(2);
        else if (step === 2 && eduLevel) setStep(3);
        else if (step === 3 && goal) handleFinish();
    };

    const handleFinish = async () => {
        setIsSaving(true);
        const success = await completeOnboarding({
            alias: name.trim() || "Scholar",
            education_level: eduLevel,
            study_goal: goal,
        });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop blur & overlay */}
            <div className="absolute inset-0 bg-[#06060B]/80 backdrop-blur-md animate-in fade-in duration-500" />

            {/* Ambient orbs */}
            <div className="absolute w-[600px] h-[600px] rounded-full animate-pulse opacity-40"
                style={{ top: "-10%", right: "-10%", background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 60%)", filter: "blur(80px)", animationDuration: "8s" }} />

            {/* Modal Box */}
            <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-500 overflow-hidden" style={clay.card}>
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />

                {/* Progress bar */}
                <div className="h-1 w-full bg-white/5">
                    <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                </div>

                <div className="p-8">
                    {/* Welcome Step */}
                    {step === 1 && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* Professor Avatar */}
                            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 6px rgba(0,0,0,0.3), 0 8px 32px rgba(245,158,11,0.15)",
                                    border: "1px solid rgba(245,158,11,0.1)",
                                }}>
                                <span className="material-symbols-outlined text-[40px] text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">school</span>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="font-heading text-2xl font-bold text-white/95 mb-2">Welcome to your studio.</h1>
                                <p className="text-[14px] text-white/30">I am The Professor. It&apos;s an honor. How should I address you?</p>
                            </div>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your preferred name"
                                className="w-full px-5 py-4 text-center font-bold text-lg text-white/90 placeholder:text-white/15 outline-none mb-8 transition-all focus:shadow-[0_0_0_1px_rgba(245,158,11,0.3)]"
                                style={clay.input}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                            />
                        </div>
                    )}

                    {/* Step 2: Academic Level */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="text-center mb-8">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#818CF8] mb-1 inline-block">Step 2 of 3</span>
                                <h2 className="font-heading text-xl font-bold text-white/90">Where are you currently situated?</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {EDU_LEVELS.map(level => (
                                    <button
                                        key={level.id}
                                        onClick={() => { setEduLevel(level.id); setTimeout(handleNext, 150); }}
                                        className="p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-200"
                                        style={{
                                            ...clay.input,
                                            background: eduLevel === level.id ? "rgba(129,140,248,0.1)" : clay.input.background,
                                            border: eduLevel === level.id ? "1px solid rgba(129,140,248,0.2)" : clay.input.border,
                                            boxShadow: eduLevel === level.id ? "inset 0 1px 2px rgba(255,255,255,0.1), 0 4px 16px rgba(129,140,248,0.2)" : clay.input.boxShadow,
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-3xl" style={{ color: eduLevel === level.id ? "#818CF8" : "rgba(255,255,255,0.2)" }}>
                                            {level.icon}
                                        </span>
                                        <span className="text-[13px] font-bold" style={{ color: eduLevel === level.id ? "#818CF8" : "rgba(255,255,255,0.5)" }}>
                                            {level.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Primary Goal */}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="text-center mb-8">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#10B981] mb-1 inline-block">Final Step</span>
                                <h2 className="font-heading text-xl font-bold text-white/90">What brings you here?</h2>
                            </div>

                            <div className="space-y-3 mb-8">
                                {GOALS.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGoal(g.id)}
                                        className="w-full flex items-center p-4 rounded-xl transition-all duration-200 text-left group"
                                        style={{
                                            ...clay.input,
                                            background: goal === g.id ? "rgba(16,185,129,0.1)" : clay.input.background,
                                            border: goal === g.id ? "1px solid rgba(16,185,129,0.2)" : clay.input.border,
                                            boxShadow: goal === g.id ? "inset 0 1px 2px rgba(255,255,255,0.1), 0 4px 12px rgba(16,185,129,0.2)" : clay.input.boxShadow,
                                        }}
                                    >
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-4"
                                            style={{ background: goal === g.id ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)" }}>
                                            <span className="material-symbols-outlined text-xl" style={{ color: goal === g.id ? "#10B981" : "rgba(255,255,255,0.2)" }}>
                                                {g.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[13px] font-bold" style={{ color: goal === g.id ? "#10B981" : "rgba(255,255,255,0.7)" }}>{g.label}</div>
                                            <div className="text-[11px] text-white/20 mt-0.5">{g.desc}</div>
                                        </div>
                                        {goal === g.id && (
                                            <span className="material-symbols-outlined text-[#10B981] animate-in zoom-in shrink-0">check_circle</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button onClick={() => setStep(step - 1)} className="p-3.5 rounded-xl hover:bg-white/[0.03] text-white/30 hover:text-white/60 transition-all shrink-0">
                                <span className="material-symbols-outlined text-xl">arrow_back</span>
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={isSaving || (step === 1 && !name.trim()) || (step === 3 && !goal)}
                            className="flex-1 py-4 rounded-xl font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000",
                                boxShadow: "0 4px 16px rgba(245,158,11,0.3), inset 0 2px 3px rgba(255,255,255,0.2)",
                            }}
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                            ) : (
                                <>
                                    {step === 3 ? "Initialize Profile" : "Continue"}
                                    {step !== 3 && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
