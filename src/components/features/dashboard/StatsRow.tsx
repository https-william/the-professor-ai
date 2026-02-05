"use client";

import { motion } from "framer-motion";
import { Flame, Brain, Target, Zap } from "lucide-react";

export function StatsRow() {
    const stats = [
        { label: "Daily Streak", value: "3 Days", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Focus Time", value: "1.2 Hrs", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
        { label: "Topics Mastered", value: "12", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Accuracy", value: "94%", icon: Target, color: "text-green-500", bg: "bg-green-500/10" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors flex items-center gap-4"
                >
                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                        <p className="text-xl font-bold font-serif">{stat.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
