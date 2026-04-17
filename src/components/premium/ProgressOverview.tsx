"use client";

import { VellumCard } from "./VellumCard";
import { BookOpen, Trophy, Brain, Target } from "lucide-react";

interface StatItemProps {
    icon: any;
    label: string;
    value: string;
}

function StatItem({ icon: Icon, label, value }: StatItemProps) {
    return (
        <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-[#C4A35A]/10 border border-[#C4A35A]/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#C4A35A]" />
            </div>
            <div>
                <div className="text-2xl font-serif font-medium text-[#F5F0E8] tracking-tight">{value}</div>
                <div className="text-[11px] text-[#8a8680] uppercase tracking-[0.1em] mt-1">{label}</div>
            </div>
        </div>
    );
}

export function ProgressOverview() {
    const stats = [
        { icon: Brain, label: "Synthesized", value: "84%" },
        { icon: BookOpen, label: "Mastered", value: "12" },
        { icon: Trophy, label: "Streak", value: "5 Days" },
        { icon: Target, label: "Readiness", value: "A" },
    ];

    return (
        <VellumCard className="p-8">
            <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="relative">
                        <StatItem {...stat} />
                        {/* Subtle vertical divider */}
                        {i !== stats.length - 1 && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-[#2a2a30] to-transparent" />
                        )}
                    </div>
                ))}
            </div>
        </VellumCard>
    );
}
