"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/ui/Mascot";
import { useMascotStore } from "@/store/useMascotStore";

const RANDOM_COMMENTS = [
  "I'm holding the coffee. You do the reading. ☕",
  "Should we study or just admire my neat sweater vest? 👔",
  "E daily study reps are calling you, boss. 📞",
  "Don't look at me like that, I'm just a very educated cup.",
  "Active recall check: close your eyes and repeat what you just read. No cheating! 🧐",
  "Did you know Gen is off but my brain cells are running at 100%? 💡",
  "Oya, let's turn these slides into a sleep schedule. 🛌",
  "My mortarboard is crooked. Please do not screenshot this. 🎓",
  "I just calculated the probability of you acing this course. It's 100% if we lock in. 📈",
  "Is that a study pack? Let me synthesize that real quick. 🧪",
  "A quick session now saves a massive midnight cram later. Just saying. 🕰️",
  "If you study for 20 minutes, you get 20 credits of pure self-respect. 🪙",
  "I'm literally doing a backflip in my mind right now. 🤸‍♂️",
  "Active recall: 1. Try to remember. 2. Remember. 3. Flex. 💪",
  "I'm literally a mug with a graduation cap. Life is wild.",
  "Did you know coffee has over 800 compounds? Most of them are 'focus'.",
  "Take a deep breath. Ace the day. Save your weekend. 🎯",
  "Tunde, Amaka, Ifeanyi, Bolu... they all started with one note. 📝",
  "My mortarboard is slightly crooked. Please don't adjust it.",
];

const TAP_REPLIES = [
  "Ouch! Watch the handle! 🤕",
  "Hey! I almost spilled the coffee! ☕",
  "Yes, I am a mug. Yes, I went to university. Don't make it weird. 🎓",
  "Oya, keep clicking me and I'll start charging you credits! 🪙",
  "Active recall: Name 3 things you studied today. Ready? Go! 🧠",
  "Please, I am defragmenting my coffee beans. 🤖",
  "Double tap? No, just tap those notes in! 📁",
];

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

export default function DashboardMascot() {
  const { setMascotState, triggerReaction, clearSpeech } = useMascotStore();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [waypointIdx, setWaypointIdx] = useState(0);
  const wanderRef = useRef<NodeJS.Timeout | null>(null);
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Autonomous wandering — pick a new waypoint every 7–14s
  useEffect(() => {
    if (!mounted) return;
    const wander = () => {
      const waypoints = isMobile ? WAYPOINTS_MOBILE : WAYPOINTS_DESKTOP;
      setWaypointIdx((prev) => {
        let next = Math.floor(Math.random() * waypoints.length);
        while (next === prev && waypoints.length > 1) {
          next = Math.floor(Math.random() * waypoints.length);
        }
        return next;
      });
      const delay = 7000 + Math.random() * 7000;
      wanderRef.current = setTimeout(wander, delay);
    };
    const initialDelay = 4000 + Math.random() * 2000;
    wanderRef.current = setTimeout(wander, initialDelay);
    return () => { if (wanderRef.current) clearTimeout(wanderRef.current); };
  }, [mounted, isMobile]);

  // Periodic random events (reactions, moods, comments)
  useEffect(() => {
    if (!mounted) return;
    const runRandomEvent = () => {
      // Pick a random comment
      const comment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
      // Pick a random mood/state
      const states: Array<"idle" | "working" | "success" | "fail" | "sleepy" | "streak"> = [
        "idle", "working", "success", "fail", "sleepy", "streak"
      ];
      const randomState = states[Math.floor(Math.random() * states.length)];
      
      // Trigger the reaction with the random state
      triggerReaction(comment, randomState, 4500);

      // Re-schedule in 12–20 seconds
      const nextDelay = 12000 + Math.random() * 8000;
      eventTimerRef.current = setTimeout(runRandomEvent, nextDelay);
    };

    const initialEventDelay = 8000 + Math.random() * 4000;
    eventTimerRef.current = setTimeout(runRandomEvent, initialEventDelay);
    
    return () => {
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
    };
  }, [mounted, triggerReaction]);

  // Tap handler — funny random replies
  const handleProfTap = useCallback(() => {
    const reply = TAP_REPLIES[Math.floor(Math.random() * TAP_REPLIES.length)];
    // Pick an expressive state for tap reaction
    const tapStates: Array<"success" | "streak" | "fail" | "idle"> = ["success", "streak", "fail", "idle"];
    const randomTapState = tapStates[Math.floor(Math.random() * tapStates.length)];
    triggerReaction(reply, randomTapState, 3000);
  }, [triggerReaction]);

  if (!mounted) return null;

  const waypoints = isMobile ? WAYPOINTS_MOBILE : WAYPOINTS_DESKTOP;
  const currentWaypoint = waypoints[waypointIdx] || waypoints[0];

  return (
    <motion.div
      className="fixed top-0 left-0 z-[999] select-none"
      style={{ willChange: "transform", pointerEvents: "none" }}
      animate={{
        x: currentWaypoint.x,
        y: currentWaypoint.y,
      }}
      transition={{
        type: "spring",
        stiffness: 12,
        damping: 15,
        mass: 1.5,
      }}
    >
      {/* Tap target — pointer-events-auto only on the mascot itself */}
      <div
        className="pointer-events-auto"
        style={{ width: isMobile ? 95 : 125, height: isMobile ? 95 : 125 }}
      >
        <Mascot size="100%" interactive={true} onTap={handleProfTap} />
      </div>
    </motion.div>
  );
}
