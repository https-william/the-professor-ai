"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";

export interface WeaknessHeatmapProps {
  packId: string;
  chapters: { title: string; index: number }[];
  className?: string;
}

interface PerformanceMetric {
  chapterIndex: number;
  chapterTitle: string;
  incorrectCount: number;
  correctCount: number;
  accuracy: number;
}

export default function WeaknessHeatmap({
  packId,
  chapters = [],
  className = "",
}: WeaknessHeatmapProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packId || packId === "placeholder") {
      setLoading(false);
      return;
    }

    const fetchPerformance = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch study sessions for this pack to aggregate quiz performance
        const { data: sessions } = await supabase
          .from("study_sessions")
          .select("metadata, correct_count, questions_answered")
          .eq("user_id", user.id)
          .eq("pack_id", packId)
          .eq("surface", "quiz");

        if (sessions && sessions.length > 0) {
          // Aggregate performance per chapter
          // Since metadata contains question/chapter reference if tracked
          const chapterMap = new Map<number, { correct: number; total: number }>();
          
          sessions.forEach((s: any) => {
            // Default split across chapters if specific tracking is missing
            const metadata = s.metadata || {};
            const misses = metadata.missedChapters as number[] || [];
            const hits = metadata.correctChapters as number[] || [];

            misses.forEach(idx => {
              const current = chapterMap.get(idx) || { correct: 0, total: 0 };
              chapterMap.set(idx, { correct: current.correct, total: current.total + 1 });
            });

            hits.forEach(idx => {
              const current = chapterMap.get(idx) || { correct: 0, total: 0 };
              chapterMap.set(idx, { correct: current.correct + 1, total: current.total + 1 });
            });
          });

          const compiled = chapters.map((ch) => {
            const stats = chapterMap.get(ch.index) || { correct: 0, total: 0 };
            const incorrectCount = stats.total - stats.correct;
            const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 100;
            return {
              chapterIndex: ch.index,
              chapterTitle: ch.title,
              incorrectCount,
              correctCount: stats.correct,
              accuracy,
            };
          });

          setMetrics(compiled);
        } else {
          // Default state (100% accuracy if no quizzes completed yet)
          setMetrics(chapters.map(ch => ({
            chapterIndex: ch.index,
            chapterTitle: ch.title,
            incorrectCount: 0,
            correctCount: 0,
            accuracy: 100,
          })));
        }
      } catch (err) {
        console.warn("Failed to fetch weakness data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [packId, chapters]);

  // Only render if there's actual quiz history (at least one question answered)
  const hasHistory = useMemo(() => {
    return metrics.some(m => m.correctCount > 0 || m.incorrectCount > 0);
  }, [metrics]);

  if (loading || !hasHistory) return null;

  return (
    <GlassmorphicCard
      intensity="light"
      radius="20px"
      className={`p-4 border border-white/5 flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <TrendingUp size={16} className="text-[#E5A93C]" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/80">
          Weakness Heatmap
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {metrics.map((m, idx) => {
          const isWeak = m.accuracy < 70;
          const isMastered = m.accuracy >= 90;
          
          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-white/70 truncate max-w-[200px]">
                  Chapter {m.chapterIndex + 1}: {m.chapterTitle}
                </span>
                <span className={`font-black uppercase tracking-wider ${
                  isMastered ? "text-[#2BB288]" : isWeak ? "text-[#E85D75]" : "text-[#E5A93C]"
                }`}>
                  {m.accuracy}% Recall
                </span>
              </div>
              
              {/* Heatmap Bar */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500`}
                  style={{ 
                    width: `${m.accuracy}%`,
                    background: isMastered ? "var(--emerald)" : isWeak ? "var(--crimson)" : "var(--amber)"
                  }}
                />
              </div>

              {/* Status Note */}
              <div className="flex items-center gap-1 text-[9px] text-white/30 font-bold uppercase">
                {isMastered ? (
                  <>
                    <CheckCircle2 size={10} className="text-[#2BB288]" />
                    <span>Recall secured. Ready for exams.</span>
                  </>
                ) : isWeak ? (
                  <>
                    <AlertCircle size={10} className="text-[#E85D75]" />
                    <span>SRS flagged. Needs targeted review.</span>
                  </>
                ) : (
                  <>
                    <Flame size={10} className="text-[#E5A93C]" />
                    <span>Steady progress. Drill flashcards.</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassmorphicCard>
  );
}
