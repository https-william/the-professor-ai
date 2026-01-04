
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
    <div className="relative text-center py-20 sm:py-32 px-4 z-10 overflow-hidden min-h-[70vh] flex flex-col items-center justify-center">
      
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <div 
           className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] will-change-transform opacity-60"
           style={{ transform: `translateY(${scrollY * 0.2}px)` }}
         ></div>
         <div 
           className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] will-change-transform opacity-60"
           style={{ transform: `translateY(-${scrollY * 0.1}px)` }}
         ></div>
      </div>

      {/* The Hook: System Status */}
      <div className="mb-12 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 backdrop-blur-md cursor-default group shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-cyan-500/50 transition-colors">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
           </span>
           <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest group-hover:text-cyan-300 transition-colors flex items-center gap-2">
              <span className="animate-pulse">⚡</span>
              <DecryptedText text="SYSTEM ONLINE: INTELLIGENCE OPTIMIZED" />
           </span>
        </div>
      </div>
      
      {/* Main Headline */}
      <div className="relative z-10 mb-10 group cursor-default">
        {/* 'The' - Offset & Stylized */}
        <h1 className="font-serif italic text-3xl sm:text-5xl text-blue-200/80 mb-[-10px] sm:mb-[-25px] ml-[-140px] sm:ml-[-260px] opacity-0 animate-slide-in" style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}>
          The
        </h1>
        
        {/* 'Professor' - Massive & Glowing */}
        <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-gray-500 drop-shadow-[0_0_35px_rgba(59,130,246,0.25)] animate-shimmer bg-[length:200%_auto] leading-[0.85] pb-2">
          <DecryptedText text="Professor" />
        </h1>
        
        {/* Decorative Underline */}
        <div className="h-1.5 w-24 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full mx-auto mt-6 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse-slow"></div>
      </div>
      
      {/* Subheadline */}
      <div className="max-w-3xl mx-auto relative z-10 px-4 animate-slide-up-fade opacity-0 space-y-6" style={{ animationFillMode: 'forwards', animationDelay: '0.5s' }}>
         <p className="text-xl sm:text-3xl text-gray-400 leading-tight font-light tracking-wide">
            <span className="line-through decoration-red-500/40 decoration-2 text-gray-600 decoration-wavy">Static notes are dead.</span>
            <br className="hidden sm:block" />
            <span className="text-white font-bold drop-shadow-md block sm:inline mt-2 sm:mt-0 sm:ml-2">Long live interactive mastery.</span>
         </p>
         
         {/* Tech-Dashboard Style Tags */}
         <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-8 border-t border-white/5 w-full max-w-lg mx-auto">
            {['UPLOAD', 'ANALYZE', 'DOMINATE'].map((tag, i) => (
                <span key={tag} className="font-mono text-[10px] bg-blue-900/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-sm uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all cursor-crosshair flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-blue-500 group-hover:bg-white rounded-full"></span>
                    {tag}
                </span>
            ))}
         </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce hidden sm:block pointer-events-none">
         <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full animate-scroll"></div>
         </div>
      </div>
    </div>
  );
};
