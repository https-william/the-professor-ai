
import React, { useState } from 'react';

interface FeatureTourModalProps {
  onComplete: () => void;
}

export const FeatureTourModal: React.FC<FeatureTourModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Welcome to The Professor",
      desc: "Your AI-powered academic accelerator. I don't just help you study; I help you master the material.",
      icon: "⚡"
    },
    {
        title: "The Core: Neural Ingestion",
        desc: "Upload PDFs, Docs, or Paste Notes. I digest chaos and output structure.",
        icon: "🧠"
    },
    {
        title: "Exam Mode",
        desc: "Interactive quizzes with adaptive difficulty. 'Nightmare' mode is not a suggestion—it's a threat.",
        icon: "📝"
    },
    {
        title: "Neural Tokens (NT)",
        desc: "Your currency for intelligence. Each generation costs NT. Refill via the 'Tuition' plan or wait for daily drops.",
        icon: "💎"
    },
    {
        title: "The Arena",
        desc: "Multiplayer academic combat. Wager XP against peers. Winner takes all.",
        icon: "⚔️"
    }
  ];

  const handleNext = () => {
      if (step < slides.length - 1) setStep(step + 1);
      else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fade-in">
        <div className="relative w-full max-w-sm bg-panel border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center">
            
            {/* Glass Shine */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative z-10 animate-float">
                {slides[step].icon}
            </div>

            <h2 className="text-2xl font-bold text-white mb-3 relative z-10">{slides[step].title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8 relative z-10 min-h-[80px]">
                {slides[step].desc}
            </p>

            <div className="flex gap-2 mb-8">
                {slides.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-white/10'}`}></div>
                ))}
            </div>

            <button 
                onClick={handleNext}
                className="w-full py-4 rounded-xl btn-glass font-bold uppercase text-xs tracking-widest"
            >
                {step === slides.length - 1 ? "Initialize System" : "Next Protocol"}
            </button>
        </div>
    </div>
  );
};
