
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
    <div className="relative text-center py-20 sm:py-24 px-4 z-10 overflow-visible min-h-[30vh] flex flex-col items-center justify-center">
      
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
         {/* Blue Orb - Moves Down */}
         <div 
           className="absolute top-[5%] left-[15%] w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] will-change-transform opacity-70 mix-blend-screen"
           style={{ transform: `translateY(${scrollY * 0.4}px)` }}
         ></div>
         
         {/* Purple Orb - Moves Up */}
         <div 
           className="absolute bottom-[10%] right-[15%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] will-change-transform opacity-70 mix-blend-screen"
           style={{ transform: `translateY(-${scrollY * 0.3}px)` }}
         ></div>
      </div>
      
      {/* Main Headline */}
      <div className="relative z-10 mb-4 group cursor-default flex flex-col items-center">
        {/* 'The Professor' - Clean & High End */}
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-display font-normal tracking-wide text-text-pri drop-shadow-2xl leading-[0.9] px-4 pb-4">
          <DecryptedText text="The Professor" />
        </h1>
      </div>
      
      {/* Subline - Minimal */}
      <div className="max-w-xl mx-auto relative z-10 px-4 animate-slide-up-fade opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}>
         <div className="text-sm sm:text-base text-text-sec font-mono tracking-widest text-center uppercase">
            Transforming material into mastery.
         </div>
      </div>
    </div>
  );
};
