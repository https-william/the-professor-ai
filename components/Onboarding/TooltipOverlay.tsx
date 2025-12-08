import React, { useState } from 'react';

interface TooltipOverlayProps {
  onComplete: () => void;
}

export const TooltipOverlay: React.FC<TooltipOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const tooltips = [
    {
      targetId: 'mode-toggle',
      title: 'Split Personality',
      text: "Toggle between 'Exam Mode' (Torture) and 'Professor Mode' (Nurture). One tests you, the other teaches you.",
      position: 'bottom'
    },
    {
      targetId: 'config-section',
      title: 'Choose Your Poison',
      text: "Configure your exam. Warning: 'Nightmare' difficulty is not a joke. It will hurt.",
      position: 'bottom'
    },
    {
      targetId: 'knowledge-base',
      title: 'Feed The Beast',
      text: "Upload PDFs, Word docs, Images, or paste text here. We eat knowledge for breakfast.",
      position: 'top'
    }
  ];

  const currentTooltip = tooltips[step];

  const handleNext = () => {
    if (step < tooltips.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  // Calculate position styles roughly based on target IDs presence
  // Note: For a robust impl, we'd use getBoundingClientRect, but simple CSS overrides work for this controlled layout
  const getTooltipStyle = () => {
     // Hardcoded relative positions for the known layout to simplify
     switch(step) {
       case 0: return { top: '140px', left: '50%', transform: 'translateX(-50%)' };
       case 1: return { top: '300px', left: '50%', transform: 'translateX(-50%)' };
       case 2: return { bottom: '180px', left: '50%', transform: 'translateX(-50%)' };
       default: return {};
     }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500"></div>

      {/* Highlighter (Mocking visually) */}
      {/* In a real scenario, we'd use z-index manipulation on the target elements, but here we just overlay the tooltip */}
      
      <div 
        className="absolute w-80 bg-white text-black p-6 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.3)] animate-bounce-subtle transition-all duration-500"
        style={getTooltipStyle()}
      >
         <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 transform origin-center"></div>
         
         <div className="relative z-10">
            <h3 className="text-xl font-extrabold mb-2">{currentTooltip.title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{currentTooltip.text}</p>
            
            <div className="flex justify-between items-center">
               <div className="flex gap-1">
                 {tooltips.map((_, i) => (
                   <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-black' : 'bg-gray-300'}`} />
                 ))}
               </div>
               <button 
                 onClick={handleNext}
                 className="px-6 py-2 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
               >
                 {step === tooltips.length - 1 ? "Finish" : "Next"}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};