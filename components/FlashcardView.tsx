import React, { useState } from 'react';
import { QuizState, QuizQuestion } from '../types';

interface FlashcardViewProps {
  quizState: QuizState;
  onExit: (force?: boolean) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ quizState, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'LEFT' | 'RIGHT' | null>(null);
  
  // Guard against missing questions
  const questions = quizState?.questions || [];
  
  const currentQ = questions[currentIndex];
  const nextQ = questions[currentIndex + 1];
  const isComplete = questions.length > 0 && currentIndex >= questions.length;

  // CRITICAL GUARD: No questions generated
  if (questions.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
              <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Empty Deck</h3>
              <p className="text-gray-400 mb-6">No study cards could be generated from this content.</p>
              <button onClick={() => onExit(true)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase text-xs">Exit</button>
          </div>
      );
  }

  const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
    if (!currentQ) return;
    setSwipeDirection(direction);
    setFlipped(false);

    setTimeout(() => {
        if (direction === 'RIGHT') {
            // SRS: Mastered
            setMasteredIds(prev => [...prev, currentQ.id]);
        } else {
            // SRS: Review
            setReviewIds(prev => [...prev, currentQ.id]);
        }
        
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
    }, 300);
  };

  const handlePrevious = () => {
      if (currentIndex > 0) {
          setFlipped(false);
          const prevQ = questions[currentIndex - 1];
          // Remove previous question from mastered/review lists if it was there
          setMasteredIds(prev => prev.filter(id => id !== prevQ.id));
          setReviewIds(prev => prev.filter(id => id !== prevQ.id));
          setCurrentIndex(prev => prev - 1);
      }
  };

  const handleRestart = () => {
      setCurrentIndex(0);
      setMasteredIds([]);
      setReviewIds([]);
  };

  if (isComplete) {
      return (
          <div className="max-w-md mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
              <div className="flex gap-4 text-sm font-mono mb-8">
                  <span className="text-green-400">{masteredIds.length} Mastered</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-red-400">{reviewIds.length} To Review</span>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                  <button onClick={handleRestart} className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 shadow-lg">
                      Restart Session
                  </button>
                  <button onClick={() => onExit(true)} className="w-full py-4 bg-white/5 text-gray-400 hover:text-white border border-white/10 rounded-xl font-bold uppercase text-xs tracking-widest">
                      Exit
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-lg mx-auto h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center py-4 px-4">
            <button onClick={() => onExit(false)} className="text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest">
                Exit
            </button>
            <div className="text-xs font-mono text-gray-500">
                {currentIndex + 1} / {questions.length}
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
                            <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-blue-500/20 text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed select-none">
                                {currentQ.question}
                            </h3>
                            <p className="absolute bottom-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest animate-pulse">Tap to Flip</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex flex-col items-center w-full">
                            <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-green-500/20 text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
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
        <div className="h-24 flex items-center justify-center gap-6 pb-4">
            {currentIndex > 0 ? (
                <button 
                    onClick={handlePrevious}
                    className="w-12 h-12 rounded-full bg-[#1a1a1d] border border-white/10 text-gray-400 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
                    title="Previous Card"
                >
                    ←
                </button>
            ) : <div className="w-12"></div>}

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
            
            <div className="w-12"></div>
        </div>
    </div>
  );
};

export default FlashcardView;