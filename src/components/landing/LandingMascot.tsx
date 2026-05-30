"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/ui/Mascot";
import { useMascotStore } from "@/store/useMascotStore";

const PROACTIVE_COMMENTS = [
  "Need a coffee break? I won't tell your lecturer. 🤫",
  "Scroll down, there's good stuff below. 👇",
  "Your notes are safe with me. Just the good parts. 📚",
  "Still here? Let's turn slides into sleep schedule. 🛌",
  "I'm ready when you are. Drop those files!",
  "Ace your exams, save your weekend. Simple plan. 🎯",
  "My mortarboard is crooked but my logic is straight. 🎓",
];

/* Safe zones where Prof can wander without obstructing content.
   Expressed as viewport-relative positions. On mobile, stick to
   bottom edge only. On desktop, float in margins. */
const WAYPOINTS_DESKTOP = [
  { x: "calc(100vw - 180px)", y: "calc(100vh - 180px)" }, // bottom-right
  { x: "calc(100vw - 200px)", y: "55vh" },                // mid-right
  { x: "calc(100vw - 160px)", y: "25vh" },                // top-right
  { x: "40px",                y: "calc(100vh - 200px)" },  // bottom-left
  { x: "60px",                y: "50vh" },                  // mid-left
  { x: "calc(100vw - 220px)", y: "calc(100vh - 140px)" }, // near bottom-right
];
const WAYPOINTS_MOBILE = [
  { x: "calc(100vw - 110px)", y: "calc(100vh - 130px)" },
  { x: "16px",                y: "calc(100vh - 140px)" },
  { x: "calc(50vw - 50px)",   y: "calc(100vh - 120px)" },
  { x: "calc(100vw - 100px)", y: "calc(100vh - 160px)" },
];

export default function LandingMascot() {
  const { setMascotState, triggerReaction, clearSpeech } = useMascotStore();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLite, setIsLite] = useState(false);
  const [waypointIdx, setWaypointIdx] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const lastScrollTime = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wanderRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);

      // Low-spec hardware detection
      const checkLite = () => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const lowMemory = (navigator as any).deviceMemory !== undefined && (navigator as any).deviceMemory <= 1;
        const lowCpu = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2;
        return reducedMotion || lowMemory || lowCpu;
      };
      setIsLite(checkLite());

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Autonomous wandering — pick a new waypoint every 6–12s. Disabled in Lite Mode to save CPU translation math.
  useEffect(() => {
    if (!mounted || isLite) return;
    const wander = () => {
      const waypoints = isMobile ? WAYPOINTS_MOBILE : WAYPOINTS_DESKTOP;
      setWaypointIdx((prev) => {
        let next = Math.floor(Math.random() * waypoints.length);
        while (next === prev && waypoints.length > 1) {
          next = Math.floor(Math.random() * waypoints.length);
        }
        return next;
      });
      const delay = 6000 + Math.random() * 6000;
      wanderRef.current = setTimeout(wander, delay);
    };
    const initialDelay = 3000 + Math.random() * 2000;
    wanderRef.current = setTimeout(wander, initialDelay);
    return () => { if (wanderRef.current) clearTimeout(wanderRef.current); };
  }, [mounted, isMobile, isLite]);

  // Track scrolling (lightweight — capture + 500ms poll). Disabled in Lite Mode.
  useEffect(() => {
    if (!mounted || isLite) return;
    const handleScroll = () => {
      lastScrollTime.current = Date.now();
      const scrollContainer = document.getElementById("main-scroll-container");
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      const maxScrollHeight = scrollContainer
        ? (scrollContainer.scrollHeight - scrollContainer.clientHeight)
        : (document.documentElement.scrollHeight - window.innerHeight);
      const pct = maxScrollHeight > 0 ? (currentScroll / maxScrollHeight) : 0;

      let section = "hero";
      if (pct >= 0.12 && pct < 0.32) section = "pain";
      else if (pct >= 0.32 && pct < 0.52) section = "manifesto";
      else if (pct >= 0.52 && pct < 0.72) section = "howitworks";
      else if (pct >= 0.72 && pct < 0.88) section = "demo";
      else if (pct >= 0.88) section = "faq";
      if (section !== activeSection) setActiveSection(section);
    };
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    const container = document.getElementById("main-scroll-container");
    if (container) container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    const interval = setInterval(handleScroll, 500);
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (container) container.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [mounted, activeSection, isLite]);

  // Section reactions. Disabled in Lite Mode.
  useEffect(() => {
    if (!mounted || isLite) return;
    const reactions: Record<string, [string, string]> = {
      hero: ["Hey! I'm Prof. Let's get your time back.", "pointing-left"],
      pain: ["Reading 100+ slides at 2 AM? Your bed misses you.", "pointing-left"],
      manifesto: ["Just the good parts. That's the whole brand policy.", "pointing-left"],
      howitworks: ["Upload notes, get guides and recall cards. Simple.", "pointing-left"],
      demo: ["Try it right here! Let's synthesize some concepts.", "pointing-left"],
      faq: ["Still got questions? Ask away, or let's get started!", "pointing-left"],
    };
    const r = reactions[activeSection];
    if (r) {
      triggerReaction(r[0], r[1] as any, activeSection === "hero" ? 3500 : 4500);
    } else {
      clearSpeech();
      setMascotState("idle");
    }
  }, [activeSection, mounted, isLite]);

  // Proactive idle comments. Disabled in Lite Mode.
  useEffect(() => {
    if (!mounted || isLite) return;
    const checkIdle = () => {
      if (Date.now() - lastScrollTime.current > 12000) {
        const comment = PROACTIVE_COMMENTS[Math.floor(Math.random() * PROACTIVE_COMMENTS.length)];
        triggerReaction(comment, Math.random() > 0.5 ? "pointing-left" : "success", 4000);
        lastScrollTime.current = Date.now();
      }
    };
    idleTimerRef.current = setInterval(checkIdle, 5000);
    return () => { if (idleTimerRef.current) clearInterval(idleTimerRef.current); };
  }, [mounted, isLite]);

  // Tap handler — wave reaction
  const handleProfTap = useCallback(() => {
    triggerReaction("Hey there! 👋 Tap those notes in!", "success", 2500);
  }, [triggerReaction]);

  if (!mounted) return null;

  const waypoints = isMobile ? WAYPOINTS_MOBILE : WAYPOINTS_DESKTOP;
  // In Lite Mode, always stay at the default bottom-right waypoint (no wandering calculations)
  const currentWaypoint = isLite ? waypoints[0] : (waypoints[waypointIdx] || waypoints[0]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[999] select-none"
      style={{ willChange: "transform", pointerEvents: "none" }}
      animate={{
        x: currentWaypoint.x,
        y: currentWaypoint.y,
      }}
      transition={isLite ? { duration: 0 } : {
        type: "spring",
        stiffness: 12,
        damping: 15,
        mass: 1.5,
      }}
    >
      {/* Tap target — pointer-events-auto only on the mascot itself */}
      <div
        className="pointer-events-auto"
        style={{ width: isMobile ? 100 : 130, height: isMobile ? 100 : 130 }}
      >
        <Mascot size="100%" interactive={true} onTap={handleProfTap} />
      </div>
    </motion.div>
  );
}
