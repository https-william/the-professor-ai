
import React, { useState, useEffect } from 'react';
import { QuizState, QuizQuestion, Difficulty } from '../types';
import { FlashcardDeck } from './FlashcardDeck';
import { simplifyExplanation } from '../services/geminiService';

interface QuizViewProps {
  quizState: QuizState;
  difficulty?: Difficulty;
  onAnswerSelect: (questionId: number, answer: string) => void;
  onFlagQuestion: (questionId: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onTimeExpired: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ 
  quizState, 
  difficulty = 'Medium',
  onAnswerSelect, 
  onFlagQuestion,
  onSubmit, 
  onReset,
  onTimeExpired
}) => {
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining: initialTime, isCramMode, focusStrikes } = quizState;
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);
  const [viewMode, setViewMode] = useState<'EXAM' | 'FLASHCARDS'>('EXAM');
  const [strikes, setStrikes] = useState(focusStrikes || 0);
  
  // Specific inputs state for current question types
  const [textAnswer, setTextAnswer] = useState('');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>([]);
  
  const [simplifiedExplanations, setSimplifiedExplanations] = useState<Record<number, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null);

  // Sync internal input state when question changes
  useEffect(() => {
      const q = questions[currentQuestionIdx];
      const savedAnswer = userAnswers[q.id];
      
      if (q.type === 'Fill in the Gap') {
          setTextAnswer(savedAnswer || '');
      } else if (q.type === 'Select All That Apply') {
          try {
              setMultiSelectAnswers(savedAnswer ? JSON.parse(savedAnswer) : []);
          } catch {
              setMultiSelectAnswers([]);
          }
      }
  }, [currentQuestionIdx, userAnswers]);

  // FOCUS TRACKING PROTOCOL
  useEffect(() => {
      if (isSubmitted) return;

      const handleVisibilityChange = () => {
          if (document.hidden) {
              handleFocusLost();
          }
      };

      const handleBlur = () => {
          handleFocusLost();
      };

      const handleFocusLost = () => {
          setStrikes(prev => {
              const newStrikes = prev + 1;
              
              // Warning Toast
              const toast = document.createElement('div');
              toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest z-[100] animate-bounce shadow-[0_0_20px_red]';
              toast.innerText = `⚠️ FOCUS LOST. STRIKE ${newStrikes}/3`;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);

              // Nightmare Protocol
              if (difficulty === 'Nightmare' && newStrikes >= 3) {
                  alert("ACADEMIC INTEGRITY VIOLATED. EXAM TERMINATED.");
                  onSubmit();
              }
              
              return newStrikes;
          });
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);

      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('blur', handleBlur);
      };
  }, [isSubmitted, difficulty, onSubmit]);

  // Cram Mode: 10s per question logic
  useEffect(() => {
      if (isCramMode && !isSubmitted) {
          setTimeLeft(10);
      }
  }, [currentQuestionIdx, isCramMode, isSubmitted]);

  // Active Timer Logic
  useEffect(() => {
    if (isSubmitted || timeLeft === null) return;

    if (timeLeft <= 0) {
      if (isCramMode) {
          handleNextQuestion(); // Move to next or submit
      } else {
          onTimeExpired();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, onTimeExpired, isCramMode]);

  const handleNextQuestion = () => {
      if (currentQuestionIdx < questions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
      } else {
          onSubmit();
      }
  };

  // Focus Mode (Fullscreen)
  useEffect(() => {
    if (!isSubmitted) {
        const enterFullscreen = async () => {
            try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) {}
        };
        enterFullscreen();
    }
  }, [isSubmitted]);

  const currentQ = questions[currentQuestionIdx];
  const total = questions.length;
  
  const getAuraClass = () => {
      if (isCramMode) return 'shadow-[0_0_150px_rgba(6,182,212,0.35)] border-cyan-500/50 bg-[#001015]';
      if (difficulty === 'Nightmare') return 'shadow-[0_0_150px_rgba(126,34,206,0.35)] border-purple-600/50 bg-[#0f001a]';
      if (difficulty === 'Hard') return 'shadow-[0_0_80px_rgba(239,68,68,0.25)] border-red-500/40 bg-[#1a0505]';
      if (difficulty === 'Easy') return 'border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]';
      return 'border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)]'; 
  };

  const getXPFeedback = (score: number) => {
      const xp = Math.min(score * 50, 500) * (isCramMode ? 2 : 1); 
      return `+${xp} XP Gained ${isCramMode ? '(2x Adrenaline)' : ''}`;
  };

  const handleELI5 = async (q: QuizQuestion) => {
      if (simplifiedExplanations[q.id]) return;
      setLoadingExplanation(q.id);
      try {
          const simplified = await simplifyExplanation(q.explanation, 'ELI5');
          setSimplifiedExplanations(prev => ({ ...prev, [q.id]: simplified }));
      } catch (e) {
          // ignore error
      } finally {
          setLoadingExplanation(null);
      }
  };

  const saveTextInput = () => {
      if (textAnswer.trim()) {
          onAnswerSelect(currentQ.id, textAnswer.trim());
      }
  };

  const toggleMultiSelect = (opt: string) => {
      let newSelection;
      if (multiSelectAnswers.includes(opt)) {
          newSelection = multiSelectAnswers.filter(o => o !== opt);
      } else {
          newSelection = [...multiSelectAnswers, opt].sort();
      }
      setMultiSelectAnswers(newSelection);
      // Save as JSON string
      onAnswerSelect(currentQ.id, JSON.stringify(newSelection));
  };

  // --- FLASHCARD MODE ---
  if (viewMode === 'FLASHCARDS' && !isSubmitted) {
      return (
          <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
              <div className="w-full flex justify-between mb-4">
                  <button onClick={() => setViewMode('EXAM')} className="text-gray-400 hover:text-white font-bold uppercase text-xs">← Back to Exam</button>
                  <span className="text-amber-500 font-mono text-xs">MEMORY SHARDS</span>
              </div>
              <FlashcardDeck questions={questions} />
          </div>
      )
  }

  // --- REPORT CARD ---
  if (isSubmitted) {
    return (
      <div className="max-w-5xl mx-auto pb-20 px-4 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-bold flex items-center gap-2 text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Exam Results
           </h2>
           <button onClick={onReset} className="px-6 py-2 bg-white text-black rounded-full font-bold uppercase text-xs hover:bg-gray-200">Exit Session</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Score Card */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
                <div className="absolute inset-0 bg-blue-900/10"></div>
                <h1 className="text-8xl font-serif font-bold mb-4 text-white relative z-10">{score}/{total}</h1>
                <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-mono text-blue-300 font-bold uppercase tracking-widest mb-6 border border-white/10">
                    {getXPFeedback(score)}
                </div>
                {strikes > 0 && <div className="text-[10px] text-red-400 font-mono uppercase tracking-widest">⚠️ {strikes} Focus Strikes Detected</div>}
                <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Final Score</p>
            </div>
            
            {/* Feedback Card */}
            <div className="glass-panel rounded-3xl p-10 flex flex-col justify-center items-center relative overflow-hidden min-h-[300px] border-l-4 border-l-amber-500">
                <div className="absolute inset-0 bg-amber-900/5"></div>
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-amber-500/30">👨‍🏫</div>
                <p className="text-xl md:text-2xl text-amber-100 font-serif italic text-center leading-relaxed">
                    "Review your mistakes. The only real failure is stopping."
                </p>
                <div className="mt-8 text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
                    The Professor
                </div>
            </div>
        </div>

        {/* Question Review */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Detailed Analysis</h3>
          {questions.map((q, idx) => {
             const userAnswer = userAnswers[q.id];
             let isCorrect = false;
             
             // Loose comparison for text input
             if (q.type === 'Fill in the Gap') {
                 isCorrect = userAnswer?.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
             } else if (q.type === 'Select All That Apply') {
                 // Compare JSON strings implies sorting
                 isCorrect = userAnswer === JSON.stringify(JSON.parse(q.correct_answer || '[]').sort());
             } else {
                 isCorrect = userAnswer === q.correct_answer;
             }

             const isSkipped = !userAnswer;
             const simpleExpl = simplifiedExplanations[q.id];

             return (
               <div key={q.id} className={`glass-panel rounded-2xl p-6 border-l-4 ${isCorrect ? 'border-l-green-500 bg-green-900/5' : isSkipped ? 'border-l-gray-500' : 'border-l-red-500 bg-red-900/5'}`}>
                  <div className="flex justify-between items-start mb-4">
                     <h4 className="text-lg font-medium text-white max-w-2xl">{idx + 1}. {q.question}</h4>
                     <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border ${
                         isCorrect ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                         isSkipped ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 
                         'bg-red-500/10 text-red-400 border-red-500/20'
                     }`}>
                        {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                     </span>
                  </div>
                  
                  {/* Review Options Rendering */}
                  <div className="space-y-2 mb-6">
                     {q.type === 'Fill in the Gap' ? (
                         <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                             <div className="text-xs text-gray-500 uppercase">Your Answer:</div>
                             <div className={`font-mono text-lg ${isCorrect ? 'text-green-400' : 'text-red-400 line-through'}`}>{userAnswer || '(Blank)'}</div>
                             {!isCorrect && (
                                 <div className="mt-2">
                                     <div className="text-xs text-gray-500 uppercase">Correct Answer:</div>
                                     <div className="font-mono text-lg text-green-400">{q.correct_answer}</div>
                                 </div>
                             )}
                         </div>
                     ) : (
                         q.options.map(opt => {
                            let btnClass = "border-transparent bg-black/20 opacity-60"; 
                            
                            // Highlight logic
                            const isSelected = q.type === 'Select All That Apply' 
                                ? (userAnswer ? JSON.parse(userAnswer).includes(opt) : false)
                                : userAnswer === opt;
                            
                            const isActuallyCorrect = q.type === 'Select All That Apply'
                                ? (JSON.parse(q.correct_answer || '[]').includes(opt))
                                : q.correct_answer === opt;

                            if (isActuallyCorrect) {
                                btnClass = "border-green-500 bg-green-500/10 text-green-200 opacity-100 font-bold";
                            } else if (isSelected && !isActuallyCorrect) {
                                btnClass = "border-red-500 bg-red-500/10 text-red-200 opacity-100 line-through";
                            }
                            
                            return (
                               <div key={opt} className={`p-4 rounded-xl border text-sm transition-all ${btnClass}`}>
                                  {opt}
                               </div>
                            );
                         })
                     )}
                  </div>

                  {/* Explanation */}
                  <div className="text-sm text-gray-300 bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                      <div className="flex gap-3">
                          <div className="shrink-0 mt-0.5 text-blue-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          </div>
                          <div className="flex-1">
                              <strong className="block text-blue-400 uppercase tracking-wider text-[10px] mb-1">Explanation</strong>
                              {simpleExpl ? (
                                  <div className="animate-fade-in bg-amber-900/10 p-2 rounded border border-amber-500/20 text-amber-100">
                                      <strong className="text-amber-500 text-[9px] uppercase block mb-1">Simplified (ELI ...):</strong>
                                      {simpleExpl}
                                  </div>
                              ) : (
                                  q.explanation
                              )}
                          </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                          <button 
                            onClick={() => handleELI5(q)} 
                            disabled={!!simpleExpl || loadingExplanation === q.id}
                            className="text-[10px] font-bold uppercase bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            {loadingExplanation === q.id ? 'Translating...' : 'ELI 5'}
                          </button>
                      </div>
                  </div>
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  // --- EXAM MODE ---
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
       {/* HUD */}
       <div className={`glass-panel p-3 sm:p-4 rounded-2xl mb-4 sticky top-4 z-30 flex flex-col gap-2 backdrop-blur-xl transition-all duration-700 ${getAuraClass()}`}>
          <div className="flex justify-between items-center px-1 sm:px-2">
             <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${isCramMode ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : difficulty === 'Nightmare' ? 'bg-purple-500 shadow-[0_0_10px_purple]' : difficulty === 'Hard' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500'}`}></div>
                 <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-none ${isCramMode ? 'text-cyan-300' : difficulty === 'Nightmare' ? 'text-purple-300 animate-pulse' : 'text-white'}`}>
                    {isCramMode ? 'ADRENALINE PROTOCOL' : difficulty === 'Nightmare' ? 'NIGHTMARE' : difficulty === 'Hard' ? 'HARDCORE' : 'LIVE EXAM'}
                 </span>
             </div>
             
             <div className="flex items-center gap-3">
                 {!isCramMode && (
                     <button onClick={() => setViewMode('FLASHCARDS')} className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest hidden sm:block">
                         Review as Cards
                     </button>
                 )}
                 <div className={`font-mono text-sm sm:text-xl font-bold tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 min-w-[70px] text-center ${isCramMode ? 'text-cyan-400 border-cyan-500/50' : 'text-white'}`}>
                    {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2,'0')}` : '∞'}
                 </div>
             </div>
          </div>
          
          {/* Question Palette */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 pt-2 px-1 border-t border-white/5">
             {questions.map((q, idx) => {
                 let statusColor = "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10";
                 const isFlagged = flaggedQuestions.includes(q.id);
                 
                 if (currentQuestionIdx === idx) {
                     statusColor = isCramMode ? "bg-cyan-600 text-black border-cyan-500 ring-2 ring-cyan-500/30" : "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/30 shadow-lg z-10";
                 } else if (userAnswers[q.id]) {
                     statusColor = "bg-blue-900/20 text-blue-400 border-blue-500/30";
                 } else if (isFlagged) {
                     statusColor = "bg-amber-900/20 text-amber-500 border-amber-500/30";
                 }
                 
                 return (
                    <button 
                      key={q.id} 
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center text-xs font-bold transition-all relative ${statusColor}`}
                    >
                      {idx + 1}
                      {isFlagged && <div className="absolute top-[-2px] right-[-2px] w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_5px_orange] border border-black text-[6px] flex items-center justify-center">!</div>}
                    </button>
                 );
             })}
          </div>
       </div>

       {/* Question Card */}
       <div className={`glass-panel rounded-3xl p-5 md:p-10 flex-1 relative flex flex-col shadow-2xl border-white/10 ${isCramMode ? 'border-cyan-500/20' : ''}`}>
          <div className="flex justify-between items-start mb-6 sm:mb-8">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${isCramMode ? 'text-cyan-400 bg-cyan-900/10 border-cyan-500/20' : 'text-blue-400 bg-blue-900/10 border-blue-500/20'}`}>Question {currentQuestionIdx + 1} / {total}</span>
              <button onClick={() => onFlagQuestion(currentQ.id)} className={`flex items-center gap-2 text-xs uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all ${flaggedQuestions.includes(currentQ.id) ? 'bg-amber-900/20 text-amber-500 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={flaggedQuestions.includes(currentQ.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 01-2-1.85V19a2 2 0 00-2 2h2zM5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H9c-1.105 0-2 .895-2 2v12z" /></svg>
                 {flaggedQuestions.includes(currentQ.id) ? 'Flagged' : 'Flag'}
              </button>
          </div>

          <h2 className="text-lg md:text-2xl font-medium mb-8 leading-relaxed text-white">{currentQ.question}</h2>
          
          <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
             {/* Dynamic Question Body based on Type */}
             {currentQ.type === 'Fill in the Gap' ? (
                 <div className="space-y-4">
                     <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Type your answer below:</p>
                     <input 
                        type="text" 
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        onBlur={saveTextInput}
                        className="w-full bg-transparent border-b-2 border-white/20 text-2xl py-2 px-1 text-white outline-none focus:border-blue-500 transition-colors font-mono"
                        placeholder="Answer..."
                     />
                 </div>
             ) : currentQ.type === 'Select All That Apply' ? (
                 <div className="grid grid-cols-1 gap-3">
                     <p className="text-xs text-gray-500 uppercase mb-2">Select all options that apply:</p>
                     {currentQ.options.map((opt) => {
                         const isSelected = multiSelectAnswers.includes(opt);
                         return (
                             <button
                                key={opt}
                                onClick={() => toggleMultiSelect(opt)}
                                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all group ${
                                    isSelected
                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                    : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                                }`}
                             >
                                 <span>{opt}</span>
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                     {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                 </div>
                             </button>
                         )
                     })}
                 </div>
             ) : (
                 currentQ.options.map((opt) => (
                   <button 
                     key={opt} 
                     onClick={() => onAnswerSelect(currentQ.id, opt)}
                     className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all relative group ${
                        userAnswers[currentQ.id] === opt 
                        ? isCramMode ? 'bg-cyan-600 text-black border-cyan-500 shadow-xl shadow-cyan-900/20 scale-[1.01]' : 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/20 scale-[1.01]' 
                        : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:border-white/10'
                     }`}
                   >
                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all ${userAnswers[currentQ.id] === opt ? 'bg-white/30' : 'bg-transparent'}`}></div>
                     <span className="relative z-10 text-sm sm:text-base">{opt}</span>
                   </button>
                 ))
             )}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
             <button 
               onClick={() => {
                   if (currentQ.type === 'Fill in the Gap') saveTextInput(); // Ensure save on nav
                   setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1));
               }} 
               disabled={currentQuestionIdx === 0} 
               className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs uppercase hover:bg-white/10 disabled:opacity-30 transition-all"
             >
               Prev
             </button>
             {currentQuestionIdx === questions.length - 1 ? (
                <button 
                    onClick={() => {
                        if (currentQ.type === 'Fill in the Gap') saveTextInput();
                        onSubmit();
                    }} 
                    className="px-10 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                    Submit Exam
                </button>
             ) : (
                <button 
                    onClick={() => {
                        if (currentQ.type === 'Fill in the Gap') saveTextInput();
                        handleNextQuestion();
                    }} 
                    className={`px-8 py-3 rounded-xl text-white font-bold text-xs uppercase transition-all shadow-lg ${isCramMode ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20 text-black' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
                >
                    Next
                </button>
             )}
          </div>
       </div>
    </div>
  );
};
