"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function DashboardHeader({ userName = "Scholar" }: { userName?: string }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
            <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                    {getGreeting()}, <span className="text-primary">{userName}</span>.
                </h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    Your mind is clear. Ready to focus?
                </p>
            </div>

            {/* AI Presence Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-white/5 backdrop-blur-md">
                <div className="relative flex items-center justify-center w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    The Professor is Active
                </span>
            </div>
        </motion.div>
    );
}
