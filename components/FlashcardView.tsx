
import React, { useState } from 'react';
import { QuizState, QuizQuestion, UserProfile } from '../types';
import { generateQuizFromText } from '../services/geminiService';
import { processFile } from '../services/fileService';

interface FlashcardViewProps {
  quizState: QuizState;
  onExit: (force?: boolean) => void;
  onGenerate?: (newState: QuizState) => void;
  userProfile?: UserProfile;
  onDeductCredits?: (amount: number, reason: string) => Promise<boolean>;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ quizState, onExit, onGenerate, userProfile, onDeductCredits }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'LEFT' | 'RIGHT' | null>(null);
  
  // Creation Mode State
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Guard against missing questions
  const questions = quizState?.questions || [];
  
  const currentQ = questions[currentIndex];
  const nextQ = questions[currentIndex + 1];
  const isComplete = questions.length > 0 && currentIndex >= questions.length;

  const handleGenerate = async () => {
      if (!inputText.trim()) return;
      
      // --- GATEKEEPER ---
      if (onDeductCredits) {
          const success = await onDeductCredits(5, "Flashcard Deck");
          if (!success) return;
      }

      setIsGenerating(true);
      try {
          const generatedQuestions = await generateQuizFromText(inputText, {
              difficulty: 'Medium',
              questionType: 'True/False', // Flashcards essentially
              questionCount: 15,
              timerDuration: 'Limitless',
              personality: 'Academic',
              analogyDomain: 'General'
          });
          
          if (onGenerate) {
              onGenerate({
                  questions: generatedQuestions,
                  userAnswers: {},
                  flaggedQuestions: [],
                  isSubmitted: false,
                  score: 0,
                  startTime: Date.now(),
                  timeRemaining: null,
                  currentQuestionIndex: 0,
                  focusStrikes: 0
              });
          }
      } catch (e) {
          alert("Failed to generate deck.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          
          // --- GATEKEEPER ---
          if (onDeductCredits) {
              const success = await onDeductCredits(5, "Flashcard Deck (File)");
              if (!success) return;
          }

          setIsGenerating(true);
          try {
              const file = e.target.files[0];
              const processed = await processFile(file);
              const generatedQuestions = await generateQuizFromText(processed.content, {
                  difficulty: 'Medium',
                  questionType: 'True/False',
                  questionCount: 15,
                  timerDuration: 'Limitless',
                  personality: 'Academic',
                  analogyDomain: 'General'
              });
              if (onGenerate) {
                  onGenerate({
                      questions: generatedQuestions,
                      userAnswers: {},
                      flaggedQuestions: [],
                      isSubmitted: false,
                      score: 0,
                      startTime: Date.now(),
                      timeRemaining: null,
                      currentQuestionIndex: 0,
                      focusStrikes: 0
                  });
              }
          } catch (e) {
              alert("Failed to process file.");
          } finally {
              setIsGenerating(false);
          }
      }
  };

  // CRITICAL GUARD: No questions generated -> Show Creation UI
  if (questions.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-lg mx-auto animate-fade-in">
              <div className="w-20 h-20 bg-pink-900/20 rounded-full flex items-center justify-center mb-6 border border-pink-500/20 text-pink-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-text-pri mb-2 font-display">Create Flashcard Deck</h3>
              <p className="text-text-sec mb-8 text-sm">Paste notes or upload a document to generate a study deck instantly. Cost: 5 NT</p>
              
              <div className="w-full space-y-4">
                  <textarea 
                    className="w-full bg-black/5 dark:bg-white/5 border border-border-main rounded-xl p-4 text-sm outline-none focus:border-pink-500 transition-colors h-32 placeholder-gray-500 text-text-pri"
                    placeholder="Paste topic content here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => document.getElementById('flash-upload')?.click()}
                        className="flex-1 py-3 border border-border-main hover:bg-white/5 rounded-xl font-bold uppercase text-xs tracking-widest text-text-sec transition-colors"
                      >
                          Upload File (5 NT)
                      </button>
                      <input id="flash-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                      
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !inputText.trim()}
                        className="flex-[2] py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg disabled:opacity-50"
                      >
                          {isGenerating ? 'Generating...' : 'Create Deck (5 NT)'}
                      </button>
                  </div>
              </div>
              
              <button onClick={() => onExit(true)} className="mt-8 text-text-sec text-xs font-bold uppercase tracking-widest hover:text-text-pri">Cancel</button>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-text-pri" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-text-pri mb-2">Session Complete</h2>
              <div className="flex gap-4 text-sm font-mono mb-8">
                  <span className="text-green-500">{masteredIds.length} Mastered</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-red-500">{reviewIds.length} To Review</span>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                  <button onClick={handleRestart} className="w-full py-4 bg-text-pri text-core rounded-xl font-bold uppercase text-xs tracking-widest hover:opacity-90 shadow-lg">
                      Restart Session
                  </button>
                  <button onClick={() => onExit(true)} className="w-full py-4 bg-white/5 text-text-sec hover:text-text-pri border border-border-main rounded-xl font-bold uppercase text-xs tracking-widest">
                      Exit
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-lg mx-auto h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center py-4 px-4">
            <button onClick={() => onExit(false)} className="text-text-sec hover:text-text-pri font-bold text-xs uppercase tracking-widest">
                Exit
            </button>
            <div className="text-xs font-mono text-text-sec">
                {currentIndex + 1} / {questions.length}
            </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center perspective-1000">
            {/* Background Card (Next Question) */}
            {nextQ && (
                <div className="absolute inset-4 top-8 bg-black/5 dark:bg-[#151518] rounded-3xl border border-border-main scale-95 opacity-50 translate-y-4"></div>
            )}

            {/* Active Card */}
            <div 
                className={`absolute inset-4 bg-panel rounded-3xl border border-border-main shadow-2xl flex flex-col transition-all duration-300 cursor-pointer overflow-hidden transform ${
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
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-2xl border border-blue-500/20 text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl md:text-2xl font-medium text-text-pri leading-relaxed select-none">
                                {currentQ.question}
                            </h3>
                            <p className="absolute bottom-8 text-[10px] text-text-sec font-bold uppercase tracking-widest animate-pulse">Tap to Flip</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex flex-col items-center w-full">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-2xl border border-green-500/20 text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-green-500 mb-4 select-none">
                                {currentQ.correct_answer}
                            </h3>
                            <p className="text-sm text-text-sec leading-relaxed select-none">
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
                    className="w-12 h-12 rounded-full bg-white/5 border border-border-main text-text-sec flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
                    title="Previous Card"
                >
                    ←
                </button>
            ) : <div className="w-12"></div>}

            <button 
                onClick={() => handleSwipe('LEFT')}
                className="w-16 h-16 rounded-full bg-white/5 border border-red-500/30 text-red-500 text-2xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
                ✕
            </button>
            
            <button 
                onClick={() => setFlipped(!flipped)}
                className="px-6 py-3 rounded-full bg-white/5 text-text-sec text-xs font-bold uppercase hover:bg-white/10 transition-all border border-border-main"
            >
                {flipped ? 'Hide' : 'Show'}
            </button>

            <button 
                onClick={() => handleSwipe('RIGHT')}
                className="w-16 h-16 rounded-full bg-white/5 border border-green-500/30 text-green-500 text-2xl flex items-center justify-center shadow-lg hover:bg-green-500 hover:text-white transition-all active:scale-95"
            >
                ✓
            </button>
            
            <div className="w-12"></div>
        </div>
    </div>
  );
};

export default FlashcardView;
