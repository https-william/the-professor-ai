
import React, { useState, useEffect } from 'react';

export const CountdownTimer: React.FC = () => {
  const calculateTimeLeft = () => {
    // Target: January 10, 2025 at 00:00:00 Local Time
    // Using explicit constructor to avoid ISO string parsing issues in some browsers
    const targetDate = new Date(2025, 0, 10, 0, 0, 0); 
    const difference = targetDate.getTime() - new Date().getTime();
    
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full bg-[#0f172a] border-b border-amber-500/20 relative overflow-hidden group shadow-lg">
      {/* Scanning Line Animation */}
      <div className="absolute top-0 bottom-0 w-1 bg-amber-400/20 blur-[2px] animate-[slideIn_3s_linear_infinite]"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        
        {/* Left: Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </div>
          <span className="text-[10px] font-bold text-amber-200 uppercase tracking-[0.2em] font-mono whitespace-nowrap">
            FIRST MONTH <span className="text-white text-shadow-glow">FREE ACCESS</span>
          </span>
        </div>

        {/* Center: The Timer */}
        <div className="flex items-center gap-3 sm:gap-4 text-white font-mono">
           <div className="flex flex-col items-center">
              <span className="text-lg sm:text-2xl font-bold leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[7px] sm:text-[8px] uppercase text-amber-500/70 tracking-wider">Days</span>
           </div>
           <span className="text-amber-500/50 text-xl font-light pb-2">:</span>
           <div className="flex flex-col items-center">
              <span className="text-lg sm:text-2xl font-bold leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[7px] sm:text-[8px] uppercase text-amber-500/70 tracking-wider">Hrs</span>
           </div>
           <span className="text-amber-500/50 text-xl font-light pb-2">:</span>
           <div className="flex flex-col items-center">
              <span className="text-lg sm:text-2xl font-bold leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[7px] sm:text-[8px] uppercase text-amber-500/70 tracking-wider">Mins</span>
           </div>
           <span className="text-amber-500/50 text-xl font-light pb-2">:</span>
           <div className="flex flex-col items-center">
              <span className="text-lg sm:text-2xl font-bold leading-none tabular-nums text-red-400 animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[7px] sm:text-[8px] uppercase text-red-400/70 tracking-wider">Secs</span>
           </div>
        </div>

        {/* Right: Protocol Info */}
        <div className="hidden sm:flex items-center gap-2">
           <div className="h-px w-8 bg-amber-500/30"></div>
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
             Offer Ends Jan 10
           </span>
        </div>
      </div>
    </div>
  );
};
