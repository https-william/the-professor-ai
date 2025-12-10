
import React, { useEffect, useState } from 'react';

// Decrypted Text Component
const DecryptedText = ({ text, className = "" }: { text: string, className?: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

  useEffect(() => {
    let interval: any;
    let iteration = 0;
    
    interval = setInterval(() => {
      setDisplayText(prev => 
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      
      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
};

export const Hero: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative text-center py-20 sm:py-32 px-4 z-10 overflow-hidden min-h-[60vh] flex flex-col items-center justify-center">
      
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <div 
           className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] will-change-transform opacity-60"
           style={{ transform: `translateY(${scrollY * 0.2}px)` }}
         ></div>
         <div 
           className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] will-change-transform opacity-60"
           style={{ transform: `translateY(-${scrollY * 0.1}px)` }}
         ></div>
      </div>

      {/* The Hook */}
      <div className="mb-8 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group hover:border-blue-500/30">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
           </span>
           <span className="text-xs font-mono text-blue-300 uppercase tracking-widest group-hover:text-blue-200 transition-colors">
              <DecryptedText text="NEURAL LINK :: ESTABLISHED" />
           </span>
        </div>
      </div>
      
      {/* Main Headline */}
      <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter text-white mb-6 font-serif relative z-10 leading-[0.9] mix-blend-overlay">
        The
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300 animate-shimmer bg-[length:200%_auto] mt-2 pb-4 sm:pb-0">
          <DecryptedText text="Professor" />
        </span>
      </h1>
      
      {/* Subheadline */}
      <div className="max-w-2xl mx-auto relative z-10 px-4 animate-slide-up-fade opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.4s' }}>
         <p className="text-lg sm:text-2xl text-gray-300 leading-relaxed font-light mb-2">
            Static notes are dead.
            <span className="block text-white font-medium">Long live interactive mastery.</span>
         </p>
         <p className="text-sm sm:text-base text-gray-500 font-mono mt-4">
            Upload. Analyze. Dominate.
         </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce hidden sm:block">
         <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full animate-scroll"></div>
         </div>
      </div>
    </div>
  );
};
