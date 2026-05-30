import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { X, Flame } from "lucide-react";

export const LateNightGuard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check time condition (between 11:30 PM (23:30) and 5:00 AM)
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    const isLateNight = (hour === 23 && minute >= 30) || hour < 5;
    
    if (isLateNight) {
      // Check localStorage to ensure we only show it once per late-night period
      const todayDate = now.toDateString(); // e.g. "Fri May 29 2026"
      const lastShown = localStorage.getItem("last_late_night_cheer");
      
      if (lastShown !== todayDate) {
        setIsOpen(true);
        localStorage.setItem("last_late_night_cheer", todayDate);
        

      }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-5 bg-white/70 dark:bg-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl rounded-[24px] shadow-2xl flex items-center gap-4"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200/20 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X size={12} />
          </button>

          {/* Left: Icon */}
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Flame size={32} className="animate-pulse" />
          </div>

          {/* Right: Copy & Actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={12} className="text-blue-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 font-mono">
                Late-Night study squad
              </span>
            </div>
            
            <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
              Pulling an all-nighter?
            </h4>
            
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-bold leading-normal mb-3">
              No stress. I'm right here with you. Let's make this session quick, smart, and get those marks.
            </p>

            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-[9px] uppercase tracking-widest rounded-lg transition-transform active:scale-95 hover:opacity-90 shadow-md"
            >
              Lock in focus
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
