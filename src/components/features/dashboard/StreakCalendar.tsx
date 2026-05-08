"use client";

import { motion } from "framer-motion";
import { Flame, Check } from "lucide-react";

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
 
    return (
        <div className="p-4 rounded-2xl bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] transition-all group hover:border-[var(--blue)]/30">
            <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                    <Flame size={12} className="text-[var(--blue)]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[var(--text-3)]">Momentum</span>
                </div>
                <span className="font-mono text-[10px] font-black text-[var(--blue)] tabular-nums">{streak}d streak</span>
            </div>
            <div className="flex gap-1.5 w-full justify-between items-center">
                {WEEKDAYS.map((day, i) => {
                    const dateStr = weekDates[i];
                    const isActive = activeSet.has(dateStr);
                    const isToday = dateStr === today;
 
                    return (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
                            <div className="w-full aspect-square rounded-lg flex items-center justify-center relative transition-all">
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="absolute inset-0 bg-[var(--blue)] rounded-lg shadow-[0_4px_12px_var(--blue-glow)]"
                                    />
                                )}
                                {isToday && !isActive && (
                                    <div className="absolute inset-0 border border-dashed border-[var(--blue)]/40 rounded-lg animate-pulse" />
                                )}
                                <div className={`relative z-10 w-full h-full rounded-lg border flex items-center justify-center transition-colors ${
                                    isActive ? 'border-transparent' :
                                    isToday ? 'border-transparent' :
                                    'border-[var(--border)]/30'
                                }`}>
                                    <span className={`text-[9px] font-black tracking-tighter ${
                                        isActive ? 'text-black' : 
                                        isToday ? 'text-[var(--blue)]' : 
                                        'text-[var(--text-3)]/40'
                                    }`}>
                                        {day[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
