
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
  const [flipped, setFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'LEFT' | 'RIGHT' | null>(null);
  
  // Creation Mode State
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Use local safe check
  const questions = quizState?.questions || [];
  const currentQ = questions[currentIndex];
  
  // Check if we need to show creation mode
  const showCreation = questions.length === 0;

  const handleGenerate = async () => {
      if (!inputText.trim()) return;
      
      // Gatekeeper
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

  if (showCreation) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-lg mx-auto animate-fade-in relative">
              <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent blur-[100px] pointer-events-none"></div>
              
              <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-pink-900/50 transform rotate-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-2 font-display">Flash Shards</h3>
              <p className="text-gray-400 mb-8 text-sm">Convert notes into high-velocity recall cards. Cost: 5 NT</p>
              
              <div className="w-full space-y-4 bg-black/40 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                  <textarea 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-pink-500 transition-colors h-32 placeholder-gray-600 text-white resize-none"
                    placeholder="Paste topic content here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest text-gray-400 transition-colors"
                      >
                          Upload File
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                      
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !inputText.trim()}
                        className="flex-[2] py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg disabled:opacity-50"
                      >
                          {isGenerating ? 'Synthesizing...' : 'Generate Deck'}
                      </button>
                  </div>
              </div>
              
              <button onClick={() => onExit(true)} className="mt-8 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
          </div>
      );
  }

  // Flashcard Viewer
  const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
    setSwipeDirection(direction);
    setTimeout(() => {
        setFlipped(false);
        setSwipeDirection(null);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Loop deck
            setCurrentIndex(0);
        }
    }, 300);
  };

  return (
    <div className="max-w-md mx-auto h-[80vh] flex flex-col relative px-4">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-white">Deck Active</span>
            </div>
            <button onClick={() => onExit(true)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Card Stack Area */}
        <div className="flex-1 relative flex items-center justify-center perspective-1000">
            {/* Background Hints of Cards */}
            <div className="absolute inset-x-8 top-12 bottom-4 bg-white/5 rounded-[2rem] scale-90 translate-y-4 opacity-50"></div>
            <div className="absolute inset-x-6 top-10 bottom-6 bg-white/5 rounded-[2rem] scale-95 translate-y-2 opacity-70"></div>

            {/* Active Card */}
            <div 
                className={`absolute inset-0 w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''} ${swipeDirection === 'LEFT' ? '-translate-x-[120%] rotate-[-20deg] opacity-0' : swipeDirection === 'RIGHT' ? 'translate-x-[120%] rotate-[20deg] opacity-0' : ''}`}
                onClick={() => setFlipped(!flipped)}
            >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-[#121212] border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                    <div className="absolute top-6 left-6 text-pink-500/50 text-xs font-mono">Q.{currentIndex + 1}</div>
                    <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed select-none">{currentQ.question}</h3>
                    <p className="absolute bottom-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest">Tap to Flip</p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden bg-[#0a0a0a] border border-pink-500/30 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl rotate-y-180">
                    <div className="w-12 h-12 bg-pink-900/20 rounded-full flex items-center justify-center mb-6 text-pink-500 border border-pink-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-relaxed mb-2 select-none">{currentQ.correct_answer}</h3>
                    <p className="text-sm text-gray-400 select-none">{currentQ.explanation}</p>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="h-24 flex items-center justify-center gap-8 pb-6">
            <button onClick={() => handleSwipe('LEFT')} className="p-4 bg-black/40 border border-white/10 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-xs font-mono text-gray-500">{currentIndex + 1} / {questions.length}</div>
            <button onClick={() => handleSwipe('RIGHT')} className="p-4 bg-black/40 border border-white/10 rounded-full text-green-500 hover:bg-green-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
        </div>
    </div>
  );
};

export default FlashcardView;
