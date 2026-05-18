"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToasts } from "@/components/ui/GlobalToasts";
import { 
    Coffee, 
    Headphones, 
    Swords, 
    Landmark, 
    GraduationCap, 
    Zap,
    Flame 
} from "lucide-react";

const MODERN_ICON_MAP: Record<string, any> = {
    coffee: Coffee,
    headphones: Headphones,
    swords: Swords,
    account_balance: Landmark,
    school: GraduationCap,
    flame: Flame,
};

interface StreakMilestoneProps {
    count: number;
    isVisible: boolean;
    onClose: () => void;
}

interface MilestoneConfig {
    name: string;
    description: string;
    icon: string;
    color: string;
    bonusXp: number;
}

const MILESTONE_CONFIGS: Record<number, MilestoneConfig> = {
    7: {
        name: "Unstoppable Momentum",
        description: "One week down. You've officially built an unbreakable study rhythm—pure focus, zero distractions, and unstoppable momentum.",
        icon: "flame",
        color: "#F59E0B",
        bonusXp: 25,
    },
    14: {
        name: "Hyperfocused",
        description: "Two weeks. The world is a distraction; the material is everything. You've reached a state of flow.",
        icon: "headphones",
        color: "#818CF8",
        bonusXp: 50,
    },
    30: {
        name: "Academic Weapon",
        description: "A month of consistency. You don't just study; you dismantle complexity. You are a lethal intellectual force.",
        icon: "swords",
        color: "#F59E0B",
        bonusXp: 100,
    },
    60: {
        name: "Tenured",
        description: "Sixty days. You're part of the furniture now. The archives recognize your stride. Excellence is becoming your default state.",
        icon: "account_balance",
        color: "#10B981",
        bonusXp: 200,
    },
    100: {
        name: "The Professor",
        description: "One hundred days. You've transcended the student role. You and I? We're colleagues now. Welcome to the upper echelon.",
        icon: "school",
        color: "#F472B6",
        bonusXp: 500,
    }
};

export default function StreakMilestone({ count, isVisible, onClose }: StreakMilestoneProps) {
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const { addToast } = useToasts();
    const config = MILESTONE_CONFIGS[count];

    useEffect(() => {
        if (isVisible && config && !rewardClaimed) {
            // In a real app, we'd hit the API here. 
            // The dashboard parent will handle the actual XP award via the activity API
            // to keep this component purely visual/interactive.
            setRewardClaimed(true);
        }
    }, [isVisible, count, config, rewardClaimed]);

    if (!config) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-[#06060B]/95 backdrop-blur-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onClose}
                    />

                    {/* Ambient Glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <motion.div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full opacity-20"
                            style={{ 
                                background: `radial-gradient(circle, ${config.color}, transparent 70%)`,
                                filter: 'blur(80px)'
                            }}
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                    </div>

                    {/* Content Card */}
                    <motion.div
                        className="relative z-10 w-full max-w-sm sm:max-w-md my-auto"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 10, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    >
                        <div className="rounded-[32px] sm:rounded-[40px] p-[1px] overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${config.color}40, rgba(255,255,255,0.05))` }}>
                            <div className="bg-[#0A0A0F]/90 backdrop-blur-3xl rounded-[31px] sm:rounded-[39px] p-6 sm:p-8 md:p-10 flex flex-col items-center text-center">
                                
                                {/* Badge Icon */}
                                <motion.div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[28px] flex items-center justify-center mb-5 sm:mb-6 relative"
                                    style={{ 
                                        background: `${config.color}15`,
                                        border: `1px solid ${config.color}30`,
                                        boxShadow: `0 0 30px ${config.color}20`
                                    }}
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2, damping: 12 }}
                                >
                                    {(() => {
                                        const IconComp = MODERN_ICON_MAP[config.icon];
                                        return <IconComp className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.8} style={{ color: config.color }} />;
                                    })()}
                                    
                                    {/* Pulsing Ring */}
                                    <motion.div 
                                        className="absolute inset-[-6px] rounded-[24px] sm:rounded-[34px] border-2 pointer-events-none"
                                        style={{ borderColor: `${config.color}20` }}
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </motion.div>

                                {/* Streak Number */}
                                <div className="mb-1.5 sm:mb-2">
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Milestone Reached</span>
                                </div>
                                <h2 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight" style={{ color: config.color }}>
                                    {count} Day Streak
                                </h2>

                                {/* Milestone Name */}
                                <div className="px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-5" style={{ background: `${config.color}10`, border: `1px solid ${config.color}20` }}>
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest" style={{ color: config.color }}>
                                        Achievement: {config.name}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-white/70 font-serif italic text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-xs sm:max-w-sm">
                                    "{config.description}"
                                </p>

                                {/* Reward & Button */}
                                <div className="w-full space-y-3 sm:space-y-4">
                                    <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-widest">Reward Unlocked</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    
                                    <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 mb-4 sm:mb-5">
                                        <Zap size={20} strokeWidth={1.8} className="text-[#F59E0B]" />
                                        <span className="text-lg sm:text-xl font-black text-white">+{config.bonusXp} XP</span>
                                    </div>

                                    <button 
                                        onClick={onClose}
                                        className="w-full py-3.5 sm:py-4 rounded-[18px] sm:rounded-[20px] font-black text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase transition-all active:scale-[0.98] shadow-xl hover:bg-white/90"
                                        style={{ 
                                            background: "white", 
                                            color: "#06060B"
                                        }}
                                    >
                                        Accept Achievement
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
