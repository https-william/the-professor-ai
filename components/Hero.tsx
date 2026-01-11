
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
    <div className="relative text-center py-12 sm:py-16 px-4 z-10 overflow-hidden min-h-[40vh] flex flex-col items-center justify-center">
      
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
      <div className="mb-6 animate-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-default group hover:border-blue-500/30 transition-colors">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
           </span>
           <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
              <DecryptedText text="SYSTEM ONLINE" />
           </span>
        </div>
      </div>
      
      {/* Main Headline */}
      <div className="relative z-10 mb-4 group cursor-default flex flex-col items-center">
        {/* Intro */}
        <span className="font-serif italic text-xl sm:text-2xl text-gray-500 mb-2 opacity-0 animate-slide-in" style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}>
          Ready to Assist
        </span>
        
        {/* 'The Professor' - Responsive Font Size */}
        <h1 className="text-4xl sm:text-7xl md:text-8xl font-display font-normal tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-2xl animate-shimmer bg-[length:200%_auto] leading-[0.9] px-4 pb-4 scale-y-110">
          <DecryptedText text="The Professor" />
        </h1>
      </div>
      
      {/* Subline */}
      <div className="max-w-3xl mx-auto relative z-10 px-4 animate-slide-up-fade opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.5s' }}>
         <div className="text-lg sm:text-xl text-gray-400 font-light tracking-wide text-center">
            Upload your materials below to begin the neural link.
         </div>
      </div>
    </div>
  );
};
