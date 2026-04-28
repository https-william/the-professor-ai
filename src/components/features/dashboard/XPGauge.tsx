"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { calculateLevel, getLevelProgress } from "@/lib/profiles-client";

interface XPGaugeProps {
    xp: number;
}

export default function XPGauge({ xp }: XPGaugeProps) {
    const level = calculateLevel(xp);
    const progress = getLevelProgress(xp);
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const levelTitles: Record<number, string> = {
        1: "Novice", 2: "Apprentice", 3: "Student", 4: "Scholar",
        5: "Adept", 6: "Expert", 7: "Master", 8: "Sage",
        9: "Professor", 10: "Luminary",
    };
    const levelTitle = levelTitles[Math.min(level, 10)] || "Legend";

    return (
        <div className="flex items-center gap-6 p-4 rounded-[32px] bg-[var(--foreground)]/[0.03] border border-[var(--border)] transition-all group hover:border-[var(--accent)]/30">
            <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-[var(--border)]" strokeWidth="4" fill="none" opacity="0.3" />
                    <motion.circle
                        cx="50" cy="50" r="40"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                        strokeDasharray={circumference}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                    <span className="text-xl font-black text-[var(--foreground)] leading-none">{level}</span>
                </div>
            </div>
            <div className="min-w-0 font-sans">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/10 mb-1.5">
                    <GraduationCap size={10} className="text-[var(--accent)]" />
                    <span className="text-[8px] font-black text-[var(--accent)] uppercase tracking-wider">{levelTitle}</span>
                </div>
                <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">{xp.toLocaleString()} XP</h3>
                <p className="text-[10px] text-[var(--foreground-muted)] font-medium opacity-60">
                    {Math.pow(level, 2) * 100 - xp > 0 ? `${(Math.pow(level, 2) * 100 - xp).toLocaleString()} XP to Next Level` : "Mastery Peak Reached"}
                </p>
            </div>
        </div>
    );
}
