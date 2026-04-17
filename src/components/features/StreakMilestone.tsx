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
    Zap 
} from "lucide-react";

const MODERN_ICON_MAP: Record<string, any> = {
    coffee: Coffee,
    headphones: Headphones,
    swords: Swords,
    account_balance: Landmark,
    school: GraduationCap,
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
        name: "Caffeine Habit",
        description: "One week down. You're starting to smell like fresh roasted beans and intellectual curiosity.",
        icon: "coffee",
        color: "#8B5E3C",
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
        description: "Sixty days. You're part of the furniture now. The archives recognize your stride. Mastery is becoming your default state.",
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
                    className="fixed inset-0 z-[110] flex items-center justify-center p-6"
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
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
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
                        className="relative z-10 w-full max-w-lg"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 10, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    >
                        <div className="rounded-[40px] p-[1px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${config.color}40, rgba(255,255,255,0.05))` }}>
                            <div className="bg-[#0A0A0F]/90 backdrop-blur-3xl rounded-[39px] p-8 md:p-12 flex flex-col items-center text-center">
                                
                                {/* Badge Icon */}
                                <motion.div
                                    className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 relative"
                                    style={{ 
                                        background: `${config.color}15`,
                                        border: `1px solid ${config.color}30`,
                                        boxShadow: `0 0 40px ${config.color}20`
                                    }}
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2, damping: 12 }}
                                >
                                    {(() => {
                                        const IconComp = MODERN_ICON_MAP[config.icon];
                                        return <IconComp size={48} strokeWidth={1.5} style={{ color: config.color }} />;
                                    })()}
                                    
                                    {/* Pulsing Ring */}
                                    <motion.div 
                                        className="absolute inset-[-8px] rounded-[36px] border-2 pointer-events-none"
                                        style={{ borderColor: `${config.color}20` }}
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </motion.div>

                                {/* Streak Number */}
                                <div className="mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Milestone Reached</span>
                                </div>
                                <h2 className="text-6xl font-black mb-4 tracking-tighter" style={{ color: config.color }}>
                                    {count} Day Streak
                                </h2>

                                {/* Milestone Name */}
                                <div className="px-5 py-2 rounded-full mb-6" style={{ background: `${config.color}10`, border: `1px solid ${config.color}20` }}>
                                    <span className="text-sm font-black uppercase tracking-widest" style={{ color: config.color }}>
                                        Achievement: {config.name}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-white/60 font-serif italic text-lg leading-relaxed mb-10 max-w-sm">
                                    "{config.description}"
                                </p>

                                {/* Reward & Button */}
                                <div className="w-full space-y-4">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Reward Unlocked</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    
                                    <div className="flex items-center justify-center gap-3 py-4 rounded-3xl bg-white/5 border border-white/5 mb-6">
                                        <Zap size={24} strokeWidth={1.5} className="text-[#F59E0B]" />
                                        <span className="text-2xl font-black text-white">+{config.bonusXp} XP</span>
                                    </div>

                                    <button 
                                        onClick={onClose}
                                        className="w-full py-5 rounded-[24px] font-bold text-sm tracking-widest uppercase transition-all active:scale-[0.98] shadow-2xl"
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
