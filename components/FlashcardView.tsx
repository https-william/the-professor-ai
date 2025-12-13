
import React, { useState, useRef } from 'react';
import { QuizState, QuizQuestion } from '../types';

interface FlashcardViewProps {
  quizState: QuizState;
  onExit: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ quizState, onExit }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(quizState.questions);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'LEFT' | 'RIGHT' | null>(null);
  
  // Only handle one card at a time (the first in the array)
  const currentQ = questions[0];
  const nextQ = questions[1];

  const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
    if (!currentQ) return;
    setSwipeDirection(direction);
    setFlipped(false);

    setTimeout(() => {
        if (direction === 'RIGHT') {
            setMasteredIds(prev => [...prev, currentQ.id]);
        } else {
            setReviewIds(prev => [...prev, currentQ.id]);
        }
        
        // Remove current card
        setQuestions(prev => prev.slice(1));
        setSwipeDirection(null);
    }, 300); // Wait for animation
  };

  const handleRestart = () => {
      // Create a new session with review items if any, else restart all
      if (reviewIds.length > 0) {
          const reviewQuestions = quizState.questions.filter(q => reviewIds.includes(q.id));
          setQuestions(reviewQuestions);
      } else {
          setQuestions(quizState.questions);
      }
      setMasteredIds([]);
      setReviewIds([]);
  };

  if (!currentQ) {
      return (
          <div className="max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
              <div className="flex gap-4 text-sm font-mono mb-8">
                  <span className="text-green-400">{masteredIds.length} Mastered</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-red-400">{reviewIds.length} To Review</span>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                  <button onClick={handleRestart} className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 shadow-lg">
                      {reviewIds.length > 0 ? 'Review Weaknesses' : 'Restart All'}
                  </button>
                  <button onClick={onExit} className="w-full py-4 bg-white/5 text-gray-400 hover:text-white border border-white/10 rounded-xl font-bold uppercase text-xs tracking-widest">
                      Exit
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-lg mx-auto h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center py-4 px-4">
            <button onClick={onExit} className="text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest">
                Exit
            </button>
            <div className="text-xs font-mono text-gray-500">
                {quizState.questions.length - questions.length + 1} / {quizState.questions.length}
            </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center perspective-1000">
            {/* Background Card (Next Question) */}
            {nextQ && (
                <div className="absolute inset-4 top-8 bg-[#151518] rounded-3xl border border-white/5 scale-95 opacity-50 translate-y-4"></div>
            )}

            {/* Active Card */}
            <div 
                className={`absolute inset-4 bg-[#1a1a1d] rounded-3xl border border-white/10 shadow-2xl flex flex-col transition-all duration-300 cursor-pointer overflow-hidden transform ${
                    swipeDirection === 'LEFT' ? '-translate-x-full rotate-[-15deg] opacity-0' : 
                    swipeDirection === 'RIGHT' ? 'translate-x-full rotate-[15deg] opacity-0' : ''
                }`}
                onClick={() => setFlipped(!flipped)}
            >
                {/* Swipe Overlay Indicators */}
                {swipeDirection === 'RIGHT' && (
                    <div className="absolute inset-0 bg-green-500/20 z-20 flex items-center justify-center">
                        <div className="border-4 border-green-500 text-green-500 font-black text-4xl uppercase px-4 py-2 rounded-xl transform -rotate-12">
                            MASTERED
                        </div>
                    </div>
                )}
                {swipeDirection === 'LEFT' && (
                    <div className="absolute inset-0 bg-red-500/20 z-20 flex items-center justify-center">
                        <div className="border-4 border-red-500 text-red-500 font-black text-4xl uppercase px-4 py-2 rounded-xl transform rotate-12">
                            REVIEW
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative backface-hidden">
                    {!flipped ? (
                        <div className="animate-fade-in flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-blue-500/20">❓</div>
                            <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed select-none">
                                {currentQ.question}
                            </h3>
                            <p className="absolute bottom-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest animate-pulse">Tap to Flip</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex flex-col items-center w-full">
                            <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-green-500/20">💡</div>
                            <h3 className="text-xl font-bold text-green-400 mb-4 select-none">
                                {currentQ.correct_answer}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed select-none">
                                {currentQ.explanation}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="h-24 flex items-center justify-center gap-8 pb-4">
            <button 
                onClick={() => handleSwipe('LEFT')}
                className="w-16 h-16 rounded-full bg-[#1a1a1d] border border-red-500/30 text-red-500 text-2xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
                ✕
            </button>
            
            <button 
                onClick={() => setFlipped(!flipped)}
                className="px-6 py-3 rounded-full bg-white/5 text-gray-400 text-xs font-bold uppercase hover:bg-white/10 transition-all border border-white/5"
            >
                {flipped ? 'Hide' : 'Show'}
            </button>

            <button 
                onClick={() => handleSwipe('RIGHT')}
                className="w-16 h-16 rounded-full bg-[#1a1a1d] border border-green-500/30 text-green-500 text-2xl flex items-center justify-center shadow-lg hover:bg-green-500 hover:text-white transition-all active:scale-95"
            >
                ✓
            </button>
        </div>
    </div>
  );
};
