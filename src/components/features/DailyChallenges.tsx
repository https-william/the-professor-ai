"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Award, 
    Layers, 
    HelpCircle, 
    Flame, 
    FileText, 
    Trophy, 
    Zap, 
    AlertCircle, 
    Check 
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  hotel_class: Award,
  style: Layers,
  quiz: HelpCircle,
  local_fire_department: Flame,
  rate_review: FileText,
  emoji_events: Trophy,
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  icon: string;
  type: "generate" | "review" | "streak" | "social";
  completed: boolean;
}

interface DailyChallengesProps {
  onComplete?: (challenge: Challenge) => void;
}

export default function DailyChallenges({ onComplete }: DailyChallengesProps) {
  const { user } = useUser();
  const router = useRouter();
  const { addToast } = useToasts();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      fetchChallenges();
    }
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayGenerations } = await supabase
        .from("generations")
        .select("type")
        .eq("user_id", user?.id)
        .gte("created_at", today.toISOString());

      const flashcardsToday = todayGenerations?.filter((g: { type: string }) => g.type === "flashcards").length || 0;
      const quizzesToday = todayGenerations?.filter((g: { type: string }) => g.type === "quiz").length || 0;

      const { data: stats } = await supabase
        .from("social_stats")
        .select("current_streak, duel_wins")
        .eq("user_id", user?.id)
        .maybeSingle();

      const todayStr = today.toISOString().split("T")[0];
      const claimsKey = `daily_claims_${user?.id}_${todayStr}`;
      const claimedStr = localStorage.getItem(claimsKey);
      const claimedIds: string[] = claimedStr ? JSON.parse(claimedStr) : [];

      const dailyChallenges: Challenge[] = [
        {
          id: "1",
          title: "Flashcard Factory",
          description: "Generate 5 flashcard decks today",
          target: 5,
          current: Math.min(flashcardsToday, 5),
          xpReward: 50,
          icon: "style",
          type: "generate",
          completed: flashcardsToday >= 5,
        },
        {
          id: "2",
          title: "Quiz Master",
          description: "Take 3 practice quizzes today",
          target: 3,
          current: Math.min(quizzesToday, 3),
          xpReward: 75,
          icon: "quiz",
          type: "generate",
          completed: quizzesToday >= 3,
        },
        {
          id: "3",
          title: "Study Streak",
          description: "Maintain your study streak",
          target: 1,
          current: stats?.current_streak > 0 ? 1 : 0,
          xpReward: 30,
          icon: "local_fire_department",
          type: "streak",
          completed: (stats?.current_streak || 0) > 0,
        },
        {
          id: "4",
          title: "Review Session",
          description: "Review 10 flashcards (Placeholder calculation for UI)",
          target: 10,
          current: Math.min(flashcardsToday * 2, 10),
          xpReward: 40,
          icon: "rate_review",
          type: "review",
          completed: flashcardsToday * 2 >= 10,
        },
        {
          id: "5",
          title: "Arena Champion",
          description: "Win 2 quiz duels",
          target: 2,
          current: Math.min(stats?.duel_wins || 0, 2),
          xpReward: 100,
          icon: "emoji_events",
          type: "social",
          completed: (stats?.duel_wins || 0) >= 2,
        },
      ];

      const mergedChallenges = dailyChallenges.map(c => 
        claimedIds.includes(c.id) 
          ? { ...c, completed: true, _claimed: true } 
          : c
      );

      setChallenges(mergedChallenges as any);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      setChallenges([
        { id: "1", title: "Flashcard Factory", description: "Generate 5 flashcard decks today", target: 5, current: 2, xpReward: 50, icon: "style", type: "generate", completed: false },
        { id: "2", title: "Quiz Master", description: "Take 3 practice quizzes", target: 3, current: 1, xpReward: 75, icon: "quiz", type: "generate", completed: false },
        { id: "3", title: "Study Streak", description: "Maintain your study streak", target: 1, current: 1, xpReward: 30, icon: "local_fire_department", type: "streak", completed: true },
        { id: "4", title: "Review Session", description: "Review 10 flashcards", target: 10, current: 5, xpReward: 40, icon: "rate_review", type: "review", completed: false },
        { id: "5", title: "Arena Champion", description: "Win 2 quiz duels", target: 2, current: 0, xpReward: 100, icon: "emoji_events", type: "social", completed: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hasUnclaimed = challenges.some(c => c.completed && !(c as any)._claimed);

  const handleQuestClick = (challenge: Challenge) => {
    if (challenge.completed && !(challenge as any)._claimed) return; // Wait for claim click
    
    setIsOpen(false);
    switch(challenge.type) {
      case "generate":
        router.push("/create");
        break;
      case "review":
        router.push("/library");
        break;
      case "social":
        router.push("/hub");
        break;
      default:
        router.push("/dashboard");
    }
  };

  const claimReward = async (challenge: Challenge, e: React.MouseEvent) => {
    e.stopPropagation();
    if (challenge.completed && !(challenge as any)._claimed) {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const claimsKey = `daily_claims_${user?.id}_${todayStr}`;
        const claimedStr = localStorage.getItem(claimsKey);
        const claimedIds: string[] = claimedStr ? JSON.parse(claimedStr) : [];
        
        claimedIds.push(challenge.id);
        localStorage.setItem(claimsKey, JSON.stringify(claimedIds));

        setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, _claimed: true } as any : c));

        const res = await fetch("/api/user/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "daily_challenge", customXp: challenge.xpReward, saveToDb: true })
        });
        
        if (res.ok) {
           addToast(`+${challenge.xpReward} XP earned!`, "xp", Zap, undefined, true);
           if (onComplete) onComplete(challenge);
        } else {
           addToast("Failed to claim XP. Already processed?", "error", AlertCircle);
        }
      } catch (err) {
        console.error("Failed to claim reward", err);
      }
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXp = challenges.filter(c => c.completed).reduce((acc, c) => acc + c.xpReward, 0);
  const progress = challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0;

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      {/* ═══ TRIGGER BUTTON ═══ */}
      <motion.button 
        whileTap={{ y: 1.5, boxShadow: "inset 0 4px 8px rgba(0,0,0,0.3)" }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
           isOpen 
             ? "bg-[var(--accent-bg)] border-[var(--border)]" 
             : "bg-[var(--background-secondary)]/70 backdrop-blur-md border-[var(--border)] hover:bg-[var(--accent-bg)] shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)]"
        } border relative h-10`}
      >
        <Award size={16} strokeWidth={1.5} className="text-amber-500" />
        <span className="text-[12px] font-bold text-[var(--foreground)] hidden sm:inline">Quests</span>
        {hasUnclaimed && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-[var(--background)]"></span>
          </span>
        )}
      </motion.button>

      {/* ═══ DROPDOWN POPOVER ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[calc(100%+12px)] right-0 w-[340px] rounded-[32px] overflow-hidden shadow-2xl"
            style={{ 
              background: "var(--card)", 
              border: "1px solid var(--border)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05)"
            }}
          >
            {loading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-1/3 bg-[var(--foreground)]/10 rounded" />
                  <div className="h-20 bg-[var(--foreground)]/5 rounded-2xl" />
                  <div className="h-20 bg-[var(--foreground)]/5 rounded-2xl" />
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-5 border-b border-[var(--border)] relative overflow-hidden bg-[var(--background-secondary)]">
                  <div className="absolute inset-0 opacity-10" style={{ background: "linear-gradient(135deg, #F59E0B, transparent)", pointerEvents: "none" }} />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
                        <Award size={18} strokeWidth={1.5} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-[var(--foreground)] leading-tight">Daily Quests</h3>
                        <p className="text-[11px] text-[var(--foreground-muted)]">{completedCount}/{challenges.length} completed</p>
                      </div>
                    </div>
                    
                    {totalXp > 0 && (
                      <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[11px] font-black text-amber-500 tracking-wide">+{totalXp} XP</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 rounded-full bg-[var(--foreground)]/5 overflow-hidden relative z-10 w-full">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #F59E0B, #fbbf24)",
                        boxShadow: "0 0 10px rgba(245,158,11,0.5)",
                      }}
                    />
                  </div>
                </div>

                {/* Challenges List */}
                <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto custom-scroll w-full">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`
                        relative w-full p-4 rounded-[24px] transition-all
                        ${challenge.completed 
                          ? (challenge as any)._claimed 
                            ? "bg-emerald-500/5 border border-emerald-500/10" 
                            : "bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10"
                          : "bg-[var(--foreground)]/5 border border-[var(--border)] cursor-pointer hover:bg-[var(--foreground)]/[0.08] active:scale-[0.98]"
                        }
                      `}
                      onClick={(e) => {
                        if (challenge.completed && !(challenge as any)._claimed) {
                          claimReward(challenge, e);
                        } else {
                          handleQuestClick(challenge);
                        }
                      }}
                    >
                      {challenge.completed && !(challenge as any)._claimed && (
                        <div className="absolute inset-0 rounded-2xl border border-amber-500/30 animate-pulse pointer-events-none" />
                      )}

                      <div className="flex flex-col gap-2 relative z-10 w-full">
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="flex items-center gap-3 min-w-0 max-w-[70%]">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                              style={{ 
                                background: challenge.completed 
                                  ? (challenge as any)._claimed 
                                    ? "rgba(34,197,94,0.15)"
                                : "rgba(245,158,11,0.15)"
                            : "var(--foreground-opacity-5)",
                        }}
                      >
                        {(() => {
                            const IconComp = ICON_MAP[challenge.icon] || HelpCircle;
                            return <IconComp 
                                size={16} 
                                strokeWidth={1.5} 
                                style={{ 
                                  color: challenge.completed 
                                    ? (challenge as any)._claimed 
                                        ? "#22c55e" 
                                        : "#F59E0B"
                                    : "var(--foreground-muted)"
                                }} 
                            />;
                        })()}
                      </div>

                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className={`font-bold text-[12px] leading-tight truncate ${challenge.completed ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>{challenge.title}</h4>
                              <p className="text-[10px] text-[var(--foreground-muted)] opacity-70 truncate mt-0.5" title={challenge.description}>{challenge.description}</p>
                            </div>
                          </div>

                          <div className={`
                            px-2 py-1 rounded-md text-[9px] font-black tracking-widest flex-shrink-0 transition-all ml-1
                            ${(challenge as any)._claimed 
                              ? "bg-transparent text-emerald-500 flex items-center justify-center" 
                              : challenge.completed
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--background)] shadow-[0_4px_12px_rgba(245,158,11,0.3)] animate-pulse"
                                : "bg-[var(--background)] text-[var(--foreground-muted)]"
                            }
                          `}>
                             {(challenge as any)._claimed 
                                ? <Check size={14} strokeWidth={1.5} />
                                : challenge.completed 
                                  ? "CLAIM" 
                                  : `+${challenge.xpReward} XP`}
                          </div>
                        </div>

                        {!(challenge as any)._claimed && (
                          <div className="flex items-center gap-2 mt-1 w-full">
                            <div className="flex-1 h-1 rounded-full bg-[var(--foreground)]/10 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${(challenge.current / challenge.target) * 100}%`,
                                  background: challenge.completed ? "#F59E0B" : "var(--foreground-muted)",
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-[var(--foreground-muted)] font-medium flex-shrink-0">
                              {challenge.current}/{challenge.target}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[var(--background-secondary)] border-t border-[var(--border)] text-center w-full">
                  <p className="text-[10px] font-medium text-[var(--foreground-muted)] opacity-60">
                    New quests appear every midnight
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
