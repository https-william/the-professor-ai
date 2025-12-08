
import React, { useState, useEffect } from 'react';
import { QuizState, QuizQuestion } from '../types';

interface QuizViewProps {
  quizState: QuizState;
  onAnswerSelect: (questionId: number, answer: string) => void;
  onFlagQuestion: (questionId: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onTimeExpired: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ 
  quizState, 
  onAnswerSelect, 
  onFlagQuestion,
  onSubmit, 
  onReset,
  onTimeExpired
}) => {
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining } = quizState;
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  
  // Timer Logic
  useEffect(() => {
    if (!isSubmitted && timeRemaining !== null) {
      if (timeRemaining <= 0) {
        onTimeExpired();
        return;
      }
    }
  }, [timeRemaining, isSubmitted, onTimeExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVerdict = (percentage: number) => {
    if (percentage === 100) return { title: "Academic Weapon", color: "text-amber-400", msg: "Flawless victory. The Professor is impressed." };
    if (percentage >= 90) return { title: "Summa Cum Laude", color: "text-blue-400", msg: "Exceptional work. You know your stuff." };
    if (percentage >= 80) return { title: "Distinction", color: "text-green-400", msg: "Solid performance. Keep sharpening the mind." };
    if (percentage >= 60) return { title: "Passing Grade", color: "text-gray-300", msg: "You survived, but there is room for improvement." };
    if (percentage >= 40) return { title: "Academic Probation", color: "text-orange-400", msg: "You need to study harder. Much harder." };
    return { title: "Expulsion Imminent", color: "text-red-500", msg: "See me after class. Immediately." };
  };

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const verdict = getVerdict(percentage);
  const currentQ = questions[currentQuestionIdx];

  // --- REPORT CARD (SUBMITTED) ---
  if (isSubmitted) {
    return (
      <div className="max-w-5xl mx-auto pb-20 animate-fade-in relative z-10 px-4">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <span className="text-2xl">📊</span> Results
           </h2>
           <button onClick={onReset} className="px-6 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full font-bold transition-all text-sm uppercase tracking-wider">
             Exit
           </button>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden text-center border-t border-white/10">
          <div className="relative z-10">
            <h1 className={`text-4xl md:text-6xl font-serif font-bold mb-4 ${verdict.color} drop-shadow-lg`}>
              {verdict.title}
            </h1>
            <p className="opacity-60 text-lg mb-8 max-w-lg mx-auto font-light">"{verdict.msg}"</p>
            <div className="flex items-end justify-center gap-2 mb-2">
              <span className="text-8xl font-bold tracking-tighter leading-none">{score}</span>
              <span className="text-2xl opacity-50 font-medium mb-3">/ {questions.length}</span>
            </div>
            <div className="text-sm font-bold uppercase tracking-widest opacity-50">Final Score</div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold opacity-60 uppercase tracking-wider">Performance Breakdown</h3>
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            const isSkipped = !userAnswer;
            return (
              <div key={q.id} className={`glass-panel rounded-2xl p-6 border-l-4 ${isCorrect ? 'border-l-green-500' : isSkipped ? 'border-l-gray-500' : 'border-l-red-500'}`}>
                <div className="flex items-start gap-4">
                  <span className="text-xs font-bold opacity-50 mt-1">Q{idx + 1}</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium mb-4">{q.question}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : isSkipped ? 'bg-gray-800 border-gray-700' : 'bg-red-500/10 border-red-500/30'}`}>
                         <div className="text-[10px] uppercase font-bold mb-1 opacity-70 flex items-center gap-2">
                           Your Answer
                           {isCorrect ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
                         </div>
                         <div className={`${isCorrect ? 'text-green-300' : isSkipped ? 'text-gray-400 italic' : 'text-red-300'}`}>
                           {userAnswer || 'Skipped'}
                         </div>
                      </div>
                      {!isCorrect && (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <div className="text-[10px] uppercase font-bold text-blue-400 mb-1 opacity-70">Correct Answer</div>
                          <div className="text-blue-200">{q.correct_answer}</div>
                        </div>
                      )}
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold opacity-50">Explanation</span>
                      </div>
                      <p className="opacity-80 text-sm leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- EXAM MODE (Active) ---
  const QuestionPalette = () => (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Question Palette</span>
          <span className="text-xs opacity-60">{Object.keys(userAnswers).length}/{questions.length} Answered</span>
        </div>
        
        <div className="grid grid-cols-5 gap-2 overflow-y-auto custom-scrollbar pr-2 content-start flex-1">
           {questions.map((q, idx) => {
             const isActive = idx === currentQuestionIdx;
             const isAnswered = !!userAnswers[q.id];
             const isFlagged = flaggedQuestions.includes(q.id);
             return (
               <button
                 key={q.id}
                 onClick={() => { setCurrentQuestionIdx(idx); setIsMobilePaletteOpen(false); }}
                 className={`
                   relative h-10 rounded-lg text-sm font-bold transition-all
                   ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400' 
                      : isAnswered 
                         ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' 
                         : 'bg-white/5 opacity-60 hover:opacity-100'
                   }
                 `}
               >
                 {idx + 1}
                 {isFlagged && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#18181b] translate-x-1/2 -translate-y-1/2"></div>}
               </button>
             )
           })}
        </div>
        <div className="mt-6 pt-6 border-t border-white/5">
             <button 
                onClick={onSubmit}
                className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
             >
               Submit Exam
             </button>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto h-[calc(100vh-100px)] relative z-10 pb-6">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden lg:flex w-80 flex-shrink-0 flex-col gap-4">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
           {timeRemaining !== null ? (
             <>
               <span className="text-xs font-bold opacity-50 uppercase tracking-widest mb-2">Time Remaining</span>
               <div className={`text-5xl font-mono font-bold tracking-tighter tabular-nums ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : ''}`}>
                 {formatTime(timeRemaining)}
               </div>
             </>
           ) : <span className="text-xs font-mono uppercase tracking-widest opacity-50">No Limit</span>}
        </div>
        <div className="glass-panel p-6 rounded-2xl flex-1 overflow-hidden flex flex-col">
          <QuestionPalette />
        </div>
      </div>

      {/* --- MOBILE HUD & DRAWER --- */}
      <div className="lg:hidden flex items-center justify-between glass-panel p-4 rounded-xl mb-2 sticky top-20 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobilePaletteOpen(true)} className="p-2 bg-white/10 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-sm font-bold uppercase tracking-wider">Q {currentQuestionIdx + 1}</span>
        </div>
        <div className="font-mono font-bold text-xl tabular-nums">
           {timeRemaining !== null ? formatTime(timeRemaining) : "∞"}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobilePaletteOpen(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-[#18181b] rounded-t-3xl p-6 h-[70vh] border-t border-white/10 flex flex-col animate-slide-up-fade">
             <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>
             <QuestionPalette />
          </div>
        </div>
      )}

      {/* --- MAIN QUESTION AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="glass-panel flex-1 rounded-[2rem] p-6 md:p-12 relative flex flex-col animate-slide-up-fade overflow-hidden">
           
           {/* Header */}
           <div className="flex justify-between items-start mb-6 md:mb-8 pb-6 border-b border-white/5 relative">
              <div className="pr-12">
                <span className="text-blue-500 font-mono text-xs font-bold uppercase tracking-widest mb-2 block">Question {currentQuestionIdx + 1}</span>
                <h2 className="text-xl md:text-2xl font-serif leading-relaxed font-medium">
                  {currentQ.question}
                </h2>
              </div>
              
              {/* FIXED FLAG ICON: Magnetic Bookmark Style */}
              <button 
                onClick={() => onFlagQuestion(currentQ.id)}
                className="absolute top-0 right-0 -mr-2 -mt-2 group"
                title="Flag for Review"
              >
                <div className={`
                   relative w-8 h-12 flex items-end justify-center pb-2 shadow-lg transition-all duration-300
                   ${flaggedQuestions.includes(currentQ.id) 
                      ? 'bg-orange-500 translate-y-0' 
                      : 'bg-gray-700 -translate-y-2 group-hover:translate-y-0 group-hover:bg-orange-500/50'
                   }
                `}>
                  {/* Triangle Cutout */}
                  <div className={`absolute bottom-0 left-0 w-full h-4 bg-[#1e1e20] transform clip-triangle`} style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white z-10 mb-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
           </div>

           {/* Options */}
           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
             {currentQ.options.map((option, i) => {
               const isSelected = userAnswers[currentQ.id] === option;
               const alphabet = String.fromCharCode(65 + i);

               return (
                 <button
                   key={option}
                   onClick={() => onAnswerSelect(currentQ.id, option)}
                   className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 group flex items-start gap-4 md:gap-5 ${
                     isSelected 
                       ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                       : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                   }`}
                 >
                   <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm md:text-lg border transition-colors ${
                     isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-black/20 border-white/10 opacity-60 group-hover:opacity-100 group-hover:border-white/30'
                   }`}>
                     {alphabet}
                   </div>
                   <span className={`text-base md:text-lg font-light pt-0.5 ${isSelected ? '' : 'opacity-80 group-hover:opacity-100'}`}>
                     {option}
                   </span>
                 </button>
               )
             })}
           </div>

           {/* Footer Nav */}
           <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-auto">
              <button 
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIdx === 0}
                className={`px-4 md:px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors ${
                  currentQuestionIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Prev
              </button>

              <button 
                onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIdx === questions.length - 1}
                className={`px-6 md:px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 ${
                  currentQuestionIdx === questions.length - 1 
                    ? 'opacity-30 cursor-not-allowed bg-white/5' 
                    : 'bg-white text-black hover:bg-gray-200 shadow-lg'
                }`}
              >
                Next
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
