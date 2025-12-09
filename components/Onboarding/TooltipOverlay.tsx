import React, { useState, useEffect, useCallback } from 'react';

interface TooltipOverlayProps {
  onComplete: () => void;
}

export const TooltipOverlay: React.FC<TooltipOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<React.CSSProperties>({});
  
  const tooltips = [
    {
      targetId: 'mode-switch-target',
      title: 'Split Personality',
      text: "Choose your pain. 'Exam Mode' drills you until you cry. 'Professor Mode' explains things nicely until you understand.",
      placement: 'bottom'
    },
    {
      targetId: 'exam-config-target',
      title: 'Choose Your Poison',
      text: "Configure the intensity. 'Nightmare' difficulty is not a marketing term. It is a threat. Use with caution.",
      placement: 'bottom'
    },
    {
      targetId: 'upload-zone-target',
      title: 'Feed The Beast',
      text: "Drag your lecture slides, PDFs, or raw chaos here. I will organize it into a curriculum in seconds.",
      placement: 'top'
    }
  ];

  const currentTooltip = tooltips[step];

  const updatePosition = useCallback(() => {
    const target = document.getElementById(currentTooltip.targetId);
    
    // Check if mobile
    if (window.innerWidth < 768) {
      // Mobile "Bottom Sheet" Style
      setPosition({
         position: 'fixed',
         bottom: '0',
         left: '0',
         right: '0',
         top: 'auto',
         width: '100%',
         borderRadius: '1.5rem 1.5rem 0 0',
         zIndex: 100,
         transform: 'none',
         margin: 0
      });
      // Try to scroll target into view roughly
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Desktop Positioning
    if (target) {
      const rect = target.getBoundingClientRect();
      let style: React.CSSProperties = {};
      
      const TOOLTIP_WIDTH = 320;

      if (currentTooltip.placement === 'bottom') {
           style = {
             top: rect.bottom + 20,
             left: rect.left + (rect.width / 2) - (TOOLTIP_WIDTH / 2),
           };
      } else {
           style = {
             top: rect.top - 220, // Approximate height offset
             left: rect.left + (rect.width / 2) - (TOOLTIP_WIDTH / 2),
           };
      }
      setPosition(style);
      
      // Scroll to element
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTooltip, step]);

  useEffect(() => {
    // Small delay to ensure render
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [step, updatePosition]);

  const handleNext = () => {
    if (step < tooltips.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-500"></div>

      <div 
        className="absolute w-full md:w-80 bg-[#18181b] text-white p-6 md:rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] border-t md:border border-white/20 animate-slide-up-fade transition-all duration-500"
        style={position}
      >
         {/* Arrow (Hidden on Mobile) */}
         <div className="hidden md:block absolute w-4 h-4 bg-[#18181b] border-t border-l border-white/20 transform rotate-45 -top-2 left-1/2 -translate-x-1/2"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-lg font-bold text-white">{currentTooltip.title}</h3>
               <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">{step + 1}/{tooltips.length}</span>
            </div>
            
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">{currentTooltip.text}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
               <button onClick={onComplete} className="text-xs text-gray-500 hover:text-white transition-colors">Skip Tour</button>
               <button 
                 onClick={handleNext}
                 className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg"
               >
                 {step === tooltips.length - 1 ? "Start" : "Next"}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};