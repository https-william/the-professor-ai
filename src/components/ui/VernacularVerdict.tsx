"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Flame, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import GlassmorphicCard from "./GlassmorphicCard";
import { getVerdict } from "@/lib/design-tokens";

export interface VernacularVerdictProps {
  scorePercent: number;
  userName?: string;
  className?: string;
}

export default function VernacularVerdict({
  scorePercent,
  userName = "Scholar",
  className = "",
}: VernacularVerdictProps) {
  const [verdictText, setVerdictText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Safe client-side generation to prevent Next.js hydration mismatches
    setVerdictText(getVerdict(userName, scorePercent));
  }, [userName, scorePercent]);

  // Determine styling based on score tier
  const tier = scorePercent >= 95 
    ? {
        color: "text-[#E5A93C]",
        bgGlow: "rgba(229, 169, 60, 0.08)",
        borderGlow: "rgba(229, 169, 60, 0.25)",
        Icon: Flame,
        tag: "OUTSTANDING",
        desc: "Your memory matches the digital records. High-yield recall achieved.",
      }
    : scorePercent >= 75
    ? {
        color: "text-[#9673F5]",
        bgGlow: "rgba(150, 115, 245, 0.08)",
        borderGlow: "rgba(150, 115, 245, 0.25)",
        Icon: Sparkles,
        tag: "STRONG RUN",
        desc: "Almost flawless. Minor gaps identified and forwarded to the SRS scheduling engine.",
      }
    : scorePercent >= 50
    ? {
        color: "text-[#2BB288]",
        bgGlow: "rgba(43, 178, 136, 0.08)",
        borderGlow: "rgba(43, 178, 136, 0.25)",
        Icon: CheckCircle,
        tag: "PASSING",
        desc: "Good grasp of key formulas, but some concepts need tightening. Review misses soon.",
      }
    : {
        color: "text-[#E85D75]",
        bgGlow: "rgba(232, 93, 117, 0.08)",
        borderGlow: "rgba(232, 93, 117, 0.25)",
        Icon: AlertTriangle,
        tag: "NEEDS FOCUS",
        desc: "Rough patch, but that is the purpose of testing. Take a 5-minute break and retry.",
      };

  const IconComponent = tier.Icon;

  // Render a placeholder matching size during SSR to avoid layout shift
  if (!mounted) {
    return (
      <div 
        className={`w-full h-36 bg-zinc-950/20 border border-white/5 rounded-3xl animate-pulse ${className}`} 
      />
    );
  }

  return (
    <GlassmorphicCard
      intensity="medium"
      radius="24px"
      className={`p-5 border flex flex-col gap-3 transition-all duration-300 ${className}`}
      style={{
        boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${tier.bgGlow}`,
        borderColor: tier.borderGlow,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Tier Icon Container */}
        <div 
          className="p-3 rounded-2xl flex items-center justify-center shrink-0 border transition-all"
          style={{
            background: tier.bgGlow,
            borderColor: tier.borderGlow,
          }}
        >
          <IconComponent className={`w-6 h-6 ${tier.color}`} />
        </div>

        {/* Verdict Content */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase italic ${tier.color}`}>
              {tier.tag}
            </span>
            <span className="text-xs font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
              {scorePercent}% Score
            </span>
          </div>

          <h4 className="text-base font-black italic text-white leading-snug tracking-wide">
            &ldquo;{verdictText}&rdquo;
          </h4>

          <p className="text-xs text-white/40 leading-relaxed font-medium mt-0.5">
            {tier.desc}
          </p>
        </div>
      </div>
    </GlassmorphicCard>
  );
}
