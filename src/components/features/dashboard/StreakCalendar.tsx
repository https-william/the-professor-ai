"use client";

import { motion } from "framer-motion";
import { Flame, Check, Zap } from "lucide-react";

interface StreakCalendarProps {
    streak: number;
    activeDates: string[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StreakCalendar({ streak, activeDates }: StreakCalendarProps) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
 
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
 
    const today = now.toISOString().split('T')[0];
    const activeSet = new Set(activeDates);

    // Ensure momentum widget accurately reflects user.streak even if server activity logs are delayed
    if (streak > 0) {
        let todayIdx = weekDates.indexOf(today);
        if (todayIdx === -1) todayIdx = 6; // Fallback to end of week
        for (let i = todayIdx; i >= Math.max(0, todayIdx - streak + 1); i--) {
            activeSet.add(weekDates[i]);
        }
    }
 
    return (
        <div className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg-2)] to-[var(--blue-dim)]/20 backdrop-blur-2xl border border-[var(--border)] shadow-xl relative overflow-hidden group hover:border-[var(--blue)]/40 transition-all">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--blue)]/15 blur-[50px] rounded-full pointer-events-none group-hover:bg-[var(--blue)]/25 transition-colors" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--blue)]/20 border border-[var(--blue)]/30 flex items-center justify-center text-[var(--blue)] shadow-[0_0_20px_var(--blue-glow)]">
                        <Flame size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-3)] block leading-none mb-1">Momentum Tracker</span>
                        <h4 className="text-base font-black text-[var(--text)] leading-none tracking-tight">Neural Sync Rate</h4>
                    </div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[var(--blue)] text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_var(--blue-glow)] flex items-center gap-1.5">
                    <Zap size={14} className="fill-black" />
                    <span>{streak} Days Active</span>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full relative z-10">
                {WEEKDAYS.map((day, i) => {
                    const dateStr = weekDates[i];
                    const isActive = activeSet.has(dateStr);
                    const isToday = dateStr === today;
 
                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-full aspect-square rounded-2xl flex items-center justify-center relative transition-all group/day">
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute inset-0 bg-gradient-to-br from-[var(--blue)] to-[var(--blue-dim)] rounded-2xl shadow-[0_8px_24px_var(--blue-glow)] flex items-center justify-center"
                                    >
                                        <Check size={18} className="text-black stroke-[3]" />
                                    </motion.div>
                                )}
                                {isToday && !isActive && (
                                    <div className="absolute inset-0 border-2 border-dashed border-[var(--blue)] rounded-2xl animate-pulse bg-[var(--blue)]/5" />
                                )}
                                {!isActive && (
                                    <div className={`relative z-10 w-full h-full rounded-2xl border flex flex-col items-center justify-center transition-colors ${
                                        isToday ? 'border-transparent' : 'border-[var(--border)]/40 bg-[var(--bg)]/40'
                                    }`}>
                                        <span className={`text-xs font-black tracking-tighter ${
                                            isToday ? 'text-[var(--blue)]' : 'text-[var(--text-3)]/40'
                                        }`}>
                                            {day[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold font-mono uppercase tracking-tighter ${
                                isToday ? 'text-[var(--blue)] font-black' : isActive ? 'text-[var(--text)] font-bold' : 'text-[var(--text-3)]/60'
                            }`}>
                                {day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
