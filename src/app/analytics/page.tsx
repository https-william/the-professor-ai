"use client";

import { motion } from "framer-motion";
import { 
    BarChart3, 
    TrendingUp, 
    Clock, 
    Zap, 
    Flame, 
    Target, 
    Award,
    ArrowLeft,
    Sparkles,
    Coffee,
    Layers,
    BrainCircuit,
    Download,
    X,
    Share2,
    Brain
} from "lucide-react";
import Link from "next/link";
import StandardContainer from "@/components/ui/StandardContainer";
import PlatformShell from "@/components/platforms/PlatformShell";
import { useUser } from "@/context/UserContext";
import { useQuery } from "@tanstack/react-query";
import { calculateLevel, getLevelTitle } from "@/lib/profiles-client";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

const ACHIEVEMENTS = [
    { id: "first_quiz", icon: Brain, label: "First Steps", desc: "Complete your first quiz", color: "var(--emerald)" },
    { id: "flash_10", icon: Layers, label: "Card Collector", desc: "Generate 10 flashcard sets", color: "var(--blue)" },
    { id: "streak_3", icon: Flame, label: "On Fire", desc: "3-day study streak", color: "var(--amber)" },
    { id: "streak_7", icon: Zap, label: "Unstoppable", desc: "7-day study streak", color: "var(--amber)" },
    { id: "level_5", icon: Award, label: "Scholar", desc: "Reach Level 5", color: "var(--violet)" },
];

const stagger: any = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } }
};

const fadeUp: any = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AnalyticsPage() {
    const { user } = useUser();
    const userLoading = user.isLoading;
    const shareCardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareImage, setShareImage] = useState<string | null>(null);

    const handleShare = async () => {
        if (!user) {
            toast.error("User data not loaded yet.");
            return;
        }

        setIsSharing(true);
        setShowShareModal(true);
        setShareImage(null); // Reset previous image

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsSharing(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            if (isSharing) {
                setIsSharing(false);
                toast.error("Generation timed out. Using fallback...");
            }
        }, 10000);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/images/share-template.png";

        const finishDrawing = () => {
            try {
                const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.lineTo(x + w - r, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                    ctx.lineTo(x + w, y + h - r);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                    ctx.lineTo(x + r, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                    ctx.lineTo(x, y + r);
                    ctx.quadraticCurveTo(x, y, x + r, y);
                    ctx.closePath();
                    ctx.fill();
                };

                // Draw Actual BrandLogo
                const drawBrandLogo = (x: number, y: number, scale: number) => {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(scale, scale);
                    
                    ctx.fillStyle = "#07092b";
                    const p1 = new Path2D("M201 0h417q21 0 41 4l2 1a178 178 0 0 1 53 21l2 1 2 1v2l3 1 12 7 4 3v2l2 1 8 5 3 3 4 6 4 2q13 13 24 29l1 1c3 5 3 5 3 8h2q16 28 24 59v2a168 168 0 0 1 4 47v412q0 18-3 34l-1 3-1 8-1 2a232 232 0 0 1-22 53h-2l-1 3-7 12-3 4h-2l-1 2c-7 13-21 26-33 34h-2v2l-8 6-2 1-2 2-2 1-5 1v2l-46 20-11 2-1 2c-20 7-45 5-66 4H198q-21 0-41-4l-3-1-7-2-4-1q-19-6-39-17l-6-3v-2h-2q-6-2-10-6l-2-1-5-4v-2l-2-1q-9-6-17-14v-2h-2v-2l-2-1q-4-2-6-6l-2-1-5-7v-2h-2l-5-7-1-2-5-10h-2q-16-28-24-59v-2a168 168 0 0 1-4-47V198q0-20 4-41l1-2a190 190 0 0 1 23-57h2v-2q2-6 6-10l1-2 4-5h2l1-2 5-8 3-3 6-4 2-4h2l1-2 7-8 2-1 7-4v-2l7-5 2-1 10-5v-2l15-8q21-10 44-16h3q20-5 41-4");
                    ctx.fill(p1);

                    ctx.fillStyle = "#eeeeee";
                    const p2 = new Path2D("m444 214 39 25 5 2v2l3 1q6 2 11 6l4 3 3 2 10 6 2 1 47 29 2 2 80 50c24 14 24 14 28 25q4 13-3 24l-5 6h-2v2l-4 1v2l-5 3-15 9-2 1-19 13-2 1-2 1q-6 3-12 2-5-3-8-8-2-7 0-12 8-9 20-15l12-8 3-1 3-2 2-1 4-6v-9l-3-1v-2l-2-1q-6-1-10-6l-3-1-25-16-29-18-52-32-45-29-4-2-15-9-17-11-3-1-2-2-4-2-2-2-2-1q-9-4-20-1l-15 8-11 7-2 1-24 15-5 2v2l-3 1-14 9-7 3v2l-2 1-16 10-5 1v2l-40 25-3 2-26 16-11 6-10 7-4 1v2l-2 1-11 7-5 3-5 4v7l1 5 25 16 42 26 2 1 10 7 2 1 11 6v2l2 1 8 5 5 2 13 9 39 23v2l3 1 8 5 5 3 8 5 2 1 13 8 3 2 4 3q13 11 29 9 10-3 17-9l5-3 3-2 7-4 2-2 82-51c11-6 11-6 18-4l7 6q2 7 0 13-9 10-22 16h-2v2l-2 1-30 18-2 1-2 2-2 1-38 23-6 3v2l-2 1-12 7q-17 10-35 8-9-1-16-6v-2h-2q-8-4-17-10l-9-6-4-2-45-29-7-4-13-8-18-11c-8-6-8-6-16-9v97c0 14 0 14 6 26l8 5 9 4a115 115 0 0 0 34 10l19 4h2q38 5 75 5h3q40 1 81-6l4-1 43-11c9-3 21-7 25-16l1-8v-10l1-103 3 3 2 1 5 6 2 3 1 2 2 2q6 9 5 20v63c0 25 0 25-6 34l-1 2q-7 10-18 13v2q-21 11-44 14l-4 2-23 4a386 386 0 0 1-228-20l-3-1q-11-5-18-15v-2h-2q-8-20-5-41v-94c0-6 0-6-3-11l-8-5-23-15-5-2-14-9-16-10q-14-6-20-20-2-13 3-24 9-9 20-16l62-39 21-13 77-47 47-30c23-15 42-19 66-3");
                    ctx.fill(p2);

                    ctx.fillStyle = "#2464a2";
                    const p3 = new Path2D("m450 320 11 8c22 16 22 16 26 29q1 12-2 23h3q12 2 23 6l9 4 14 5v2l3 1 10 5 2 1 12 8 6 4 8 7 2 2 2 1v2h2v2l2 1 5 5 2 2 2 2 3 4 2 1 2 3 4 5 2 2 1 2 1 2c14 21 14 21 14 25h2l17 42 1 2 2 7v2l3 12h5v2h4q7 2 12 8 8 10 6 22l-2 7-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19l2-1q1-7-2-12l-6-19c-5-11-5-11-5-16h-2l-1-2q-1-7-6-14l-1-3-6-9-3-6-9-12-4-5q-24-31-61-48l-3-1-13-5v-2l-16-2-9-4h-3l-1 4-1 5-1 2-5 14-1 5h-2v2l-5 8h-2v2c-12 12-34 10-50 10-39-1-39-1-47-9l-3-4-3-2q-4-6-5-13l-5-14-6-18-1-4-2-9-1-2q-2-14 5-26 6-8 15-14l7-6 5-2 8-5 4-4 4-2v-2l6-2v-2l2-1 3-1 3-1 3-2c18-4 32 7 46 18");
                    ctx.fill(p3);

                    ctx.fillStyle = "#ddb238";
                    const p4 = new Path2D("M660 553q10 7 13 18 1 9-2 17l-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19 15-10 32-3");
                    ctx.fill(p4);

                    ctx.restore();
                };

                drawBrandLogo(80, 80, 160 / 816);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "900 52px sans-serif";
                ctx.fillText("THE PROFESSOR", 320, 130);
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.font = "700 24px monospace";
                ctx.fillText("YOUR SMART STUDY COMPANION", 320, 175);

                const currentLevel = calculateLevel(user.xp);
                ctx.fillStyle = "#2563EB";
                ctx.font = "900 36px sans-serif";
                ctx.fillText("CURRENT RANK", 80, 420);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "900 140px sans-serif";
                ctx.fillText(`Level ${currentLevel}`, 80, 560);
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.font = "900 72px sans-serif";
                ctx.fillText(getLevelTitle(currentLevel), 80, 650);

                const drawBento = (x: number, y: number, label: number | string, val: string, sub: string, accent: string) => {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
                    drawRoundedRect(x, y, 440, 280, 56);
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                    ctx.font = "900 28px sans-serif";
                    ctx.fillText(val, x + 50, y + 70);

                    ctx.fillStyle = accent;
                    ctx.font = "900 110px sans-serif";
                    const labelStr = label.toString();
                    ctx.fillText(labelStr, x + 50, y + 195);

                    const labelWidth = ctx.measureText(labelStr).width;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                    ctx.font = "900 36px sans-serif";
                    ctx.fillText(sub, x + 50 + labelWidth + 20, y + 185);
                };

                drawBento(80, 780, user.streak || 0, "STUDY STREAK", "DAYS", "#FFFFFF");
                drawBento(560, 780, (user.xp || 0).toLocaleString(), "KNOWLEDGE GAINED", "XP", "#F59E0B");

                ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
                ctx.fillRect(80, 1140, 920, 1.5);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "900 56px sans-serif";
                ctx.fillText(user.name || "Scholar", 80, 1220);
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.font = "700 28px sans-serif";
                ctx.fillText("Acing this thing, the smart way. 🧪", 80, 1265);

                ctx.textAlign = "right";
                ctx.fillStyle = "#2563EB";
                ctx.font = "900 42px sans-serif";
                ctx.fillText("theprofessor.xyz", 1000, 1240);

                setShareImage(canvas.toDataURL("image/png"));
            } catch (err) {
                console.error("Draw error:", err);
                toast.error("Failed to render card details.");
            } finally {
                clearTimeout(timeoutId);
                setIsSharing(false);
            }
        };

        img.onload = () => {
            ctx.drawImage(img, 0, 0, 1080, 1350);
            finishDrawing();
        };

        img.onerror = () => {
            console.warn("Template missing, using solid background fallback.");
            ctx.fillStyle = "#040406";
            ctx.fillRect(0, 0, 1080, 1350);
            const grad = ctx.createRadialGradient(540, 675, 0, 540, 675, 800);
            grad.addColorStop(0, "rgba(37, 99, 235, 0.1)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1350);
            finishDrawing();
        };
    };

    const downloadShareImage = () => {
        if (!shareImage) return;
        const link = document.createElement("a");
        link.download = `professor-report-${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'scholar'}.png`;
        link.href = shareImage;
        link.click();
        toast.success("Downloaded! Your report is ready. 🚀");
    };

    const handleWebShare = async () => {
        if (!shareImage) return;

        const templates = [
            `Study less. Pass more. theprofessor.xyz 🧪`,
            `Your notes, but smarter. theprofessor.xyz 🧠`,
            `Stop the grind. Ace it. theprofessor.xyz`,
            `Actually understand your material. theprofessor.xyz 🧪`,
            `Get your time back. theprofessor.xyz 📚`,
            `Smart study. More free time. theprofessor.xyz 💤`,
            `Exam prep, without the stress. theprofessor.xyz`
        ];

        const randomText = templates[Math.floor(Math.random() * templates.length)];

        try {
            const res = await fetch(shareImage);
            const blob = await res.blob();
            const file = new File([blob], 'professor-report.png', { type: 'image/png' });
            if (navigator.share) {
                await navigator.share({
                    title: 'The Professor AI - My Report Card',
                    text: randomText,
                    files: [file]
                });
            } else {
                downloadShareImage();
            }
        } catch (err) {
            console.error("Share failed:", err);
            downloadShareImage();
        }
    };
    
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['activity-history', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const res = await fetch("/api/user/activity-history");
            return res.json();
        }
    });

    const { data: libraryData, isLoading: libraryLoading } = useQuery({
        queryKey: ['library-stats', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const res = await fetch("/api/library");
            const data = await res.json();
            if (data.success && Array.isArray(data.generations)) {
                const stats = { flashcards: 0, quiz: 0, summary: 0 };
                data.generations.forEach((g: any) => {
                    if (g.type === 'flashcards') stats.flashcards++;
                    if (g.type === 'quiz') stats.quiz++;
                    if (g.type === 'summary') stats.summary++;
                });
                return stats;
            }
            return { flashcards: 0, quiz: 0, summary: 0 };
        }
    });

    if (userLoading || activityLoading || libraryLoading || !user) {
        return (
            <PlatformShell>
                <div className="w-full min-h-screen flex items-center justify-center bg-[var(--bg)]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] animate-pulse">Calculating your genius...</p>
                    </div>
                </div>
            </PlatformShell>
        );
    }

    const level = calculateLevel(user.xp);
    
    const timeSavedMins = (libraryData?.summary || 0) * 30 + (libraryData?.flashcards || 0) * 2 + (libraryData?.quiz || 0) * 5;
    const timeSavedHours = (timeSavedMins / 60).toFixed(1);
    
    const deepWorkMins = (libraryData?.flashcards || 0) * 3 + (libraryData?.quiz || 0) * 10;
    const deepWorkHours = (deepWorkMins / 60).toFixed(1);

    const totalGenerations = (libraryData?.flashcards || 0) + (libraryData?.quiz || 0) + (libraryData?.summary || 0);

    const getProfessorTake = () => {
        if (user.streak > 14) return "Elite consistency. You're basically outperforming the algorithm at this point. Keep this energy.";
        if (user.xp > 5000) return "You've built quite the knowledge vault here. Don't worry, your progress speaks for itself.";
        if (totalGenerations > 50) return "The sheer volume of your notes is impressive. Let's make sure we're actually reviewing them.";
        return "Early days, but the foundations are looking solid. Consistency is the only habit that actually works.";
    };

    const getProfessorTip = () => {
        if ((libraryData?.quiz || 0) < (libraryData?.flashcards || 0) / 3) return "You've got a lot of flashcards, but not enough quizzes. Time to stress-test that brain.";
        if (parseFloat(timeSavedHours) > 20) return "You've saved over 20 hours! Go outside and touch some grass—or just take a long nap.";
        if (user.streak < 3) return "Let's build that momentum back up. One session today is all it takes.";
        return "Try the Feynman technique: if you can't explain your notes to a 5-year-old, you don't know it yet.";
    };

    return (
        <PlatformShell>
            <div className="w-full min-h-screen bg-[var(--bg)] selection:bg-[var(--blue-dim)] pt-20 pb-24 font-sans">
                <StandardContainer className="relative z-10">
                    {/* Header Section */}
                    <div className="mb-10">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--blue)] transition-all mb-6 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Command Center</span>
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)] mb-3">
                                    <BarChart3 size={14} className="text-[var(--blue)]" />
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--blue-text)] font-bold">Performance Report</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] tracking-tight">
                                    Your Progress. <br />
                                    <span className="text-[var(--blue)] font-black">Just the good parts.</span>
                                </h1>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                                <button 
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="py-3 px-6 rounded-xl bg-[var(--text)] text-[var(--bg)] font-bold text-xs uppercase tracking-wider hover:bg-[var(--text-2)] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={14} className={isSharing ? "animate-spin" : ""} />
                                    <span>{isSharing ? "Generating Card..." : "Share My Progress"}</span>
                                </button>
                                <div className="scholar-card p-4 border border-[var(--blue-border)] bg-[var(--blue-dim)]/20 backdrop-blur-md" style={{ borderRadius: "16px" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">Professor's Take</p>
                                    <p className="text-xs font-medium text-[var(--text-2)] italic max-w-[240px]">
                                        &ldquo;{getProfessorTake()}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Share Preview Modal */}
                    {showShareModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setShowShareModal(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                            />
                            
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="relative w-full max-w-md scholar-card overflow-hidden flex flex-col gap-5 p-6 bg-[var(--background-secondary)] border border-[var(--border)] shadow-2xl"
                                style={{ borderRadius: "24px" }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">Your Professor's Report</h3>
                                    <button 
                                        onClick={() => setShowShareModal(false)}
                                        className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-white/5 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Preview Area */}
                                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/40 border border-[var(--border)] shadow-inner flex items-center justify-center">
                                    {shareImage ? (
                                        <motion.img 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            src={shareImage} 
                                            alt="Share Preview" 
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-3 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
                                            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)] animate-pulse">Synthesizing Card...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={downloadShareImage}
                                            disabled={!shareImage}
                                            className="flex-1 py-3 rounded-xl bg-[var(--text)] text-[var(--bg)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                        >
                                            <Download size={16} />
                                            <span>Download</span>
                                        </button>
                                        <button 
                                            onClick={handleWebShare}
                                            disabled={!shareImage}
                                            className="flex-1 py-3 rounded-xl bg-[var(--blue-dim)] border border-[var(--blue-border)] text-[var(--blue)] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                        >
                                            <Share2 size={16} />
                                            <span>Share</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-[var(--text-3)] font-medium">
                                        Tip: Post this on X or IG and tag <span className="text-[var(--blue)]">@theprofessorai</span> to show off.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <motion.div 
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-12 gap-6"
                    >
                        {/* Level & XP */}
                        <motion.div variants={fadeUp} className="md:col-span-8 scholar-card p-8 relative overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]/50" style={{ borderRadius: "24px" }}>
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-[var(--blue)] pointer-events-none"><Award size={120} /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center text-2xl font-black text-[var(--blue)] shadow-sm shrink-0">
                                        {level}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">{getLevelTitle(level)}</h3>
                                        <p className="text-xs text-[var(--text-3)] uppercase tracking-wider font-bold mt-0.5">{user.xp?.toLocaleString()} Total XP Earned</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono font-bold text-[var(--text-3)] uppercase tracking-wider">
                                        <span>Momentum Level</span>
                                        <span>{Math.min(100, Math.round((user.xp % 1000) / 10))}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--text-4)] rounded-full overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (user.xp % 1000) / 10)}%` }}
                                            transition={{ duration: 1 }}
                                            className="h-full bg-[var(--blue)] shadow-[0_0_10px_var(--blue-glow)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Momentum (Streak) */}
                        <motion.div variants={fadeUp} className="md:col-span-4 scholar-card p-8 flex flex-col justify-between relative overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]/50" style={{ borderRadius: "24px" }}>
                            <div className="absolute -top-4 -right-4 w-28 h-28 bg-[var(--amber)]/5 blur-2xl rounded-full pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame size={16} className="text-[var(--amber)]" />
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">Momentum</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-[var(--text)] tracking-tight font-mono">{user.streak}</span>
                                    <span className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider font-mono">Days</span>
                                </div>
                                <p className="text-xs text-[var(--text-2)] mt-3 font-normal leading-relaxed">
                                    {user.streak > 7 ? "You're in the elite tier of consistency." : "Building the chain, one day at a time."}
                                </p>
                            </div>
                        </motion.div>

                        {/* Efficiency Stats */}
                        <motion.div variants={fadeUp} className="md:col-span-4 scholar-card p-6 flex flex-col gap-5 border border-[var(--border)] bg-[var(--background-secondary)]/50" style={{ borderRadius: "20px" }}>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[var(--blue)]" />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">Efficiency</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-2xl font-bold text-[var(--text)] tracking-tight font-mono">{timeSavedHours}h</p>
                                    <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-bold mt-0.5">Estimated Time Saved</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-[var(--text)] tracking-tight font-mono">{deepWorkHours}h</p>
                                    <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-bold mt-0.5">Deep Work Logged</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Learning Mix */}
                        <motion.div variants={fadeUp} className="md:col-span-8 scholar-card p-6 relative overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]/50" style={{ borderRadius: "20px" }}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-[var(--emerald)]" />
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">Knowledge Mix</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[var(--blue)]" />
                                        <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider font-mono">Cards</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[var(--cyan)]" />
                                        <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider font-mono">Quizzes</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                                <div className="sm:col-span-2 space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-3xl font-bold text-[var(--text)] font-mono">{totalGenerations > 0 ? "88%" : "0%"}</p>
                                        <p className="text-[10px] font-bold text-[var(--emerald)] uppercase tracking-wider font-mono">Retention Rate</p>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--text-4)] rounded-full flex overflow-hidden shadow-inner">
                                        <div className="h-full bg-[var(--blue)]" style={{ width: `${totalGenerations > 0 ? ((libraryData?.flashcards || 0) / totalGenerations) * 100 : 0}%` }} />
                                        <div className="h-full bg-[var(--cyan)]" style={{ width: `${totalGenerations > 0 ? ((libraryData?.quiz || 0) / totalGenerations) * 100 : 0}%` }} />
                                        <div className="h-full bg-[var(--text-3)]/20" style={{ width: `${totalGenerations > 0 ? ((libraryData?.summary || 0) / totalGenerations) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col justify-center gap-2 sm:border-l border-[var(--border)] sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0">
                                    <p className="text-xs text-[var(--text-2)] font-normal">
                                        <span className="text-[var(--text)] font-bold font-mono">{libraryData?.flashcards || 0}</span> Cards Completed
                                    </p>
                                    <p className="text-xs text-[var(--text-2)] font-normal">
                                        <span className="text-[var(--text)] font-bold font-mono">{libraryData?.quiz || 0}</span> Quizzes Aced
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Witty Bottom Cards */}
                        <motion.div variants={fadeUp} className="md:col-span-6 scholar-card p-6 border border-[var(--blue-border)] bg-[var(--blue-dim)]/10" style={{ borderRadius: "20px" }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Coffee size={16} className="text-[var(--blue)]" />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">Professor's Tip</span>
                            </div>
                            <p className="text-base font-bold text-[var(--text)] leading-snug mb-3">
                                {getProfessorTip()}
                            </p>
                            <p className="text-xs text-[var(--text-2)] leading-relaxed">
                                Your focus sessions are becoming elite. At this rate, you'll be able to ace your finals and still have plenty of free time to enjoy your evenings.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="md:col-span-6 scholar-card p-6 flex items-center justify-between group border border-[var(--border)] bg-[var(--background-secondary)]/50 cursor-pointer hover:border-[var(--blue-border)] transition-all" style={{ borderRadius: "20px" }}>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text)] tracking-tight mb-1 group-hover:text-[var(--blue)] transition-colors">Need a boost?</h3>
                                <p className="text-xs text-[var(--text-2)]">Your "Long-Term Memory" score could use a little love.</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--blue)] group-hover:border-[var(--blue)] group-hover:text-black transition-all shadow-sm">
                                <Zap size={18} className="group-hover:fill-current" />
                            </div>
                        </motion.div>

                        {/* Hall of Fame / Achievements Section */}
                        <motion.div variants={fadeUp} className="md:col-span-12 scholar-card p-8 relative overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]/50" style={{ borderRadius: "24px" }}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Award size={16} className="text-[var(--amber)]" />
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)] font-bold">Hall of Fame</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">Your Achievements</h2>
                                </div>
                                <Link href="/achievements" className="text-xs font-bold text-[var(--blue)] hover:underline flex items-center gap-1">
                                    <span>Go to Trophy Room</span>
                                    <ArrowLeft size={14} className="rotate-180" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                {ACHIEVEMENTS.map((achievement) => {
                                    let unlocked = false;
                                    if (achievement.id === "first_quiz" && (libraryData?.quiz || 0) > 0) unlocked = true;
                                    if (achievement.id === "flash_10" && (libraryData?.flashcards || 0) >= 10) unlocked = true;
                                    if (achievement.id === "streak_3" && user.streak >= 3) unlocked = true;
                                    if (achievement.id === "streak_7" && user.streak >= 7) unlocked = true;
                                    if (achievement.id === "level_5" && level >= 5) unlocked = true;

                                    const AchIcon = achievement.icon;

                                    return (
                                        <div 
                                            key={achievement.id}
                                            className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center gap-2.5 ${
                                                unlocked 
                                                ? "bg-[var(--blue-dim)] border-[var(--blue-border)] shadow-sm" 
                                                : "bg-[var(--bg)] border-[var(--border)] opacity-40 grayscale"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] shadow-inner shrink-0">
                                                <AchIcon size={18} className={unlocked ? "text-[var(--blue)]" : "text-[var(--text-3)]"} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold tracking-tight text-[var(--text)] leading-tight">{achievement.label}</p>
                                                <p className="text-[10px] text-[var(--text-3)] font-mono mt-0.5">{unlocked ? "Unlocked" : "Locked"}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                </StandardContainer>
            </div>
        </PlatformShell>
    );
}
