
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
    <div className="relative text-center py-20 sm:py-28 px-4 z-10 overflow-hidden min-h-[60vh] flex flex-col items-center justify-center">
      
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <div 
           className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] will-change-transform opacity-60"
           style={{ transform: `translateY(${scrollY * 0.2}px)` }}
         ></div>
         <div 
           className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] will-change-transform opacity-60"
           style={{ transform: `translateY(-${scrollY * 0.1}px)` }}
         ></div>
      </div>

      {/* The Hook: System Status */}
      <div className="mb-10 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-default group hover:border-blue-500/30 transition-colors">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
           </span>
           <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
              <DecryptedText text="ACADEMIC ACCELERATOR V2.0" />
           </span>
        </div>
      </div>
      
      {/* Main Headline */}
      <div className="relative z-10 mb-8 group cursor-default flex flex-col items-center">
        {/* 'The' */}
        <span className="font-serif italic text-2xl sm:text-3xl text-gray-500 mb-[-5px] sm:mb-[-10px] opacity-0 animate-slide-in" style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}>
          The
        </span>
        
        {/* 'Professor' - Scaled and Refined */}
        <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 drop-shadow-xl animate-shimmer bg-[length:200%_auto] leading-[0.9] pb-2 px-4">
          <DecryptedText text="Professor" />
        </h1>
      </div>
      
      {/* XYZ Tagline */}
      <div className="max-w-3xl mx-auto relative z-10 px-4 animate-slide-up-fade opacity-0 mb-8" style={{ animationFillMode: 'forwards', animationDelay: '0.5s' }}>
         <div className="text-lg sm:text-2xl text-gray-400 font-light tracking-wide flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <span>Learning is as simple as</span>
            
            <div className="relative inline-flex items-center px-2">
                {/* Crossed out ABC */}
                <span className="text-gray-600 font-mono line-through decoration-red-500/80 decoration-[3px] mr-3 opacity-60">
                    ABC
                </span>
                
                {/* Glowing XYZ */}
                <span className="font-black text-white text-xl sm:text-3xl relative">
                    <span className="absolute -inset-1 bg-blue-500/20 blur-lg rounded-full"></span>
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">XYZ</span>
                    
                    {/* Hand-drawn underline */}
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-500" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" className="animate-pulse-slow" />
                    </svg>
                </span>
            </div>
         </div>
      </div>

      {/* Subtext */}
      <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.7s' }}>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Don't just read. Interrogate your notes. <br/>
              Upload materials and dominate your exams.
          </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce hidden sm:block pointer-events-none">
         <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center p-1">
            <div className="w-0.5 h-1.5 bg-white rounded-full animate-scroll"></div>
         </div>
      </div>
    </div>
  );
};
