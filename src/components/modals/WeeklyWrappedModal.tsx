"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Trophy, Award, Clock, ArrowRight, ArrowLeft, Volume2, ShieldCheck } from "lucide-react";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import ShareCardGenerator from "@/components/ui/ShareCardGenerator";

interface WeeklyWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityData?: any;
  firstName?: string;
  isGuest?: boolean;
}

const SLIDE_DURATION = 4200; // 4.2 seconds per slide
const TOTAL_SLIDES = 5;

function playWrappedChime() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // 4-note ascending major arpeggio (C4, E4, G4, C5)
    const freqs = [261.63, 329.63, 392.00, 523.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.12 + 0.04);
      gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.12 + 0.7);
      
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.71);
    });
  } catch (e) {
    console.error("Audio failed", e);
  }
}

export default function WeeklyWrappedModal({
  isOpen,
  onClose,
  activityData,
  firstName = "Scholar",
  isGuest = false
}: WeeklyWrappedModalProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Deriving Stats
  const timeSpentSeconds = activityData?.stats?.timeSpentSeconds || 0;
  const hoursStudied = timeSpentSeconds > 0 ? (timeSpentSeconds / 3600).toFixed(1) : "0";
  const questionsAnswered = activityData?.stats?.questionsAnswered || 0;
  const correctCount = activityData?.stats?.correctCount || 0;
  const accuracy = questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 0;
  const flashcardsCount = activityData?.stats?.cardsFlipped || 0;
  const quizzesCount = questionsAnswered;
  
  // Computed Archetype
  let archetype = "Maestro";
  let archetypeDesc = "Balanced, analytical, and highly structured learning pattern.";
  if (accuracy >= 85) {
    archetype = "Accuracy Champion";
    archetypeDesc = "Flawless precision. Rushing nothing, retaining everything.";
  } else if (flashcardsCount > 60) {
    archetype = "Memory Maestro";
    archetypeDesc = "Spaced repetition fanatic. Dominating the active recall queue.";
  } else if (timeSpentSeconds > 10800) {
    archetype = "Endurance Titan";
    archetypeDesc = "Deep work specialist. High-volume study marathons.";
  }

  // Dynamic Comments
  let welcomeText = `"Look, ${firstName}! You didn't come to play this week. Let's see how much sleep you traded for these study sprints."`;
  if (hoursStudied === "0" && questionsAnswered === 0) {
    welcomeText = `"It's been a quiet week, ${firstName}. Your bed misses you, but your books miss you more. Time to lock in."`;
  } else if (accuracy >= 80) {
    welcomeText = `"${firstName}, you absolutely aced this week. You're making this look too easy. Just the good parts, right?"`;
  } else if (Number(hoursStudied) > 5) {
    welcomeText = `"Wow, ${firstName}. You lived in the library this week. I hope you're staying hydrated."`;
  }

  let hoursText = `"That's like sitting through three separate Lagos-to-Ibadan gridlocks, but actually using your brain."`;
  if (Number(hoursStudied) === 0) {
    hoursText = `"No hours logged yet. The week is still young!"`;
  } else if (Number(hoursStudied) < 2) {
    hoursText = `"A light warmup. More time to ignore your group chat and rest."`;
  } else if (Number(hoursStudied) >= 2 && Number(hoursStudied) < 8) {
    hoursText = `"Solid focused time. That's enough to get your time back and still ace it."`;
  } else if (Number(hoursStudied) >= 8) {
    hoursText = `"Absolute marathon. You spent more time studying than people spend scrolling TikTok."`;
  }

  let recallText = "Your memory database is filling up. Spaced repetition queue is working overtime.";
  if (flashcardsCount === 0 && quizzesCount === 0) {
    recallText = "You haven't flipped any cards or taken quizzes. Active recall is where the magic happens!";
  } else if (accuracy >= 85) {
    recallText = `With ${accuracy}% accuracy, you're retaining almost everything. Peak performance!`;
  } else if (flashcardsCount > 50) {
    recallText = "Flipping cards like a pro. Your brain is a sponge right now.";
  }

  // Play mount audio and manage timer
  useEffect(() => {
    if (isOpen) {
      setActiveSlide(0);
      setIsPaused(false);
      playWrappedChime();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isPaused) {
      const interval = setInterval(() => {
        if (activeSlide < TOTAL_SLIDES - 1) {
          setActiveSlide((prev) => prev + 1);
        } else {
          setIsPaused(true);
        }
      }, SLIDE_DURATION);
      return () => clearInterval(interval);
    }
  }, [activeSlide, isPaused, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (activeSlide < TOTAL_SLIDES - 1) {
      setActiveSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeSlide > 0) {
      setActiveSlide(prev => prev - 1);
    }
  };

  // 30/70 Split Tap Handler
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
        <GlassmorphicCard 
          intensity="heavy"
          radius="32px"
          className="relative max-w-lg w-full h-[620px] max-h-[90vh] border border-white/10 flex flex-col justify-between p-6 sm:p-8 overflow-hidden select-none"
        >
          {/* Ambient background glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--violet)]/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--amber)]/10 blur-[120px] pointer-events-none" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-[160] p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>

          {/* Story Progress Indicators */}
          <div className="flex gap-1.5 w-full mb-6 z-20">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => {
              let width = "0%";
              if (idx < activeSlide) width = "100%";
              if (idx === activeSlide && !isPaused) width = "100%"; // animation handles it

              return (
                <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-[var(--amber)]"
                    initial={{ width: "0%" }}
                    animate={{ width }}
                    transition={{
                      duration: idx === activeSlide && !isPaused ? (SLIDE_DURATION / 1000) : 0.2,
                      ease: "linear"
                    }}
                    style={{ originX: 0 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Touch-Hold & Split Tap Container */}
          <div 
            className="flex-1 relative z-10 flex flex-col justify-between h-full cursor-pointer"
            onClick={handleTap}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-center"
              >
                {/* SLIDE 0: Welcome Wrapped */}
                {activeSlide === 0 && (
                  <div className="text-center space-y-6 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--violet)]/10 border border-[var(--violet)]/20 flex items-center justify-center mx-auto text-[var(--violet)] shadow-lg shadow-[var(--violet)]/5">
                      <Trophy size={32} />
                    </div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] block">
                      WEEKLY WRAPPED
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-black italic uppercase text-white leading-none tracking-tight">
                      Your Week <br/>
                      <span className="text-[var(--violet)]">In Review.</span>
                    </h2>
                    <p className="text-lg text-[var(--foreground-secondary)] font-medium font-serif italic max-w-sm mx-auto leading-relaxed pt-2">
                      {welcomeText}
                    </p>
                  </div>
                )}

                {/* SLIDE 1: Hours Studied */}
                {activeSlide === 1 && (
                  <div className="text-center space-y-6 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--amber)]/10 border border-[var(--amber)]/20 flex items-center justify-center mx-auto text-[var(--amber)] shadow-lg shadow-[var(--amber)]/5">
                      <Clock size={32} />
                    </div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] block">
                      DEEP WORK INTENSITY
                    </span>
                    <div className="text-6xl font-black text-white italic tracking-tighter">
                      {hoursStudied} <span className="text-2xl text-[var(--foreground-muted)]">HRS</span>
                    </div>
                    <p className="text-lg text-[var(--foreground-secondary)] font-medium font-serif italic max-w-sm mx-auto leading-relaxed">
                      {hoursText}
                    </p>
                  </div>
                )}

                {/* SLIDE 2: Active Recall & Focus */}
                {activeSlide === 2 && (
                  <div className="space-y-6 px-4">
                    <div className="text-center">
                      <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] block mb-4">
                        MEMORY COMPRESSION
                      </span>
                      <h2 className="text-3xl font-black text-white italic uppercase mb-6">
                        Recall Volume
                      </h2>
                    </div>

                    <div className="space-y-4 max-w-xs mx-auto">
                      <div>
                        <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                          <span>Cards Flipped</span>
                          <span className="text-white font-bold">{flashcardsCount}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-[var(--violet)] rounded-full" style={{ width: `${Math.min(100, (flashcardsCount/80)*100)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                          <span>Quizzes Taken</span>
                          <span className="text-white font-bold">{quizzesCount}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-[var(--amber)] rounded-full" style={{ width: `${Math.min(100, (quizzesCount/5)*100)}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-base text-[var(--foreground-secondary)] text-center font-medium font-serif italic max-w-sm mx-auto leading-relaxed pt-2">
                      {recallText}
                    </p>
                  </div>
                )}

                {/* SLIDE 3: Study Archetype Badge */}
                {activeSlide === 3 && (
                  <div className="text-center space-y-6 px-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[var(--amber)] shadow-xl relative group">
                      <div className="absolute inset-0 rounded-full bg-[var(--amber)]/10 animate-ping" />
                      <Award size={40} className="relative z-10" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] block mb-1">
                        YOUR ARCHETYPE
                      </span>
                      <h3 className="text-3xl font-black text-white italic uppercase">
                        {archetype}
                      </h3>
                    </div>
                    <p className="text-lg text-[var(--foreground-secondary)] font-medium font-serif italic max-w-sm mx-auto leading-relaxed">
                      "{archetypeDesc}"
                    </p>
                  </div>
                )}

                {/* SLIDE 4: Share Card Exporter */}
                {activeSlide === 4 && (
                  <div className="flex flex-col items-center justify-center space-y-4 z-20">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[var(--foreground-muted)] block text-center">
                      SHARE YOUR GLORY
                    </span>
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                      <ShareCardGenerator 
                        title="Weekly Scholar Stats"
                        userName={firstName}
                        stats={[
                          { label: "Hours", value: hoursStudied, suffix: "h" },
                          { label: "Recall", value: flashcardsCount, suffix: " c" },
                          { label: "Accuracy", value: accuracy, suffix: "%" }
                        ]}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation helpers (indicators + tips) */}
          <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] z-20 border-t border-white/5 pt-4">
            <span className="flex items-center gap-1 font-serif text-[11px] italic font-medium lowercase">
              {activeSlide > 0 ? "tap left to return" : ""}
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono">{activeSlide + 1}</span>
              <span>/</span>
              <span className="font-mono">{TOTAL_SLIDES}</span>
            </div>
            <span className="flex items-center gap-1">
              {activeSlide < TOTAL_SLIDES - 1 ? "tap right to continue" : "finish"}
              <ArrowRight size={10} />
            </span>
          </div>
        </GlassmorphicCard>
      </div>
    </AnimatePresence>
  );
}
