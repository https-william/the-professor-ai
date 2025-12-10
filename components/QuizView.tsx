
import React, { useState, useEffect } from 'react';
import { QuizState, QuizQuestion, Difficulty } from '../types';

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
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining: initialTime } = quizState;
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);

  // Active Timer Logic
  useEffect(() => {
    if (isSubmitted || timeLeft === null) return;

    if (timeLeft <= 0) {
      onTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, onTimeExpired]);

  // Focus Mode Logic
  useEffect(() => {
    if (!isSubmitted) {
        const enterFullscreen = async () => {
            try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) {}
        };
        enterFullscreen();
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Optional: Alert on focus loss
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }
  }, [isSubmitted]);

  const currentQ = questions[currentQuestionIdx];
  const total = questions.length;
  
  // Difficulty Aura Logic (Enhanced)
  const getAuraClass = () => {
      if (difficulty === 'Nightmare') return 'shadow-[0_0_150px_rgba(126,34,206,0.35)] border-purple-600/50 bg-[#0f001a]';
      if (difficulty === 'Hard') return 'shadow-[0_0_80px_rgba(239,68,68,0.25)] border-red-500/40 bg-[#1a0505]';
      if (difficulty === 'Easy') return 'border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]';
      return 'border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)]'; // Medium
  };

  const getFeedback = (score: number, total: number) => {
      const percentage = (score / total) * 100;
      if (percentage < 50) return "Abysmal. My grandmother reads faster than you think. See me immediately.";
      if (percentage < 70) return "Mediocre. You have memorized, but you have not understood. Do it again.";
      if (percentage < 90) return "Acceptable. You are beginning to grasp the basics. Do not get comfortable.";
      return "Excellentia. You may actually survive the final. Keep this pace.";
  };

  const getXPFeedback = (score: number) => {
      const xp = Math.min(score * 50, 500); 
      return `+${xp} XP Gained`;
  };

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
                <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Final Score</p>
            </div>
            
            {/* Feedback Card */}
            <div className="glass-panel rounded-3xl p-10 flex flex-col justify-center items-center relative overflow-hidden min-h-[300px] border-l-4 border-l-amber-500">
                <div className="absolute inset-0 bg-amber-900/5"></div>
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 text-2xl border border-amber-500/30">👨‍🏫</div>
                <p className="text-xl md:text-2xl text-amber-100 font-serif italic text-center leading-relaxed">
                    "{getFeedback(score, total)}"
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
             const isCorrect = userAnswer === q.correct_answer;
             const isSkipped = !userAnswer;

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
                  
                  <div className="space-y-2 mb-6">
                     {q.options.map(opt => {
                        let btnClass = "border-transparent bg-black/20 opacity-60"; 
                        
                        if (opt === q.correct_answer) {
                            btnClass = "border-green-500 bg-green-500/10 text-green-200 opacity-100 font-bold";
                        } else if (opt === userAnswer && !isCorrect) {
                            btnClass = "border-red-500 bg-red-500/10 text-red-200 opacity-100 line-through";
                        } else if (opt === userAnswer && isCorrect) {
                            // Already handled by correct_answer check above
                        }
                        
                        return (
                           <div key={opt} className={`p-4 rounded-xl border text-sm transition-all ${btnClass}`}>
                              {opt}
                           </div>
                        );
                     })}
                  </div>
                  <div className="text-sm text-gray-300 bg-black/30 p-4 rounded-xl border border-white/5 flex gap-3">
                      <div className="shrink-0 mt-0.5 text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      </div>
                      <div>
                          <strong className="block text-blue-400 uppercase tracking-wider text-[10px] mb-1">Explanation</strong>
                          {q.explanation}
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
       {/* HUD & Navigation */}
       <div className={`glass-panel p-3 sm:p-4 rounded-2xl mb-4 sticky top-4 z-30 flex flex-col gap-2 backdrop-blur-xl transition-all duration-700 ${getAuraClass()}`}>
          
          {/* Top Bar: Difficulty & Timer */}
          <div className="flex justify-between items-center px-1 sm:px-2">
             <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${difficulty === 'Nightmare' ? 'bg-purple-500 shadow-[0_0_10px_purple]' : difficulty === 'Hard' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500'}`}></div>
                 <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-none ${difficulty === 'Nightmare' ? 'text-purple-300 animate-pulse' : 'text-white'}`}>
                    {difficulty === 'Nightmare' ? 'NIGHTMARE' : difficulty === 'Hard' ? 'HARDCORE' : 'LIVE EXAM'}
                 </span>
             </div>
             
             {/* Active Timer */}
             <div className="font-mono text-sm sm:text-xl font-bold text-white tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 min-w-[70px] text-center">
                {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2,'0')}` : '∞'}
             </div>
          </div>
          
          {/* Question Palette Row */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 pt-2 px-1 border-t border-white/5">
             {questions.map((q, idx) => {
                 let statusColor = "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10";
                 const isFlagged = flaggedQuestions.includes(q.id);
                 
                 if (currentQuestionIdx === idx) {
                     statusColor = "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/30 shadow-lg z-10";
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
       <div className="glass-panel rounded-3xl p-5 md:p-10 flex-1 relative flex flex-col shadow-2xl border-white/10">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-500/20">Question {currentQuestionIdx + 1} / {total}</span>
              <button onClick={() => onFlagQuestion(currentQ.id)} className={`flex items-center gap-2 text-xs uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all ${flaggedQuestions.includes(currentQ.id) ? 'bg-amber-900/20 text-amber-500 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={flaggedQuestions.includes(currentQ.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 01-2-1.85V19a2 2 0 00-2 2h2zM5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H9c-1.105 0-2 .895-2 2v12z" /></svg>
                 {flaggedQuestions.includes(currentQ.id) ? 'Flagged' : 'Flag'}
              </button>
          </div>

          <h2 className="text-lg md:text-2xl font-medium mb-8 leading-relaxed text-white">{currentQ.question}</h2>
          
          <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
             {currentQ.options.map((opt) => (
               <button 
                 key={opt} 
                 onClick={() => onAnswerSelect(currentQ.id, opt)}
                 className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all relative group ${
                    userAnswers[currentQ.id] === opt 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/20 scale-[1.01]' 
                    : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:border-white/10'
                 }`}
               >
                 <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all ${userAnswers[currentQ.id] === opt ? 'bg-white/30' : 'bg-transparent'}`}></div>
                 <span className="relative z-10 text-sm sm:text-base">{opt}</span>
               </button>
             ))}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
             <button 
               onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))} 
               disabled={currentQuestionIdx === 0} 
               className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs uppercase hover:bg-white/10 disabled:opacity-30 transition-all"
             >
               Prev
             </button>
             {currentQuestionIdx === questions.length - 1 ? (
                <button onClick={onSubmit} className="px-10 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-white/10">Submit Exam</button>
             ) : (
                <button onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">Next</button>
             )}
          </div>
       </div>
    </div>
  );
};
