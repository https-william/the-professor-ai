"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronRight, Sparkles, Zap, FileText, GraduationCap } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { useUser } from "@/context/UserContext";

import { useToasts } from "@/components/ui/GlobalToasts";

interface TourStep {
  targetSelector: string;
  title: string;
  body: string;
  icon?: any;
  placement: "top" | "bottom" | "left" | "right";
  action?: "navigate" | "click" | "wait";
  actionTarget?: string;
  waitForElement?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: "#platform-root",
    title: "Your Study Lab",
    body: "Welcome. Let's make studying easy. Your notes, but just the good parts.",
    icon: GraduationCap,
    placement: "bottom",
  },
  {
    targetSelector: "#main-scroll-container",
    title: "Your Dashboard",
    body: "Track streaks and daily wisdom here. Keep your focus sharp and your habits steady.",
    icon: Sparkles,
    placement: "bottom",
    waitForElement: "#platform-root",
  },
  {
    targetSelector: "button:nth-child(2)",
    title: "Create Guides",
    body: "Paste your chaotic notes here. We'll distill them into pure academic gold.",
    icon: Zap,
    placement: "bottom",
    action: "navigate",
    actionTarget: "/create",
  },
  {
    targetSelector: "textarea",
    title: "Feed The Professor",
    body: "Dump your lectures or PDFs here. I'll handle the heavy lifting.",
    icon: FileText,
    placement: "top",
    action: "wait",
    waitForElement: "textarea",
  },
  {
    targetSelector: "#ready-sprint-btn",
    title: "Exam Sprint Mode",
    body: "Exam coming up? Don't panic. This sprint mode is your ultimate study companion.",
    icon: Zap,
    placement: "top",
  },
];

export default function ProfessorTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { addToast } = useToasts();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tourSeen = localStorage.getItem("professor-tour-completed");
    
    const isNewUser = user.createdAt 
      ? (Date.now() - new Date(user.createdAt).getTime()) < 24 * 60 * 60 * 1000
      : true;

    if (!tourSeen && user.isAuthenticated && isNewUser && pathname === "/dashboard") {
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user.isAuthenticated, user.createdAt, pathname]);


  const updateTargetRect = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const waitForEl = step.waitForElement || step.targetSelector;
    const el = document.querySelector(waitForEl);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;
    updateTargetRect();
    const observer = new MutationObserver(updateTargetRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", updateTargetRect);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTargetRect);
    };
  }, [isActive, updateTargetRect]);

  const handleNext = () => {
    const step = TOUR_STEPS[currentStep];
    if (step?.action === "navigate" && step.actionTarget) {
      router.push(step.actionTarget);
    }

    if (currentStep >= TOUR_STEPS.length - 1) {
      setIsActive(false);
      setIsCompleted(true);
      localStorage.setItem("professor-tour-completed", "true");
      addToast("🎉 Onboarding Complete! 100 XP awarded. Welcome to The Professor!", "success", undefined, undefined, true);
      fetch("/api/user/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily_challenge", customXp: 100 })
      }).catch(err => console.error("XP error:", err));
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem("professor-tour-completed", "true");
    addToast("Tour skipped. Explore at your own pace!", "info");
  };

  const step = TOUR_STEPS[currentStep];
  if (!isActive || !step || isCompleted) return null;

  const getPositionStyle = () => {
    if (!targetRect) return { bottom: "120px", right: "24px" };

    switch (step.placement) {
      case "top":
        return {
          left: `${Math.min(targetRect.left + targetRect.width / 2, window.innerWidth - 320)}px`,
          bottom: `${window.innerHeight - targetRect.top + 16}px`,
        };
      case "bottom":
        return {
          left: `${Math.min(targetRect.left + targetRect.width / 2 - 150, window.innerWidth - 340)}px`,
          top: `${targetRect.bottom + 16}px`,
        };
      case "right":
        return {
          left: `${targetRect.right + 16}px`,
          top: `${targetRect.top + targetRect.height / 2 - 80}px`,
        };
      default:
        return {
          right: "24px",
          bottom: "120px",
        };
    }
  };

  const Icon = step.icon || Sparkles;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="fixed z-[99999] pointer-events-auto"
        style={{
          maxWidth: "320px",
          ...getPositionStyle(),
        }}
      >
        <div className="relative rounded-[28px] bg-[var(--bg-2)] border border-[var(--border)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-[var(--blue)] to-[var(--emerald)]" />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center">
                  <Icon size={16} className="text-[var(--blue)]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)]">
                  The Professor Says
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 rounded-full text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-3)] transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <h3 className="text-[15px] font-black text-[var(--foreground)] mb-1.5 tracking-tight">
              {step.title}
            </h3>
            <p className="text-[12px] text-[var(--foreground-muted)] font-medium leading-relaxed mb-4">
              {step.body}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentStep
                        ? "bg-[var(--blue)] w-4"
                        : i < currentStep
                        ? "bg-[var(--emerald)]"
                        : "bg-[var(--border)]"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[var(--blue-dark)] transition-all active:scale-95"
              >
                {currentStep >= TOUR_STEPS.length - 1 ? "Got it" : "Next"}
                {currentStep < TOUR_STEPS.length - 1 && <ChevronRight size={12} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}