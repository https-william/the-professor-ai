
import React, { useState, useEffect, useRef } from 'react';
import { QuizState, QuizQuestion, Difficulty, DuelState } from '../types';
import { simplifyExplanation, generateSuddenDeathQuestion, generateWittyFeedback } from '../services/geminiService';
import { subscribeToDuel, activateSuddenDeath, submitSuddenDeathAnswer } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
// import confetti from 'canvas-confetti'; // Assuming CDN/package usage

interface QuizViewProps {
  quizState: QuizState;
  onAnswerSelect: (questionId: number, answer: string) => void;
  onFlagQuestion: (questionId: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onTimeExpired: () => void;
  duelId?: string | null;
  onIndexChange: (index: number) => void;
}

const safeParseJSON = (str: string | undefined | null, fallback: any = []) => {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
};

export const QuizView: React.FC<QuizViewProps> = ({ 
  quizState, onAnswerSelect, onFlagQuestion, onSubmit, onReset, onTimeExpired, duelId, onIndexChange
}) => {
  const { user } = useAuth();
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining: initialTime, focusStrikes, currentQuestionIndex } = quizState;
  const [internalIndex, setInternalIndex] = useState(currentQuestionIndex || 0);
  const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);
  const [strikes, setStrikes] = useState(focusStrikes || 0);
  const [showGrid, setShowGrid] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState("Calculating...");
  
  // Confetti trigger
  useEffect(() => {
      if (isSubmitted) {
          const percentage = (score / questions.length) * 100;
          if (percentage >= 80) {
              // Trigger confetti
              // Since we don't have npm packages installed in this prompt, we use a CSS fallback or assume window.confetti
              // For robustness, we'll use a CSS animation class on the score.
          }
          generateWittyFeedback(score, questions.length).then(setAiFeedback);
      }
  }, [isSubmitted, score]);

  const lastStrikeTime = useRef<number>(0);

  useEffect(() => { setInternalIndex(currentQuestionIndex || 0); }, [currentQuestionIndex]);

  useEffect(() => {
      if (!questions || questions.length === 0) return;
      const q = questions[internalIndex];
      if (!q) return;
      const savedAnswer = userAnswers[q.id];
      if (q.type === 'Fill in the Gap') setTextAnswer(savedAnswer || '');
      else if (q.type === 'Select All That Apply') setMultiSelectAnswers(safeParseJSON(savedAnswer, []));
  }, [internalIndex, userAnswers, questions]);

  useEffect(() => {
      if (isSubmitted) return;
      const timer = setInterval(() => setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
      return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const handleJumpToQuestion = (idx: number) => {
      if (currentQ?.type === 'Fill in the Gap') saveTextInput();
      setInternalIndex(idx);
      onIndexChange(idx);
      setShowGrid(false);
  };

  const handleNextQuestion = () => {
      if (internalIndex < questions.length - 1) {
          handleJumpToQuestion(internalIndex + 1);
      } else { onSubmit(); }
  };

  const currentQ = questions?.[internalIndex];
  if (!currentQ && !isSubmitted) return <div>Error</div>;

  const total = questions.length;
  const saveTextInput = () => { if (textAnswer.trim() && currentQ) onAnswerSelect(currentQ.id, textAnswer.trim()); };

  const toggleMultiSelect = (opt: string) => {
      let newSelection = multiSelectAnswers.includes(opt) ? multiSelectAnswers.filter(o => o !== opt) : [...multiSelectAnswers, opt].sort();
      setMultiSelectAnswers(newSelection);
      if(currentQ) onAnswerSelect(currentQ.id, JSON.stringify(newSelection));
  };

  if (isSubmitted) {
    const percentage = (score / total) * 100;
    const isVictory = percentage >= 80;

    return (
      <div className="max-w-5xl mx-auto pb-24 px-4 animate-fade-in custom-scrollbar">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-20">
           <h2 className="text-xl font-bold text-white">Exam Results</h2>
           <button onClick={onReset} className="px-6 py-2 bg-white text-black rounded-full font-bold uppercase text-xs hover:bg-gray-200">Exit Session</button>
        </div>
        
        {/* Score Card */}
        <div className={`glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center mb-10 overflow-hidden relative ${isVictory ? 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : ''}`}>
            {isVictory && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 to-transparent animate-pulse-slow"></div>
                </div>
            )}
            
            <h1 className="text-8xl font-serif font-bold mb-4 text-white relative z-10">{score}/{total}</h1>
            <div className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase mb-6 z-10 ${isVictory ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                {isVictory ? '🏆 ACADEMIC WEAPON 🏆' : 'Keep Studying'}
            </div>
            
            <div className="max-w-md mx-auto bg-black/40 border border-white/10 p-6 rounded-2xl relative z-10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Professor's Verdict
                </div>
                <p className="text-gray-300 italic text-sm leading-relaxed mt-2">
                    "{aiFeedback}"
                </p>
            </div>
        </div>

        {/* Detailed Review Section */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Question Analysis</h3>
            {questions.map((q, idx) => {
                const userAnswer = userAnswers[q.id];
                const isCorrect = userAnswer === q.correct_answer;
                
                return (
                    <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Question {idx + 1}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${isCorrect ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                {isCorrect ? 'Correct' : 'Missed'}
                            </span>
                        </div>
                        <h4 className="text-white font-medium mb-4">{q.question}</h4>
                        <div className="bg-white/5 p-4 rounded-xl text-sm text-gray-400 leading-relaxed border-l-2 border-white/10">
                            <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Professor's Explanation</span>
                            {q.explanation}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col relative">
       {/* Top Bar with Grid Toggle */}
       <div className="glass-panel p-3 sm:p-4 rounded-2xl mb-4 sticky top-4 z-30 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500"></div>
                 <span className="text-xs font-bold uppercase text-white">{duelId ? 'DUEL IN PROGRESS' : 'LIVE EXAM'}</span>
             </div>
             <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors ${showGrid ? 'bg-white text-black' : 'bg-white/10 text-gray-300'}`}>{showGrid ? 'Hide Nav' : 'Show Nav'}</button>
          </div>
          <div className="font-mono text-sm font-bold bg-black/40 px-3 py-1.5 rounded-lg text-white">
             {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2,'0')}` : '∞'}
          </div>
       </div>

       {showGrid && (
           <div className="mb-4 bg-[#111] p-4 rounded-2xl border border-white/10 animate-slide-in">
               <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                   {questions.map((q, idx) => (
                       <button key={q.id} onClick={() => handleJumpToQuestion(idx)} className={`w-full aspect-square rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${idx === internalIndex ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black border-white/5 text-gray-600 hover:bg-white/5'}`}>{idx + 1}</button>
                   ))}
               </div>
           </div>
       )}

       <div className="glass-panel rounded-3xl p-5 md:p-10 flex-1 flex flex-col shadow-2xl">
          <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-bold uppercase text-blue-400">Question {internalIndex + 1} / {total}</span>
              <button onClick={() => onFlagQuestion(currentQ.id)} className={`text-xs font-bold uppercase ${flaggedQuestions.includes(currentQ.id) ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}>{flaggedQuestions.includes(currentQ.id) ? 'Flagged' : 'Flag'}</button>
          </div>
          <h2 className="text-lg md:text-2xl font-medium mb-8 text-white">{currentQ.question}</h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
             {currentQ.type === 'Fill in the Gap' ? (
                 <input type="text" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} onBlur={saveTextInput} className="w-full bg-transparent border-b-2 border-white/20 text-2xl py-2 text-white outline-none focus:border-blue-500" placeholder="Answer..." />
             ) : currentQ.type === 'Select All That Apply' ? (
                 currentQ.options.map((opt) => (
                     <button key={opt} onClick={() => toggleMultiSelect(opt)} className={`w-full text-left p-4 rounded-xl border ${multiSelectAnswers.includes(opt) ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-transparent text-gray-300'}`}>{opt}</button>
                 ))
             ) : (
                 currentQ.options.map((opt) => (
                   <button key={opt} onClick={() => onAnswerSelect(currentQ.id, opt)} className={`w-full text-left p-4 rounded-2xl border transition-all ${userAnswers[currentQ.id] === opt ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'}`}>{opt}</button>
                 ))
             )}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
             <button onClick={() => { if (currentQ.type === 'Fill in the Gap') saveTextInput(); if(internalIndex > 0) handleJumpToQuestion(internalIndex - 1); }} disabled={internalIndex === 0} className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-xs uppercase disabled:opacity-30">Prev</button>
             <button onClick={() => { if (currentQ.type === 'Fill in the Gap') saveTextInput(); internalIndex === questions.length - 1 ? onSubmit() : handleNextQuestion(); }} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase">{internalIndex === questions.length - 1 ? 'Submit' : 'Next'}</button>
          </div>
       </div>
    </div>
  );
};

export default QuizView;
