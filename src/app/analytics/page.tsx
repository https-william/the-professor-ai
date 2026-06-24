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
    Brain,
    CalendarDays,
} from "lucide-react";
import Link from "next/link";
import StandardContainer from "@/components/ui/StandardContainer";
import PlatformShell from "@/components/platforms/PlatformShell";
import { useUser } from "@/context/UserContext";
import { useQuery } from "@tanstack/react-query";
import { calculateLevel, getLevelTitle } from "@/lib/profiles-client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

// ─── Web Audio ────────────────────────────────────────────────────────────────

function useMountChime() {
    const played = useRef(false);
    useEffect(() => {
        if (played.current || typeof window === "undefined") return;
        played.current = true;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const freqs = [480, 600, 720];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.09;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.055, t + 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.42);
        });
    }, []);
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ activityData }: { activityData: any }) {
    const weeks = 12;
    const today = new Date();

    const activityMap = useMemo(() => {
        const map: Record<string, number> = {};
        if (!activityData?.activities) return map;
        for (const entry of activityData.activities) {
            const day = entry.date?.substring(0, 10);
            if (day) map[day] = (map[day] || 0) + 1;
        }
        return map;
    }, [activityData]);

    // Build a grid: 7 rows (days) × weeks cols
    const cells: { date: Date; count: number; key: string }[][] = [];
    // Start from the most-recent Sunday minus (weeks * 7) days
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

    for (let w = 0; w < weeks; w++) {
        const col: { date: Date; count: number; key: string }[] = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + w * 7 + d);
            const key = date.toISOString().substring(0, 10);
            col.push({ date, count: activityMap[key] || 0, key });
        }
        cells.push(col);
    }

    const getColor = (count: number) => {
        if (count === 0) return "rgba(255,255,255,0.04)";
        if (count === 1) return "rgba(229,169,60,0.2)";
        if (count === 2) return "rgba(229,169,60,0.4)";
        if (count === 3) return "rgba(229,169,60,0.65)";
        return "#E5A93C";
    };

    const getBorder = (count: number) => {
        if (count === 0) return "1px solid rgba(255,255,255,0.04)";
        return `1px solid rgba(229,169,60,${Math.min(0.4, count * 0.1)})`;
    };

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["S", "M", "T", "W", "T", "F", "S"];

    // Compute month labels (show label when week starts a new month)
    const monthLabels: (string | null)[] = cells.map((col, i) => {
        const firstDay = col[0].date;
        if (i === 0 || firstDay.getDate() <= 7) return months[firstDay.getMonth()];
        return null;
    });

    return (
        <div className="overflow-x-auto pb-2">
            {/* Month labels */}
            <div className="flex gap-[3px] mb-1 pl-6">
                {monthLabels.map((label, i) => (
                    <div
                        key={i}
                        className="flex-shrink-0 w-[14px] text-[8px] font-mono font-bold text-white/20 uppercase"
                    >
                        {label || ""}
                    </div>
                ))}
            </div>

            <div className="flex gap-[3px]">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] mr-1 shrink-0">
                    {days.map((d, i) => (
                        <div key={i} className="w-4 h-[14px] text-[8px] font-mono font-bold text-white/20 flex items-center">
                            {i % 2 === 1 ? d : ""}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                {cells.map((col, w) => (
                    <div key={w} className="flex flex-col gap-[3px]">
                        {col.map((cell) => (
                            <div
                                key={cell.key}
                                className="w-[14px] h-[14px] rounded-[3px] transition-all cursor-default group relative"
                                style={{
                                    background: getColor(cell.count),
                                    border: getBorder(cell.count),
                                    boxShadow: cell.count >= 3 ? "0 0 6px rgba(229,169,60,0.25)" : "none",
                                }}
                                title={`${cell.key}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 pl-6">
                <span className="text-[8px] font-mono font-bold text-white/20 uppercase">Less</span>
                {[0, 1, 2, 3, 4].map((n) => (
                    <div
                        key={n}
                        className="w-[12px] h-[12px] rounded-[2px]"
                        style={{ background: getColor(n), border: getBorder(n) }}
                    />
                ))}
                <span className="text-[8px] font-mono font-bold text-white/20 uppercase">More</span>
            </div>
        </div>
    );
}

// ─── Achievements Data ────────────────────────────────────────────────────────

const ACHIEVEMENTS = [
    { id: "first_quiz", icon: Brain, label: "First Steps", desc: "Complete your first quiz", color: "#2BB288", glow: "rgba(43,178,136,0.15)" },
    { id: "flash_10", icon: Layers, label: "Card Collector", desc: "Generate 10 flashcard sets", color: "#3B82F6", glow: "rgba(59,130,246,0.15)" },
    { id: "streak_3", icon: Flame, label: "On Fire", desc: "3-day study streak", color: "#E5A93C", glow: "rgba(229,169,60,0.15)" },
    { id: "streak_7", icon: Zap, label: "Unstoppable", desc: "7-day study streak", color: "#E5A93C", glow: "rgba(229,169,60,0.2)" },
    { id: "level_5", icon: Award, label: "Scholar", desc: "Reach Level 5", color: "#9673F5", glow: "rgba(150,115,245,0.15)" },
];

// ─── Animation Variants ────────────────────────────────────────────────────────

const stagger: any = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: any = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { user } = useUser();
    const userLoading = user.isLoading;
    useMountChime();

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
        setShareImage(null);

        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext("2d");
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
                ctx.fillStyle = "#E5A93C";
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
                drawBento(560, 780, (user.xp || 0).toLocaleString(), "KNOWLEDGE GAINED", "XP", "#E5A93C");

                ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
                ctx.fillRect(80, 1140, 920, 1.5);

                ctx.fillStyle = "#FFFFFF";
                ctx.font = "900 56px sans-serif";
                ctx.fillText(user.name || "Scholar", 80, 1220);

                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.font = "700 28px sans-serif";
                ctx.fillText("Acing this thing, the smart way. 🧪", 80, 1265);

                ctx.textAlign = "right";
                ctx.fillStyle = "#E5A93C";
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
            grad.addColorStop(0, "rgba(229,169,60,0.08)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1350);
            finishDrawing();
        };
    };

    const downloadShareImage = () => {
        if (!shareImage) return;
        const link = document.createElement("a");
        link.download = `professor-report-${user?.name?.toLowerCase().replace(/\s+/g, "-") || "scholar"}.png`;
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
            `Exam prep, without the stress. theprofessor.xyz`,
        ];

        const randomText = templates[Math.floor(Math.random() * templates.length)];

        try {
            const res = await fetch(shareImage);
            const blob = await res.blob();
            const file = new File([blob], "professor-report.png", { type: "image/png" });
            if (navigator.share) {
                await navigator.share({
                    title: "The Professor AI - My Report Card",
                    text: randomText,
                    files: [file],
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
        queryKey: ["activity-history", user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const res = await fetch("/api/user/activity-history");
            return res.json();
        },
    });

    const { data: libraryData, isLoading: libraryLoading } = useQuery({
        queryKey: ["library-stats", user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const res = await fetch("/api/library");
            const data = await res.json();
            if (data.success && Array.isArray(data.generations)) {
                const stats = { flashcards: 0, quiz: 0, summary: 0 };
                data.generations.forEach((g: any) => {
                    if (g.type === "flashcards") stats.flashcards++;
                    if (g.type === "quiz") stats.quiz++;
                    if (g.type === "summary") stats.summary++;
                });
                return stats;
            }
            return { flashcards: 0, quiz: 0, summary: 0 };
        },
    });

    if (userLoading || activityLoading || libraryLoading || !user) {
        return (
            <PlatformShell>
                <div className="w-full min-h-screen flex items-center justify-center bg-[var(--bg)]">
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-2xl animate-spin"
                            style={{
                                border: "2px solid transparent",
                                borderTopColor: "#E5A93C",
                                borderRightColor: "rgba(229,169,60,0.2)",
                            }}
                        />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 animate-pulse">
                            Calculating your genius...
                        </p>
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
        if (parseFloat(timeSavedHours) > 20) return "You've saved over 20 hours! Go outside and touch some grass — or just take a long nap.";
        if (user.streak < 3) return "Let's build that momentum back up. One session today is all it takes.";
        return "Try the Feynman technique: if you can't explain your notes to a 5-year-old, you don't know it yet.";
    };

    const xpProgressPercent = Math.min(100, (user.xp % 1000) / 10);
    const flashPercent = totalGenerations > 0 ? ((libraryData?.flashcards || 0) / totalGenerations) * 100 : 0;
    const quizPercent = totalGenerations > 0 ? ((libraryData?.quiz || 0) / totalGenerations) * 100 : 0;
    const summaryPercent = totalGenerations > 0 ? ((libraryData?.summary || 0) / totalGenerations) * 100 : 0;

    return (
        <PlatformShell>
            <div className="w-full min-h-screen bg-[var(--bg)] selection:bg-[rgba(229,169,60,0.15)] pt-20 pb-24 font-sans">
                <StandardContainer className="relative z-10">

                    {/* ── Header ──────────────────────────────────────────────── */}
                    <div className="mb-10">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-[#E5A93C] transition-all mb-6 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Command Center</span>
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                                    style={{
                                        background: "rgba(229,169,60,0.08)",
                                        border: "1px solid rgba(229,169,60,0.2)",
                                    }}
                                >
                                    <BarChart3 size={13} style={{ color: "#E5A93C" }} />
                                    <span
                                        className="font-mono text-[10px] uppercase tracking-wider font-bold"
                                        style={{ color: "#E5A93C" }}
                                    >
                                        Performance Report
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white/90 tracking-tight">
                                    Your Progress.{" "}
                                    <br />
                                    <span className="font-black" style={{ color: "#E5A93C" }}>
                                        Just the good parts.
                                    </span>
                                </h1>
                            </div>

                            <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                                <button
                                    onClick={handleShare}
                                    disabled={isSharing}
                                    className="py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                    style={{
                                        background: "linear-gradient(135deg, #E5A93C, #D97706)",
                                        color: "#06060B",
                                        boxShadow: "0 6px 20px rgba(229,169,60,0.25)",
                                    }}
                                >
                                    <Sparkles size={14} className={isSharing ? "animate-spin" : ""} />
                                    <span>{isSharing ? "Generating Card..." : "Share My Progress"}</span>
                                </button>
                                <div
                                    className="p-4"
                                    style={{
                                        borderRadius: "16px",
                                        background: "rgba(229,169,60,0.05)",
                                        border: "1px solid rgba(229,169,60,0.15)",
                                        backdropFilter: "blur(12px)",
                                    }}
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">
                                        Professor&apos;s Take
                                    </p>
                                    <p className="text-xs font-medium text-white/55 italic max-w-[240px] leading-relaxed">
                                        &ldquo;{getProfessorTake()}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Share Modal ─────────────────────────────────────────── */}
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
                                className="relative w-full max-w-md overflow-hidden flex flex-col gap-5 p-6"
                                style={{
                                    borderRadius: "24px",
                                    background: "rgba(12,12,18,0.95)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    backdropFilter: "blur(20px)",
                                    boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
                                }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg font-bold text-white/90 tracking-tight">
                                        Your Professor&apos;s Report
                                    </h3>
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-[rgba(229,169,60,0.1)]"
                                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                    >
                                        <X size={16} className="text-white/50" />
                                    </button>
                                </div>

                                <div
                                    className="relative aspect-square w-full rounded-2xl overflow-hidden flex items-center justify-center"
                                    style={{
                                        background: "rgba(0,0,0,0.4)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
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
                                            <div
                                                className="w-8 h-8 animate-spin rounded-full"
                                                style={{
                                                    border: "2px solid transparent",
                                                    borderTopColor: "#E5A93C",
                                                }}
                                            />
                                            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 animate-pulse">
                                                Synthesizing Card...
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={downloadShareImage}
                                            disabled={!shareImage}
                                            className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                                            style={{
                                                background: "linear-gradient(135deg, #E5A93C, #D97706)",
                                                color: "#06060B",
                                            }}
                                        >
                                            <Download size={16} />
                                            <span>Download</span>
                                        </button>
                                        <button
                                            onClick={handleWebShare}
                                            disabled={!shareImage}
                                            className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                                            style={{
                                                background: "rgba(150,115,245,0.1)",
                                                border: "1px solid rgba(150,115,245,0.25)",
                                                color: "#9673F5",
                                            }}
                                        >
                                            <Share2 size={16} />
                                            <span>Share</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-center text-white/25 font-medium">
                                        Post on X or IG and tag{" "}
                                        <span style={{ color: "#E5A93C" }}>@theprofessorai</span> to show off.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* ── Stats Grid ──────────────────────────────────────────── */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-12 gap-6"
                    >
                        {/* Level & XP — 8 col */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-8 relative overflow-hidden p-8"
                            style={{
                                borderRadius: "24px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04)",
                            }}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-[0.025] pointer-events-none" style={{ color: "#9673F5" }}>
                                <Award size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
                                        style={{
                                            background: "rgba(150,115,245,0.1)",
                                            border: "1px solid rgba(150,115,245,0.2)",
                                            color: "#9673F5",
                                            boxShadow: "0 0 20px rgba(150,115,245,0.1)",
                                        }}
                                    >
                                        {level}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white/90 tracking-tight">{getLevelTitle(level)}</h3>
                                        <p
                                            className="text-xs uppercase tracking-wider font-bold mt-0.5"
                                            style={{ color: "rgba(229,169,60,0.6)" }}
                                        >
                                            {user.xp?.toLocaleString()} Total XP Earned
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono font-bold text-white/25 uppercase tracking-wider">
                                        <span>Momentum Level</span>
                                        <span>{Math.round(xpProgressPercent)}%</span>
                                    </div>
                                    <div
                                        className="h-2 w-full rounded-full overflow-hidden"
                                        style={{ background: "rgba(255,255,255,0.05)" }}
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${xpProgressPercent}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: "linear-gradient(90deg, #E5A93C, #D97706)",
                                                boxShadow: "0 0 10px rgba(229,169,60,0.4)",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Momentum / Streak — 4 col */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-4 flex flex-col justify-between relative overflow-hidden p-8"
                            style={{
                                borderRadius: "24px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div
                                className="absolute -top-4 -right-4 w-28 h-28 rounded-full blur-2xl pointer-events-none"
                                style={{ background: "rgba(229,169,60,0.06)" }}
                            />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame size={16} style={{ color: "#E5A93C" }} />
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/30 font-bold">Momentum</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white/90 tracking-tight font-mono">{user.streak}</span>
                                    <span className="text-xs font-bold text-white/30 uppercase tracking-wider font-mono">Days</span>
                                </div>
                                <p className="text-xs text-white/40 mt-3 font-normal leading-relaxed">
                                    {user.streak > 7 ? "You're in the elite tier of consistency." : "Building the chain, one day at a time."}
                                </p>
                            </div>
                        </motion.div>

                        {/* Efficiency — 4 col */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-4 flex flex-col gap-5 p-6"
                            style={{
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Clock size={16} style={{ color: "#9673F5" }} />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-white/30 font-bold">Efficiency</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-2xl font-bold tracking-tight font-mono" style={{ color: "#E5A93C" }}>
                                        {timeSavedHours}h
                                    </p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mt-0.5">
                                        Estimated Time Saved
                                    </p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tracking-tight font-mono" style={{ color: "#E5A93C" }}>
                                        {deepWorkHours}h
                                    </p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mt-0.5">
                                        Deep Work Logged
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Knowledge Mix — 8 col */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-8 relative overflow-hidden p-6"
                            style={{
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Target size={16} style={{ color: "#2BB288" }} />
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/30 font-bold">Knowledge Mix</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: "#E5A93C" }} />
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider font-mono">Cards</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: "#9673F5" }} />
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider font-mono">Quizzes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                                <div className="sm:col-span-2 space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-3xl font-bold font-mono" style={{ color: "#2BB288" }}>
                                            {totalGenerations > 0 ? "88%" : "0%"}
                                        </p>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider font-mono"
                                            style={{ color: "rgba(43,178,136,0.7)" }}
                                        >
                                            Retention Rate
                                        </p>
                                    </div>
                                    <div
                                        className="h-2 w-full rounded-full flex overflow-hidden"
                                        style={{ background: "rgba(255,255,255,0.04)" }}
                                    >
                                        <div className="h-full" style={{ width: `${flashPercent}%`, background: "#E5A93C" }} />
                                        <div className="h-full" style={{ width: `${quizPercent}%`, background: "#9673F5" }} />
                                        <div className="h-full" style={{ width: `${summaryPercent}%`, background: "rgba(255,255,255,0.12)" }} />
                                    </div>
                                </div>

                                <div
                                    className="flex flex-col justify-center gap-2 sm:border-l sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0"
                                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                                >
                                    <p className="text-xs text-white/40 font-normal">
                                        <span className="text-white/80 font-bold font-mono">{libraryData?.flashcards || 0}</span> Cards Completed
                                    </p>
                                    <p className="text-xs text-white/40 font-normal">
                                        <span className="text-white/80 font-bold font-mono">{libraryData?.quiz || 0}</span> Quizzes Aced
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Activity Heatmap — full width */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-12 p-6 relative overflow-hidden"
                            style={{
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <CalendarDays size={16} style={{ color: "#E5A93C" }} />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-white/30 font-bold">
                                    12-Week Activity
                                </span>
                                <div className="flex-1" />
                                <span className="text-[10px] font-mono text-white/20">
                                    {Object.values(activityData?.activities?.reduce((acc: Record<string, number>, a: any) => {
                                        const d = a.date?.substring(0, 10);
                                        if (d) acc[d] = 1;
                                        return acc;
                                    }, {}) || {}).length || 0} active days
                                </span>
                            </div>
                            <ActivityHeatmap activityData={activityData} />
                        </motion.div>

                        {/* Professor's Tip — 6 col */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-6 p-6"
                            style={{
                                borderRadius: "20px",
                                background: "rgba(229,169,60,0.04)",
                                border: "1px solid rgba(229,169,60,0.15)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Coffee size={16} style={{ color: "#E5A93C" }} />
                                <span
                                    className="font-mono text-[10px] uppercase tracking-wider font-bold"
                                    style={{ color: "rgba(229,169,60,0.6)" }}
                                >
                                    Professor&apos;s Tip
                                </span>
                            </div>
                            <p className="text-base font-bold text-white/85 leading-snug mb-3">{getProfessorTip()}</p>
                            <p className="text-xs text-white/35 leading-relaxed">
                                Your focus sessions are becoming elite. At this rate, you&apos;ll be able to ace your finals and still have plenty of free time.
                            </p>
                        </motion.div>

                        {/* Need a boost? — 6 col */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-6 p-6 flex items-center justify-between group cursor-pointer transition-all"
                            style={{
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div>
                                <h3 className="text-lg font-bold text-white/85 tracking-tight mb-1 group-hover:text-[#9673F5] transition-colors">
                                    Need a boost?
                                </h3>
                                <p className="text-xs text-white/35">
                                    Your &ldquo;Long-Term Memory&rdquo; score could use a little love.
                                </p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-[0_0_20px_rgba(150,115,245,0.3)]"
                                style={{
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    background: "rgba(255,255,255,0.03)",
                                    color: "rgba(255,255,255,0.4)",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = "rgba(150,115,245,0.15)";
                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(150,115,245,0.3)";
                                    (e.currentTarget as HTMLElement).style.color = "#9673F5";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
                                }}
                            >
                                <Zap size={18} />
                            </div>
                        </motion.div>

                        {/* Hall of Fame / Achievements — full width */}
                        <motion.div
                            variants={fadeUp}
                            className="md:col-span-12 relative overflow-hidden p-8"
                            style={{
                                borderRadius: "24px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                backdropFilter: "blur(16px)",
                            }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Award size={16} style={{ color: "#E5A93C" }} />
                                        <span
                                            className="font-mono text-[10px] uppercase tracking-wider font-bold"
                                            style={{ color: "rgba(229,169,60,0.6)" }}
                                        >
                                            Hall of Fame
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white/90 tracking-tight">Your Achievements</h2>
                                </div>
                                <Link
                                    href="/achievements"
                                    className="text-xs font-bold hover:underline flex items-center gap-1 transition-colors"
                                    style={{ color: "#E5A93C" }}
                                >
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
                                            className="p-5 rounded-2xl flex flex-col items-center text-center gap-2.5 transition-all"
                                            style={{
                                                background: unlocked ? `${achievement.color}10` : "rgba(255,255,255,0.02)",
                                                border: unlocked
                                                    ? `1px solid ${achievement.color}30`
                                                    : "1px solid rgba(255,255,255,0.04)",
                                                boxShadow: unlocked ? `0 0 20px ${achievement.glow}` : "none",
                                                opacity: unlocked ? 1 : 0.3,
                                                filter: unlocked ? "none" : "grayscale(1)",
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                style={{
                                                    background: unlocked ? `${achievement.color}15` : "rgba(255,255,255,0.04)",
                                                    border: unlocked
                                                        ? `1px solid ${achievement.color}25`
                                                        : "1px solid rgba(255,255,255,0.06)",
                                                }}
                                            >
                                                <AchIcon
                                                    size={18}
                                                    style={{ color: unlocked ? achievement.color : "rgba(255,255,255,0.2)" }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold tracking-tight text-white/80 leading-tight">
                                                    {achievement.label}
                                                </p>
                                                <p
                                                    className="text-[10px] font-mono mt-0.5"
                                                    style={{ color: unlocked ? achievement.color : "rgba(255,255,255,0.2)" }}
                                                >
                                                    {unlocked ? "Unlocked" : "Locked"}
                                                </p>
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
