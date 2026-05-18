"use client";
import { GraduationCap } from "lucide-react";

interface MasteryIndicatorProps {
  known: number;
  unknown: number;
  total: number;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MasteryIndicator({ 
  known, 
  unknown, 
  total, 
  showDetails = true,
  size = "md" 
}: MasteryIndicatorProps) {
  const percentage = total > 0 ? Math.round((known / total) * 100) : 0;
  
  // Determine study level
  const getStudyLevel = (pct: number): { label: string; color: string } => {
    if (pct >= 90) return { label: "Aced", color: "#10B981" };
    if (pct >= 70) return { label: "Strong", color: "#34D399" };
    if (pct >= 50) return { label: "Learning", color: "var(--blue)" };
    if (pct >= 25) return { label: "Developing", color: "var(--cyan)" };
    return { label: "Just Started", color: "var(--text-3)" };
  };

  const studyLevel = getStudyLevel(percentage);

  const sizes = {
    sm: { bar: "h-1.5", iconSize: 14, text: "text-xs", padding: "p-2" },
    md: { bar: "h-2", iconSize: 20, text: "text-sm", padding: "p-3" },
    lg: { bar: "h-3", iconSize: 24, text: "text-base", padding: "p-4" },
  };

  const s = sizes[size];

  return (
    <div className={`${s.padding} rounded-xl`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Header with percentage */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GraduationCap 
            size={s.iconSize}
            strokeWidth={1.5}
            style={{ color: studyLevel.color }}
          />
          <span 
            className={`font-bold ${s.text}`}
            style={{ color: studyLevel.color }}
          >
            {studyLevel.label}
          </span>
        </div>
        <span 
          className={`font-bold ${s.text}`}
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full ${s.bar} rounded-full mb-3`} style={{ background: "rgba(255,255,255,0.1)" }}>
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: studyLevel.color,
            boxShadow: `0 0 10px ${studyLevel.color}60`,
          }}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>{known} known</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--blue)" }} />
            <span>{unknown} unknown</span>
          </div>
          <span>{total} total</span>
        </div>
      )}
    </div>
  );
}

// Compact version for list items
export function CompactMastery({ percentage }: { percentage: number }) {
  const getColor = (pct: number) => {
    if (pct >= 70) return "#10B981";
    if (pct >= 40) return "var(--blue)";
    return "var(--text-3)";
  };

  const color = getColor(percentage);

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div 
          className="h-full rounded-full"
          style={{ 
            width: `${percentage}%`,
            background: color,
          }}
        />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>
        {percentage}%
      </span>
    </div>
  );
}
