"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
    Layers, 
    Trophy, 
    Sparkles, 
    HelpCircle, 
    Flame, 
    CheckCircle2, 
    Lightbulb,
    Trophy as TrophyIcon,
    Timer,
    Target,
    Share2,
    Check
} from "lucide-react";
import ShareCard from "@/components/ShareCard";
import { useUser } from "@/context/UserContext";

const ICON_MAP: Record<string, any> = {
  style: Layers,
  emoji_events: Trophy,
  auto_awesome: Sparkles,
  quiz: HelpCircle,
  local_fire_department: Flame,
  check_circle: CheckCircle2,
  tips_and_updates: Lightbulb,
  timer: Timer,
  target: Target,
};

/* ═══════════════════════════════════════════════════
   CONFETTI PARTICLE SYSTEM
   ═══════════════════════════════════════════════════ */
const CONFETTI_COLORS = ["#F59E0B", "#10B981", "#818CF8", "#F472B6", "#34D399", "#FBBF24", "#A78BFA"];

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    velocityX: number;
    velocityY: number;
    delay: number;
    shape: "square" | "circle" | "strip";
}

function generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 40 + Math.random() * 20, // Center cluster (40-60% of width)
        y: 30 + Math.random() * 10,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 60,
        velocityY: -(20 + Math.random() * 40),
        delay: Math.random() * 0.3,
        shape: (["square", "circle", "strip"] as const)[Math.floor(Math.random() * 3)],
    }));
}

function ConfettiParticle({ particle }: { particle: Particle }) {
    const shapeStyle =
        particle.shape === "circle"
            ? { borderRadius: "50%" }
            : particle.shape === "strip"
            ? { width: particle.size * 0.4, height: particle.size * 2 }
            : {};

    return (
        <motion.div
            className="absolute pointer-events-none"
            initial={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                rotate: 0,
                scale: 0,
                opacity: 1,
            }}
            animate={{
                left: `${particle.x + particle.velocityX}%`,
                top: `${particle.y + 80 + Math.random() * 30}%`,
                rotate: particle.rotation + 720 * (Math.random() > 0.5 ? 1 : -1),
                scale: [0, 1.2, 1, 0.8, 0],
                opacity: [0, 1, 1, 0.6, 0],
            }}
            transition={{
                duration: 2.5 + Math.random(),
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                ...shapeStyle,
            }}
        />
    );
}

/* ═══════════════════════════════════════════════════
   ANIMATED XP COUNTER
   ═══════════════════════════════════════════════════ */
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let start = 0;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * value);
            setDisplay(current);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{display}</span>;
}

/* ═══════════════════════════════════════════════════
   SESSION COMPLETE COMPONENT
   ═══════════════════════════════════════════════════ */
export interface SessionCompleteProps {
    isVisible: boolean;
    onDismiss: () => void;
    xpEarned: number;
    streak: number;
    streakIncremented: boolean;
    type: "flashcards" | "quiz" | "summary";
    title?: string;
    /** Optional extra stats (e.g., quiz score) */
    extraStat?: { label: string; value: string; icon: string };
    /** Where to go for "Continue studying" */
    continueHref?: string;
    /** The items studied (optional, for ShareCard) */
    items?: any[];
}

const typeConfig = {
    flashcards: {
        icon: "style",
        label: "Deck Complete",
        color: "#F59E0B",
        suggestion: "Try a quiz on this topic to reinforce your memory.",
        suggestIcon: "quiz",
        suggestHref: "/create",
        suggestLabel: "Create Quiz",
    },
    quiz: {
        icon: "emoji_events",
        label: "Quiz Complete",
        color: "#10B981",
        suggestion: "Review your flashcards to strengthen weak areas.",
        suggestIcon: "style",
        suggestHref: "/create",
        suggestLabel: "Study Flashcards",
    },
    summary: {
        icon: "auto_awesome",
        label: "Summary Ready",
        color: "#818CF8",
        suggestion: "Generate flashcards from this summary to test yourself.",
        suggestIcon: "style",
        suggestHref: "/create",
        suggestLabel: "Create Flashcards",
    },
};

const PROFESSOR_TIPS = [
    "Active recall is 2x more effective than passive reading. Keep testing yourself!",
    "Spaced repetition works best when you review *just* as you're about to forget.",
    "Try explaining this concept to someone else. Teaching is the best way to learn.",
    "Consistency beats intensity. 10 minutes every day > 5 hours once a week.",
    "The 'Feynman Technique' (simplifying) is your best friend for complex topics.",
    "Sleep is where memories are consolidated. Don't skip your rest!",
    "Take a 5-minute breather now. Your brain needs time to process new info."
];

export default function SessionComplete({
    isVisible,
    onDismiss,
    xpEarned,
    streak,
    streakIncremented,
    type,
    title,
    extraStat,
    continueHref = "/dashboard",
    items = [],
}: SessionCompleteProps) {
    const { user } = useUser();
    const [particles, setParticles] = useState<Particle[]>([]);
    const [tip, setTip] = useState("");
    const [isShareOpen, setIsShareOpen] = useState(false);
    
    const isSprint = typeof window !== "undefined" ? sessionStorage.getItem("isExamSprint") === "true" : false;
    const baseConfig = typeConfig[type];
    const config = isSprint && type === "flashcards" ? {
        ...baseConfig,
        label: "Memory Drill Complete",
        suggestion: "Memory Drill complete. Take the final Mock Exam to complete your Exam Sprint!",
        suggestLabel: "Start Final Mock Exam",
        suggestIcon: "quiz",
        suggestHref: "#",
    } : isSprint && type === "quiz" ? {
        ...baseConfig,
        label: "Exam Sprint Complete!",
        suggestion: "You have completed the Exam Sprint! The Professor is exceptionally proud of your smart work.",
        suggestLabel: "Return to Library",
        suggestIcon: "emoji_events",
        suggestHref: "/library",
    } : baseConfig;

    useEffect(() => {
        if (isVisible) {
            setParticles(generateParticles(60));
            setTip(PROFESSOR_TIPS[Math.floor(Math.random() * PROFESSOR_TIPS.length)]);
        }
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-[#06060B]/90 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onDismiss}
                    />

                    {/* Confetti Layer */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {particles.map((p) => (
                            <ConfettiParticle key={p.id} particle={p} />
                        ))}
                    </div>

                    {/* Central Card */}
                    <motion.div
                        className="relative z-10 w-[90%] max-w-md"
                        initial={{ scale: 0.8, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
                    >
                        <div className="rounded-[36px] overflow-hidden" style={{
                            background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: `0 0 80px ${config.color}15, 0 24px 48px rgba(0,0,0,0.5)`,
                        }}>
                            <div className="bg-[#0A0A10]/95 backdrop-blur-3xl p-8 md:p-10">
                                {/* Header */}
                                <motion.div
                                    className="flex flex-col items-center mb-8"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                        style={{
                                            background: `${config.color}15`,
                                            border: `1px solid ${config.color}25`,
                                            boxShadow: `0 0 30px ${config.color}20`,
                                        }}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", delay: 0.4, damping: 12 }}
                                    >
                                        {(() => {
                                            const IconComp = ICON_MAP[config.icon];
                                            return <IconComp size={30} strokeWidth={1.5} style={{ color: config.color }} />;
                                        })()}
                                    </motion.div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">{config.label}</h2>
                                    {title && (
                                        <p className="text-sm font-bold text-white/70 text-center mt-1 max-w-[280px] truncate">{title}</p>
                                    )}
                                </motion.div>

                                {/* XP Splash */}
                                <motion.div
                                    className="text-center mb-8"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", delay: 0.5, damping: 15 }}
                                >
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B]/60">+</span>
                                        <span className="text-6xl font-black tracking-tighter text-[#F59E0B]">
                                            <AnimatedCounter value={xpEarned} />
                                        </span>
                                        <span className="text-lg font-black text-[#F59E0B]/40 ml-1">XP</span>
                                    </div>
                                </motion.div>

                                {/* Stats Row */}
                                <motion.div
                                    className="grid grid-cols-2 gap-3 mb-8"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    {/* Streak */}
                                    <div className="rounded-2xl p-4 text-center" style={{
                                        background: streakIncremented ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${streakIncremented ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)"}`,
                                    }}>
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Flame size={14} strokeWidth={1.5} style={{
                                                color: streakIncremented ? "#F59E0B" : "rgba(255,255,255,0.3)"
                                            }} />
                                            <span className="text-2xl font-black" style={{
                                                color: streakIncremented ? "#F59E0B" : "rgba(255,255,255,0.5)"
                                            }}>{streak}</span>
                                        </div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                                            {streakIncremented ? "Streak Extended!" : "Day Streak"}
                                        </p>
                                    </div>

                                    {/* Extra stat or generic */}
                                    {extraStat ? (
                                        <div className="rounded-2xl p-4 text-center" style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                        }}>
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                {(() => {
                                                    const IconComp = ICON_MAP[extraStat.icon] || HelpCircle;
                                                    return <IconComp size={14} strokeWidth={1.5} className="text-white/30" />;
                                                })()}
                                                <span className="text-2xl font-black text-white/60">{extraStat.value}</span>
                                            </div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">{extraStat.label}</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl p-4 text-center" style={{
                                            background: "rgba(16,185,129,0.05)",
                                            border: "1px solid rgba(16,185,129,0.1)",
                                        }}>
                                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                                <CheckCircle2 size={14} strokeWidth={1.5} className="text-[#10B981]/50" />
                                                <span className="text-2xl font-black text-[#10B981]/70">Done</span>
                                            </div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">Session Status</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Suggestion */}
                                <motion.div
                                    className="rounded-2xl p-4 mb-8 flex items-center gap-3"
                                    style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                    }}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: `${config.color}10` }}>
                                        {(() => {
                                            const IconComp = ICON_MAP[config.suggestIcon] || HelpCircle;
                                            return <IconComp size={14} strokeWidth={1.5} style={{ color: config.color }} />;
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-white/40 leading-relaxed">{config.suggestion}</p>
                                    </div>
                                </motion.div>

                                {/* Professor's Tip */}
                                <motion.div
                                    className="mb-8 p-4 rounded-2xl bg-[var(--accent)]/[0.03] border border-[var(--accent)]/10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]/60 mb-2 flex items-center gap-2">
                                        <Lightbulb size={14} strokeWidth={1.5} />
                                        Professor's Tip
                                    </p>
                                    <p className="text-[12px] italic text-white/60 leading-relaxed font-serif">
                                        "{tip}"
                                    </p>
                                </motion.div>

                                {/* Actions */}
                                <motion.div
                                    className="space-y-3"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    {isSprint && type === "flashcards" ? (
                                        <button
                                            onClick={() => {
                                                const sprintContent = sessionStorage.getItem("examSprintContent") || "";
                                                const params = JSON.parse(sessionStorage.getItem("generateParams") || "{}");
                                                sessionStorage.setItem("generateParams", JSON.stringify({
                                                    ...params,
                                                    content: sprintContent,
                                                    type: "quiz",
                                                    count: 10,
                                                    difficulty: "medium"
                                                }));
                                                onDismiss();
                                                window.location.href = "/quiz/generate";
                                            }}
                                            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                                            style={{
                                                background: `linear-gradient(135deg, ${config.color}, ${config.color}CC)`,
                                                color: "#06060B",
                                                boxShadow: `0 8px 24px ${config.color}30`,
                                            }}
                                        >
                                            {(() => {
                                                const IconComp = ICON_MAP[config.suggestIcon] || HelpCircle;
                                                return <IconComp size={18} strokeWidth={1.5} />;
                                            })()}
                                            {config.suggestLabel}
                                        </button>
                                    ) : (
                                        <Link
                                            href={config.suggestHref}
                                            onClick={() => {
                                                if (isSprint && type === "quiz") {
                                                    sessionStorage.removeItem("isExamSprint");
                                                    sessionStorage.removeItem("examSprintContent");
                                                }
                                                onDismiss();
                                            }}
                                            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                                            style={{
                                                background: `linear-gradient(135deg, ${config.color}, ${config.color}CC)`,
                                                color: "#06060B",
                                                boxShadow: `0 8px 24px ${config.color}30`,
                                            }}
                                        >
                                            {(() => {
                                                const IconComp = ICON_MAP[config.suggestIcon] || HelpCircle;
                                                return <IconComp size={18} strokeWidth={1.5} />;
                                            })()}
                                            {config.suggestLabel}
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => setIsShareOpen(true)}
                                        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/5"
                                    >
                                        <Share2 size={18} strokeWidth={1.5} />
                                        Share Performance
                                    </button>

                                    <Link
                                        href={continueHref}
                                        onClick={() => {
                                            if (isSprint && type === "quiz") {
                                                sessionStorage.removeItem("isExamSprint");
                                                sessionStorage.removeItem("examSprintContent");
                                            }
                                            onDismiss();
                                        }}
                                        className="w-full py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white/25 hover:text-white/40 transition-colors flex items-center justify-center"
                                    >
                                        Back to Dashboard
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <ShareCard 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                data={{ 
                    title: title || config.label, 
                    count: extraStat?.value || 0, 
                    type: type === 'flashcards' ? 'Flashcards' : type === 'quiz' ? 'Quiz' : 'Summary', 
                    user: user?.name || "Scholar",
                    items: items
                }}
            />
        </AnimatePresence>
    );
}
