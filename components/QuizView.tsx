
import React, { useState, useEffect, useRef } from 'react';
import { QuizState, QuizQuestion, Difficulty, DuelState } from '../types';
import { simplifyExplanation, generateSuddenDeathQuestion } from '../services/geminiService';
import { subscribeToDuel, activateSuddenDeath, submitSuddenDeathAnswer } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

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

const getWittyFeedback = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    
    if (percentage === 100) return ["God Tier. I have nothing left to teach you.", "Absolute perfection.", "Flawless victory."];
    if (percentage >= 80) return ["Impressive. Most impressive.", "You might actually pass this course.", "Solid performance."];
    if (percentage >= 50) return ["Mediocre. But acceptable.", "C's get degrees.", "You know enough to be dangerous."];
    if (percentage >= 20) return ["My grandmother could guess better.", "Are you even trying?", "Pathetic. Go study."];
    return ["I have no words.", "Did you sleep through the lecture?", "This score is a crime."];
};

export const QuizView: React.FC<QuizViewProps> = ({ 
  quizState, 
  onAnswerSelect, 
  onFlagQuestion,
  onSubmit, 
  onReset,
  onTimeExpired,
  duelId,
  onIndexChange
}) => {
  const { user } = useAuth();
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining: initialTime, focusStrikes, currentQuestionIndex } = quizState;
  const [internalIndex, setInternalIndex] = useState(currentQuestionIndex || 0);
  const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);
  const [strikes, setStrikes] = useState(focusStrikes || 0);
  
  const [duelData, setDuelData] = useState<DuelState | null>(null);
  const [suddenDeathSubmitted, setSuddenDeathSubmitted] = useState(false);
  const [isGeneratingSD, setIsGeneratingSD] = useState(false);
  
  const [textAnswer, setTextAnswer] = useState('');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>([]);
  const [simplifiedExplanations, setSimplifiedExplanations] = useState<Record<number, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null);

  const lastStrikeTime = useRef<number>(0);

  useEffect(() => { setInternalIndex(currentQuestionIndex); }, [currentQuestionIndex]);

  useEffect(() => {
      if (!questions || questions.length === 0) return;
      const q = questions[internalIndex];
      if (!q) return;
      const savedAnswer = userAnswers[q.id];
      if (q.type === 'Fill in the Gap') setTextAnswer(savedAnswer || '');
      else if (q.type === 'Select All That Apply') setMultiSelectAnswers(safeParseJSON(savedAnswer, []));
  }, [internalIndex, userAnswers, questions]);

  useEffect(() => {
      if (isSubmitted && duelId) {
          const unsub = subscribeToDuel(duelId, (data) => {
              setDuelData(data);
              if (data.status === 'SUDDEN_DEATH_PENDING' && data.hostId === user?.uid && !isGeneratingSD) {
                  setIsGeneratingSD(true);
                  generateSuddenDeathQuestion(data.content || "General Knowledge").then((q) => {
                      activateSuddenDeath(duelId, q);
                  });
              }
          });
          return () => unsub();
      }
  }, [isSubmitted, duelId, user, isGeneratingSD]);

  useEffect(() => {
      if (isSubmitted) return;
      const handleFocusLost = () => {
          const now = Date.now();
          if (now - lastStrikeTime.current < 1500) return; 
          lastStrikeTime.current = now;
          setStrikes(prev => prev + 1);
      };
      const onVisibilityChange = () => { if (document.hidden) handleFocusLost(); };
      const onWindowBlur = () => { if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) handleFocusLost(); };
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onWindowBlur);
      return () => {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          window.removeEventListener('blur', onWindowBlur);
      };
  }, [isSubmitted, strikes]);

  useEffect(() => {
    if (isSubmitted || timeLeft === null) return;
    if (timeLeft <= 0) { onTimeExpired(); return; }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, onTimeExpired]);

  const handleNextQuestion = () => {
      if (internalIndex < questions.length - 1) {
          const newIdx = internalIndex + 1;
          setInternalIndex(newIdx);
          onIndexChange(newIdx);
      } else { onSubmit(); }
  };

  const handlePrevQuestion = () => {
      if (internalIndex > 0) {
          const newIdx = internalIndex - 1;
          setInternalIndex(newIdx);
          onIndexChange(newIdx);
      }
  };

  const handleSuddenDeathAnswer = (opt: string) => {
      if (!duelData?.suddenDeathQuestion || !duelId || !user) return;
      const isCorrect = opt === duelData.suddenDeathQuestion.correct_answer;
      submitSuddenDeathAnswer(duelId, user.uid, isCorrect);
      setSuddenDeathSubmitted(true);
  };

  const currentQ = questions?.[internalIndex];
  if (!currentQ && !isSubmitted) return <div>Error</div>;

  const total = questions.length;
  const getXPFeedback = (score: number) => `+${Math.min(score * 50, 500)} XP Gained`;

  const handleELI5 = async (q: QuizQuestion) => {
      if (simplifiedExplanations[q.id]) return;
      setLoadingExplanation(q.id);
      try {
          const simplified = await simplifyExplanation(q.explanation, 'ELI5');
          setSimplifiedExplanations(prev => ({ ...prev, [q.id]: simplified }));
      } catch (e) {} finally { setLoadingExplanation(null); }
  };

  const saveTextInput = () => { if (textAnswer.trim() && currentQ) onAnswerSelect(currentQ.id, textAnswer.trim()); };

  const toggleMultiSelect = (opt: string) => {
      let newSelection = multiSelectAnswers.includes(opt) ? multiSelectAnswers.filter(o => o !== opt) : [...multiSelectAnswers, opt].sort();
      setMultiSelectAnswers(newSelection);
      if(currentQ) onAnswerSelect(currentQ.id, JSON.stringify(newSelection));
  };

  if (isSubmitted) {
    const feedbacks = getWittyFeedback(score, total);
    const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    if (duelData?.status === 'SUDDEN_DEATH_ACTIVE' && !suddenDeathSubmitted && duelData.suddenDeathQuestion) {
        return <div className="fixed inset-0 z-50 bg-red-950/90 flex items-center justify-center">SUDDEN DEATH</div>; 
    }

    return (
      <div className="max-w-5xl mx-auto pb-20 px-4 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-bold text-white">Exam Results</h2>
           <button onClick={onReset} className="px-6 py-2 bg-white text-black rounded-full font-bold uppercase text-xs hover:bg-gray-200">Exit Session</button>
        </div>
        <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            <h1 className="text-8xl font-serif font-bold mb-4 text-white">{score}/{total}</h1>
            <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-mono text-blue-300 font-bold uppercase">{getXPFeedback(score)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
       <div className="glass-panel p-3 sm:p-4 rounded-2xl mb-4 sticky top-4 z-30 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500"></div>
             <span className="text-xs font-bold uppercase text-white">{duelId ? 'DUEL IN PROGRESS' : 'LIVE EXAM'}</span>
          </div>
          <div className="font-mono text-sm font-bold bg-black/40 px-3 py-1.5 rounded-lg text-white">
             {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2,'0')}` : '∞'}
          </div>
       </div>

       <div className="glass-panel rounded-3xl p-5 md:p-10 flex-1 flex flex-col shadow-2xl">
          <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-bold uppercase text-blue-400">Question {internalIndex + 1} / {total}</span>
              <button onClick={() => onFlagQuestion(currentQ.id)} className="text-gray-500 hover:text-white">Flag</button>
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
             <button onClick={() => { if (currentQ.type === 'Fill in the Gap') saveTextInput(); handlePrevQuestion(); }} disabled={internalIndex === 0} className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-xs uppercase disabled:opacity-30">Prev</button>
             <button onClick={() => { if (currentQ.type === 'Fill in the Gap') saveTextInput(); internalIndex === questions.length - 1 ? onSubmit() : handleNextQuestion(); }} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase">{internalIndex === questions.length - 1 ? 'Submit' : 'Next'}</button>
          </div>
       </div>
    </div>
  );
};
