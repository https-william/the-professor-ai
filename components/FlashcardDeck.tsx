
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface FlashcardDeckProps {
  questions: QuizQuestion[];
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ questions }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  const currentQ = questions[index];

  return (
    <div className="w-full max-w-lg aspect-[3/4] sm:aspect-video perspective-1000">
        <div className="flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            <button onClick={handlePrev} className="hover:text-white transition-colors">← Prev</button>
            <span>Shard {index + 1} / {questions.length}</span>
            <button onClick={handleNext} className="hover:text-white transition-colors">Next →</button>
        </div>

        <div 
            className={`relative w-full h-full cursor-pointer transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-blue-500/20 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-medium text-white leading-relaxed">{currentQ.question}</h3>
                <p className="absolute bottom-8 text-[10px] uppercase tracking-widest text-gray-600">Tap to Reveal</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-[#0f0f11] border border-amber-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl rotate-y-180">
                <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-green-500/20 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-green-400 leading-relaxed mb-4">{currentQ.correct_answer}</h3>
                <p className="text-sm text-gray-400">{currentQ.explanation}</p>
            </div>
        </div>
    </div>
  );
};
