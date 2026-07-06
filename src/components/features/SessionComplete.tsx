"use client";

import { useState, useEffect, useRef } from "react";
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
    Timer,
    Target,
    Share2,
    Check,
    Compass,
    ArrowRight,
    Milestone,
    Eye,
    Shield,
    ChevronLeft,
    ChevronRight,
    BookOpen
} from "lucide-react";
import ShareCard from "@/components/ShareCard";
import { useUser } from "@/context/UserContext";
import OdometerCounter from "@/components/ui/OdometerCounter";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { useTelegram } from "@/hooks";

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

const CONFETTI_COLORS = ["#E5A93C", "#2BB288", "#9673F5", "#4A7CF5", "#E85D75"];

interface CanvasParticle {
    x: number;
    y: number;
    size: number;
    color: string;
    shape: 'square' | 'circle' | 'strip';
    velocityX: number;
    velocityY: number;
    rotation: number;
    rotationSpeed: number;
    gravity: number;
    wind: number;
    friction: number;
    opacity: number;
    fadeSpeed: number;
}

const createParticle = (x: number, y: number, angleRange: [number, number], speedRange: [number, number]): CanvasParticle => {
    const angle = angleRange[0] + Math.random() * (angleRange[1] - angleRange[0]);
    const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
    return {
        x,
        y,
        size: 5 + Math.random() * 7,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: (['square', 'circle', 'strip'] as const)[Math.floor(Math.random() * 3)],
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6,
        gravity: 0.12 + Math.random() * 0.12,
        wind: (Math.random() - 0.5) * 0.04,
        friction: 0.98,
        opacity: 1,
        fadeSpeed: 0.004 + Math.random() * 0.004
    };
};

export interface SessionCompleteProps {
    isVisible: boolean;
    onDismiss: () => void;
    xpEarned: number;
    streak: number;
    streakIncremented: boolean;
    type: "flashcards" | "quiz" | "summary";
    title?: string;
    extraStat?: { label: string; value: string; icon: string };
    continueHref?: string;
    items?: any[];
}

const typeConfig = {
    flashcards: {
        icon: "style",
        label: "Deck Complete",
        color: "#E5A93C", // Amber
        suggestion: "Try a quiz on this topic to reinforce your memory.",
        suggestIcon: "quiz",
        suggestHref: "/dashboard",
        suggestLabel: "Create Quiz",
    },
    quiz: {
        icon: "emoji_events",
        label: "Quiz Complete",
        color: "#2BB288", // Emerald
        suggestion: "Review your flashcards to strengthen weak areas.",
        suggestIcon: "style",
        suggestHref: "/dashboard",
        suggestLabel: "Study Flashcards",
    },
    summary: {
        icon: "auto_awesome",
        label: "Summary Ready",
        color: "#9673F5", // Violet
        suggestion: "Generate flashcards from this summary to test yourself.",
        suggestIcon: "style",
        suggestHref: "/dashboard",
        suggestLabel: "Create Flashcards",
    },
};

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
    const { triggerHaptic } = useTelegram();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    
    // Spotify-wrapped Story slides state
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slideProgress, setSlideProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    const SLIDE_DURATION = 5500; // 5.5 seconds per slide
    const totalSlides = 4;
    const progressIntervalRef = useRef<number | null>(null);

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

    // Auto-advance progress timer removed to minimize cognitive load and allow users to read at their own pace.
    useEffect(() => {
        if (!isVisible) return;
        setSlideProgress(100);
    }, [currentSlide, isVisible]);

    const handleNextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1);
            setSlideProgress(0);
        }
    };

    const handlePrevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
            setSlideProgress(0);
        }
    };

    // Tap navigator (left 30% = prev, right 70% = next)
    const handleCardTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        if (clickX < width * 0.3) {
            handlePrevSlide();
        } else {
            handleNextSlide();
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                handleNextSlide();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrevSlide();
            } else if (e.key === "Escape") {
                e.preventDefault();
                onDismiss();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSlide, isVisible]);

    // Setup celebration particles & audio on visible
    useEffect(() => {
        if (!isVisible) return;
        triggerHaptic('success');

        // Play arpeggio chord synthesis
        const playArpeggio = () => {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContextClass) return;
                const ctx = new AudioContextClass();
                const now = ctx.currentTime;
                
                const chord = [261.63, 329.63, 392.00, 523.25]; // C4 -> E4 -> G4 -> C5
                chord.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                    
                    gain.gain.setValueAtTime(0.06, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.6);
                });
            } catch (e) {
                console.warn("Arpeggio synthesis blocked or failed", e);
            }
        };

        playArpeggio();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particlesPool: CanvasParticle[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Sparks bursts
        for (let i = 0; i < 40; i++) {
            particlesPool.push(createParticle(canvas.width / 2, canvas.height * 0.35, [0, Math.PI * 2], [2, 7]));
        }
        for (let i = 0; i < 30; i++) {
            particlesPool.push(createParticle(0, canvas.height * 0.8, [-Math.PI / 3, 0], [8, 16]));
            particlesPool.push(createParticle(canvas.width, canvas.height * 0.8, [-Math.PI, -2 * Math.PI / 3], [8, 16]));
        }

        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesPool.forEach((p) => {
                p.velocityY += p.gravity;
                p.velocityX += p.wind;
                p.velocityX *= p.friction;
                p.velocityY *= p.friction;
                p.x += p.velocityX;
                p.y += p.velocityY;
                p.rotation += p.rotationSpeed;
                p.opacity -= p.fadeSpeed;

                if (p.opacity > 0) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = p.opacity;
                    ctx.fillStyle = p.color;

                    if (p.shape === "circle") {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (p.shape === "strip") {
                        ctx.fillRect(-p.size * 0.15, -p.size, p.size * 0.3, p.size * 2);
                    } else {
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    }

                    ctx.restore();
                }
            });

            particlesPool = particlesPool.filter(p => p.opacity > 0 && p.y < canvas.height + 40 && p.x > -40 && p.x < canvas.width + 40);

            if (particlesPool.length > 0) {
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        tick();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isVisible]);

    // Parse score percentage for verdict calculation
    let scorePercent = 100;
    if (extraStat && extraStat.value) {
        const match = extraStat.value.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
            const correct = parseInt(match[1]);
            const total = parseInt(match[2]);
            if (total > 0) scorePercent = (correct / total) * 100;
        } else {
            const val = parseFloat(extraStat.value);
            if (!isNaN(val) && val <= 1) scorePercent = val * 100;
            else if (!isNaN(val) && val <= 100) scorePercent = val;
        }
    }

    const studentName = user?.firstName || user?.name || "Scholar";

    const VERDICTS = {
        perfect: [
            `Perfect run, ${studentName}! Spot on. 🎯`,
            `${studentName}, you nailed it! Nothing missed. 🏆`,
            `Clean sweep, ${studentName}. Your bed misses you — go rest. 🛌`,
        ],
        great: [
            `Sharp work, ${studentName}! Almost flawless. 🔥`,
            `Solid, ${studentName}. Just a few gaps to patch. 📚`,
            `${studentName}, that was smooth. Quick review and you're golden. ⚡`,
        ],
        good: [
            `Not bad at all, ${studentName}. A couple of tricky spots. ☕`,
            `Good effort, ${studentName}! Let's revisit the rough edges. 🔍`,
            `${studentName}, you try sha. Let's tighten up the loose ends. 🛠️`,
        ],
        needsWork: [
            `Don't stress, ${studentName}. This one just needs more time. ⏳`,
            `${studentName}, let's break this down again. You'll get it. 💡`,
            `Rough patch, ${studentName}, but that's what reviews are for. 🛡️`,
        ]
    };

    const getBedtimeVerdict = () => {
        let cat: keyof typeof VERDICTS = "needsWork";
        if (scorePercent >= 95) cat = "perfect";
        else if (scorePercent >= 75) cat = "great";
        else if (scorePercent >= 50) cat = "good";
        
        const list = VERDICTS[cat];
        const index = (title ? title.length : 0) % list.length;
        return list[index];
    };

    // Calculate cognitive study archetype
    const getStudyArchetype = () => {
        if (type === 'quiz') {
            if (scorePercent >= 80) {
                return {
                    name: "Accuracy Champion 🎯",
                    description: "High-precision solver. Gaps are rare, conceptual mapping is solid.",
                    color: "var(--amber)"
                };
            }
            return {
                name: "Speed Demon ⚡",
                description: "Rapid conceptual navigator. Fast pacing, watch out for fine traps sha!",
                color: "var(--violet)"
            };
        }
        return {
            name: "Memory Maestro 🧠",
            description: "Strong active recall loops. Spaced retention curve is highly optimized.",
            color: "var(--emerald)"
        };
    };

    const archetype = getStudyArchetype();

    // 2.5D Holographic Tilt Card states
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        
        const calcY = (mouseX / (width / 2)) * 12;
        const calcX = -(mouseY / (height / 2)) * 12;

        setRotateX(calcX);
        setRotateY(calcY);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-[#06060B]/90 backdrop-blur-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onDismiss}
                    />

                    {/* Confetti canvas */}
                    <canvas 
                        ref={canvasRef} 
                        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                    />

                    {/* Central Story Layout */}
                    <motion.div
                        className="relative z-10 w-full max-w-sm aspect-[9/14] rounded-[32px] overflow-hidden border border-white/10 bg-zinc-950 flex flex-col justify-between p-6 shadow-2xl cursor-pointer"
                        initial={{ scale: 0.85, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 15, opacity: 0 }}
                        transition={{ type: "spring", damping: 26, stiffness: 280 }}
                        onClick={handleCardTap}
                        onMouseDown={() => setIsPaused(true)}
                        onMouseUp={() => setIsPaused(false)}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                    >
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-0" />

                        {/* Top Story indicators progress bars */}
                        <div className="w-full flex items-center gap-1.5 z-20 shrink-0 mb-4" onClick={e => e.stopPropagation()}>
                            {Array.from({ length: totalSlides }).map((_, idx) => {
                                const isPast = idx < currentSlide;
                                const isActive = idx === currentSlide;
                                return (
                                    <div key={idx} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white transition-all duration-300"
                                            style={{
                                                width: isPast || isActive ? "100%" : "0%"
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Slide Content rendering */}
                        <div className="flex-1 flex flex-col justify-center items-center z-10 w-full relative">
                            <AnimatePresence mode="wait">
                                
                                {/* Slide 1: XP and Streak Shield */}
                                {currentSlide === 0 && (
                                    <motion.div
                                        key="slide0"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="w-full flex flex-col items-center text-center gap-6 py-4"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C] shadow-lg animate-pulse mb-2">
                                            {(() => {
                                                const IconComp = ICON_MAP[config.icon] || Layers;
                                                return <IconComp size={28} strokeWidth={1.5} />;
                                            })()}
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                                Session Complete
                                            </p>
                                            <h3 className="text-sm font-bold text-white max-w-[240px] truncate mx-auto">{title || config.label}</h3>
                                        </div>

                                        <div className="flex items-baseline justify-center gap-1 my-3">
                                            <span className="text-6xl font-black tracking-tighter text-[#E5A93C]">
                                                <OdometerCounter value={xpEarned} />
                                            </span>
                                            <span className="text-xs font-black text-[#E5A93C]/50 ml-1">XP</span>
                                        </div>

                                        <div className="w-full max-w-[260px] p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                                <Flame size={18} strokeWidth={2} />
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-black text-white">{streak}</span>
                                                    <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider">Day Streak</span>
                                                </div>
                                                {streakIncremented ? (
                                                    <span className="text-[8px] font-bold uppercase text-[var(--emerald)] tracking-wider flex items-center gap-1 mt-0.5">
                                                        <Shield size={10} /> Streak Secured! 🛡️
                                                    </span>
                                                ) : (
                                                    <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider">Keep it burning!</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Slide 2: Study Archetype */}
                                {currentSlide === 1 && (
                                    <motion.div
                                        key="slide1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-full flex flex-col items-center text-center gap-6"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-[#9673F5]/10 border border-[#9673F5]/20 flex items-center justify-center text-[#9673F5] shadow-lg">
                                            <Trophy size={28} strokeWidth={1.5} />
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">
                                                Study Archetype
                                            </p>
                                            <h3 className="text-xl font-bold text-white tracking-tight">Your Session Persona</h3>
                                        </div>

                                        <GlassmorphicCard 
                                            intensity="medium"
                                            className="w-full max-w-[260px] p-5 border border-white/10 relative overflow-hidden shadow-inner text-center mt-2"
                                            style={{ boxShadow: `0 10px 30px rgba(0,0,0,0.5)` }}
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 via-transparent to-transparent rounded-full blur-xl pointer-events-none" />
                                            <span 
                                                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mb-3 inline-block"
                                                style={{ color: archetype.color, borderColor: `${archetype.color}30`, backgroundColor: `${archetype.color}10` }}
                                            >
                                                Unlocked Badge
                                            </span>
                                            <h4 className="text-base font-black tracking-tight text-white mb-2">{archetype.name}</h4>
                                            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed leading-relaxed font-sans px-2">
                                                {archetype.description}
                                            </p>
                                        </GlassmorphicCard>
                                    </motion.div>
                                )}

                                {/* Slide 3: Next Steps (Spaced repetition scheduler) */}
                                {currentSlide === 2 && (
                                    <motion.div
                                        key="slide2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-full flex flex-col items-center text-center gap-6"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-[#2BB288]/10 border border-[#2BB288]/20 flex items-center justify-center text-[#2BB288] shadow-lg">
                                            <Milestone size={28} strokeWidth={1.5} />
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">
                                                Next Steps
                                            </p>
                                            <h3 className="text-xl font-bold text-white tracking-tight">Active Spaced Schedule</h3>
                                        </div>

                                        <div className="w-full max-w-[260px] relative space-y-4 text-left pl-4 mt-2">
                                            {/* Line */}
                                            <div className="absolute left-[7px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#2BB288] to-white/10 rounded-full" />
                                            
                                            {/* Node 1 */}
                                            <div className="relative pl-6 flex items-start gap-2.5">
                                                <div className="absolute left-[-2px] top-1 w-3 h-3 rounded-full bg-[#2BB288] border-2 border-zinc-950 shadow" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-[#2BB288] tracking-wider">Tomorrow</span>
                                                    <span className="text-[10px] font-bold text-zinc-300">Active Recall check</span>
                                                </div>
                                            </div>

                                            {/* Node 2 */}
                                            <div className="relative pl-6 flex items-start gap-2.5">
                                                <div className="absolute left-[-2px] top-1 w-3 h-3 rounded-full bg-[#2BB288]/70 border-2 border-zinc-950" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-[#2BB288]/80 tracking-wider">In 3 Days</span>
                                                    <span className="text-[10px] font-bold text-zinc-400">Leitner check</span>
                                                </div>
                                            </div>

                                            {/* Node 3 */}
                                            <div className="relative pl-6 flex items-start gap-2.5">
                                                <div className="absolute left-[-2px] top-1 w-3 h-3 rounded-full bg-white/10 border-2 border-zinc-950" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">In 7 Days</span>
                                                    <span className="text-[10px] font-bold text-zinc-500">Graduation test</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Slide 4: 2.5D Holographic Bedtime Verdict */}
                                {currentSlide === 3 && (
                                    <motion.div
                                        key="slide3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="w-full flex flex-col items-center text-center gap-6"
                                        onClick={e => e.stopPropagation()} // Prevent advance tap triggers
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20 flex items-center justify-center text-[var(--amber)] shadow-lg shrink-0">
                                            <CheckCircle2 size={24} strokeWidth={1.5} />
                                        </div>

                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-0.5">
                                                The Professor's Verdict
                                            </p>
                                            <h4 className="text-xs font-bold text-zinc-300">Sprint Summary complete</h4>
                                        </div>

                                        {/* Holographic 3D Parallax Verdict card */}
                                        <div 
                                            className="w-full max-w-[280px] h-[140px] relative transition-transform duration-100 ease-out cursor-default z-20 shrink-0"
                                            style={{
                                                perspective: "800px"
                                            }}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <div 
                                                className="w-full h-full rounded-2xl border border-white/10 bg-zinc-950/80 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl"
                                                style={{
                                                    transformStyle: "preserve-3d",
                                                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                                                    boxShadow: `0 15px 40px -10px rgba(0,0,0,0.8)`
                                                }}
                                            >
                                                {/* Shimmer light sweep */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--amber)] mb-2.5">
                                                    Bedtime Verdict
                                                </span>
                                                <p className="text-[13px] font-bold italic text-zinc-100 leading-relaxed font-serif px-2">
                                                    "{getBedtimeVerdict()}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions footer */}
                                        <div className="w-full max-w-[280px] flex flex-col gap-2 z-30 shrink-0">
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
                                                    className="w-full py-3 rounded-xl bg-[var(--amber)] text-zinc-950 font-black text-xs uppercase tracking-wider hover:opacity-95 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow"
                                                >
                                                    <Compass size={14} />
                                                    <span>{config.suggestLabel}</span>
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
                                                    className="w-full py-3 rounded-xl bg-[var(--amber)] text-zinc-950 font-black text-xs uppercase tracking-wider hover:opacity-95 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow"
                                                >
                                                    {type === 'quiz' ? <Layers size={14} /> : type === 'flashcards' ? <Compass size={14} /> : <BookOpen size={14} />}
                                                    <span>{config.suggestLabel}</span>
                                                </Link>
                                            )}

                                            <div className="flex gap-2 w-full">
                                                <button 
                                                    onClick={() => setIsShareOpen(true)}
                                                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1 shadow"
                                                >
                                                    <Share2 size={13} />
                                                    <span>Share card</span>
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
                                                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all flex items-center justify-center shadow"
                                                >
                                                    <span>Dashboard</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* Floating Chevrons for visual navigation guidance */}
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
                            {currentSlide > 0 && (
                                <div className="p-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                                    <ChevronLeft size={16} />
                                </div>
                            )}
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
                            {currentSlide < totalSlides - 1 && (
                                <div className="p-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                                    <ChevronRight size={16} />
                                </div>
                            )}
                        </div>

                        {/* Slide footer instructions */}
                        <div className="w-full flex items-center justify-between text-[8px] text-[var(--foreground-muted)]/40 font-mono z-20 shrink-0 mt-4" onClick={e => e.stopPropagation()}>
                            <span>Tap sides or use arrows to navigate</span>
                            <span>{currentSlide + 1} / {totalSlides}</span>
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
