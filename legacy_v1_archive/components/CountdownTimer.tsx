
import React, { useState, useEffect } from 'react';

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // TARGET: January 10, 2025 at 00:00:00 UTC
    // Fixed Timestamp ensures consistency regardless of timezone
    const targetDate = new Date('2025-01-10T00:00:00Z').getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setIsLive(false);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      setIsLive(true);
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    // Initial cal
    setTimeLeft(calculateTime());

    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isLive && timeLeft.days === 0 && timeLeft.seconds === 0) return null;

  return (
    <div className="w-full bg-[#0f172a] border-b border-amber-500/20 relative overflow-hidden group shadow-lg z-[60]">
      {/* Scanning Line Animation */}
      <div className="absolute top-0 bottom-0 w-1 bg-amber-400/20 blur-[2px] animate-[slideIn_3s_linear_infinite]"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        
        {/* Left: Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest font-mono whitespace-nowrap">
            FREE ACCESS: <span className="text-white">ACTIVE UNTIL JAN 10</span>
          </span>
        </div>

        {/* Center: The Timer */}
        <div className="flex items-center gap-3 text-white font-mono text-sm tracking-wider">
           <div className="flex flex-col items-center leading-none">
             <span className="font-bold text-lg">{String(timeLeft.days).padStart(2, '0')}</span>
             <span className="text-[8px] text-gray-500 uppercase">Days</span>
           </div>
           <span className="text-gray-600 mb-2">:</span>
           <div className="flex flex-col items-center leading-none">
             <span className="font-bold text-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
             <span className="text-[8px] text-gray-500 uppercase">Hrs</span>
           </div>
           <span className="text-gray-600 mb-2">:</span>
           <div className="flex flex-col items-center leading-none">
             <span className="font-bold text-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
             <span className="text-[8px] text-gray-500 uppercase">Min</span>
           </div>
           <span className="text-gray-600 mb-2">:</span>
           <div className="flex flex-col items-center leading-none">
             <span className="font-bold text-lg text-amber-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
             <span className="text-[8px] text-gray-500 uppercase">Sec</span>
           </div>
        </div>
      </div>
    </div>
  );
};
